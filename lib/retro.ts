import fs from 'node:fs';
import path from 'node:path';

// Reads the RetroAchievements snapshot written by scripts/retro.mjs at build
// time. Nothing here runs at request time.

export interface RetroGame {
  id: number;
  title: string;
  console: string | null;
  icon: string | null;
  awarded: number;
  total: number;
  /** Earned in hardcore mode, which RetroAchievements treats as the real one. */
  hardcore: boolean;
  awardKind: string | null;
  awardedAt: string | null;
}

export interface RetroSnapshot {
  fetchedAt: string | null;
  user: string | null;
  profileUrl: string | null;
  gamesTracked: number;
  perfect: RetroGame[];
}

const EMPTY: RetroSnapshot = {
  fetchedAt: null,
  user: null,
  profileUrl: null,
  gamesTracked: 0,
  perfect: [],
};

export function getRetro(): RetroSnapshot {
  try {
    const file = path.join(process.cwd(), 'data', 'retro.json');
    if (!fs.existsSync(file)) return EMPTY;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as RetroSnapshot;
  } catch {
    return EMPTY;
  }
}
