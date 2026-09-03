// Pulls RetroAchievements completion data and writes data/retro.json.
//
//   node scripts/retro.mjs
//
// Runs as part of prebuild, so every deploy refreshes it. The site is a static
// export — the data is baked in rather than fetched in the browser, which also
// keeps the API key on the build machine.
//
// Environment:
//
//   RETRO_API_KEY   RetroAchievements → Settings → Web API Key
//   RETRO_USER      the profile to read; not a secret
//
// A missing key, an unreachable API or an empty profile all leave the
// committed data/retro.json alone and let the build continue.

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'data', 'retro.json');
const KEY = process.env.RETRO_API_KEY;
const USER = process.env.RETRO_USER || 'MasterRoachi';

function bail(why) {
  console.log(`retro: ${why} — keeping the committed data/retro.json`);
  process.exit(0);
}

if (!KEY) bail('RETRO_API_KEY not set');

/**
 * A game is a perfect run when every achievement is unlocked. RetroAchievements
 * distinguishes "mastered" (all of them, hardcore) from "completed" (all of
 * them, softcore); both are every achievement, so both count, and which one is
 * recorded so the page can say.
 */
const PERFECT = new Set(['mastered', 'completed']);

/**
 * Whether every achievement was earned in hardcore mode — no save states, no
 * rewind, no speed changes.
 *
 * RetroAchievements does not say "hardcore" for this. Its vocabulary is
 * `mastered` for all achievements in hardcore and `completed` for all of them
 * in softcore, and it only spells the word out on the lesser `beaten-hardcore`
 * award. So testing the string for "hardcore" — which is what this did at
 * first — marks every mastery as softcore and quietly understates the harder
 * achievement.
 */
function isHardcore(kind) {
  const k = String(kind ?? '').toLowerCase();
  return k === 'mastered' || k.includes('hardcore');
}

async function page(offset) {
  const url = new URL(
    'https://retroachievements.org/API/API_GetUserCompletionProgress.php',
  );
  url.searchParams.set('y', KEY);
  url.searchParams.set('u', USER);
  url.searchParams.set('c', '500');
  url.searchParams.set('o', String(offset));

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`completion progress returned ${res.status}`);
  return res.json();
}

try {
  const all = [];
  let offset = 0;

  // Paged, because a long-standing profile will exceed the 500 cap.
  for (;;) {
    const data = await page(offset);
    const results = data?.Results ?? [];
    all.push(...results);
    const total = data?.Total ?? all.length;
    offset += results.length;
    if (results.length === 0 || all.length >= total || offset > 5000) break;
  }

  if (all.length === 0) bail('no games returned for this profile');

  const perfect = all
    .filter((g) => {
      const kind = String(g.HighestAwardKind ?? '').toLowerCase();
      const maxed =
        Number(g.MaxPossible) > 0 &&
        Number(g.NumAwarded) >= Number(g.MaxPossible);
      return PERFECT.has(kind) || maxed;
    })
    .map((g) => ({
      id: g.GameID,
      title: g.Title,
      console: g.ConsoleName ?? null,
      // RetroAchievements serves icons from its own host, path-only in the API.
      icon: g.ImageIcon ? `https://media.retroachievements.org${g.ImageIcon}` : null,
      awarded: Number(g.NumAwarded) || 0,
      total: Number(g.MaxPossible) || 0,
      hardcore: isHardcore(g.HighestAwardKind),
      awardKind: g.HighestAwardKind ?? null,
      awardedAt: g.HighestAwardDate ?? null,
    }))
    // Most recent masteries first.
    .sort((a, b) => Date.parse(b.awardedAt ?? 0) - Date.parse(a.awardedAt ?? 0));

  const payload = {
    fetchedAt: new Date().toISOString(),
    user: USER,
    profileUrl: `https://retroachievements.org/user/${USER}`,
    gamesTracked: all.length,
    perfect,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(
    `retro: ${all.length} games tracked, ${perfect.length} perfect`,
  );
} catch (err) {
  bail(`fetch failed (${err.message})`);
}
