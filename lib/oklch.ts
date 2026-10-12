// oklch ↔ sRGB hex.
//
// The site stores every colour as oklch, which is what the CSS uses. Two
// things cannot read it and need hex instead: librsvg, which is what sharp
// rasterises the generated cards with, and `<input type="color">`, which is
// what the projects editor puts in front of the two accents.
//
// Moved out of scripts/oklch.mjs so the Worker-side editor and the build
// scripts share one conversion rather than two that drift. Same reasoning as
// lib/printful.ts, and the same constraint: erasable TypeScript only, because
// a plain .mjs script imports it and Node strips the types on the way in.

/** How much of a colour's lightness a caller may force, drawing on the dark. */
export type Floor = number;

/**
 * oklch → sRGB hex.
 *
 * `minL` is a lightness floor for callers drawing on a dark ground. Terrath's
 * accent is a deep forest green at 40% lightness; drawn at a tenth opacity on
 * a near-black ground, under a card that dims covers to 0.86, it came out as a
 * black rectangle. Lifting L keeps the hue and chroma — it is still
 * recognisably that green — while making it something you can see.
 */
export function oklchToHex(input: unknown, minL: Floor = 0): string {
  const m = /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/i.exec(
    String(input),
  );
  if (!m) return '#888888';

  let L = parseFloat(m[1]);
  if (L > 1) L /= 100; // "84%" and "0.84" both appear in the wild
  if (minL) L = Math.max(L, minL);
  const C = parseFloat(m[2]);
  const h = (parseFloat(m[3]) * Math.PI) / 180;

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

/**
 * sRGB hex → oklch, formatted the way the frontmatter already writes it.
 *
 * Rounded to `oklch(86% 0.20 135)` rather than carried to full precision: the
 * existing files are all written that way, and a picker that turned every
 * accent it touched into fifteen decimal places would make the diffs useless
 * for a change nobody can see.
 *
 * Note the direction is lossy in one specific way worth knowing: a colour
 * picker is sRGB, so round-tripping an oklch value that sits outside the sRGB
 * gamut through hex will clamp it. The editor therefore writes a new value
 * only when the picker is actually moved, and keeps a text field beside it for
 * typing a value by hand.
 */
export function hexToOklch(hex: string): string {
  const clean = String(hex).trim().replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return 'oklch(50% 0 0)';

  const [r, g, b] = [0, 2, 4].map((at) => {
    const v = parseInt(full.slice(at, at + 2), 16) / 255;
    // sRGB → linear light.
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(A * A + B * B);
  // A grey has no meaningful hue, and atan2(0, 0) is 0 by luck rather than by
  // meaning — written as 0 deliberately so `oklch(97% 0 0)` comes back out as
  // itself rather than as some arbitrary angle.
  const H = C < 0.0005 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;

  return `oklch(${Math.round(L * 1000) / 10}% ${C < 0.0005 ? 0 : Math.round(C * 100) / 100} ${Math.round(H)})`;
}

/** Whether a string is an oklch colour this site can store. */
export function isOklch(value: unknown): boolean {
  return /^oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+\s*(?:\/\s*[\d.]+\s*)?\)$/i.test(
    String(value).trim(),
  );
}
