// Small copies of the artworks for the store's "By artwork" tiles.
//
//   node scripts/piece-thumbs.mjs
//
// public/store/pieces/<id>.webp are the drawings at 1600px on the long side,
// made outside this repo (~/Work/assets/art/timon/tools/), and the artwork
// pages want them that size. A tile on /store/ is at most about 200 CSS
// pixels wide, so fifteen of them at full size came to some 2MB on the
// store's first screen. These are 640px on the long side, enough for a tile
// on a 3x phone, written to public/store/pieces/thumb/<id>.webp.
//
// Only remade when the drawing is newer than its thumbnail. Missing sharp
// leaves the tiles on the full drawings, and the page still works.

import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'public', 'store', 'pieces');
const OUT = path.join(SRC, 'thumb');
const LONG_SIDE = 640;

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('piece-thumbs: sharp is not installed; the tiles keep the full drawings.');
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
let made = 0;
for (const name of fs.readdirSync(SRC)) {
  if (!name.endsWith('.webp')) continue;
  const src = path.join(SRC, name);
  const out = path.join(OUT, name);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  await sharp(src)
    .resize({ width: LONG_SIDE, height: LONG_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(out);
  made++;
}
console.log(`piece-thumbs: ${made} made, ${OUT}`);
