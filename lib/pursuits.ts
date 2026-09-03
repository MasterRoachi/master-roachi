// Hand-maintained state for the Gaming and Orthodoxy pages, and for the
// "Right now" strip on the homepage.
//
// Anything that can be derived is derived instead: what is being built comes
// from the project files, and what is being played comes from Steam via
// data/steam.json (see scripts/steam.mjs). Only what no machine knows lives
// here.

export interface Game {
  title: string;
  /** Steam appid, when the game is on Steam — drives the header art. */
  appid?: number;
  achievements?: { unlocked: number; total: number };
  /** Every achievement unlocked. */
  perfect?: boolean;
  /** Free text: a verdict, a platform, a note. */
  note?: string;
  tier?: TierRank;
}

export type TierRank = 'Z' | 'S' | 'A' | 'B' | 'C';

/**
 * Ordered best first. Z sits above S — the reserved shelf, for the few that
 * are not really competing with the rest.
 */
export const TIERS: TierRank[] = ['Z', 'S', 'A', 'B', 'C'];

export const streamSchedule = {
  // TODO confirm — carried over from the previous site.
  summary: 'Daily, 20:00 – 00:00',
  active: true,
};

/**
 * What is currently being read. Nothing derives this, so it is set by hand.
 * Set to null and the row disappears rather than showing something stale.
 */
export const currentlyReading: {
  title: string;
  author: string;
  note?: string;
} | null = {
  title: 'The Iliad',
  author: 'Homer',
};

/**
 * The current focus, in a few words. Falls back to the heaviest in-progress
 * project when null, which is true often enough to be a sensible default.
 */
export const currentFocus: string | null = null;

/**
 * Runs no API can see: a console game, an emulator outside RetroAchievements,
 * anything finished before a platform started tracking it. Steam and
 * RetroAchievements masteries are synced (see lib/perfect.ts) and must not be
 * duplicated here — a Steam entry is absorbed by the sync once it lands, so
 * only add one to bridge the gap until then. `perfect: true` means every achievement unlocked — the
 * Gaming page groups these separately, since a 100% run is the thing being
 * claimed rather than merely having finished.
 */
export const finished: Game[] = [
  {
    title: 'Bioshock Remastered',
    appid: 409710,
    achievements: { unlocked: 65, total: 65 },
    perfect: true,
    note: 'Completionist run — every achievement',
  },
];

/**
 * Queued next, and the options in the "what should I play next" vote.
 *
 * Titles are load-bearing: lib/poll.ts slugs them into the key each vote is
 * stored under, so retitling an entry restarts its count from zero. Fix a
 * spelling before the poll runs, not after.
 */
export const upNext: Game[] = [
  { title: 'Sea of Stars' },
  { title: 'Castlevania: Lords of Shadow 2' },
  { title: 'Beast of Reincarnation' },
  { title: 'Clair Obscur: Expedition 33' },
  { title: 'Guacamelee!' },
  { title: 'BioShock 2 Remastered' },
];

/**
 * TODO: PLACEHOLDER RANKINGS — not Stephan's opinion.
 *
 * They exist so the section can be seen working, and they use games actually
 * in the library rather than invented ones, but the order is a guess. Replace
 * the whole array rather than tidying it. `tierListProvisional` puts a visible
 * note on the page saying so; clear it at the same time.
 */
export const tierList: Game[] = [
  { title: 'BioShock Remastered', appid: 409710, tier: 'Z' },
  { title: 'God of War', appid: 1593500, tier: 'S' },
  { title: 'Machinarium', appid: 40700, tier: 'S' },
  { title: 'Ratchet: Deadlocked', tier: 'A' },
  { title: 'Darksiders Warmastered Edition', appid: 462780, tier: 'A' },
  { title: 'Maneater', appid: 629820, tier: 'B' },
  { title: "Mario's Picross", tier: 'B' },
  { title: 'Doodle God', appid: 348360, tier: 'C' },
];


export interface VideoOrArticle {
  title: string;
  kind: 'video' | 'article';
  url?: string;
  /** Unpublished things are listed as upcoming rather than linked. */
  upcoming?: boolean;
  summary?: string;
}

// Seeded from the old South African Sinner page. Both were listed as upcoming.
export const orthodoxWork: VideoOrArticle[] = [
  {
    title: 'Unite-180: Spirits & Powers — The Ecclesiological Heresy of Unite-180',
    kind: 'video',
    upcoming: true,
  },
  {
    title: 'Why South Africa Needs Orthodoxy',
    kind: 'video',
    upcoming: true,
  },
];
