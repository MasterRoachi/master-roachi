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

/**
 * Luminance a pixel must clear to count as printed artwork rather than fabric.
 *
 * The garment sits between about 10 and 50; the print is line art in light
 * grey and runs from 80 well past 200. There is a wide empty band between the
 * two, so this is not a delicate number.
 */
const PRINT_LUM = 80;
/** Below this is fabric and gets no alpha at all. */
const PRINT_FLOOR = 54;
/** At or above this the artwork is fully opaque. */
const PRINT_CEIL = 150;

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
    const i = p * 4;
    data[i + 3] = 0;
    // The colour goes too, not just the alpha.
    //
    // A transparent pixel still holds an RGB value, and anything that filters
    // the texture — three.js sampling it onto a mesh, most obviously — blends
    // that colour across the edge. Leaving it white painted a white rim around
    // the garment in 3D while the flat image looked perfect, because a browser
    // compositing an <img> never samples the cleared side.
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
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
      const keep = 1 - towardWhite;
      data[i + 3] = Math.round(data[i + 3] * keep);
      // Darkened by the same amount it is faded, for the reason above: a rim
      // pixel that is now mostly transparent still hands its white to anything
      // that samples across the edge unless the colour goes with the alpha.
      data[i] = Math.round(data[i] * keep);
      data[i + 1] = Math.round(data[i + 1] * keep);
      data[i + 2] = Math.round(data[i + 2] * keep);
    }
  }

  return cleared;
}

/**
 * Lifts the printed design off the garment, so it can be applied to a modelled
 * shirt instead of the photograph being pressed into service as one.
 *
 * The mockup is a picture of a shirt. Bending that picture over a curved mesh
 * only ever produces a bent picture of a shirt — the folds, the shadows and
 * the perspective are all baked into the pixels and stay where they are while
 * the surface moves under them. What is actually wanted from the mockup is the
 * one thing that cannot be modelled: the artwork.
 *
 * So the artwork is cut out on its own, and the garment is built rather than
 * photographed.
 *
 * Finding it needs no template. The print is the only bright, connected thing
 * on a dark garment, so the largest run of pixels well above fabric luminance
 * is it. Position and size come back as fractions of the garment's own
 * bounding box, which keeps them meaningful if the mockup is ever re-rendered
 * at another size.
 */
function extractPrint(data, width, height) {
  const lumAt = (i) =>
    0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

  let gx0 = width, gy0 = height, gx1 = -1, gy1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 250) continue;
      if (x < gx0) gx0 = x;
      if (x > gx1) gx1 = x;
      if (y < gy0) gy0 = y;
      if (y > gy1) gy1 = y;
    }
  }
  if (gx1 < 0) return null;
  const gw = gx1 - gx0 + 1;
  const gh = gy1 - gy0 + 1;

  const seen = new Uint8Array(width * height);
  let best = null;
  for (let p = 0; p < width * height; p++) {
    if (seen[p] || data[p * 4 + 3] < 250 || lumAt(p * 4) < PRINT_LUM) continue;
    const stack = [p];
    seen[p] = 1;
    let x0 = width, y0 = height, x1 = -1, y1 = -1, n = 0;
    while (stack.length) {
      const q = stack.pop();
      const x = q % width;
      const y = (q - x) / width;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const r = ny * width + nx;
          if (seen[r] || data[r * 4 + 3] < 250 || lumAt(r * 4) < PRINT_LUM) continue;
          seen[r] = 1;
          stack.push(r);
        }
      }
    }
    if (!best || n > best.n) best = { n, x0, y0, x1, y1 };
  }
  // A few hundred pixels of glare on a seam is not a print.
  if (!best || best.n < 400) return null;

  // The flood only catches the brightest strokes; the soft edges of the line
  // art fall below the threshold and would be sheared off without this.
  const pad = Math.round(Math.max(best.x1 - best.x0, best.y1 - best.y0) * 0.09);
  const px0 = Math.max(0, best.x0 - pad);
  const py0 = Math.max(0, best.y0 - pad);
  const px1 = Math.min(width - 1, best.x1 + pad);
  const py1 = Math.min(height - 1, best.y1 + pad);
  const pw = px1 - px0 + 1;
  const ph = py1 - py0 + 1;

  const out = Buffer.alloc(pw * ph * 4);
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const i = ((y + py0) * width + (x + px0)) * 4;
      const o = (y * pw + x) * 4;
      const l = data[i + 3] < 250 ? 0 : lumAt(i);
      const a = Math.max(0, Math.min(1, (l - PRINT_FLOOR) / (PRINT_CEIL - PRINT_FLOOR)));
      if (a <= 0) continue; // leaves RGBA at zero — colour cleared with alpha,
      out[o] = data[i];     // for the same reason the background is
      out[o + 1] = data[i + 1];
      out[o + 2] = data[i + 2];
      out[o + 3] = Math.round(a * 255);
    }
  }

  return {
    raw: out,
    width: pw,
    height: ph,
    /**
     * The garment's own colour, averaged over everything that is neither
     * print nor highlight. The modelled shirt is lit from scratch, so it wants
     * the flat cloth colour rather than any particular lit pixel.
     */
    fabric: (() => {
      let r = 0, g = 0, b = 0, n = 0;
      for (let p = 0; p < width * height; p++) {
        const i = p * 4;
        if (data[i + 3] < 250) continue;
        if (lumAt(i) >= PRINT_FLOOR) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      if (!n) return null;
      const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0');
      return '#' + hex(r) + hex(g) + hex(b);
    })(),
    place: {
      x: ((px0 + px1) / 2 - gx0) / gw,
      y: ((py0 + py1) / 2 - gy0) / gh,
      width: pw / gw,
    },
  };
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

    const print = extractPrint(data, info.width, info.height);
    if (print) {
      const printFile = `${product.id}-print.webp`;
      await sharp(print.raw, {
        raw: { width: print.width, height: print.height, channels: 4 },
      })
        .webp({ quality: 92, alphaQuality: 100 })
        .toFile(path.join(OUT_DIR, printFile));
      product.print = { src: `/store/${printFile}`, ...print.place };
      if (print.fabric) product.fabric = print.fabric;
      console.log(
        `store-art: ${product.name} — print lifted, ${print.width}x${print.height}`,
      );
    } else {
      delete product.print;
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
