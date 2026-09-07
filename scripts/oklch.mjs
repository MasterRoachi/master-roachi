/**
 * oklch → sRGB hex.
 *
 * The frontmatter and lib/format.ts both store colours as oklch, which is what
 * the CSS uses. librsvg — what sharp rasterises SVG with — does not understand
 * it, so it is converted here rather than a second set of hex values being
 * maintained alongside and drifting from the first.
 *
 * Shared by scripts/covers.mjs and scripts/og.mjs, which both draw with these
 * colours and would otherwise carry a copy each.
 */
export function oklchToHex(input, minL = 0) {
  const m = String(input).match(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/i,
  );
  if (!m) return '#888888';
  let [, L, C, Hdeg] = m;
  L = parseFloat(L);
  if (L > 1) L /= 100; // "84%" and "0.84" both appear in the wild
  // A lightness floor, for callers drawing on a dark ground.
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
