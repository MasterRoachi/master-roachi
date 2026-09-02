// Regenerates the logo variants in public/ from the master artwork.
//
//   node scripts/logo.mjs [path-to-source.png]
//
// The source is ~666KB at 1305x1206. Static export performs no image
// optimisation, so shipping it directly would cost every visitor more than the
// whole JS bundle. These variants are committed; the source is not.
import sharp from 'sharp';

const src = process.argv[2] ?? 'A:/Admin/masterroachi logo.png';
const base = sharp(src).trim(); // drop the transparent margin

await base
  .clone()
  .resize({ width: 640 })
  .webp({ quality: 88 })
  .toFile('public/logo.webp');

await base
  .clone()
  .resize({ width: 128 })
  .webp({ quality: 92 })
  .toFile('public/logo-mark.webp');

await base
  .clone()
  .resize({ width: 128 })
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/logo-mark.png');

console.log('wrote public/logo.webp, logo-mark.webp, logo-mark.png');

// --- Pantokrator icon for the first leaf of the hero book -------------------
//
//   node scripts/logo.mjs <logo.png> <pantokrator-source>
//
// Optional second argument. Produces public/pantokrator.webp, sized for a
// texture rather than a print — anything past ~768px is invisible at the size
// the page is actually seen.
const iconSrc = process.argv[3];
if (iconSrc) {
  await sharp(iconSrc)
    .resize({ width: 768, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile('public/pantokrator.webp');
  console.log('wrote public/pantokrator.webp');
}

// --- Turtle Hermit kanji, used on the hero rule -----------------------------
//
//   node scripts/logo.mjs <logo> <pantokrator> <kanji>
//
// Optional third argument. Displayed at ~26px, so 128px covers it even on a
// 3x display; the 1254px source would be ~580KB of invisible detail.
const kanjiSrc = process.argv[4];
if (kanjiSrc) {
  await sharp(kanjiSrc)
    .trim()
    .resize({ width: 128 })
    .webp({ quality: 92 })
    .toFile('public/kanji.webp');
  console.log('wrote public/kanji.webp');
}
