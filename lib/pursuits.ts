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

export type TierRank = 'S' | 'A' | 'B' | 'C' | 'D';

export const TIERS: TierRank[] = ['S', 'A', 'B', 'C', 'D'];

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
} | null = null; // TODO: fill in.

/**
 * The current focus, in a few words. Falls back to the heaviest in-progress
 * project when null, which is true often enough to be a sensible default.
 */
export const currentFocus: string | null = null;

/**
 * Completed runs. `perfect: true` means every achievement unlocked — the
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

/** Queued next. */
export const upNext: Game[] = [
  { title: 'Wall World' },
  { title: 'Sea of Stars' },
];

// TODO: fill in. The tier list — assign `tier` per game.
export const tierList: Game[] = [];

/** RetroAchievements profile, if you want it linked. */
export const retroAchievements = {
  url: null as string | null,
};

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
