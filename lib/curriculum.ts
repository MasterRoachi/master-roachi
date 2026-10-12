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
}

export interface Module {
  id: number;
  name: string;
  lessons: Lesson[];
}

/**
 * Where a curriculum is studied from.
 *
 * A list, because a real one is studied from several things at once — Greek
 * runs Pimsleur and the Basic Course in tandem. `curriculums.source` is a
 * different fact and still there: it records which document DESIGNED the
 * curriculum, which the build scripts read. See migration 0008.
 */
export interface Source {
  id: number;
  title: string;
  url: string | null;
  note: string | null;
}

export interface Curriculum {
  id: number;
  name: string;
  source: string | null;
  status: 'active' | 'paused' | 'done';
  modules: Module[];
  sources?: Source[];
}

/* THE ROUTE IS GONE, deliberately and at his word: "get rid of the entire
 * on the route dynamic it's not necessary, even for odin".
 *
 * It existed for Odin, which forks into Full Stack JavaScript or Ruby — the
 * idea being that 14 of its 151 lessons were decided against, so its progress
 * should read 112 of 137 rather than of 151. One flag, three derived numbers
 * (`skipped`, `doneOffRoute`, `moduleOnRoute`), a switch on every lesson, a
 * dimmed state in the grid, and a filter in every "what is next" — all to
 * express "I am not doing these", which deleting the lesson also expresses.
 *
 * So progress is done over total, and nothing is excluded from anything. The
 * `lessons.on_route` COLUMN is still there and every row is now 1: dropping a
 * column in SQLite rewrites the table, which is not worth doing to tidy away a
 * number nothing reads. Migration 0006 stays as the record of why it was once
 * a good idea.
 */
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
  // An empty curriculum is at 0%, not at 100% and not at NaN — dividing by
  // zero here would render a full ring on a course with nothing in it.
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/**
 * The first lesson not yet done, in course order.
 *
 * In order, not "the earliest id" — modules and lessons both carry a position,
 * and the API returns them sorted by it, so the first gap in that sequence is
 * genuinely the next thing to do. Skipping around leaves earlier gaps, and
 * those are what should come back first.
 *
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
/** Where a lesson sits, for a label like "Japanese module 2 lesson 12". */
export interface Step {
  curriculum: Curriculum;
  module: Module;
  lesson: Lesson;
  /** 1-based position of the module within its curriculum. */
  moduleAt: number;
  /** 1-based position of the lesson within its module. */
  lessonAt: number;
}

/**
 * The next thing to do in one curriculum, with its position.
 *
 * `skip` walks past lessons already queued, which is what lets the Up next row
 * refill itself: when a card is finished and fades, the next one from the same
 * curriculum is appended, and that is the one after the one just taken.
 */
export function nextStep(curriculum: Curriculum, skip: Set<number> = new Set()): Step | null {
  for (let m = 0; m < curriculum.modules.length; m += 1) {
    const module = curriculum.modules[m];
    for (let l = 0; l < module.lessons.length; l += 1) {
      const lesson = module.lessons[l];
      if (lesson.done_on !== null) continue;
      if (skip.has(lesson.id)) continue;
      return { curriculum, module, lesson, moduleAt: m + 1, lessonAt: l + 1 };
    }
  }
  return null;
}

/**
 * One next lesson per ACTIVE curriculum.
 *
 * Not the next ten on the route, which is what this was: in route order those
 * all come from whichever curriculum is first, so the row answered "what is
 * the path" when the question it is asked every morning is "what is there to
 * do today" — and the answer to that is one thing from each course being
 * studied. Paused and done contribute nothing, which is what pausing is for.
 */
export function nextPerCurriculum(curriculums: Curriculum[]): Step[] {
  const out: Step[] = [];
  for (const curriculum of curriculums) {
    if (curriculum.status !== 'active') continue;
    const step = nextStep(curriculum);
    if (step) out.push(step);
  }
  return out;
}

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
