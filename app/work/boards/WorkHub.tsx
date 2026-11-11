'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CARDS_PER_LIST,
  HIDDEN_LISTS,
  keywordsOf,
  STALE_DAYS,
  daysSince,
  soonestDue,
  type WorkBoard,
  type WorkCard,
  type WorkHubPayload,
} from '@/lib/work-hub';
import ui from '../ui.module.css';
import styles from './boards.module.css';

// One list across every board: his pick, 2026-11-10 (redesign page, Boards: A).
//
// The page opens on every card that matters, from every board, in three
// groups: Late, This week and Gone quiet. Board chips along the top narrow it
// to one board. The old view, one board's lists as columns of chips, stays one
// tap away behind "Board view", because a board's own lists are still the
// only place a fresh Waiting card or a backlog shows.
//
// The cards come from what the Worker already sends: on his own boards only
// cards in a Today / Doing / This week / Waiting list, on a day-job board only
// cards assigned to him. So the groups sort that set; they do not widen it.
//
// DRESSED AS THE PUBLIC SITE, AND A DASHBOARD ON A COMPUTER (his call,
// 2026-11-10, design pass: the public site's styling, the CRM's desktop
// layout). From 900px the three groups' counts sit on top as tiles and the
// groups are panels side by side; the board view's lists are panels as
// columns. Under that the phone keeps its one stacked list. To DESIGN.md
// (his rulings, 11 Nov 2026): the cards in a panel are hairline-split rows,
// and state is the colour of the words: late in --bad, gone quiet in the
// app's colour. No fills, no side stripes.
//
// Fetches /api/work/ once on mount. No polling: the page is opened in the
// morning, read, and closed, and a timer re-fetching every minute would spend
// Trello's rate limit on a tab nobody is looking at. A move re-reads.
//
// Fetched with the trailing slash. next.config.mjs sets trailingSlash: true,
// so the dev server normalises /api/work to /api/work/ and the Worker strips
// trailing slashes before matching. Both forms reach the same route, and
// writing the slashed one means dev and production take the same path rather
// than production working by luck.

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: WorkHubPayload };

/**
 * The list that means finished, whatever a board calls it.
 *
 * Marked out among the move buttons, because finishing is the thing done most.
 * Command calls it Done; North Star calls it Completed.
 */
const FINISHED_LIST = /^(done|completed|complete)$/i;

const DAY = 86_400_000;

/** A card with the board it sits on, because the one list mixes boards. */
interface Entry {
  card: WorkCard;
  board: WorkBoard;
  due: number | null;
  idle: number | null;
}

type GroupKey = 'late' | 'week' | 'quiet';

const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'late', label: 'Late' },
  { key: 'week', label: 'This week' },
  { key: 'quiet', label: 'Gone quiet' },
];

/**
 * Which group a card falls in, or none.
 *
 * One group per card, first match wins: past due is Late; due within a week is
 * This week, even if it has also gone quiet, because a date is the stronger
 * signal; then idle for STALE_DAYS or more is Gone quiet, even in a Doing list
 * (the mockup's own example), because a Doing card nobody touched for nine
 * days is the one that wants an eye; then a card in a Today, Doing or This
 * week list is This week. A fresh Waiting card, or a day-job card with no date
 * that moved recently, is in none, and the board view still shows it.
 */
function groupOf(entry: Entry, now: number): GroupKey | null {
  if (entry.due !== null && entry.due < now) return 'late';
  if (entry.due !== null && entry.due < now + 7 * DAY) return 'week';
  if (entry.idle !== null && entry.idle >= STALE_DAYS) return 'quiet';
  const bucket = entry.card.bucket;
  if (bucket === 'today' || bucket === 'doing' || bucket === 'week') return 'week';
  return null;
}

const BUCKET_RANK: Record<string, number> = { today: 0, doing: 1, week: 2, waiting: 3 };

/** Late and This week by date (soonest first, undated after); Gone quiet by stillest first. */
function compare(group: GroupKey, a: Entry, b: Entry): number {
  if (group === 'quiet') return (b.idle ?? 0) - (a.idle ?? 0);
  const ad = a.due ?? Number.POSITIVE_INFINITY;
  const bd = b.due ?? Number.POSITIVE_INFINITY;
  if (ad !== bd) return ad - bd;
  return (BUCKET_RANK[a.card.bucket ?? ''] ?? 9) - (BUCKET_RANK[b.card.bucket ?? ''] ?? 9);
}

function shortDate(at: number): string {
  return new Date(at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

/** One card in the one list, by its full name, with where it sits underneath. */
function Row({
  entry,
  group,
  showBoard,
  busy,
  onOpen,
}: {
  entry: Entry;
  group: GroupKey;
  showBoard: boolean;
  busy: boolean;
  onOpen: () => void;
}) {
  const { card, board, due, idle } = entry;
  const edge = group === 'late' ? styles.rowLate : group === 'quiet' ? styles.rowQuiet : '';
  const dot = group === 'late' ? styles.dotBad : group === 'quiet' ? styles.dotAccent : styles.dot;
  const where = [showBoard ? board.name : null, card.list].filter(Boolean).join(' · ');
  const still = idle !== null && idle >= STALE_DAYS;

  /* The dashboards' row: a dot, the full name with where it sits under it,
     and the date or the stillness on the right. */
  return (
    <li>
      <button
        type="button"
        className={`${styles.row} ${edge} ${busy ? styles.rowBusy : ''}`}
        onClick={onOpen}
      >
        <i className={dot} aria-hidden="true" />
        <span className={styles.rowText}>
          <span className={styles.rowName}>{card.name}</span>
          {where && <span className={styles.rowMeta}>{where}</span>}
        </span>
        {(due !== null || still) && (
          <span className={styles.rowNote}>
            {due !== null && (
              <span className={group === 'late' ? styles.dueLate : undefined}>due {shortDate(due)}</span>
            )}
            {still && <span className={styles.staleText}>{idle} days still</span>}
          </span>
        )}
      </button>
    </li>
  );
}

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
     is what the purity rule is for, and it also let two chips in one list
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
 * One list of the board view, as chips, capped at what fits.
 *
 * A list longer than its column shows what it can and offers the rest. The
 * count is always on the heading, so a long list reads as long rather than as
 * five cards.
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
  /** The board chip that is on; null is All. */
  const [active, setActive] = useState<string | null>(null);
  /** The one list, or one board's lists as columns. */
  const [view, setView] = useState<'list' | 'board'>('list');
  const [busyCard, setBusyCard] = useState<string | null>(null);
  /** The card being read, with its board: the one list mixes boards, and the moves are the board's. */
  const [open, setOpen] = useState<{ card: WorkCard; board: WorkBoard } | null>(null);
  /** A board-view list that did not fit, shown in full. */
  const [overflow, setOverflow] = useState<{ heading: string; cards: WorkCard[] } | null>(null);

  /* Escape closes the layer, which is what everyone tries first. */
  useEffect(() => {
    if (!open && !overflow) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(null);
      setOverflow(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, overflow]);

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
              ? 'The hub is not switched on. See the setup notes.'
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
   * on it leads. A board with nothing due sorts last (no deadline is not the
   * same as an imminent one) and ties break on the name so the chips do not
   * reshuffle themselves between reads. */
  const boards = useMemo(() => {
    if (state.phase !== 'ready') return [];
    return [...state.data.boards].sort(
      (a, b) => soonestDue(a) - soonestDue(b) || a.name.localeCompare(b.name),
    );
  }, [state]);

  /* Every card, sorted into the three groups. Built across all boards; the
     chip filters it at render time. */
  const entries = useMemo(() => {
    const all: (Entry & { group: GroupKey })[] = [];
    for (const board of boards) {
      for (const card of board.cards) {
        const parsed = card.due ? Date.parse(card.due) : Number.NaN;
        const entry: Entry = {
          card,
          board,
          due: Number.isFinite(parsed) ? parsed : null,
          idle: daysSince(card.lastActivity, openedAt),
        };
        const group = groupOf(entry, openedAt);
        if (group) all.push({ ...entry, group });
      }
    }
    return all;
  }, [boards, openedAt]);

  const chosen = boards.find((one) => one.id === active) ?? null;
  /* The board view needs one board; from All it opens on the first. */
  const board = chosen ?? boards[0] ?? null;

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
      // is now. The open card goes with it: it has just moved, so the sheet
      // describing where it was is the one thing that is certainly wrong.
      setOpen(null);
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
        <button type="button" className={ui.button} onClick={() => setNonce((n) => n + 1)}>
          Try again
        </button>
      </p>
    );
  }

  const { data } = state;

  const shown = chosen ? entries.filter((entry) => entry.board.id === chosen.id) : entries;
  const everyGroup = GROUPS.map(({ key, label }) => ({
    key,
    label,
    entries: shown.filter((entry) => entry.group === key).sort((a, b) => compare(key, a, b)),
  }));
  const grouped = everyGroup.filter((group) => group.entries.length > 0);
  const scopeCards = chosen ? chosen.cards.length : boards.reduce((n, one) => n + one.cards.length, 0);
  const elsewhere = scopeCards - shown.length;

  /* The board view: one board's cards, grouped by ITS OWN lists, in its own
   * order.
   *
   * Not by the hub's four bucket names, which was the first attempt and was
   * wrong in a way worth recording: North Star runs nine lists and exactly one
   * of them matches a bucket pattern. Grouping by bucket showed two cards and
   * silently dropped the rest of the board. A board's lists are the board's
   * own language. */
  const columns =
    view === 'board' && board
      ? board.lists
          .filter((list) => !HIDDEN_LISTS.test(list.name.trim()))
          .map((list) => ({
            heading: list.name,
            cards: board.cards.filter((card) => card.list === list.name),
          }))
          .filter((column) => column.cards.length > 0)
      : [];

  const sheetCard = open?.card ?? null;
  const sheetIdle = sheetCard ? daysSince(sheetCard.lastActivity, openedAt) : null;

  return (
    <div className={`${styles.page} ${view === 'board' ? styles.pageBoard : ''}`}>
      {boards.length > 0 && (
        <div className={styles.head}>
          {/* All, then a chip per board. In the list they narrow it; in the
              board view they pick the board, and All goes back to the list. */}
          <nav className={styles.pills} aria-label="Boards">
            <button
              type="button"
              className={view === 'list' && !chosen ? styles.pillOn : styles.pill}
              aria-pressed={view === 'list' && !chosen}
              onClick={() => {
                setActive(null);
                setView('list');
              }}
            >
              All
            </button>
            {boards.map((one) => {
              const on = view === 'board' ? one.id === board?.id : one.id === chosen?.id;
              return (
                <button
                  key={one.id}
                  type="button"
                  className={on ? styles.pillOn : styles.pill}
                  aria-pressed={on}
                  title={one.name}
                  onClick={() => setActive(one.id)}
                >
                  {one.name}
                </button>
              );
            })}
          </nav>
        </div>
      )}

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

      {boards.length === 0 && data.configured && (
        <p className={styles.clear}>Nothing on the boards.</p>
      )}

      {boards.length > 0 && (
        <div className={styles.bar}>
          <h2 className={styles.barTitle}>
            {view === 'list' ? (
              <>
                Next up <span className={styles.barScope}>{chosen ? chosen.name : 'all boards'}</span>
              </>
            ) : (
              board && (
                <a href={board.url} target="_blank" rel="noreferrer">
                  {board.name} ↗
                </a>
              )
            )}
          </h2>
          <div className={`${ui.tabs} ${styles.views}`} role="group" aria-label="View">
            <button
              type="button"
              className={view === 'list' ? styles.viewOn : styles.view}
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              type="button"
              className={view === 'board' ? styles.viewOn : styles.view}
              aria-pressed={view === 'board'}
              onClick={() => setView('board')}
            >
              Board view
            </button>
          </div>
        </div>
      )}

      {view === 'list' && boards.length > 0 && (
        <>
          {/* The counts as the dashboards' tiles: a computer only, where the
              groups sit side by side and their headings are far apart. */}
          <ul className={styles.tiles}>
            {everyGroup.map((group) => {
              const n = group.entries.length;
              const late = group.key === 'late' && n > 0;
              const dot =
                n === 0
                  ? styles.dot
                  : group.key === 'late'
                    ? styles.dotBad
                    : group.key === 'quiet'
                      ? styles.dotAccent
                      : styles.dotInk;
              return (
                <li key={group.key} className={late ? styles.tileLate : styles.tile}>
                  <span className={styles.tileK}>
                    <i className={dot} /> {group.label}
                  </span>
                  <span className={late ? styles.tileVBad : ui.figure}>{n}</span>
                </li>
              );
            })}
            <li className={styles.tile}>
              <span className={styles.tileK}>
                <i className={styles.dot} /> Elsewhere
              </span>
              <span className={ui.figure}>{elsewhere}</span>
            </li>
          </ul>

          {grouped.length === 0 ? (
            <p className={styles.clear}>Nothing late, due this week or gone quiet.</p>
          ) : (
            <div className={styles.groups}>
              {grouped.map((group) => (
                <section
                  key={group.key}
                  className={`${styles.group} ${group.key === 'late' ? styles.groupLate : ''}`}
                >
                  <h3 className={`${styles.groupName} ${styles[`group_${group.key}`]}`}>
                    {group.label}
                    <span className={styles.count}>{group.entries.length}</span>
                  </h3>
                  <ul className={styles.rows}>
                    {group.entries.map((entry) => (
                      <Row
                        key={entry.card.id}
                        entry={entry}
                        group={group.key}
                        showBoard={!chosen}
                        busy={busyCard === entry.card.id}
                        onOpen={() => setOpen({ card: entry.card, board: entry.board })}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {/* Said, so a fresh Waiting card, which is in no group, does not look lost. */}
          {elsewhere > 0 && (
            <p className={styles.unmatched}>
              {elsewhere} more card{elsewhere === 1 ? ' sits' : 's sit'} outside these groups.{' '}
              <button type="button" className={styles.inlineLink} onClick={() => setView('board')}>
                Board view
              </button>{' '}
              shows them.
            </p>
          )}
        </>
      )}

      {view === 'board' && board && (
        <div className={styles.boardPane}>
          {columns.length === 0 ? (
            <p className={styles.clear}>
              {board.scope === 'mine' ? 'Nothing queued.' : 'Nothing assigned to you.'}
            </p>
          ) : (
            <div className={styles.buckets}>
              {columns.map(({ heading, cards }) => (
                <Group
                  key={heading}
                  heading={heading}
                  cards={cards}
                  onOpen={(card) => setOpen({ card, board })}
                  onOverflow={(name, all) => setOverflow({ heading: name, cards: all })}
                  busyCard={busyCard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- one card: a bottom sheet on a phone, centred on a computer --- */}
      {open && sheetCard && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={sheetCard.name}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(null);
          }}
        >
          <article className={styles.detail}>
            <p className={styles.detailWhere}>
              {open.board.name} <span className={styles.chev}>›</span> {sheetCard.list}
            </p>
            <h2 className={styles.detailName}>{sheetCard.name}</h2>

            <p className={styles.detailMeta}>
              {sheetCard.labels.map((label) => (
                <span key={label} className={ui.chip}>
                  {label}
                </span>
              ))}
              {sheetCard.due && (
                <span className={Date.parse(sheetCard.due) < openedAt ? ui.chipBad : ui.chip}>
                  due {new Date(sheetCard.due).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
                </span>
              )}
              {sheetIdle !== null && sheetIdle >= STALE_DAYS && (
                <span className={ui.chipAccent}>{sheetIdle} days still</span>
              )}
            </p>

            {/* The move, which is the whole reason the page writes anything. */}
            <div className={styles.detailMoves}>
              {open.board.lists
                .filter((list) => list.name !== sheetCard.list)
                .map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    className={FINISHED_LIST.test(list.name.trim()) ? ui.primary : ui.button}
                    disabled={busyCard === sheetCard.id}
                    onClick={() => void move(sheetCard, list.id)}
                  >
                    {list.name}
                  </button>
                ))}
            </div>

            <p className={styles.detailFoot}>
              <a className={styles.trello} href={sheetCard.url} target="_blank" rel="noreferrer">
                Open in Trello ↗
              </a>
              <button type="button" className={ui.quiet} onClick={() => setOpen(null)}>
                Close
              </button>
            </p>
          </article>
        </div>
      )}

      {/* --- a board-view list that did not fit, in full ----------------- */}
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
                    if (board) setOpen({ card: one, board });
                  }}
                />
              ))}
            </ul>
            <p className={styles.detailFoot}>
              <button type="button" className={ui.quiet} onClick={() => setOverflow(null)}>
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
