// The note that lives with a card.
//
// A kanji card asks for the character to be written from memory, so there has
// to be somewhere to write it. The note is that place: pen and text, beside
// the card and the same size as it, saved when the card is answered.
//
// The scene format is the sketchpad's (lib/sketch.ts) — the same strokes and
// text items, so one surface implementation and one renderer serve both. What
// is different is the SHAPE OF THE PAGE: a sketch is one page of fixed size,
// and a note grows downward forever.

import { emptyScene, type Scene } from './sketch';

/** Matches PAGE.width in lib/sketch.ts, so coordinates mean the same thing. */
export const NOTE_WIDTH = 1600;

/**
 * One section: exactly what the panel shows, in scene units.
 *
 * A note is a whole number of sections, and ONLY ONE IS EVER VISIBLE. The
 * panel does not scroll through a tall page; it pages between sections, which
 * is the difference between this and the sketchpad.
 *
 * This is the FALLBACK. The real height is measured from the panel, so that a
 * section is exactly the shape of the space it is drawn in and the surface
 * fills it — a fixed shape left a bar of dead space above and below, which is
 * the one thing a writing area cannot afford. The measurement travels with the
 * note when it is saved, so the server records the same sections the page drew.
 *
 * The cost is that resizing the window moves where sections divide. For a
 * scratch pad on one rig that is a fair trade against making the geometry
 * permanent, which would mean every note carrying the shape of the window it
 * was first opened in.
 */
export const NOTE_SECTION = 1200;

/**
 * The biggest a note may get, in bytes of JSON.
 *
 * Handwriting is cheap — eight strokes of thirty points is a few hundred bytes
 * — so this is roughly a thousand attempts at one character. It exists because
 * the note grows forever by design and a row that grows forever eventually
 * stops being a row D1 will take. A note at the limit refuses the save and
 * says so, rather than being silently truncated into a scene that will not
 * parse.
 */
export const NOTE_MAX_BYTES = 192 * 1024;

export interface Note {
  scene: Scene;
  height: number;
}

export function emptyNote(): Note {
  return { scene: emptyScene(), height: NOTE_SECTION };
}

/** The lowest point any ink or text reaches. 0 for an empty scene. */
export function lowestPoint(scene: Scene): number {
  let lowest = 0;
  for (const item of scene.items) {
    if (item.kind === 'stroke') {
      for (const [, y] of item.points) if (y > lowest) lowest = y;
    } else if (item.text.trim()) {
      // The baseline plus the rest of the block, so a three-line note does not
      // read as one line tall.
      const lines = item.text.split('\n').length;
      const bottom = item.y + item.size * 1.35 * (lines - 1);
      if (bottom > lowest) lowest = bottom;
    }

  }
  return lowest;
}

/** A sane section height from anywhere, including the wire. */
export function sectionHeight(value: unknown): number {
  const asked = Number(value);
  if (!Number.isFinite(asked)) return NOTE_SECTION;
  // Bounded rather than trusted: the page measures this, and a zero would
  // divide by zero while something enormous would make every note one section.
  return Math.min(Math.max(Math.round(asked), 200), 20_000);
}

/** How many sections have something written in them. 0 for an empty note. */
export function sectionsWritten(scene: Scene, section: number = NOTE_SECTION): number {
  return Math.ceil(lowestPoint(scene) / sectionHeight(section));
}

/**
 * How many sections to show, which is only ever asked ON LOADING A CARD.
 *
 * Every section with something in it, plus one empty one to write in. Asking
 * once per card is the whole mechanism, and the first version got it wrong by
 * asking continuously: a fresh section appeared the instant a stroke was made,
 * because the stroke was what made the count go up. His words — "whenever i
 * write anything it immediately spawns another note section below".
 *
 * So the count is frozen for as long as the card is on screen. Write as much
 * as you like; the next section appears the next time you reach this card,
 * which is also when the previous attempt becomes worth comparing against.
 */
export function sectionsToShow(scene: Scene, section: number = NOTE_SECTION): number {
  return Math.max(1, sectionsWritten(scene, section) + 1);
}

/**
 * The height of what has been WRITTEN, for the `height` column.
 *
 * Not the height of what is shown — that is a count of sections and it lives
 * in the page, because it depends on when the card was opened rather than on
 * what is in the note. This is only a record of how far the note has actually
 * filled.
 */
export function writtenHeight(scene: Scene, section: number = NOTE_SECTION): number {
  return Math.max(1, sectionsWritten(scene, section)) * sectionHeight(section);
}

/**
 * A scene from the wire, or null.
 *
 * Null rather than a throw or a repaired guess: this arrives from a browser,
 * and a note that cannot be read is a note that must not overwrite the one
 * already saved.
 */
export function parseNote(value: unknown): Scene | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (value.length > NOTE_MAX_BYTES) return null;

  try {
    const parsed = JSON.parse(value) as Scene;
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return null;

    // The same filter fromSvg() applies, for the same reason: an item that is
    // neither a stroke with points nor text with a string would render as
    // nothing and be impossible to find or remove afterwards.
    return {
      version: 1,
      background: typeof parsed.background === 'string' ? parsed.background : '#16181d',
      items: parsed.items.filter(
        (item) =>
          item &&
          ((item.kind === 'stroke' && Array.isArray(item.points)) ||
            (item.kind === 'text' && typeof item.text === 'string')),
      ),
    };
  } catch {
    return null;
  }
}

/** Nothing has been written. Used to avoid storing a row for an untouched note. */
export function isEmptyNote(scene: Scene): boolean {
  return scene.items.every((item) => item.kind === 'text' && !item.text.trim());
}
