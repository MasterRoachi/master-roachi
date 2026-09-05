// Pulls a game's achievement list from Steam, with its official icons.
//
//   node --env-file-if-exists=.env.local scripts/achievements.mjs
//
// Which games it fetches is decided by APPS below — a walkthrough that wants a
// grid adds its appid there, and the post refers to it by the same id.
//
// Two endpoints, both public:
//
//   GetSchemaForGame     every achievement, with name, description and icons
//   GetPlayerAchievements  which of them this account has unlocked
//
// The icons are downloaded rather than hot-linked. Steam serves them from a CDN
// that has changed host more than once, and a grid of sixty-five images that
// silently turn into broken boxes some months from now is worse than the 200KB
// of committing them.
//
// A missing key, an unreachable API or a rate limit all leave whatever is
// already in data/ alone, so a build never fails over decoration.

import fs from 'node:fs';
import path from 'node:path';

/** Games with an achievement grid on the site. */
const APPS = [
  { appid: 409710, slug: 'bioshock-remastered' },
];

const KEY = process.env.STEAM_API_KEY;
const ID = process.env.STEAM_ID || '76561198116677367';
const OUT = path.join(process.cwd(), 'data', 'achievements');
const ICONS = path.join(process.cwd(), 'public', 'achievements');

function bail(why) {
  console.log(`achievements: ${why} — leaving what is already there`);
  process.exit(0);
}

if (!KEY) bail('STEAM_API_KEY not set');

const get = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).pathname}`);
  return res.json();
};

fs.mkdirSync(OUT, { recursive: true });

for (const { appid, slug } of APPS) {
  try {
    const schema = await get(
      `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${KEY}&appid=${appid}`,
    );
    const list = schema?.game?.availableGameStats?.achievements ?? [];
    if (list.length === 0) throw new Error('schema returned no achievements');

    // Which are unlocked. Not fatal if it fails — the grid is still worth
    // showing without the ticks.
    let unlocked = new Set();
    try {
      const mine = await get(
        `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${KEY}&steamid=${ID}&appid=${appid}`,
      );
      unlocked = new Set(
        (mine?.playerstats?.achievements ?? [])
          .filter((a) => a.achieved === 1)
          .map((a) => a.apiname),
      );
    } catch (err) {
      console.log(`achievements: no player data (${err.message})`);
    }

    const dir = path.join(ICONS, String(appid));
    fs.mkdirSync(dir, { recursive: true });

    const out = [];
    for (const a of list) {
      const file = `${a.name}.jpg`;
      const to = path.join(dir, file);

      if (!fs.existsSync(to) && a.icon) {
        try {
          const res = await fetch(a.icon, { signal: AbortSignal.timeout(20000) });
          if (res.ok) {
            fs.writeFileSync(to, Buffer.from(await res.arrayBuffer()));
          }
        } catch {
          // One missing icon is a gap in a grid, not a reason to stop.
        }
      }

      out.push({
        key: a.name,
        title: a.displayName,
        // Hidden achievements ship with an empty description on purpose; say
        // so rather than rendering a blank line.
        description: a.description || null,
        hidden: a.hidden === 1,
        icon: fs.existsSync(to) ? `/achievements/${appid}/${file}` : null,
        unlocked: unlocked.has(a.name),
      });
    }

    fs.writeFileSync(
      path.join(OUT, `${slug}.json`),
      JSON.stringify(
        { appid, slug, fetchedAt: new Date().toISOString(), achievements: out },
        null,
        2,
      ) + '\n',
    );

    const got = out.filter((a) => a.unlocked).length;
    console.log(
      `achievements: ${slug} — ${out.length} achievements, ${got} unlocked, ` +
        `${out.filter((a) => a.icon).length} icons`,
    );
  } catch (err) {
    console.log(`achievements: ${slug} failed (${err.message})`);
  }
}
