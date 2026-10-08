// Reading a curriculum: how far through it, and what is next.
//
// Both are derived rather than stored, so they cannot drift from the lessons
// themselves. "What is next" is the single most useful thing a course tracker
// can say — the question on opening it is never "how many have I done", it is
// "where was I" — and it is one scan of data already on the page.

export interface Lesson {
  id: number;
  name: string;
  done_on: string | null;
}

export interface Module {
  id: number;
  name: string;
  lessons: Lesson[];
}

export interface Curriculum {
  id: number;
  name: string;
  source: string | null;
  status: 'active' | 'paused' | 'done';
  modules: Module[];
}

export interface Progress {
  done: number;
  total: number;
  /** 0–100, and 0 for an empty curriculum rather than NaN. */
  percent: number;
}

export function progressOf(unit: { modules: Module[] } | { lessons: Lesson[] }): Progress {
  const lessons =
    'modules' in unit ? unit.modules.flatMap((module) => module.lessons) : unit.lessons;
  const done = lessons.filter((lesson) => lesson.done_on !== null).length;
  const total = lessons.length;
  // A curriculum with no lessons yet is at 0%, not at 100% and not at NaN —
  // dividing by zero here would render a full bar on an empty course.
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/**
 * The first lesson not yet done, in course order.
 *
 * In order, not "the earliest id" — modules and lessons both carry a position,
 * and the API returns them sorted by it, so the first gap in that sequence is
 * genuinely the next thing to do. Skipping around leaves earlier gaps, and
 * those are what should come back first.
 */
export function nextLesson(
  curriculum: Curriculum,
): { module: Module; lesson: Lesson } | null {
  for (const module of curriculum.modules) {
    for (const lesson of module.lessons) {
      if (lesson.done_on === null) return { module, lesson };
    }
  }
  return null;
}

/** Whether every lesson is done — distinct from a curriculum marked done by hand. */
export function isComplete(curriculum: Curriculum): boolean {
  const { done, total } = progressOf(curriculum);
  return total > 0 && done === total;
}

/** Lessons finished in the last `days`, as a sign of whether it is moving. */
export function recentlyDone(curriculum: Curriculum, today: string, days = 14): number {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const from = cutoff.toISOString().slice(0, 10);
  return curriculum.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => lesson.done_on !== null && lesson.done_on >= from).length;
}
