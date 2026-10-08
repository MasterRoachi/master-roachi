// What a book looks like on the shelf.
//
// A shelf of identical rectangles is a bar chart, not a library — what makes a
// bookcase recognisable is that no two books are the same size or colour. So
// each one gets a spine derived from what is already known about it, and
// nothing new has to be stored.
//
// Everything here is DETERMINISTIC. A book must look the same on every visit
// and on every device: a shelf that reshuffles its colours on reload is
// unreadable, because the colour is how a book is found again without reading
// every title.

/** A stable 32-bit hash of a string. Not cryptographic — it only has to spread. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Hues that sit on this site's palette.
 *
 * Not the whole wheel: the site is one warm accent on a near-black ground, and
 * an evenly-spread rainbow would look like a different website. These are
 * picked to read as cloth and leather bindings — ochres, greens, oxbloods,
 * slate blues — and any of them can sit next to the accent without fighting
 * it.
 */
const HUES = [28, 48, 85, 112, 148, 196, 232, 262, 318, 12];

export interface Spine {
  /** CSS colour for the spine face. */
  colour: string;
  /** A darker edge, so adjacent books of a similar hue still separate. */
  edge: string;
  /** Thickness in px, from the page count where there is one. */
  width: number;
  /** Height in px. Varied, because books are not all the same height. */
  height: number;
  /** True for the pale-text case — a light spine needs dark lettering. */
  light: boolean;
}

/**
 * The spine for a book.
 *
 * Thickness comes from the page count, which is the one honest mapping
 * available: a thick book should look thick. A book with no page count gets a
 * middling width rather than the thinnest, so "unknown" does not read as
 * "slim".
 */
export function spineFor(book: {
  id: number;
  title: string;
  author?: string | null;
  pages?: number | null;
}): Spine {
  // Keyed on the id and the title together: the id keeps two books of the same
  // name apart, and the title keeps a book's colour stable if rows are ever
  // renumbered.
  const h = hash(`${book.id}:${book.title}`);

  const hue = HUES[h % HUES.length];
  // A few lightness steps rather than a continuum, so the shelf has
  // recognisable light and dark books instead of a wash of mid-tones.
  //
  // Unsigned shifts throughout. `>>` is signed, so any hash above 2^31 came
  // back negative and indexed off the front of these arrays — undefined
  // lightness, and heights below the base. Silent, because an undefined in a
  // CSS string is just a colour the browser ignores.
  const step = (h >>> 8) % 4;
  const lightness = [26, 34, 42, 72][step];
  const chroma = step === 3 ? 0.06 : 0.085;

  const pages = book.pages ?? null;
  const width =
    pages === null
      ? 34
      : Math.round(24 + Math.min(Math.max(pages, 60), 1000) / 1000 * 34);

  // Height varies within a band that keeps the shelf line readable — real
  // books differ by a centimetre or two, not by half.
  const height = 156 + ((h >>> 16) % 5) * 11;

  return {
    colour: `oklch(${lightness}% ${chroma} ${hue})`,
    edge: `oklch(${Math.max(lightness - 12, 14)}% ${chroma} ${hue})`,
    width,
    height,
    light: lightness > 60,
  };
}
