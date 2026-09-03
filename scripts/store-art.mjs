// Cuts the white background out of Printful's mockups and writes them to
// public/store/ as transparent WebP.
//
//   node scripts/store-art.mjs
//
// Runs after the catalogue sync, so it works on whatever data/store.json holds.
//
// Printful renders every mockup on a white sheet, which is the only white block
// on a black site. No CSS blend mode fixes that: screen over a dark page
// returns the image untouched, and multiply — which does drop white — takes a
// dark garment down with it. The background has to actually go.
//
// It goes by flood fill from the edges rather than by keying every pale pixel,
// because a white shirt or a white print is not the background and must
// survive. Only white connected to the border is removed.
//
// Missing sharp, an unreachable image or a mockup that is not on white all
// leave the product pointing at Printful's own URL, and the page still works.

import fs from 'node:fs';
import path from 'node:path';

const STORE = path.join(process.cwd(), 'data', 'store.json');
const OUT_DIR = path.join(process.cwd(), 'public', 'store');

/** How far from pure white still counts as background, per channel. */
const TOLERANCE = 26;

function bail(why) {
  console.log(`store-art: ${why} — products keep their remote thumbnails`);
  process.exit(0);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  bail('sharp is not available');
}

let store;
try {
  store = JSON.parse(fs.readFileSync(STORE, 'utf8'));
} catch {
  bail('no data/store.json to read');
}

const products = store.products ?? [];
if (products.length === 0) bail('no products');

/**
 * Clears the background by flooding inward from the edges.
 *
 * A global "make every white pixel transparent" pass would punch holes through
 * a white logo or a white garment. Starting at the border and only crossing
 * pixels that are themselves near-white keeps anything enclosed by the
 * product intact.
 */
function clearBackground(data, width, height) {
  const seen = new Uint8Array(width * height);
  const stack = [];

  const isPale = (i) =>
    data[i] >= 255 - TOLERANCE &&
    data[i + 1] >= 255 - TOLERANCE &&
    data[i + 2] >= 255 - TOLERANCE;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p]) return;
    if (!isPale(p * 4)) return;
    seen[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  let cleared = 0;
  while (stack.length) {
    const p = stack.pop();
    data[p * 4 + 3] = 0;
    cleared++;
    const x = p % width;
    const y = (p - x) / width;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // The fill stops at the first pixel too dark to count as background, which
  // leaves the anti-aliased rim of the garment behind — a bright white outline
  // once the sheet around it is gone.
  //
  // So the boundary is faded rather than cut: any pixel still opaque but
  // touching a transparent one has its alpha scaled by how far from white it
  // is. A rim pixel that is nine-tenths sheet nearly disappears; the garment
  // proper is untouched, because it is nowhere near white.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      if (data[i + 3] === 0) continue;

      const touchesHole =
        (x > 0 && data[(p - 1) * 4 + 3] === 0) ||
        (x < width - 1 && data[(p + 1) * 4 + 3] === 0) ||
        (y > 0 && data[(p - width) * 4 + 3] === 0) ||
        (y < height - 1 && data[(p + width) * 4 + 3] === 0);
      if (!touchesHole) continue;

      const lightest = Math.max(data[i], data[i + 1], data[i + 2]);
      // 255 is the sheet itself, 200 and below is the garment's own edge.
      const towardWhite = Math.max(0, Math.min(1, (lightest - 200) / 55));
      data[i + 3] = Math.round(data[i + 3] * (1 - towardWhite));
    }
  }

  return cleared;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let changed = 0;

for (const product of products) {
  if (!product.thumbnail) continue;

  try {
    const res = await fetch(product.thumbnail, {
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`image returned ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    const { data, info } = await sharp(buf)
      .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const cleared = clearBackground(data, info.width, info.height);
    const share = cleared / (info.width * info.height);

    // A mockup that is not on white will barely clear anything. Leaving it
    // alone is better than shipping a half-keyed image.
    if (share < 0.05) {
      console.log(
        `store-art: ${product.name} — only ${(share * 100).toFixed(1)}% cleared, leaving it`,
      );
      continue;
    }

    const file = `${product.id}.webp`;
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim({ threshold: 0 })
      .webp({ quality: 86, alphaQuality: 90 })
      .toFile(path.join(OUT_DIR, file));

    product.art = `/store/${file}`;
    changed++;
    console.log(
      `store-art: ${product.name} — ${(share * 100).toFixed(0)}% background removed`,
    );
  } catch (err) {
    console.log(`store-art: ${product.name} failed (${err.message})`);
  }
}

if (changed > 0) {
  fs.writeFileSync(STORE, JSON.stringify(store, null, 2) + '\n');
  console.log(`store-art: wrote ${changed} cut-out mockups`);
}
