import { getSteam, steamHeader, hoursFrom } from './steam';
import { getRetro } from './retro';
import { finished, type Game } from './pursuits';

// Every 100% run, gathered from the places that actually know about them.
//
// Steam and RetroAchievements are both authoritative about their own
// achievements, so neither list is maintained by hand — they are synced at
// build time (scripts/steam.mjs, scripts/retro.mjs). lib/pursuits.ts still
// carries hand-written entries for runs no API can see: console games, an
// emulator outside RetroAchievements, a game finished before Steam tracked it.

export interface PerfectRun {
  key: string;
  title: string;
  /** Wide art, when the platform has any. */
  art: string | null;
  /** Square badge art. RetroAchievements only serves this shape. */
  icon: string | null;
  unlocked: number | null;
  total: number | null;
  /** The console, for retro runs; free text for hand-written ones. */
  platform: string | null;
  note: string | null;
  /** Hardcore on RetroAchievements — no save states, no rewind. */
  hardcore?: boolean;
  href: string | null;
}

export interface PerfectRuns {
  steam: PerfectRun[];
  retro: PerfectRun[];
  other: PerfectRun[];
  total: number;
  /** True once at least one list is coming from a live sync. */
  synced: boolean;
}

export function getPerfectRuns(): PerfectRuns {
  const steamData = getSteam();
  const retroData = getRetro();

  // Hand-written perfect runs, keyed by appid so a synced Steam result can
  // absorb the note rather than appearing twice.
  const manual = finished.filter((g: Game) => g.perfect);
  const manualByAppid = new Map(
    manual.filter((g) => g.appid).map((g) => [g.appid as number, g]),
  );

  const steam: PerfectRun[] = steamData.perfect.map((g) => ({
    key: `steam-${g.appid}`,
    title: g.title,
    art: g.header ?? steamHeader(g.appid),
    icon: null,
    unlocked: g.unlocked,
    total: g.total,
    platform: 'Steam',
    // Every run says the same thing: hours played. A per-game note used to
    // win here, which meant one card read "Completionist run — every
    // achievement" while its neighbours gave a number — an inconsistency that
    // looked like missing data rather than a deliberate remark.
    //
    // Shared games are the one exception, and only when Steam has no playtime
    // to report for them: nothing on this account owns the licence, so the
    // hours genuinely are not knowable rather than merely absent.
    note:
      g.minutesTotal > 0
        ? `${hoursFrom(g.minutesTotal)}h played`
        : g.shared
          ? 'Family shared'
          : null,
    href: `https://store.steampowered.com/app/${g.appid}/`,
  }));

  const seenAppids = new Set(steamData.perfect.map((g) => g.appid));

  const retro: PerfectRun[] = retroData.perfect.map((g) => ({
    key: `retro-${g.id}`,
    title: g.title,
    art: null,
    icon: g.icon,
    unlocked: g.awarded,
    total: g.total,
    platform: g.console,
    note: null,
    hardcore: g.hardcore,
    href: `https://retroachievements.org/game/${g.id}`,
  }));

  // Whatever is left: hand-written runs that no sync covered. A Steam entry
  // written by hand disappears from here the moment the sync confirms it,
  // which is the point — the API is the better source for the same fact.
  const other: PerfectRun[] = manual
    .filter((g) => !g.appid || !seenAppids.has(g.appid))
    .map((g) => ({
      key: `manual-${g.title}`,
      title: g.title,
      art: g.appid ? steamHeader(g.appid) : null,
      icon: null,
      unlocked: g.achievements?.unlocked ?? null,
      total: g.achievements?.total ?? null,
      platform: null,
      note: g.note ?? null,
      href: g.appid ? `https://store.steampowered.com/app/${g.appid}/` : null,
    }));

  return {
    steam,
    retro,
    other,
    total: steam.length + retro.length + other.length,
    synced: steamData.perfect.length > 0 || retroData.perfect.length > 0,
  };
}
