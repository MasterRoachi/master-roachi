// What a curriculum's card looks like.
//
// Derived from the name rather than stored, so it is identical on every visit
// and a new curriculum gets its own colour with nothing to choose. Same
// reasoning as lib/book-spine.ts, and the same constraint on the palette: the
// site is one warm accent on a near-black ground, and a card deck in evenly
// spread rainbow hues would look like a different website.
//
// Keyed on the NAME alone, not on the id. "A background that matches the
// name" is what was asked for, so renaming a curriculum is meant to change its
// colour — and the same name always comes back to the same card, whatever the
// row numbering has done in between.

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
 * Deliberately the same set the book spines use: the two decks are the same
 * idea in two places — a shelf of things being worked through — and two
 * different palettes for that would read as two different sites. Ten is enough
 * that eight curriculums rarely collide, and a collision costs nothing because
 * the name is written on the card.
 */
const HUES = [28, 48, 85, 112, 148, 196, 232, 262, 318, 12];

export interface CardLook {
  /** The face, dark enough for white text to sit on it. */
  background: string;
  /** A second stop, so the face has some depth rather than reading as a swatch. */
  background2: string;
  /** The ring and any emphasis on the card. */
  accent: string;
  /** The hue itself, for anything that needs to derive its own shade. */
  hue: number;
}

/**
 * A curriculum's card colours.
 *
 * Lightness and chroma are fixed rather than derived. Varying them by hash as
 * well is how a deck ends up with one card that is unreadably dark and one
 * that glares — the hue carries the identity, and everything else stays
 * where the rest of the site's surfaces sit.
 */
export function cardFor(name: string): CardLook {
  const hue = HUES[hash(name.trim().toLowerCase()) % HUES.length];
  return {
    background: `oklch(32% 0.07 ${hue})`,
    background2: `oklch(22% 0.05 ${hue})`,
    accent: `oklch(82% 0.14 ${hue})`,
    hue,
  };
}

export interface Scatter {
  /** Degrees, for the card's own tilt. */
  rotate: number;
  /** rem, left and up are negative. */
  dx: number;
  dy: number;
}

/**
 * Where a card lies in a roughly strewn pile.
 *
 * Derived from the name and the depth rather than randomised, for the same
 * reason the colour is: a pile that re-strews itself on every reload is a pile
 * you cannot learn the shape of, and the card you were about to click moves
 * out from under the cursor.
 *
 * The FRONT card is dead centre and untilted — it is the one being read, and
 * a tilted card with a name on it reads worse than a straight one. Everything
 * behind it scatters further the deeper it sits, which is what makes the lower
 * cards peek out far enough to be clicked at all.
 */
export function scatterFor(name: string, at: number): Scatter {
  if (at === 0) return { rotate: 0, dx: 0, dy: 0 };

  const h = hash(`${name.trim().toLowerCase()}:${at}`);

  /* Placed by ANGLE and RADIUS rather than by two independent offsets.
   *
   * Two independent random offsets put two of eight cards within half a
   * centimetre of dead centre, which on a 25rem card means no visible edge and
   * nothing to click. A minimum radius guarantees every card behind the front
   * one peeks out somewhere, and stepping the angle by the golden angle keeps
   * consecutive cards from peeking in the same direction — the hash only
   * jitters it, so the pile looks strewn rather than laid out.
   */
  const angle = ((at * 137.5 + (h % 50)) * Math.PI) / 180;
  // Grows with depth, with a floor so even the second card has an edge, and a
  // ceiling so a long deck does not walk off the side of the page.
  const radius = 3.6 + Math.min(1, at / 6) * 4.8;

  const round = (value: number) => Math.round(value * 10) / 10;

  return {
    rotate: round(((h >>> 16) % 180) / 10 - 9),
    dx: round(Math.cos(angle) * radius),
    // Flatter vertically: the cards are tall, so the same radius sideways
    // shows an edge and downwards mostly shows nothing.
    dy: round(Math.sin(angle) * radius * 0.7),
  };
}

/**
 * A stage's card, a step lighter than its curriculum's.
 *
 * Same hue on purpose: the fan of stage cards has to read as having come out
 * of the card that was clicked, and a different colour per stage would lose
 * that the moment two curriculums were open.
 */
export function stageCardFor(name: string, at: number): CardLook {
  const base = cardFor(name);
  // Walks up in lightness across the fan, so a long course's stages are
  // distinguishable from each other without leaving the curriculum's colour.
  const lift = Math.min(10, at * 1.5);
  return {
    background: `oklch(${32 + lift}% 0.07 ${base.hue})`,
    background2: `oklch(${22 + lift}% 0.05 ${base.hue})`,
    accent: base.accent,
    hue: base.hue,
  };
}
