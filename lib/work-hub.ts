// What the work hub shows, and how it decides.
//
// The hub answers one question per project — "what is next?" — and it answers
// it from Trello rather than from a copy. Nothing here caches: a board changed
// a minute ago reads correctly a minute later. That rule is not stylistic.
// Copying card detail into a second place is exactly what made the Shepherds
// board stale in September, and a hub that quietly disagrees with the board is
// worse than no hub.

/** A list is a bucket if its name matches one of these. Everything else is ignored. */
const BUCKETS = [
  {
    key: 'today' as const,
    label: 'Today',
    // Command, Cultus and Lost Sheep call it Today; Shepherds calls it
    // Current Focus. Both mean "I am on this now".
    patterns: [/^today$/i, /^current focus$/i],
  },
  {
    key: 'doing' as const,
    label: 'Doing',
    // Shepherds splits active work into In Progress and Review / Test, and a
    // card sitting in Review is still live work that wants an eye on it.
    patterns: [/^doing$/i, /^in progress$/i, /^review\s*\/\s*test$/i],
  },
  {
    key: 'week' as const,
    label: 'This week',
    patterns: [/^this week$/i, /^ready$/i],
  },
];

export type BucketKey = (typeof BUCKETS)[number]['key'];

/**
 * Boards that belong to the day job rather than to him.
 *
 * ASSUMPTION, 2026-10-08, and the one line to correct if it is wrong: the
 * token turned out to reach seven boards, and these three read as SensusAir's
 * — "Sales" especially could as easily be Fabled Threads', in which case move
 * it out and it goes back to being read as his own.
 *
 * The distinction is not cosmetic. His own boards have one member, so the list
 * a card sits in is the whole signal. A team board's lists are the team's
 * workflow — a card in their In Progress says the team is busy, not that he
 * owes anyone anything — so on these boards the signal is whether the card is
 * ASSIGNED TO HIM, and the list is just where it happens to sit.
 */
const WORK_BOARDS = ['North Star', 'Sales'];

/**
 * Boards the hub ignores completely.
 *
 * "SensusAir Dev Tean" is dead — unused, and carrying a typo nobody is going
 * to fix. Note that dropping a board from WORK_BOARDS does not hide it: it
 * would then be read as one of his own and turn up under Mine, or in the
 * unmatched footnote. Hiding needs saying separately, which is what this is.
 */
const HIDDEN_BOARDS = ['SensusAir Dev Tean'];

function named(list: string[], name: string): boolean {
  const needle = name.trim().toLowerCase();
  return list.some((entry) => entry.toLowerCase() === needle);
}

export function isWorkBoard(name: string): boolean {
  return named(WORK_BOARDS, name);
}

export function isHiddenBoard(name: string): boolean {
  return named(HIDDEN_BOARDS, name);
}

/** The order the hub reads in: what I am on, then what is live, then what is queued. */
export const BUCKET_ORDER: BucketKey[] = ['today', 'doing', 'week'];

export const BUCKET_LABELS: Record<BucketKey, string> = {
  today: 'Today',
  doing: 'Doing',
  week: 'This week',
};

/**
 * Which bucket a list belongs to, by its name.
 *
 * Deliberately by name and not by id. The list ids are in the check-in skill's
 * table, and on 8 October the hub's own lesson arrived early: The Lost Sheep
 * had a board for ten days that the check-in never read, because nobody added
 * its six ids to that table. Matching on names means a new board, or a fourth
 * game, appears here the day it is made and needs no edit to this file.
 *
 * The cost is the opposite failure: rename Today to Now and it silently drops
 * out. That is why the API reports every board it found with no bucket at all
 * (see `WorkBoard.matched`) instead of returning an empty column.
 */
export function bucketFor(listName: string): BucketKey | null {
  for (const bucket of BUCKETS) {
    if (bucket.patterns.some((p) => p.test(listName.trim()))) return bucket.key;
  }
  return null;
}

export interface WorkCard {
  id: string;
  name: string;
  url: string;
  /** The list the card actually sits in, so "Review / Test" stays visible under Doing. */
  list: string;
  /** Null on a day-job board, where the card was kept for being his and not for its list. */
  bucket: BucketKey | null;
  /** Trello labels, used on Command where one card per project is the only clue which it is. */
  labels: string[];
  /** ISO, UTC. Null for most cards — he works to lists, not to dates. */
  due: string | null;
  /** ISO, UTC. Drives the "untouched for N days" marker. */
  lastActivity: string | null;
}

export interface WorkBoard {
  id: string;
  name: string;
  url: string;
  /**
   * How the board was read: 'mine' by bucket list, 'day-job' by what is
   * assigned to him. The page groups on it, because at a glance he needs to
   * know which of these someone else is waiting on.
   */
  scope: 'mine' | 'day-job';
  cards: WorkCard[];
}

export interface WorkHubPayload {
  /** False when the Worker has no Trello credentials. The page says so rather than looking broken. */
  configured: boolean;
  /** Only boards with work in a bucket. One panel each. */
  boards: WorkBoard[];
  /**
   * Names of boards with no Today / Doing / This week list at all.
   *
   * These used to get a panel each, which was fine for four boards and absurd
   * for forty: the token sees every board the account is a member of, and most
   * of someone else's boards will never use these list names. They collapse to
   * one muted line instead — still visible, because a board of his whose list
   * got renamed must not vanish silently, but no longer able to drown the page.
   */
  unmatched: string[];
  /** ISO, UTC. When the Worker fetched this — the page shows it so stale data is visible. */
  fetchedAt: string;
  /** Anything that failed, named. A board that errored must not look like a board with no work. */
  errors: string[];
}

/** Days since a card last moved, or null if Trello gave no date. */
export function daysSince(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return Math.floor((now - then) / 86_400_000);
}

/** A card with no movement for this long is called out. Matches the check-in's stale rule. */
export const STALE_DAYS = 7;

/**
 * How many cards of one list the page draws before it stops.
 *
 * A project manager's board has a backlog on it, and a backlog rendered in
 * full is a page you scroll past rather than read — North Star alone buried
 * everything else. Nothing is dropped: each list says how many it is holding
 * and opens on a click. The point is that the page fits on a screen again.
 */
export const CARDS_PER_LIST = 5;
