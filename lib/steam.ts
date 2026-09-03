import fs from 'node:fs';
import path from 'node:path';

// Reads the Steam snapshot written by scripts/steam.mjs at build time. The
// site is a static export, so nothing here runs at request time — the values
// are baked into the HTML and refresh on the next deploy.

export interface SteamGame {
  appid: number;
  title: string;
  /** Steam's icon hash; the URL is assembled from it. Absent on older data. */
  icon?: string | null;
  minutesTwoWeeks: number;
  minutesTotal: number;
}

export interface SteamPerfect {
  appid: number;
  title: string;
  icon: string | null;
  unlocked: number;
  total: number;
  minutesTotal: number;
  /** Played on someone else's licence through Steam Family Sharing. */
  shared?: boolean;
}

export interface SteamSnapshot {
  fetchedAt: string | null;
  current: SteamGame | null;
  recent: SteamGame[];
  perfect: SteamPerfect[];
  ownedCount?: number;
}

const EMPTY: SteamSnapshot = {
  fetchedAt: null,
  current: null,
  recent: [],
  perfect: [],
};

/**
 * Tools that live on Steam and report playtime like games do. Aseprite hours
 * are Shepherds art, not play, and showing them as "now playing" would be a
 * true number telling a false story.
 *
 * Filtered here rather than in the fetch script so it applies to data already
 * committed, and so the raw snapshot stays a faithful record of what Steam
 * actually said.
 */
const NOT_GAMES = new Set([
  431730, // Aseprite
  431960, // Wallpaper Engine
  365670, // Blender
]);

export function getSteam(): SteamSnapshot {
  try {
    const file = path.join(process.cwd(), 'data', 'steam.json');
    if (!fs.existsSync(file)) return EMPTY;

    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as SteamSnapshot;
    const games = (raw.recent ?? []).filter((g) => !NOT_GAMES.has(g.appid));

    return {
      fetchedAt: raw.fetchedAt,
      perfect: (raw.perfect ?? []).filter((g) => !NOT_GAMES.has(g.appid)),
      ownedCount: raw.ownedCount,
      // `current` is recomputed rather than trusted: the stored one is
      // whatever Steam ranked first, which may be a tool.
      current: games[0] ?? null,
      recent: games,
    };
  } catch {
    // A malformed snapshot should not take the build down over a decoration.
    return EMPTY;
  }
}

/** Steam's own header art, hotlinked from their CDN. */
export function steamHeader(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

/**
 * The square library icon. Falls back to the wide header when the snapshot
 * predates the icon hash being captured — cropped square by CSS, so it still
 * reads rather than breaking.
 */
export function steamIcon(game: SteamGame): string {
  return game.icon
    ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.icon}.jpg`
    : steamHeader(game.appid);
}

export function hoursFrom(minutes: number): number {
  return Math.round(minutes / 60);
}
