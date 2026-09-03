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

/**
 * Games played through Steam Family Sharing, listed by hand in
 * data/shared-games.json.
 *
 * They have to be listed, because no Steam Web API endpoint will report them:
 * GetOwnedGames returns games this account owns, and a shared game is played
 * on someone else's licence. The family endpoints exist but want a logged-in
 * session token rather than a Web API key.
 *
 * Only the names are manual. GetPlayerAchievements does not check ownership —
 * only that the profile is public — so the achievement counts still come from
 * Steam and a 100% claim here is as verified as any other.
 */
function sharedGames() {
  try {
    const file = path.join(process.cwd(), 'data', 'shared-games.json');
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed.games) ? parsed.games : [];
  } catch {
    return [];
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

/**
 * The real header image for a game, from the store.
 *
 * The predictable URL — cdn.../steam/apps/<appid>/header.jpg — is right for
 * most games and wrong for some. BALL x PIT answers 404 there: Steam has moved
 * newer titles to content-hashed store_item_assets paths, and games with
 * seasonal "alt assets" no longer have anything at the old address at all.
 * Guessing the URL therefore produces a dead image with no warning.
 *
 * Only asked for games that turn out to be perfect, which is a handful rather
 * than a library, and cached so a second build does not ask again.
 */
async function storeHeader(appid) {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&filters=basic`,
      { signal: AbortSignal.timeout(20000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[appid]?.data?.header_image ?? null;
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

  const owned = await api('IPlayerService', 'GetOwnedGames', 1, {
    include_appinfo: 1,
    include_played_free_games: 1,
  });
  const library = owned?.response?.games ?? [];

  // --- what is being played -----------------------------------------------
  // Two sources, because neither is enough alone.
  //
  // GetRecentlyPlayedGames covers the last fortnight and nothing else — it
  // returns six games in total here, three of which are tools — so it cannot
  // fill a list of any length. It is still the only source that sees family-
  // shared games: God of War and DOOM are played on someone else's licence
  // and appear nowhere in the owned library.
  //
  // The library reaches much further back through rtime_last_played, but only
  // for games this account owns.
  //
  // So the fortnight leads, in Steam's own order, and the library extends it.
  const recent = await api('IPlayerService', 'GetRecentlyPlayedGames', 1, {
    count: 20,
  });
  const recentGames = recent?.response?.games ?? [];

  const seen = new Set();
  const shaped = [];

  for (const g of recentGames) {
    seen.add(g.appid);
    shaped.push({
      appid: g.appid,
      title: g.name,
      // Steam returns a hash, not a URL — the icon path is assembled from it.
      icon: g.img_icon_url || null,
      // Steam reports playtime in minutes.
      minutesTwoWeeks: g.playtime_2weeks ?? 0,
      minutesTotal: g.playtime_forever ?? 0,
    });
  }

  for (const g of library
    .filter((g) => g.rtime_last_played && !seen.has(g.appid))
    .sort((a, b) => b.rtime_last_played - a.rtime_last_played)) {
    // Generous, because the page filters tools out of this list afterwards
    // and would otherwise run short.
    if (shaped.length >= 16) break;
    shaped.push({
      appid: g.appid,
      title: g.name,
      icon: g.img_icon_url || null,
      // Outside the fortnight window by definition.
      minutesTwoWeeks: 0,
      minutesTotal: g.playtime_forever ?? 0,
    });
  }

  // --- which games are 100% ------------------------------------------------
  // One request per game, so results are cached against playtime: a game whose
  // playtime has not moved cannot have gained achievements, and a library of a
  // few hundred titles would otherwise be re-scanned on every single deploy.
  const cache = prior.achievementCache ?? {};

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

  // Family-shared games, always re-checked rather than cached against
  // playtime: Steam reports no playtime for a game this account does not own,
  // so there is nothing to compare against. The list is short by nature.
  const shared = sharedGames();
  if (shared.length > 0) {
    console.log(`steam: checking ${shared.length} family-shared games`);
    await mapLimit(shared, CONCURRENCY, async (g) => {
      const got = await achievements(g.appid);
      if (!got) {
        // Either the game has no achievements, or it has never actually been
        // played on this account. Said plainly, because a shared game silently
        // missing from the page is the confusing outcome.
        console.log(`steam:   ${g.title} (${g.appid}) — no achievement data`);
      }
      cache[g.appid] = {
        name: g.title,
        // Steam reports no playtime for a game this account does not own, and
        // no endpoint will give it once the game drops out of the fortnight
        // window. An `hours` field in data/shared-games.json fills that in by
        // hand; without one the page says "Family shared" instead of inventing
        // a number.
        minutes: Number.isFinite(g.hours) ? Math.round(g.hours * 60) : 0,
        icon: null,
        unlocked: got?.unlocked ?? null,
        total: got?.total ?? null,
        shared: true,
      };
    });
  }

  // Header art for the perfect runs, which are the only ones that get a
  // picture. Fetched one at a time and only when not already known — this is
  // the public store API, not the keyed one, and there are single figures of
  // them.
  const perfectIds = Object.entries(cache)
    .filter(([, v]) => v.total && v.unlocked === v.total)
    .map(([appid]) => appid);

  for (const appid of perfectIds) {
    if (cache[appid].header !== undefined) continue;
    cache[appid].header = await storeHeader(appid);
    if (!cache[appid].header) {
      console.log(`steam:   no store header for ${cache[appid].name} (${appid})`);
    }
  }

  const perfect = Object.entries(cache)
    .filter(([, v]) => v.total && v.unlocked === v.total)
    .map(([appid, v]) => ({
      header: v.header ?? null,
      appid: Number(appid),
      title: v.name,
      icon: v.icon ?? null,
      unlocked: v.unlocked,
      total: v.total,
      minutesTotal: v.minutes,
      shared: v.shared === true,
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
