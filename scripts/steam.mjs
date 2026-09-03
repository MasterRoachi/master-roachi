// Pulls what is actually being played, and which games are 100%, from Steam
// and writes data/steam.json.
//
//   node scripts/steam.mjs
//
// Runs as prebuild, so every deploy refreshes it. The site is a static export —
// there is no server at request time — so the data is baked in at build rather
// than fetched in the browser. That also keeps the API key on the build
// machine: a browser fetch would expose it to anyone who opened devtools, and
// Steam does not allow cross-origin calls anyway.
//
// Needs:
//
//   STEAM_API_KEY   from https://steamcommunity.com/dev/apikey
//   STEAM_ID        optional; the 64-bit id is public and defaulted below
//
// Both go in .env.local for development and in the Cloudflare project's build
// environment variables for deploys. Neither is ever committed.
//
// If the key is missing, or Steam is unreachable, the existing data/steam.json
// is left untouched and the build carries on. A profile that has gone private
// looks the same as one that has nothing recent, so the previous data standing
// is better than the page emptying itself.

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'data', 'steam.json');
const KEY = process.env.STEAM_API_KEY;
// Not a secret: a SteamID64 is public on the profile page. Defaulting it means
// only the API key ever needs configuring.
const ID = process.env.STEAM_ID || '76561198116677367';

/** Achievement lookups run in parallel, but gently. */
const CONCURRENCY = 6;

function bail(why) {
  console.log(`steam: ${why} — keeping the committed data/steam.json`);
  process.exit(0);
}

if (!KEY) bail('STEAM_API_KEY not set');

/** Whatever is already committed, used as the cache for the perfect-run scan. */
function previous() {
  try {
    return JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch {
    return {};
  }
}

async function api(iface, method, version, params = {}) {
  const url = new URL(
    `https://api.steampowered.com/${iface}/${method}/v${version}/`,
  );
  url.searchParams.set('key', KEY);
  url.searchParams.set('steamid', ID);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${method} returned ${res.status}`);
  return res.json();
}

/**
 * Achievement state for one game.
 *
 * Steam answers with an error for games that have no achievements at all,
 * which is not a failure — it just means the game cannot be perfected. Those
 * are recorded as checked so they are never asked about again.
 */
async function achievements(appid) {
  try {
    const data = await api('ISteamUserStats', 'GetPlayerAchievements', 1, {
      appid,
    });
    const list = data?.playerstats?.achievements;
    if (!Array.isArray(list) || list.length === 0) return null;
    const unlocked = list.filter((a) => a.achieved === 1).length;
    return { unlocked, total: list.length };
  } catch {
    return null;
  }
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const index = i++;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

try {
  const prior = previous();

  // --- what is being played -----------------------------------------------
  const recent = await api('IPlayerService', 'GetRecentlyPlayedGames', 1, {
    count: 6,
  });
  const recentGames = recent?.response?.games ?? [];

  const shaped = recentGames.map((g) => ({
    appid: g.appid,
    title: g.name,
    // Steam returns a hash, not a URL — the icon path is assembled from it.
    icon: g.img_icon_url || null,
    // Steam reports playtime in minutes.
    minutesTwoWeeks: g.playtime_2weeks ?? 0,
    minutesTotal: g.playtime_forever ?? 0,
  }));

  // --- which games are 100% ------------------------------------------------
  // One request per game, so results are cached against playtime: a game whose
  // playtime has not moved cannot have gained achievements, and a library of a
  // few hundred titles would otherwise be re-scanned on every single deploy.
  const cache = prior.achievementCache ?? {};
  const owned = await api('IPlayerService', 'GetOwnedGames', 1, {
    include_appinfo: 1,
    include_played_free_games: 1,
  });
  const library = owned?.response?.games ?? [];

  const needsCheck = library.filter((g) => {
    if ((g.playtime_forever ?? 0) === 0) return false;
    const seen = cache[g.appid];
    return !seen || seen.minutes !== g.playtime_forever;
  });

  console.log(
    `steam: ${library.length} owned, ${needsCheck.length} to check for achievements`,
  );

  await mapLimit(needsCheck, CONCURRENCY, async (g) => {
    const got = await achievements(g.appid);
    cache[g.appid] = {
      name: g.name,
      minutes: g.playtime_forever ?? 0,
      icon: g.img_icon_url || null,
      // null means the game has no achievements to earn.
      unlocked: got?.unlocked ?? null,
      total: got?.total ?? null,
    };
  });

  const perfect = Object.entries(cache)
    .filter(([, v]) => v.total && v.unlocked === v.total)
    .map(([appid, v]) => ({
      appid: Number(appid),
      title: v.name,
      icon: v.icon ?? null,
      unlocked: v.unlocked,
      total: v.total,
      minutesTotal: v.minutes,
    }))
    .sort((a, b) => b.total - a.total);

  const payload = {
    // Recorded so the page can say how fresh this is rather than implying it
    // is live.
    fetchedAt: new Date().toISOString(),
    current: shaped[0] ?? null,
    recent: shaped,
    perfect,
    ownedCount: library.length,
    achievementCache: cache,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(
    `steam: current = ${shaped[0]?.title ?? 'nothing'}, ${perfect.length} perfect runs`,
  );
} catch (err) {
  bail(`fetch failed (${err.message})`);
}
