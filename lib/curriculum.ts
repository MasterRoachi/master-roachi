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
  /**
   * What the lesson actually teaches, in Markdown. Null where the substance
   * lives in the resource instead — see migrations/0007_lesson_detail.sql.
   */
  detail: string | null;
  /**
   * 1 when the lesson is on the route being taken, 0 when it is being skipped.
   *
   * A number rather than a boolean because that is what SQLite stores, and
   * converting it on the way through would mean two shapes for one fact.
   */
  on_route: number;
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
  /** Lessons on the route. The denominator that matters. */
  total: number;
  /** 0–100, and 0 for an empty curriculum rather than NaN. */
  percent: number;
  /** Lessons being skipped, so the page can say what the route leaves out. */
  skipped: number;
  /**
   * Lessons done that are NOT on the route.
   *
   * Kept separate rather than folded into `done`: work done off the route was
   * still done and its date is still true, but counting it would make a route
   * read as more complete than it is — and could put it over 100%.
   */
  doneOffRoute: number;
}

export function progressOf(unit: { modules: Module[] } | { lessons: Lesson[] }): Progress {
  const lessons =
    'modules' in unit ? unit.modules.flatMap((module) => module.lessons) : unit.lessons;
  const onRoute = lessons.filter((lesson) => lesson.on_route !== 0);
  const done = onRoute.filter((lesson) => lesson.done_on !== null).length;
  const total = onRoute.length;
  // A curriculum with no lessons on its route is at 0%, not at 100% and not at
  // NaN — dividing by zero here would render a full ring on an empty course.
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    skipped: lessons.length - onRoute.length,
    doneOffRoute: lessons.filter(
      (lesson) => lesson.on_route === 0 && lesson.done_on !== null,
    ).length,
  };
}

/** Whether a module is on the route at all. Derived, so it cannot disagree. */
export function moduleOnRoute(module: Module): boolean {
  return module.lessons.some((lesson) => lesson.on_route !== 0);
}

/**
 * The first lesson not yet done, in course order.
 *
 * In order, not "the earliest id" — modules and lessons both carry a position,
 * and the API returns them sorted by it, so the first gap in that sequence is
 * genuinely the next thing to do. Skipping around leaves earlier gaps, and
 * those are what should come back first.
 *
 * Off-route lessons are passed over. A lesson taken off the route is one that
 * is not being done, so offering it as the next thing would be offering the
 * one piece of work already decided against.
 */
export function nextLesson(
  curriculum: Curriculum,
): { module: Module; lesson: Lesson } | null {
  for (const module of curriculum.modules) {
    for (const lesson of module.lessons) {
      if (lesson.on_route !== 0 && lesson.done_on === null) return { module, lesson };
    }
  }
  return null;
}

/**
 * The next thing to do across everything — the route through all the routes.
 *
 * Curriculums are walked in their own order, so the single next lesson is the
 * first gap on the first unfinished route. Only ACTIVE curriculums take part:
 * paused means not now, and a paused course offering the next thing to do
 * would make pausing it pointless.
 */
export function overallNext(curriculums: Curriculum[]):
  | { curriculum: Curriculum; module: Module; lesson: Lesson }
  | null {
  for (const curriculum of curriculums) {
    if (curriculum.status !== 'active') continue;
    const next = nextLesson(curriculum);
    if (next) return { curriculum, ...next };
  }
  return null;
}

/** Whether every lesson is done — distinct from a curriculum marked done by hand. */
export function isComplete(curriculum: Curriculum): boolean {
  const { done, total } = progressOf(curriculum);
  return total > 0 && done === total;
}

/** Progress across every active route, for the one number at the top. */
export function overallProgress(curriculums: Curriculum[]): Progress {
  const active = curriculums.filter((curriculum) => curriculum.status === 'active');
  return progressOf({ modules: active.flatMap((curriculum) => curriculum.modules) });
}

/** Lessons finished in the last `days`, as a sign of whether it is moving. */
export function recentlyDone(curriculum: Curriculum, today: string, days = 14): number {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const from = cutoff.toISOString().slice(0, 10);
  // Any lesson done counts as movement, on the route or not — the question is
  // whether the course is being worked on, not whether it was worked on
  // according to plan.
  return curriculum.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => lesson.done_on !== null && lesson.done_on >= from).length;
}
