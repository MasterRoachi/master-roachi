import fs from 'node:fs';
import path from 'node:path';

// Reads the Steam snapshot written by scripts/steam.mjs at build time. The
// site is a static export, so nothing here runs at request time — the values
// are baked into the HTML and refresh on the next deploy.

export interface SteamGame {
  appid: number;
  title: string;
  minutesTwoWeeks: number;
  minutesTotal: number;
}

export interface SteamSnapshot {
  fetchedAt: string | null;
  current: SteamGame | null;
  recent: SteamGame[];
}

const EMPTY: SteamSnapshot = { fetchedAt: null, current: null, recent: [] };

export function getSteam(): SteamSnapshot {
  try {
    const file = path.join(process.cwd(), 'data', 'steam.json');
    if (!fs.existsSync(file)) return EMPTY;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as SteamSnapshot;
  } catch {
    // A malformed snapshot should not take the build down over a decoration.
    return EMPTY;
  }
}

/** Steam's own header art, hotlinked from their CDN. */
export function steamHeader(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export function hoursFrom(minutes: number): number {
  return Math.round(minutes / 60);
}
