// Reading a habit's history: weeks and streaks.
//
// This was the maths behind a grid of habits by days. That table is gone
// (14 Oct 2026) and with it weekday(), INITIALS, thisWeek() and the old
// window-bounded streak() — the page shows one run per habit now, over the
// whole history rather than over the month on screen.
//
// All of it operates on 'YYYY-MM-DD' strings that the server already resolved
// to Master Roachi's local date — see localDay() in worker/db.ts. Nothing here
// may consult the clock or the browser's zone, or the page would disagree with
// what was stored.

/**
 * The Monday of a day's week, as a date string.
 *
 * Weeks start Monday, which is both the ISO week and how a week is counted
 * here. Starting Sunday would split every weekend across two weeks and make
 * a "three times a week" habit score differently depending on which day it
 * was done.
 */
export function weekOf(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  // getUTCDay has Sunday as 0; shift so Monday is 0.
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive days up to today, over the whole history.
 *
 * The version this replaced walked a fixed window — the month being drawn —
 * which was right when the number lived in a monthly grid and wrong now that
 * it is the page's one measure: a run begun in September would have been cut off at the
 * 1st of October and read as a shorter streak than it was.
 *
 * Today being unticked does not break it: the day is not over, and a tracker
 * that showed a broken streak every morning until you ticked it would be
 * lying about the thing it exists to measure.
 */
export function dayStreak(days: string[], today: string): number {
  const done = new Set(days);
  const cursor = new Date(`${today}T00:00:00Z`);
  let run = 0;
  // Nothing can run longer than the record itself, so this terminates on the
  // first gap or when it walks off the back of the history.
  for (let step = 0; step <= days.length; step += 1) {
    const day = cursor.toISOString().slice(0, 10);
    if (done.has(day)) run += 1;
    else if (day !== today) break;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return run;
}

/**
 * Consecutive weeks that met the target, for a weekly habit.
 *
 * Weeks, not ticks: "2 of 3 this week" says nothing about whether the habit is
 * being kept, and a consecutive-DAY count calls a thrice-weekly habit broken
 * every week it succeeded. A run of weeks is the honest equivalent of a run of
 * days — his call, 14 Oct 2026.
 *
 * The current week cannot break the run, exactly as today cannot break a daily
 * one: it is still being filled. A week short of its target simply does not
 * count toward the run yet.
 */
export function weekStreak(days: string[], target: number, today: string): number {
  const need = Math.max(1, target);
  const counts = new Map<string, number>();
  for (const day of days) {
    const week = weekOf(day);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }

  const current = weekOf(today);
  const cursor = new Date(`${current}T00:00:00Z`);
  let run = 0;
  for (let step = 0; step <= counts.size; step += 1) {
    const week = cursor.toISOString().slice(0, 10);
    const met = (counts.get(week) ?? 0) >= need;
    if (met) run += 1;
    else if (week !== current) break;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return run;
}
