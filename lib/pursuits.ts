// Structured data for the Gaming and Orthodoxy pages.
//
// These are ongoing pursuits rather than projects, so their pages are driven
// by lists that change often. Keeping them here — typed, in one file — means
// updating them is editing data, not markup.
//
// ⚠ SEEDED FROM THE OLD SITE (archive/html-site, last touched July 2026).
// Everything below needs confirming or replacing; the achievement counts in
// particular will have moved.

export interface Game {
  title: string;
  /** Percentage complete, if tracked. */
  progress?: number;
  achievements?: { unlocked: number; total: number };
  /** Free text: "Completionist run", "Retro", a platform, a verdict. */
  note?: string;
  tier?: TierRank;
}

export type TierRank = 'S' | 'A' | 'B' | 'C' | 'D';

export const TIERS: TierRank[] = ['S', 'A', 'B', 'C', 'D'];

export const streamSchedule = {
  // TODO confirm — the old site said daily 20:00–00:00.
  summary: 'Daily, 20:00 – 00:00',
  active: true,
};

export const nowPlaying: Game[] = [
  {
    title: 'Bioshock Remastered',
    progress: 73,
    achievements: { unlocked: 48, total: 65 },
    note: 'Completionist run, analysis video in progress',
  },
];

export const upNext: Game[] = [
  { title: 'Wall World' },
  { title: 'Sea of Stars' },
];

// TODO: fill in. Games finished, with a verdict each.
export const finished: Game[] = [];

// TODO: fill in. The tier list — assign `tier` per game.
export const tierList: Game[] = [];

/** RetroAchievements profile, if you want it linked. */
export const retroAchievements = {
  // TODO: profile URL.
  url: null as string | null,
};

export interface VideoOrArticle {
  title: string;
  /** "video" | "article" — drives the label. */
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
