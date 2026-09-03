// Pulls what is actually being played from Steam and writes data/steam.json.
//
//   node scripts/steam.mjs
//
// Runs as `prebuild`, so every deploy refreshes it. The site is a static
// export — there is no server at request time — so the data is baked in at
// build rather than fetched in the browser. That also keeps the API key on the
// build machine, where it belongs: a browser fetch would expose it to anyone
// who opened devtools, and Steam does not allow cross-origin calls anyway.
//
// Needs two environment variables:
//
//   STEAM_API_KEY   from https://steamcommunity.com/dev/apikey
//   STEAM_ID        the 64-bit id, e.g. 7656119...
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

function bail(why) {
  console.log(`steam: ${why} — keeping the committed data/steam.json`);
  process.exit(0);
}

if (!KEY) bail('STEAM_API_KEY not set');

async function api(iface, method, version, params = {}) {
  const url = new URL(
    `https://api.steampowered.com/${iface}/${method}/v${version}/`,
  );
  url.searchParams.set('key', KEY);
  url.searchParams.set('steamid', ID);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${method} returned ${res.status}`);
  return res.json();
}

try {
  const recent = await api('IPlayerService', 'GetRecentlyPlayedGames', 1, {
    count: 6,
  });

  const games = recent?.response?.games ?? [];
  if (games.length === 0) {
    bail('no recently played games returned (private profile, or nothing played in two weeks)');
  }

  const shaped = games.map((g) => ({
    appid: g.appid,
    title: g.name,
    // Steam returns a hash, not a URL — the icon path is assembled from it.
    icon: g.img_icon_url || null,
    // Steam reports playtime in minutes.
    minutesTwoWeeks: g.playtime_2weeks ?? 0,
    minutesTotal: g.playtime_forever ?? 0,
  }));

  const payload = {
    // Recorded so the page can say how fresh this is rather than implying it
    // is live.
    fetchedAt: new Date().toISOString(),
    current: shaped[0],
    recent: shaped,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`steam: wrote ${shaped.length} recent games, current = ${shaped[0].title}`);
} catch (err) {
  bail(`fetch failed (${err.message})`);
}
