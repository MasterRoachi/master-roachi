// What a curriculum's card looks like, and where it lies in the pile.
//
// THE COLOUR IS THE STATUS and nothing else. It was derived from the name
// first, which gave every curriculum its own hue — handsome, and it meant the
// one thing a glance at the deck could not tell you was which courses were
// running. Eight hues carry eight identities nobody needed; three carry the
// only fact that changes.
//
//   active    white — in play, and the card you are meant to be reading
//   done      gold  — finished, and worth looking finished
//   paused    black — out of play without being gone
//
// So `cardFor(name)` is gone rather than kept around unused. The hash stays,
// for the scatter, which does still want to be per-name.

/** A stable 32-bit hash of a string. Not cryptographic — it only has to spread. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The gold everything finished is marked in, and the deck's arrows. */
export const GOLD = 'oklch(80% 0.13 85)';

export interface CardLook {
  /** The face. */
  background: string;
  /** A second stop, so the face has depth rather than reading as a swatch. */
  background2: string;
  /** Text and strokes ON the card — dark on white and gold, light on black. */
  ink: string;
  /** Emphasis: the ring's fill, the status mark. */
  accent: string;
  /** The card's own edge. */
  line: string;
}

/**
 * A card's colours, from its status.
 *
 * Every value is stated rather than derived from one hue, because the three
 * are not three shades of a thing: white and gold need dark ink and black
 * needs light, and a formula that produced all three would be a worse way of
 * writing down three answers.
 */
export function statusLook(status: string): CardLook {
  if (status === 'done') {
    return {
      background: 'oklch(84% 0.12 88)',
      background2: 'oklch(72% 0.13 82)',
      ink: 'oklch(24% 0.03 85)',
      accent: 'oklch(32% 0.05 85)',
      line: 'oklch(90% 0.08 88)',
    };
  }
  if (status === 'paused') {
    return {
      background: 'oklch(18% 0 0)',
      background2: 'oklch(11% 0 0)',
      ink: 'oklch(72% 0 0)',
      accent: 'oklch(80% 0 0)',
      line: 'oklch(32% 0 0)',
    };
  }
  // Active, and the default for anything unrecognised — a card with a status
  // nobody has heard of is still a card being worked on.
  return {
    background: 'oklch(97% 0 0)',
    background2: 'oklch(88% 0 0)',
    ink: 'oklch(20% 0 0)',
    accent: 'oklch(28% 0 0)',
    line: 'oklch(99% 0 0)',
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
 * reason the colour used to be: a pile that re-strews itself on reload is a
 * pile you cannot learn the shape of.
 *
 * NEATER THAN IT WAS. The first version threw the cards wide, because every
 * card had to be clickable and so needed a visible edge. The deck has arrows
 * now and only the front card is interactive, so the cards behind it are
 * texture rather than targets — and the pile can look like a deck somebody
 * squared up rather than one somebody dropped.
 */
export function scatterFor(name: string, at: number): Scatter {
  if (at === 0) return { rotate: 0, dx: 0, dy: 0 };

  const h = hash(`${name.trim().toLowerCase()}:${at}`);

  // Angle and radius rather than two independent offsets, so the cards sit
  // around the front one instead of clustering at the centre. Stepped by the
  // golden angle so consecutive cards do not lie in the same direction.
  const angle = ((at * 137.5 + (h % 40)) * Math.PI) / 180;
  // Neater again, asked for twice: a squared-up deck with a hand's worth of
  // untidiness, not a scatter. Half the reach and half the tilt of the last
  // pass, which itself was a third of the first.
  const radius = 0.55 + Math.min(1, at / 6) * 0.75;

  const round = (value: number) => Math.round(value * 10) / 10;

  return {
    rotate: round(((h >>> 16) % 46) / 10 - 2.3),
    dx: round(Math.cos(angle) * radius),
    // Flatter vertically: the cards are tall, so the same radius sideways
    // shows an edge and downwards mostly shows nothing.
    dy: round(Math.sin(angle) * radius * 0.7),
  };
}
