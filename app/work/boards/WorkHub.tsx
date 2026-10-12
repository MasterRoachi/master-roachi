'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  CARDS_PER_LIST,
  STALE_DAYS,
  daysSince,
  soonestDue,
  type BucketKey,
  type WorkBoard,
  type WorkCard,
  type WorkHubPayload,
} from '@/lib/work-hub';
import styles from './boards.module.css';

// One board at a time, chosen by a pill.
//
// Every board used to render at once, stacked, which made the page the longest
// thing in the backend and meant the board being looked at was somewhere in
// the middle of four others. A pill each and one on screen fits, which is the
// rule for the whole backend now, and reading one board is what anyone
// actually does with it.
//
// Fetches /api/work/ once on mount. No polling: the page is opened in the
// morning, read, and closed, and a timer re-fetching every minute would spend
// Trello's rate limit on a tab nobody is looking at. The button is there for
// when a card has just been moved.
//
// Fetched with the trailing slash. next.config.mjs sets trailingSlash: true,
// so the dev server normalises /api/work to /api/work/ and the Worker strips
// trailing slashes before matching — both forms reach the same route, and
// writing the slashed one means dev and production take the same path rather
// than production working by luck.

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: WorkHubPayload };

/** Where a card can go from here, in the order the day runs. */
const MOVE_ORDER: BucketKey[] = ['week', 'today', 'doing', 'waiting'];

function Card({
  card,
  board,
  onMove,
  busy,
}: {
  card: WorkCard;
  board: WorkBoard;
  onMove: (card: WorkCard, listId: string) => void;
  busy: boolean;
}) {
  const idle = daysSince(card.lastActivity);
  const overdue = card.due !== null && Date.parse(card.due) < Date.now() ? card.due : null;

  /* Where this card can be sent: the board's own lists, in the order the day
   * runs, plus Done. Done is not a bucket — it is the past and the hub does
   * not show it — but finishing something is just a move into it, so it is the
   * one non-bucket list the page needs to know the id of. */
  const targets = MOVE_ORDER.map((key) => {
    const list = board.lists.find((one) => one.bucket === key);
    return list && list.bucket !== card.bucket
      ? { id: list.id, label: BUCKET_LABELS[key] }
      : null;
  }).filter(Boolean) as { id: string; label: string }[];

  const done = board.lists.find((one) => /^done$/i.test(one.name));

  return (
    <li className={`${styles.card} ${busy ? styles.cardBusy : ''}`}>
      <a href={card.url} target="_blank" rel="noreferrer" className={styles.cardName}>
        {card.name}
      </a>
      <p className={styles.meta}>
        {card.labels.map((label) => (
          <span key={label} className={styles.label}>
            {label}
          </span>
        ))}
        {overdue && (
          <span className={styles.overdue}>due {new Date(overdue).toLocaleDateString('en-ZA')}</span>
        )}
        {idle !== null && idle >= STALE_DAYS && <span className={styles.stale}>{idle}d still</span>}
      </p>

      {/* The morning shuffle, without opening Trello. */}
      <p className={styles.moves}>
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            disabled={busy}
            onClick={() => onMove(card, target.id)}
            title={`Move to ${target.label}`}
          >
            {target.label}
          </button>
        ))}
        {done && (
          <button
            type="button"
            className={styles.finish}
            disabled={busy}
            onClick={() => onMove(card, done.id)}
            title="Finish it"
          >
            Done
          </button>
        )}
      </p>
    </li>
  );
}

/**
 * One list, capped.
 *
 * The count is always shown, so a long list reads as long rather than as five
 * cards, and one click gives the rest — nothing here is hidden, only folded.
 */
function Group({
  heading,
  cards,
  board,
  onMove,
  busyCard,
}: {
  heading: string;
  cards: WorkCard[];
  board: WorkBoard;
  onMove: (card: WorkCard, listId: string) => void;
  busyCard: string | null;
}) {
  const [open, setOpen] = useState(false);
  const hidden = cards.length - CARDS_PER_LIST;
  const shown = open ? cards : cards.slice(0, CARDS_PER_LIST);

  return (
    <section className={styles.bucket}>
      <h3 className={styles.bucketName}>
        {heading}
        {cards.length > CARDS_PER_LIST && <span className={styles.count}>{cards.length}</span>}
      </h3>
      <ul className={styles.cards}>
        {shown.map((card) => (
          <Card
            key={card.id}
            card={card}
            board={board}
            onMove={onMove}
            busy={busyCard === card.id}
          />
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className={styles.more} onClick={() => setOpen(!open)}>
          {open ? 'Show fewer' : `${hidden} more`}
        </button>
      )}
    </section>
  );
}

export default function WorkHub() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [nonce, setNonce] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [busyCard, setBusyCard] = useState<string | null>(null);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const response = await fetch('/api/work/', { cache: 'no-store' });
        // Access returns its own login page as HTML when a session has
        // expired, and parsing that as JSON throws something unhelpful.
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
            message: error instanceof Error ? error.message : 'Something went wrong.',
          });
        }
      }
    })();

    return () => {
      live = false;
    };
  }, [nonce]);

  /* Boards by soonest due card, his call: the board with the most urgent thing
   * on it leads. A board with nothing due sorts last — no deadline is not the
   * same as an imminent one — and ties break on the name so the row does not
   * reshuffle itself between reads. */
  const boards = useMemo(() => {
    if (state.phase !== 'ready') return [];
    return [...state.data.boards].sort(
      (a, b) => soonestDue(a) - soonestDue(b) || a.name.localeCompare(b.name),
    );
  }, [state]);

  const board = boards.find((one) => one.id === active) ?? boards[0] ?? null;

  async function move(card: WorkCard, listId: string) {
    setBusyCard(card.id);
    try {
      const response = await fetch('/api/work/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ card: card.id, list: listId }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok || result.error) {
        setState({ phase: 'error', message: result.error ?? `Could not move it (${response.status}).` });
        return;
      }
      // Re-read rather than patch the card in place: the move may have been
      // one of several, and Trello is the thing that knows where everything
      // is now.
      setNonce((n) => n + 1);
    } catch (error) {
      setState({
        phase: 'error',
        message: error instanceof Error ? error.message : 'Could not move it.',
      });
    } finally {
      setBusyCard(null);
    }
  }

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

  /* The active board's cards, grouped by the list they are in.
   *
   * By bucket rather than by raw list name, because two boards call the same
   * state different things — Shepherds files under Current Focus and In
   * Progress where Command files under Today and Doing — and the hub's whole
   * job is to read them as one thing. */
  const groups = board
    ? BUCKET_ORDER.map((key) => ({
        heading: BUCKET_LABELS[key],
        cards: board.cards.filter((card) => card.bucket === key),
      })).filter((group) => group.cards.length > 0)
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        {/* A pill per board, one open at a time. */}
        <nav className={styles.pills} aria-label="Boards">
          {boards.map((one) => (
            <button
              key={one.id}
              type="button"
              className={one.id === board?.id ? styles.pillOn : styles.pill}
              aria-current={one.id === board?.id}
              onClick={() => setActive(one.id)}
            >
              {one.name}
            </button>
          ))}
        </nav>

        <p className={styles.status}>
          {new Date(data.fetchedAt).toLocaleTimeString('en-ZA')}{' '}
          <button type="button" onClick={() => setNonce((n) => n + 1)}>
            Refresh
          </button>
        </p>
      </div>

      {/* Trello and the rest fail independently, so a missing token costs the
          boards and not the page. */}
      {!data.configured && (
        <p className={styles.warn}>
          No Trello credentials on the Worker, so the boards are missing. Set <code>TRELLO_KEY</code>{' '}
          and <code>TRELLO_TOKEN</code> with <code>npx wrangler secret put</code>.
        </p>
      )}

      {data.errors.length > 0 && (
        <ul className={styles.errors}>
          {data.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {board && (
        <div className={styles.boardPane}>
          <h2 className={styles.boardName}>
            <a href={board.url} target="_blank" rel="noreferrer">
              {board.name} ↗
            </a>
          </h2>

          {groups.length === 0 ? (
            <p className={styles.clear}>
              {board.scope === 'mine' ? 'Nothing queued.' : 'Nothing assigned to you.'}
            </p>
          ) : (
            <div className={styles.buckets}>
              {groups.map(({ heading, cards }) => (
                <Group
                  key={heading}
                  heading={heading}
                  cards={cards}
                  board={board}
                  onMove={move}
                  busyCard={busyCard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Named, not drawn. If one of these is a board of his whose Today list
          got renamed, this line is how he finds out. */}
      {data.unmatched.length > 0 && (
        <p className={styles.unmatched}>
          No Today / Doing / This week list on: {data.unmatched.join(', ')}.
        </p>
      )}
    </div>
  );
}
