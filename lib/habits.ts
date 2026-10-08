// Reading a habit grid: weekdays, weeks and streaks.
//
// All of it operates on 'YYYY-MM-DD' strings that the server already resolved
// to Master Roachi's local date — see localDay() in worker/db.ts. Nothing here
// may consult the clock or the browser's zone, or the page would disagree with
// what was stored.

/**
 * The weekday of a date string, 0 = Sunday.
 *
 * Read in UTC on purpose. `new Date('2026-10-08')` is parsed as UTC midnight,
 * so getDay() applies the viewer's offset and returns the wrong weekday west
 * of the line — and off-by-one weekdays would put the weekend shading and the
 * week boundaries in the wrong columns.
 */
export function weekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

export const INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

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
 * Consecutive days up to today, for a daily habit.
 *
 * Stops at the first gap, so it is a streak and not a count. Today being
 * unticked does not break it — the day is not over yet, and a tracker that
 * showed a broken streak every morning until you ticked it would be lying
 * about the thing it exists to measure.
 */
export function streak(days: string[], window: string[], today: string): number {
  const done = new Set(days);
  let run = 0;
  for (let i = window.length - 1; i >= 0; i -= 1) {
    const day = window[i];
    if (done.has(day)) run += 1;
    else if (day !== today) break;
  }
  return run;
}

/**
 * Ticks inside the week containing today.
 *
 * The right measure for a weekly habit, where a streak is the wrong one: a
 * habit done three times a week has a gap most days, so a consecutive-day
 * count would read as broken every week it actually succeeded.
 */
export function thisWeek(days: string[], today: string): number {
  const week = weekOf(today);
  return days.filter((day) => weekOf(day) === week).length;
}
