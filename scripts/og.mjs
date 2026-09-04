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
