'use client';

import { useEffect, useState } from 'react';
import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  CARDS_PER_LIST,
  STALE_DAYS,
  daysSince,
  type BucketKey,
  type WorkBoard,
  type WorkHubPayload,
} from '@/lib/work-hub';
import styles from './work.module.css';

// The hub's only moving part.
//
// Fetches /api/work/ once on mount and renders a column per board. No polling:
// the page is opened in the morning, read, and closed, and a timer that
// re-fetched every minute would spend Trello's rate limit on a tab nobody is
// looking at. Reopening it is the refresh, and the button below is there for
// when he has just moved a card and wants to see it land.
//
// Fetched with the trailing slash. next.config.mjs sets trailingSlash: true,
// so the dev server normalises /api/work to /api/work/ and the Worker strips
// trailing slashes before matching — both forms reach the same route, and
// writing the slashed one means dev and production take the same path rather
// than production working by luck. That exact trap is documented on the vote
// endpoint in worker/index.ts.

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: WorkHubPayload };

function Card({ card }: { card: WorkBoard['cards'][number] }) {
  const idle = daysSince(card.lastActivity);
  const overdue =
    card.due !== null && Date.parse(card.due) < Date.now() ? card.due : null;

  return (
    <li className={styles.card}>
      <a href={card.url} target="_blank" rel="noreferrer" className={styles.cardName}>
        {card.name}
      </a>
      <p className={styles.meta}>
        {/* Review / Test is a different thing from In Progress even though both
            read as Doing, so the real list is named — but not on a day-job
            board, where the list is already the heading above it. */}
        {card.bucket !== null && <span className={styles.list}>{card.list}</span>}
        {card.labels.map((label) => (
          <span key={label} className={styles.label}>
            {label}
          </span>
        ))}
        {overdue && (
          <span className={styles.overdue}>
            due {new Date(overdue).toLocaleDateString('en-ZA')}
          </span>
        )}
        {idle !== null && idle >= STALE_DAYS && (
          <span className={styles.stale}>{idle}d still</span>
        )}
      </p>
    </li>
  );
}

/**
 * One list, capped.
 *
 * North Star has a backlog on it and rendering all of it pushed every other
 * board off the screen. The count is always shown, so a long list reads as
 * long rather than as five cards, and one click gives the rest — nothing here
 * is hidden, only folded.
 */
function Group({ heading, cards }: { heading: string; cards: WorkBoard['cards'] }) {
  const [open, setOpen] = useState(false);
  const hidden = cards.length - CARDS_PER_LIST;
  const shown = open ? cards : cards.slice(0, CARDS_PER_LIST);

  return (
    <div className={styles.bucket}>
      <h3 className={styles.bucketName}>
        {heading}
        {cards.length > CARDS_PER_LIST && (
          <span className={styles.count}>{cards.length}</span>
        )}
      </h3>
      <ul className={styles.cards}>
        {shown.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className={styles.more} onClick={() => setOpen(!open)}>
          {open ? 'show fewer' : `${hidden} more`}
        </button>
      )}
    </div>
  );
}

function Board({ board }: { board: WorkBoard }) {
  // His own boards group by bucket, in bucket order. A day-job board has no
  // buckets — the cards are his because they are assigned to him — so they
  // group by the list they actually sit in, which is the team's own language.
  const groups =
    board.scope === 'mine'
      ? BUCKET_ORDER.map((key) => ({
          heading: BUCKET_LABELS[key as BucketKey],
          cards: board.cards.filter((c) => c.bucket === key),
        })).filter((g) => g.cards.length > 0)
      : [...new Set(board.cards.map((c) => c.list))].map((list) => ({
          heading: list,
          cards: board.cards.filter((c) => c.list === list),
        }));

  return (
    <section className={styles.board} data-scope={board.scope}>
      <h2 className={styles.boardName}>
        <a href={board.url} target="_blank" rel="noreferrer">
          {board.name}
        </a>
      </h2>

      {groups.length === 0 && (
        <p className={styles.clear}>
          {board.scope === 'mine' ? 'Nothing queued.' : 'Nothing assigned to you.'}
        </p>
      )}

      {groups.map(({ heading, cards }) => (
        <Group key={heading} heading={heading} cards={cards} />
      ))}
    </section>
  );
}

export default function WorkHub() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const response = await fetch('/api/work/', { cache: 'no-store' });
        // Access returns its own login page as HTML when a session has
        // expired, and parsing that as JSON throws something unhelpful. Say
        // the useful thing instead.
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'The hub is not switched on — see the setup notes.'
              : `Trello could not be read (${response.status}).`,
          );
        }
        const data = (await response.json()) as WorkHubPayload;
        if (live) setState({ phase: 'ready', data });
      } catch (error) {
        if (live) {
          setState({
            phase: 'error',
            message:
              error instanceof Error ? error.message : 'Something went wrong.',
          });
        }
      }
    })();

    return () => {
      live = false;
    };
  }, [nonce]);

  if (state.phase === 'loading') {
    return <p className={styles.status}>Reading the boards…</p>;
  }

  if (state.phase === 'error') {
    return (
      <p className={styles.status}>
        {state.message}{' '}
        <button type="button" onClick={() => setNonce((n) => n + 1)}>
          Try again
        </button>
      </p>
    );
  }

  const { data } = state;

  return (
    <>
      <p className={styles.status}>
        Read {new Date(data.fetchedAt).toLocaleTimeString('en-ZA')}{' '}
        <button type="button" onClick={() => setNonce((n) => n + 1)}>
          Refresh
        </button>
      </p>

      {/* Trello and SensusAir fail independently, so a missing token costs the
          boards and not the page. */}
      {!data.configured && (
        <p className={styles.warn}>
          No Trello credentials on the Worker, so the boards are missing. Set{' '}
          <code>TRELLO_KEY</code> and <code>TRELLO_TOKEN</code> with{' '}
          <code>npx wrangler secret put</code>.
        </p>
      )}

      {data.errors.length > 0 && (
        <ul className={styles.errors}>
          {data.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <h2 className={styles.group}>The day job</h2>
      <div className={styles.boards}>
        {data.boards
          .filter((b) => b.scope === 'day-job')
          .map((board) => (
            <Board key={board.id} board={board} />
          ))}
      </div>

      <h2 className={styles.group}>Mine</h2>
      <div className={styles.boards}>
        {data.boards
          .filter((b) => b.scope === 'mine')
          .map((board) => (
            <Board key={board.id} board={board} />
          ))}
      </div>

      {/* Named, not drawn. If one of these is a board of his whose Today list
          got renamed, this line is how he finds out; the rest is just what the
          token can see. */}
      {data.unmatched.length > 0 && (
        <p className={styles.unmatched}>
          No Today / Doing / This week list on: {data.unmatched.join(', ')}.
        </p>
      )}
    </>
  );
}
