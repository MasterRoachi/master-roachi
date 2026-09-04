// Generates placeholder cover art for the project cards.
//
//   node scripts/covers.mjs
//
// Every project except The Odin Project had no cover, so the Work page showed
// one card with art beside five without — which reads as unfinished rather
// than deliberate.
//
// These are abstract on purpose. A generated image that looked like a
// screenshot would be claiming the software does something it may not yet do;
// abstract accent art claims nothing. Each is built from the project's own
// accent colours and seeded by its slug, so it is stable across runs — a cover
// that reshuffled every build would churn the diff and the CDN for nothing.
//
// The motif varies by the project's `kind`, so the six are distinguishable at
// a glance rather than six versions of the same gradient.
//
// Replacing one is a matter of dropping a real 1600x900 image at the path in
// the frontmatter. Nothing here has to be undone.

import fs from 'node:fs';
import path from 'node:path';

const W = 1600;
const H = 900;
const DIR = path.join('public', 'projects');
const CONTENT = path.join('content', 'projects');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('covers: sharp is not available — covers left as they are');
  process.exit(0);
}

/* --- colour ---------------------------------------------------------------
 *
 * The frontmatter stores oklch, which is what the CSS uses. librsvg — what
 * sharp rasterises with — does not understand it, so it is converted here
 * rather than a second set of hex values being maintained alongside.
 */

function oklchToHex(input, minL = 0) {
  const m = String(input).match(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/i,
  );
  if (!m) return '#888888';
  let [, L, C, Hdeg] = m;
  L = parseFloat(L);
  if (L > 1) L /= 100; // "84%" and "0.84" both appear in the wild
  // A lightness floor for the drawing colours only.
  //
  // Terrath's accent is a deep forest green at 40% lightness. Drawn at a tenth
  // opacity on a near-black ground, under a card that dims covers to 0.86, it
  // came out as a black rectangle. Lifting L keeps the hue and chroma — it is
  // still recognisably that green — while making it something you can see.
  if (minL) L = Math.max(L, minL);
  C = parseFloat(C);
  const h = (parseFloat(Hdeg) * Math.PI) / 180;

  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.089484178 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const mm = m_ ** 3;
  const s = s_ ** 3;

  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];

  const hex = lin
    .map((c) => {
      const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      return Math.max(0, Math.min(255, Math.round(v * 255)))
        .toString(16)
        .padStart(2, '0');
    })
    .join('');
  return `#${hex}`;
}

/* --- deterministic randomness --------------------------------------------- */

function rngFor(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function next() {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --- the motifs -----------------------------------------------------------
 *
 * One per `kind`, so a glance at the Work page distinguishes a game from a
 * tool from a world without reading the label.
 */

const MOTIF = {
  // Overlapping tiles, the way a sprite sheet or a level grid looks.
  Game(rnd, a, b) {
    let out = '';
    for (let i = 0; i < 26; i++) {
      const s = 60 + rnd() * 190;
      const x = rnd() * (W - s);
      const y = rnd() * (H - s);
      const c = rnd() > 0.5 ? a : b;
      out += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${s.toFixed(0)}" rx="10" fill="none" stroke="${c}" stroke-width="${(1 + rnd() * 2).toFixed(1)}" opacity="${(0.06 + rnd() * 0.16).toFixed(3)}"/>`;
    }
    return out;
  },

  // Contour lines, for a world that is mostly map and lore.
  World(rnd, a, b) {
    let out = '';
    for (let i = 0; i < 16; i++) {
      const y0 = 90 + i * 48 + rnd() * 18;
      const amp = 26 + rnd() * 62;
      const pts = [];
      for (let x = -40; x <= W + 40; x += 40) {
        pts.push(`${x},${(y0 + Math.sin((x / W) * Math.PI * (1.4 + rnd() * 0.5) + i) * amp).toFixed(1)}`);
      }
      out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${i % 3 === 0 ? b : a}" stroke-width="${(1 + rnd()).toFixed(1)}" opacity="${(0.07 + rnd() * 0.14).toFixed(3)}"/>`;
    }
    return out;
  },

  // A measured grid with crosshairs — a tool is precise or it is not a tool.
  Tool(rnd, a, b) {
    let out = '';
    for (let x = 0; x <= W; x += 64) {
      out += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${a}" stroke-width="1" opacity="0.055"/>`;
    }
    for (let y = 0; y <= H; y += 64) {
      out += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${a}" stroke-width="1" opacity="0.055"/>`;
    }
    for (let i = 0; i < 9; i++) {
      const x = 120 + rnd() * (W - 240);
      const y = 100 + rnd() * (H - 200);
      const r = 16 + rnd() * 40;
      out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="${b}" stroke-width="1.6" opacity="0.3"/>`;
      out += `<line x1="${(x - r - 16).toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x + r + 16).toFixed(0)}" y2="${y.toFixed(0)}" stroke="${b}" stroke-width="1" opacity="0.24"/>`;
      out += `<line x1="${x.toFixed(0)}" y1="${(y - r - 16).toFixed(0)}" x2="${x.toFixed(0)}" y2="${(y + r + 16).toFixed(0)}" stroke="${b}" stroke-width="1" opacity="0.24"/>`;
    }
    return out;
  },

  // Halftone, which is what the Store page already uses.
  Store(rnd, a, b) {
    let out = '';
    for (let y = 40; y < H; y += 46) {
      for (let x = 40; x < W; x += 46) {
        const t = x / W;
        const r = 3 + (1 - t) * 9 * (0.5 + rnd() * 0.9);
        out += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${t > 0.5 ? b : a}" opacity="${(0.05 + rnd() * 0.13).toFixed(3)}"/>`;
      }
    }
    return out;
  },

  // Stacked bars, for a course worked through one exercise at a time.
  Exercises(rnd, a, b) {
    let out = '';
    const cols = 22;
    const gap = W / cols;
    for (let i = 0; i < cols; i++) {
      const h = 60 + rnd() * 520;
      const x = i * gap + gap * 0.18;
      out += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${(gap * 0.64).toFixed(0)}" height="${h.toFixed(0)}" fill="${i % 4 === 0 ? b : a}" opacity="${(0.05 + rnd() * 0.12).toFixed(3)}"/>`;
    }
    return out;
  },
};

/* --- read the projects ----------------------------------------------------- */

const files = fs.existsSync(CONTENT)
  ? fs.readdirSync(CONTENT).filter((f) => f.endsWith('.mdx'))
  : [];
if (files.length === 0) {
  console.log('covers: no projects found');
  process.exit(0);
}

fs.mkdirSync(DIR, { recursive: true });
let wrote = 0;

for (const file of files) {
  const slug = file.replace(/\.mdx$/, '');
  const raw = fs.readFileSync(path.join(CONTENT, file), 'utf8');
  const field = (k) => {
    const m = raw.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?\\s*$`, 'm'));
    return m ? m[1].trim() : null;
  };

  const a = oklchToHex(field('accent') ?? 'oklch(84% 0.16 92)', 0.66);
  const b = oklchToHex(field('accent2') ?? field('accent') ?? 'oklch(70% 0.14 80)', 0.56);
  const kind = field('kind') ?? 'Game';
  const motif = MOTIF[kind] ?? MOTIF.Game;
  const rnd = rngFor(slug);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="a" cx="72%" cy="24%" r="78%">
      <stop offset="0%" stop-color="${a}" stop-opacity="0.30"/>
      <stop offset="70%" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="16%" cy="86%" r="70%">
      <stop offset="0%" stop-color="${b}" stop-opacity="0.24"/>
      <stop offset="72%" stop-color="${b}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.32"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0a0a0b"/>
  <rect width="${W}" height="${H}" fill="url(#a)"/>
  <rect width="${W}" height="${H}" fill="url(#b)"/>
  ${motif(rnd, a, b)}
  <rect width="${W}" height="${H}" fill="url(#v)"/>
</svg>`;

  const out = path.join(DIR, `${slug}.webp`);
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(out);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`covers: ${slug} — ${kind}, ${a}/${b}, ${kb}KB`);
  wrote++;
}

console.log(`covers: wrote ${wrote} covers to ${DIR}/`);
