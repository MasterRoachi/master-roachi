'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CARDS_PER_LIST,
  keywordsOf,
  STALE_DAYS,
  daysSince,
  soonestDue,
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

/**
 * Lists the page does not draw, whatever board they are on.
 *
 * Done and its synonyms are the past. Inbox is uncategorised capture and
 * showing it turns the hub into a second inbox. Projects is Command's standing
 * list of project NAMES — Shepherds, Cultus, Terrath, Kame, The Rig — which is
 * reference rather than anything to do today.
 *
 * Matched on the whole name, so a list called "Done thinking" is not swept up
 * with it.
 */
const HIDDEN_LISTS = /^(inbox|done|completed|complete|archive|archived|projects)$/i;

/**
 * The list that means finished, whatever a board calls it.
 *
 * Its own button rather than one option among many, because finishing is the
 * thing done most and the thing worth one click. Command calls it Done;
 * North Star calls it Completed.
 */
const FINISHED_LIST = /^(done|completed|complete)$/i;

function Chip({
  card,
  onOpen,
  busy,
}: {
  card: WorkCard;
  onOpen: (card: WorkCard) => void;
  busy: boolean;
}) {
  /* Read once on mount rather than on every render. Reading the clock during
     render means the same card can draw differently from the same props, which
     is what the purity rule is for - and it also let two chips in one list
     disagree about a day boundary they crossed between renders. */
  const [now] = useState(() => Date.now());
  const idle = daysSince(card.lastActivity, now);
  const overdue = card.due !== null && Date.parse(card.due) < now;

  return (
    <li>
      <button
        type="button"
        className={`${styles.chip} ${busy ? styles.chipBusy : ''}`}
        title={card.name}
        onClick={() => onOpen(card)}
      >
        <span className={styles.chipName}>{keywordsOf(card.name)}</span>
        {/* Two marks and no more. A chip is three words wide and a row of
            labels on it would be the whole chip. */}
        <span className={styles.marks}>
          {overdue && <span className={styles.overdue} title="Overdue" />}
          {idle !== null && idle >= STALE_DAYS && (
            <span className={styles.stale} title={`${idle} days still`} />
          )}
        </span>
      </button>
    </li>
  );
}

/**
 * One list, as chips, capped at what fits.
 *
 * Nothing scrolls — that is the rule for the whole backend — so a list longer
 * than its column shows what it can and offers the rest. The count is always
 * on the heading, so a long list reads as long rather than as eight cards.
 */
function Group({
  heading,
  cards,
  onOpen,
  onOverflow,
  busyCard,
}: {
  heading: string;
  cards: WorkCard[];
  onOpen: (card: WorkCard) => void;
  onOverflow: (heading: string, cards: WorkCard[]) => void;
  busyCard: string | null;
}) {
  const hidden = cards.length - CARDS_PER_LIST;
  const shown = hidden > 0 ? cards.slice(0, CARDS_PER_LIST) : cards;

  return (
    <section className={styles.bucket}>
      <h3 className={styles.bucketName}>
        {heading}
        <span className={styles.count}>{cards.length}</span>
      </h3>
      <ul className={styles.chips}>
        {shown.map((card) => (
          <Chip key={card.id} card={card} onOpen={onOpen} busy={busyCard === card.id} />
        ))}
        {hidden > 0 && (
          <li>
            <button
              type="button"
              className={`${styles.chip} ${styles.moreChip}`}
              onClick={() => onOverflow(heading, cards)}
            >
              +{hidden} more
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}

export default function WorkHub() {
  /* The clock, read once. Same reasoning as Chip: due-vs-now decided during
     render makes the output depend on when React happened to re-render. */
  const [openedAt] = useState(() => Date.now());
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [nonce, setNonce] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [busyCard, setBusyCard] = useState<string | null>(null);
  /** The card being read, dead centre with the page dimmed behind it. */
  const [openCard, setOpenCard] = useState<WorkCard | null>(null);
  /** A list that did not fit, shown in full rather than scrolled to. */
  const [overflow, setOverflow] = useState<{ heading: string; cards: WorkCard[] } | null>(null);

  /* Escape closes the layer, which is what everyone tries first. */
  useEffect(() => {
    if (!openCard && !overflow) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenCard(null);
      setOverflow(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openCard, overflow]);

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
      // is now. The open card goes with it — it has just moved, so the panel
      // describing where it was is the one thing that is certainly wrong.
      setOpenCard(null);
      setOverflow(null);
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

  /* The active board's cards, grouped by ITS OWN lists, in its own order.
   *
   * Not by the hub's four bucket names, which was the first attempt and was
   * wrong in a way worth recording: North Star runs nine lists — Continuing,
   * Blocked / Waiting, To Plan, Strategic Backlog, Next Sprint, Current
   * 2-Week Sprint, In Progress, Review / Approval, Completed — and exactly
   * one of them matches a bucket pattern. Grouping by bucket showed two cards
   * and silently dropped the rest of the board.
   *
   * The buckets still earn their keep: they decide what a card can be MOVED
   * to, and the morning check-in reads them. They are just the wrong thing to
   * lay a board out with, because a board's lists are the board's own
   * language. */
  const groups = board
    ? board.lists
        .filter((list) => !HIDDEN_LISTS.test(list.name.trim()))
        .map((list) => ({
          heading: list.name,
          cards: board.cards.filter((card) => card.list === list.name),
        }))
        .filter((group) => group.cards.length > 0)
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        {/* A pill per board, one open at a time, and nothing else.
            The account, the read time and a Refresh button sat here: the
            account was a diagnostic that has done its job, the time was a
            number nobody acts on, and reloading the page re-reads Trello
            because the fetch runs on mount. */}
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
                  onOpen={setOpenCard}
                  onOverflow={(name, all) => setOverflow({ heading: name, cards: all })}
                  busyCard={busyCard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- one card, dead centre, with the page dimmed behind it ------- */}
      {openCard && board && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={openCard.name}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenCard(null);
          }}
        >
          <article className={styles.detail}>
            <p className={styles.detailWhere}>
              {board.name} <span className={styles.chev}>›</span> {openCard.list}
            </p>
            <h2 className={styles.detailName}>{openCard.name}</h2>

            <p className={styles.detailMeta}>
              {openCard.labels.map((label) => (
                <span key={label} className={styles.label}>
                  {label}
                </span>
              ))}
              {openCard.due && (
                <span
                  className={
                    Date.parse(openCard.due) < openedAt ? styles.dueLate : styles.due
                  }
                >
                  due {new Date(openCard.due).toLocaleDateString('en-ZA')}
                </span>
              )}
              {(() => {
                const idle = daysSince(openCard.lastActivity, openedAt);
                return idle !== null && idle >= STALE_DAYS ? (
                  <span className={styles.staleText}>{idle} days still</span>
                ) : null;
              })()}
            </p>

            {/* The move, which is the whole reason the page writes anything. */}
            <div className={styles.detailMoves}>
              {board.lists
                .filter((list) => list.name !== openCard.list)
                .map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    className={FINISHED_LIST.test(list.name.trim()) ? styles.finish : undefined}
                    disabled={busyCard === openCard.id}
                    onClick={() => void move(openCard, list.id)}
                  >
                    {list.name}
                  </button>
                ))}
            </div>

            <p className={styles.detailFoot}>
              <a href={openCard.url} target="_blank" rel="noreferrer">
                Open in Trello ↗
              </a>
              <button type="button" onClick={() => setOpenCard(null)}>
                Close
              </button>
            </p>
          </article>
        </div>
      )}

      {/* --- a list that did not fit, in full ----------------------------- */}
      {overflow && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={overflow.heading}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOverflow(null);
          }}
        >
          <article className={styles.detail}>
            <p className={styles.detailWhere}>{board?.name}</p>
            <h2 className={styles.detailName}>
              {overflow.heading} <span className={styles.count}>{overflow.cards.length}</span>
            </h2>
            <ul className={styles.chips}>
              {overflow.cards.map((card) => (
                <Chip
                  key={card.id}
                  card={card}
                  busy={busyCard === card.id}
                  onOpen={(one) => {
                    setOverflow(null);
                    setOpenCard(one);
                  }}
                />
              ))}
            </ul>
            <p className={styles.detailFoot}>
              <button type="button" onClick={() => setOverflow(null)}>
                Close
              </button>
            </p>
          </article>
        </div>
      )}

      {/* Named, not drawn. If one of these is a board of his whose Today list
          got renamed, this line is how he finds out. */}
      {data.unmatched.length > 0 && (
        <p className={styles.unmatched}>
          No Today / Doing / This week list on: {data.unmatched.join(', ')}.
        </p>
      )}

      {/* Every board this token can reach, named. Without it there is no way
          to tell "the account has no such board" from "the board was filtered
          out", which is the exact confusion North Star caused. */}
      {data.seen.length > 0 && (
        <details className={styles.seen}>
          <summary>
            {data.account ? `@${data.account.username} can see` : 'This token can see'}{' '}
            {data.seen.length} board{data.seen.length === 1 ? '' : 's'}
          </summary>
          <p>{data.seen.join(' · ')}</p>
        </details>
      )}
    </div>
  );
}
