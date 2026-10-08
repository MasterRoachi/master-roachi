// D1, and the one date rule everything here depends on.

/** Only the parts of D1 that are actually used. */
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
}

/**
 * Master Roachi's local date, which is the day a habit belongs to.
 *
 * Hardcoded to Africa/Johannesburg, and safe to hardcode: South Africa is
 * UTC+2 and has never observed daylight saving, so there is no transition to
 * get wrong. Using UTC instead would file anything ticked between midnight
 * and 02:00 under the previous day — which is precisely when someone
 * remembers they have not ticked today.
 *
 * Not taken from the browser either. A client's clock is a thing that can be
 * wrong, and a wrong one would write ticks against days that never happened.
 */
export function localDay(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** N days ending today, oldest first — the window the tracker draws. */
export function dayWindow(days: number, now: Date = new Date()): string[] {
  const out: string[] = [];
  for (let back = days - 1; back >= 0; back -= 1) {
    out.push(localDay(new Date(now.getTime() - back * 86_400_000)));
  }
  return out;
}

/** A plausible 'YYYY-MM'. */
export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/**
 * Every day of a calendar month, as date strings.
 *
 * Day 0 of the following month is the last day of this one, which is how the
 * 28/29/30/31 question answers itself — including February in a leap year,
 * which a table of month lengths gets wrong once every four years.
 */
export function monthDays(month: string): string[] {
  const [year, index] = month.split('-').map(Number);
  const length = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return Array.from(
    { length },
    (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`,
  );
}

/** A plausible 'YYYY-MM-DD'. Rejects anything that is not one, rather than coercing. */
export function isDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
