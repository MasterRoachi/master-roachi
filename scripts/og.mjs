// Generates the site icons and the social share image.
//
//   node scripts/og.mjs
//
// Runs off public/logo-mark-lg.webp, which scripts/logo.mjs writes from the
// master artwork — so this works without the source PNG on the external drive.
//
// What it makes, and why each one:
//
//   app/icon.png         the browser tab icon. There was none, and
//                        /favicon.ico returned 404 on every request.
//   app/apple-icon.png   the icon iOS uses when a page is saved to the home
//                        screen; without it Safari screenshots the page.
//   public/og.png        the 1200x630 card every link preview shows. Nothing
//                        on the site had an og:image, so a shared link was a
//                        bare title on a grey rectangle.
//
// app/icon.png and app/apple-icon.png are Next.js file conventions: put them
// there and the <link> tags are emitted automatically, including the hashed
// filename. No markup needed.

import fs from 'node:fs';
import path from 'node:path';

const MARK = 'public/logo-mark-lg.webp';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('og: sharp is not available — icons left as they are');
  process.exit(0);
}

if (!fs.existsSync(MARK)) {
  console.log(`og: ${MARK} is missing — run scripts/logo.mjs first`);
  process.exit(0);
}

fs.mkdirSync('app', { recursive: true });

/** Near-black, matching the site's own ground rather than pure #000. */
const GROUND = { r: 10, g: 10, b: 11, alpha: 1 };

// --- tab and home-screen icons ---------------------------------------------
//
// Squared with padding rather than stretched: the mark is wider than it is
// tall, and a favicon that has been squashed reads as a mistake at 16px.
for (const [file, size, pad] of [
  ['app/icon.png', 256, 0.1],
  ['app/apple-icon.png', 180, 0.14],
]) {
  const inner = Math.round(size * (1 - pad * 2));
  const mark = await sharp(MARK)
    .resize(inner, inner, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: GROUND },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(file);

  console.log(`og: wrote ${file} (${size}x${size})`);
}

// --- the share card ---------------------------------------------------------
//
// 1200x630 is what every platform crops to. The mark sits left of the
// wordmark and tagline, which are drawn as SVG text — no font file is loaded,
// so this uses whatever the rendering machine has rather than Archivo. At this
// size, in a card nobody studies, that is a fair trade for not shipping a
// font-loading step.
const OG_W = 1200;
const OG_H = 630;
const markSize = 300;

const mark = await sharp(MARK)
  .resize(markSize, markSize, { fit: 'inside' })
  .toBuffer();

const text = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
  <style>
    .name { font: 800 92px system-ui, -apple-system, "Segoe UI", sans-serif;
            fill: #f7f7f5; letter-spacing: -3px; }
    .line { font: 600 38px system-ui, -apple-system, "Segoe UI", sans-serif;
            fill: #d9a441; letter-spacing: 1px; }
  </style>
  <text class="name" x="470" y="300">Master Roachi</text>
  <text class="line" x="470" y="368">Work Hard, Study Well,</text>
  <text class="line" x="470" y="418">Eat and Sleep Plenty.</text>
</svg>`);

await sharp({
  create: { width: OG_W, height: OG_H, channels: 4, background: GROUND },
})
  .composite([
    { input: mark, left: 120, top: Math.round((OG_H - markSize) / 2) },
    { input: text, left: 0, top: 0 },
  ])
  .png()
  .toFile('public/og.png');

const kb = (fs.statSync('public/og.png').size / 1024).toFixed(0);
console.log(`og: wrote public/og.png (${OG_W}x${OG_H}, ${kb}KB)`);

// --- a share card per product ----------------------------------------------
//
// Product pages were pointing og:image at the cut-out mockup itself. Three
// things were wrong with that at once: it is a WebP, which X and LinkedIn do
// not render; it is 567x765 portrait while the page declared the 1200x630 that
// every card is cropped to; and it is a garment on transparency, so whatever
// the platform paints behind it decides what the card looks like. A shared
// product link previewed as a blank rectangle.
//
// So each product gets a real card: its own garment on the site's ground, with
// the name and price beside it. Runs last in prebuild, after printful.mjs has
// written the catalogue and store-art.mjs has cut the mockups out, so both are
// on disk by the time this reads them.
const STORE = 'data/store.json';
const OG_DIR = 'public/store/og';

function priceRange(product) {
  const amounts = (product.variants ?? [])
    .map((v) => v.amount)
    .filter((n) => Number.isFinite(n));
  if (amounts.length === 0) return null;
  const currency = product.variants?.[0]?.currency ?? 'USD';
  const sign = currency === 'USD' ? '$' : `${currency} `;
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const f = (n) => `${sign}${n.toFixed(2)}`;
  return low === high ? f(low) : `${f(low)} – ${f(high)}`;
}

/** XML-safe, because a product name is not ours to trust inside markup. */
function esc(s) {
  return String(s).replace(
    /[<>&'"]/g,
    (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[
        c
      ],
  );
}

if (fs.existsSync(STORE)) {
  let products = [];
  try {
    products = JSON.parse(fs.readFileSync(STORE, 'utf8')).products ?? [];
  } catch {
    console.log('og: data/store.json is unreadable — no product cards');
  }

  if (products.length > 0) fs.mkdirSync(OG_DIR, { recursive: true });

  for (const product of products) {
    const slug = product.slug ?? String(product.id);
    // The cut-out, which lives under public/ at the path the site serves it
    // from. Falls back to nothing rather than fetching the remote thumbnail:
    // a build should not need the network to produce a card.
    const art = product.art ? path.join('public', product.art) : null;
    if (!art || !fs.existsSync(art)) {
      console.log(`og: ${slug} has no local mockup — card skipped`);
      continue;
    }

    const garment = await sharp(art)
      .resize({ height: 500, fit: 'inside' })
      .toBuffer();
    const { width: gw } = await sharp(garment).metadata();

    const price = priceRange(product);
    const left = 120 + (gw ?? 0) + 80;

    const label = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
  <style>
    .eyebrow { font: 700 26px system-ui, -apple-system, "Segoe UI", sans-serif;
               fill: #e0509f; letter-spacing: 4px; }
    .name { font: 800 76px system-ui, -apple-system, "Segoe UI", sans-serif;
            fill: #f7f7f5; letter-spacing: -2px; }
    .price { font: 700 40px system-ui, -apple-system, "Segoe UI", sans-serif;
             fill: #e0509f; }
    .foot { font: 600 26px system-ui, -apple-system, "Segoe UI", sans-serif;
            fill: #8b8b8f; }
  </style>
  <text class="eyebrow" x="${left}" y="248">FABLED THREADS</text>
  <text class="name" x="${left}" y="336">${esc(product.name)}</text>
  ${price ? `<text class="price" x="${left}" y="404">${esc(price)}</text>` : ''}
  <text class="foot" x="${left}" y="470">masterroachi.com</text>
</svg>`);

    const out = path.join(OG_DIR, `${slug}.png`);
    await sharp({
      create: { width: OG_W, height: OG_H, channels: 4, background: GROUND },
    })
      .composite([
        { input: garment, left: 120, top: Math.round((OG_H - 500) / 2) },
        { input: label, left: 0, top: 0 },
      ])
      .png()
      .toFile(out);

    console.log(`og: wrote ${out} (${OG_W}x${OG_H})`);
  }
}

// --- a share card per writing entry and project -----------------------------
//
// These pages pointed og:image straight at their cover, which is a WebP —
// X and LinkedIn will not render one, so a shared post previewed as a bare
// title on a grey rectangle. The covers are also every aspect ratio going
// (1440x465, 1440x810, 1600x900) against the 1.91:1 a card is cropped to.
//
// So the cover becomes the background of a real card instead of being the
// card: cropped to 1200x630, darkened, with the title over it. A post with no
// cover gets the mark and its title on the site's ground, which still beats
// the generic site card because it at least says what the page is.
const CARD_DIR = 'public/og';

/** The site's gold, as used on the default card's tagline. */
const GOLD = '#d9a441';

/**
 * Break a title across lines that will fit.
 *
 * SVG has no text wrapping, so this measures the only way available without
 * loading a font: an average glyph is about 0.52 of the point size in the
 * sans-serif this draws with. It is an estimate, which is why the box it
 * targets is narrower than the space actually available — a title that wraps
 * one word early looks intentional, one that overruns the card does not.
 */
function wrap(text, perLine, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  // A title too long for the box is cut rather than allowed to run off it.
  if (lines.length === maxLines && words.join(' ').length > perLine * maxLines) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[,;:.\s]+$/, '')}…`;
  }
  return lines;
}

async function entryCard({ title, eyebrow, cover, out }) {
  const layers = [];

  if (cover && fs.existsSync(cover)) {
    // How dark to take it, measured rather than fixed.
    //
    // A flat dim was wrong for everything here: these covers already run from
    // luma 15 to 46 out of 255, and taking all of them down by the same amount
    // turned the dark ones into black rectangles with a title on top. The
    // scrim below is what makes the text readable, so this only pulls down a
    // cover bright enough to fight it, and never lifts one.
    const stats = await sharp(cover).stats();
    const [r, g, b] = stats.channels;
    const luma = r.mean * 0.2126 + g.mean * 0.7152 + b.mean * 0.0722;
    const brightness = Math.max(0.5, Math.min(1, 40 / Math.max(luma, 1)));

    // Cover, not contain: the card is a fixed shape and letterboxing a cover
    // inside it would put the site's ground in two bands around someone's
    // artwork.
    const art = await sharp(cover)
      .resize(OG_W, OG_H, { fit: 'cover', position: 'attention' })
      .modulate({ brightness })
      .toBuffer();
    layers.push({ input: art, left: 0, top: 0 });

    // A scrim under the text only. Darkening the whole cover enough to read
    // white type over any of it would have flattened the picture.
    const scrim = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.35" stop-color="#0a0a0b" stop-opacity="0"/>
      <stop offset="1" stop-color="#0a0a0b" stop-opacity="0.93"/>
    </linearGradient>
  </defs>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#s)"/>
</svg>`);
    layers.push({ input: scrim, left: 0, top: 0 });
  } else {
    // No cover. The mark stands in, small and top-left, so the card still
    // belongs to this site rather than being type on a black field.
    const small = await sharp(MARK).resize(120, 120, { fit: 'inside' }).toBuffer();
    layers.push({ input: small, left: 80, top: 74 });
  }

  // Long titles step down rather than wrapping to four lines.
  const size = title.length <= 34 ? 68 : title.length <= 66 ? 56 : 46;
  const perLine = Math.floor((OG_W - 160) / (size * 0.52));
  const lines = wrap(title, perLine);
  // Anchored to the bottom, so one line and three lines share a baseline
  // instead of drifting up and down the card.
  const lastBaseline = OG_H - 96;
  const lead = Math.round(size * 1.16);

  const text = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
  <style>
    .eyebrow { font: 700 25px system-ui, -apple-system, "Segoe UI", sans-serif;
               fill: ${GOLD}; letter-spacing: 4px; }
    .t { font: 800 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif;
         fill: #f7f7f5; letter-spacing: -1.5px; }
  </style>
  <text class="eyebrow" x="80" y="${lastBaseline - lines.length * lead - 26}">${esc(
    eyebrow.toUpperCase(),
  )}</text>
  ${lines
    .map(
      (l, i) =>
        `<text class="t" x="80" y="${
          lastBaseline - (lines.length - 1 - i) * lead
        }">${esc(l)}</text>`,
    )
    .join('\n  ')}
</svg>`);
  layers.push({ input: text, left: 0, top: 0 });

  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp({
    create: { width: OG_W, height: OG_H, channels: 4, background: GROUND },
  })
    .composite(layers)
    .png()
    .toFile(out);
}

{
  const { default: matter } = await import('gray-matter');

  for (const [dir, kind] of [
    ['content/writing', 'writing'],
    ['content/projects', 'projects'],
  ]) {
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
      const slug = file.replace(/\.mdx$/, '');
      const { data } = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (!data.title) continue;
      // A project with an href points somewhere else — Fabled Threads sends
      // people to /store/ — so no page is generated for it and a card would
      // belong to a URL that 404s.
      if (data.href) continue;

      await entryCard({
        title: data.title,
        // Writing is filed by track, projects by what the thing is.
        eyebrow: kind === 'writing' ? (data.track ?? 'writing') : (data.kind ?? 'project'),
        cover: data.cover ? path.join('public', data.cover) : null,
        out: path.join(CARD_DIR, kind, `${slug}.png`),
      });
    }

    const n = fs.existsSync(path.join(CARD_DIR, kind))
      ? fs.readdirSync(path.join(CARD_DIR, kind)).length
      : 0;
    console.log(`og: wrote ${n} ${kind} card(s) to ${CARD_DIR}/${kind}/`);
  }
}

// --- favicon.ico -----------------------------------------------------------
//
// app/icon.png gets Next to emit <link rel="icon">, which is what a browser
// reads off the page — but nothing serves /favicon.ico, and that bare path is
// still probed directly by browsers on a cold tab, by crawlers, and by every
// link-preview scraper. It was returning 404 on every request.
//
// An .ico is a container: a 6-byte header, one 16-byte directory entry per
// size, then the images. Since Vista those images may be PNGs rather than
// bitmaps, so this packs the PNGs sharp already produces instead of pulling in
// an encoder.
const icoSizes = [16, 32, 48];
const icoImages = [];
for (const size of icoSizes) {
  const inner = Math.round(size * 0.82);
  const mark = await sharp(MARK)
    .resize(inner, inner, { fit: 'inside' })
    .toBuffer();
  icoImages.push(
    await sharp({
      create: { width: size, height: size, channels: 4, background: GROUND },
    })
      .composite([{ input: mark, gravity: 'center' }])
      .png()
      .toBuffer(),
  );
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // 1 = icon
header.writeUInt16LE(icoSizes.length, 4);

const entries = [];
let offset = 6 + icoSizes.length * 16;
icoSizes.forEach((size, i) => {
  const e = Buffer.alloc(16);
  // 0 means 256 in this field; every size here is smaller, so it is literal.
  e.writeUInt8(size, 0);
  e.writeUInt8(size, 1);
  e.writeUInt8(0, 2); // palette size, 0 for truecolour
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(icoImages[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += icoImages[i].length;
  entries.push(e);
});

fs.writeFileSync(
  path.join('app', 'favicon.ico'),
  Buffer.concat([header, ...entries, ...icoImages]),
);
console.log(
  `og: wrote app/favicon.ico (${icoSizes.join(', ')}px, ${(
    fs.statSync('app/favicon.ico').size / 1024
  ).toFixed(1)}KB)`,
);
