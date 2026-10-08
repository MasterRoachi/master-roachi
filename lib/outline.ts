// Turning a pasted course outline into modules and lessons.
//
// This exists so that building a curriculum is not two hundred clicks. Course
// pages, syllabi and tables of contents are all already shaped like an
// outline, so the fastest way in is to paste one and let it be parsed —
// otherwise the dashboard is finished and entering the content is the hard
// part, which is the wrong way round.
//
// Deliberately forgiving about what a list looks like, because the point is to
// paste from somewhere else rather than to type in a format. A top-level line
// is a module; an indented, bulleted or numbered line is a lesson under it.

export interface ParsedModule {
  name: string;
  lessons: string[];
}

/** Strip bullets, numbering and trailing punctuation from a line's text. */
function clean(line: string): string {
  return line
    .replace(/^[\s]*[-*•–—]+\s*/, '')
    .replace(/^[\s]*\d+[.)]\s*/, '')
    .replace(/^[\s]*#+\s*/, '')
    .trim();
}

/**
 * Parse an outline into modules with their lessons.
 *
 * A line is a lesson if it is INDENTED or BULLETED. Numbering deliberately
 * does not count on its own: courses number their sections at least as often
 * as their items — "1. JavaScript" is a module in Odin's path — so treating a
 * number as a lesson marker turns every numbered section into a lesson of
 * whatever came before it. Indented numbering is still a lesson, which the
 * indentation test already covers.
 *
 * That leaves a genuine ambiguity for an outline that numbers its lessons
 * flat, with no indentation. It is not resolvable from the text, which is why
 * the dashboard shows what the parse produced and asks before writing any of
 * it — a wrong guess is then something to see and fix rather than two hundred
 * rows to undo.
 *
 * Lessons appearing before any module are collected under a module named by
 * `orphans`: silently dropping them would lose content someone just pasted,
 * and inventing a name for them is worse than saying what happened.
 */
export function parseOutline(text: string, orphans = 'Lessons'): ParsedModule[] {
  const modules: ParsedModule[] = [];

  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;

    const indented = /^(\s{2,}|\t)/.test(raw);
    const bulleted = /^\s*[-*•–—]/.test(raw);
    const name = clean(raw);
    if (!name) continue;

    if (indented || bulleted) {
      if (modules.length === 0) modules.push({ name: orphans, lessons: [] });
      modules[modules.length - 1].lessons.push(name.slice(0, 300));
    } else {
      modules.push({ name: name.slice(0, 300), lessons: [] });
    }
  }

  // A module with no lessons is kept: a section heading with nothing under it
  // yet is a real state while a curriculum is being entered.
  return modules;
}

/** How many rows an import would create, for a confirmation that means something. */
export function outlineSize(modules: ParsedModule[]): { modules: number; lessons: number } {
  return {
    modules: modules.length,
    lessons: modules.reduce((total, module) => total + module.lessons.length, 0),
  };
}
