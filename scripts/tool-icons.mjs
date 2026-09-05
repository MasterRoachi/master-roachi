// Generates lib/toolIcons.ts from simple-icons.
//
//   node scripts/tool-icons.mjs
//
// simple-icons is a devDependency and stays there: importing it at runtime
// would ship 3,457 icons to reach the handful this site uses. The generated
// file holds only those, and is committed.
//
// Brand hexes are authored for light backgrounds. Anything too dark to see on
// this site's near-black is flipped to white, which is how those brands
// present themselves on dark ground anyway.
import fs from 'node:fs';
import * as si from 'simple-icons';

const TOOLS = [
  ['typescript', 'TypeScript'],
  ['javascript', 'JavaScript'],
  ['react', 'React'],
  ['nextdotjs', 'Next.js'],
  ['vuedotjs', 'Vue'],
  ['nuxt', 'Nuxt'],
  ['godotengine', 'Godot'],
  ['python', 'Python'],
  ['nodedotjs', 'Node.js'],
  ['sqlite', 'SQLite'],
  ['html5', 'HTML'],
  ['css', 'CSS'],
  ['claude', 'Claude'],
  ['cursor', 'Cursor'],
];

// LinkedIn is deliberately absent: simple-icons removed it after LinkedIn
// enforced their trademark, and redrawing the mark they objected to would be
// doing knowingly what the removal was about. It renders as a wordmark.
const SOCIALS = [
  ['github', 'GitHub'],
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['youtube', 'YouTube'],
];

/**
 * Whether a brand colour is too close to black to read on this ground.
 *
 * Luminance alone is not enough: pure red scores 0.21 and would be flipped to
 * white despite being perfectly visible. A colour only needs replacing when it
 * is both dark AND close to greyscale — which is what an almost-black brand
 * mark actually is.
 */
function needsLightening(hex) {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const max = Math.max(r, g, b);
  const saturation = max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
  return luminance < 0.22 && saturation < 0.25;
}

/**
 * Lifts a dark but colourful mark until it is visible, keeping its hue.
 *
 * `needsLightening` above handles the other case — a mark that is dark *and*
 * grey, like a black wordmark, which is flattened to white because there is no
 * colour in it to preserve. A dark saturated mark cannot be treated that way:
 * SQLite's #003B57 is a navy at 19% luminance and fully saturated, so it fails
 * that test, stays as it is, and disappears entirely against a near-black page.
 * Turning it white would lose the blue that makes it recognisable.
 *
 * So the hue and saturation are kept and only the lightness is raised. It is
 * the same trick scripts/covers.mjs uses on Terrath's accent, for the same
 * reason.
 */
function liftDarkColour(hex, below = 0.28, to = 0.5) {
  const n = parseInt(hex, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  // Only marks that are genuinely too dark to see. A floor applied to every
  // colour shifted Nuxt, Python and CSS as well, which were perfectly legible
  // and are not this function's business.
  if (l >= below) return hex;

  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  // Back out of HSL at the raised lightness.
  const c = (1 - Math.abs(2 * to - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = to - c / 2;
  const [r2, g2, b2] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];

  return [r2, g2, b2]
    .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function lookup(slug) {
  const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = si[key];
  if (!icon) throw new Error(`simple-icons has no "${slug}"`);
  return icon;
}

/**
 * Marks that are really two colours, and which simple-icons flattens to one.
 *
 * Python is the whole reason this exists: its logo is a blue snake and a
 * yellow one, and the set carries a single blue path holding both. The path is
 * four subpaths — body, eye, body, eye — so it splits cleanly down the middle.
 *
 * The catch is that subpaths after the first move *relatively*, from wherever
 * the previous one ended. Each of these closes with `z`, which returns the
 * point to that subpath's own start, so the absolute origin of any subpath is
 * just the running sum of the offsets before it. The second half is re-anchored
 * to that absolute point; without it the yellow snake lands somewhere else
 * entirely.
 */
const SPLITS = {
  python: { at: 2, colors: ['#3776AB', '#FFD43B'] },
};

/** SVG packs numbers together: "14.25.18" is two of them, not one. */
const NUM = /-?(?:\d+(?:\.\d+)?|\.\d+)/g;

function splitPath(path, at) {
  const parts = path.split(/(?=[Mm])/).filter(Boolean);

  let x = 0;
  let y = 0;
  const origins = [];
  for (const part of parts) {
    NUM.lastIndex = 0;
    const a = NUM.exec(part);
    const b = NUM.exec(part);
    const dx = parseFloat(a[0]);
    const dy = parseFloat(b[0]);
    if (part[0] === 'M') {
      x = dx;
      y = dy;
    } else {
      x += dx;
      y += dy;
    }
    origins.push({ x, y, headLength: NUM.lastIndex });
  }

  const first = parts.slice(0, at).join('');
  const o = origins[at];
  const second =
    `M${+o.x.toFixed(4)} ${+o.y.toFixed(4)}` +
    parts[at].slice(o.headLength) +
    parts.slice(at + 1).join('');

  return [first, second];
}

function toolRow([slug, label]) {
  const icon = lookup(slug);
  // Dark and grey goes white; dark and colourful keeps its hue and is lifted.
  const color = needsLightening(icon.hex)
    ? 'FFFFFF'
    : liftDarkColour(icon.hex);
  const split = SPLITS[slug];

  const lines = [
    '  {',
    `    label: ${JSON.stringify(label)},`,
    `    color: '#${color}',`,
    `    path: ${JSON.stringify(icon.path)},`,
  ];

  if (split) {
    const halves = splitPath(icon.path, split.at);
    lines.push('    layers: [');
    halves.forEach((d, i) => {
      lines.push('      {');
      lines.push(`        color: '${split.colors[i]}',`);
      lines.push(`        path: ${JSON.stringify(d)},`);
      lines.push('      },');
    });
    lines.push('    ],');
  }

  lines.push('  },');
  return lines.join('\n');
}

function socialRow([slug, label]) {
  const icon = lookup(slug);
  const color = needsLightening(icon.hex) ? 'FFFFFF' : icon.hex;
  const lines = [
    '  {',
    `    key: ${JSON.stringify(slug)},`,
    `    label: ${JSON.stringify(label)},`,
    `    color: '#${color}',`,
    `    path: ${JSON.stringify(icon.path)},`,
    '  },',
  ];
  return lines.join('\n');
}

const out = [
  '// GENERATED by scripts/tool-icons.mjs — do not edit by hand.',
  '//',
  '// Brand marks from simple-icons, reduced to the ones this site uses.',
  '// Colours too dark to read on a near-black ground are flipped to white.',
  '',
  'export interface ToolIcon {',
  '  label: string;',
  '  color: string;',
  '  /** SVG path data, on a 24x24 viewBox. */',
  '  path: string;',
  '  /**',
  '   * Set where the real mark is more than one colour. Drawn in order, over',
  '   * the flat `path` rather than instead of it, so anything that does not',
  '   * know about layers still renders something correct.',
  '   */',
  '  layers?: { color: string; path: string }[];',
  '}',
  '',
  'export const TOOL_ICONS: ToolIcon[] = [',
  TOOLS.map(toolRow).join('\n'),
  '];',
  '',
  '/** Tools with no brand mark in simple-icons; rendered as a wordmark. */',
  "export const TOOL_WORDMARKS: string[] = ['Codex'];",
  '',
  'export interface SocialIcon extends ToolIcon {',
  '  key: string;',
  '}',
  '',
  'export const SOCIAL_ICONS: SocialIcon[] = [',
  SOCIALS.map(socialRow).join('\n'),
  '];',
  '',
].join('\n');

fs.writeFileSync('lib/toolIcons.ts', out);
console.log(
  `wrote lib/toolIcons.ts — ${TOOLS.length} tools, ${SOCIALS.length} socials`,
);
