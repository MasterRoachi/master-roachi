'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HABIT_ICONS, iconFor } from '@/lib/habit-icons';
import { keptRatio, monthDaysOf, weekDays, weekOf } from '@/lib/habits';
import styles from './habits.module.css';

// THE WEEK AS A GRID — his pick, 2026-11-10 (redesign page, Habits: B).
//
// The page is this week: the daily habits down the side, seven days across,
// today outlined. The old shape (year cards opening into twelve months, then
// two cards of icon boxes) buried today under the archive; now today is the
// first thing on screen and the archive is one control away ("Month · Year").
//
// ONLY TODAY IS EDITABLE — his rule, unchanged. Today's column is the one
// column of buttons; every other square is a read-out. Past weeks, reached
// with the arrows or a swipe, are read-only for the same reason.
//
// Weekly habits are not a row of seven: "three times a week" has no right day,
// so a blank Tuesday would read as a miss. They are a bar towards the target
// instead, with today's tick on the bar.
//
// The streak chips at the foot are the page's one measure, which is why the
// number comes from the server: a run begun in September is still a run on
// 1 October. See dayStreak() and weekStreak() in lib/habits.ts. Tapping a
// chip's icon opens the icon picker, as before.
//
// The server decides what "today" is. The page never reads the clock: a
// browser's clock can be wrong, and a wrong one would tick days that never
// happened. See localDay() in worker/db.ts. Moving between weeks is arithmetic
// on the server's date string, not a reading of the clock.

interface Habit {
  id: number;
  name: string;
  cadence: 'daily' | 'weekly';
  target: number | null;
  icon: string | null;
}

interface Payload {
  configured: boolean;
  habits: Habit[];
  ticks: Record<string, string[]>;
  /** Habit id -> run. Days for a daily habit, WEEKS for a weekly one. */
  streaks: Record<string, number>;
  /** Habit id -> every day ever ticked. What the week and both grids read. */
  history: Record<string, string[]>;
  month: string;
  days: string[];
  today: string;
  years: number[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Monday first, matching weekDays(). */
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** The two grids behind "Month · Year". The week is the page itself. */
type View = 'month' | 'year';

/** A day string moved by whole days. UTC arithmetic on the string, no clock. */
function addDays(day: string, n: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** "3 – 9 Nov", or "27 Oct – 2 Nov" across a month. */
function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  const short = (day: string) => MONTHS[Number(day.slice(5, 7)) - 1].slice(0, 3);
  const a = Number(monday.slice(8));
  const b = Number(sunday.slice(8));
  return short(monday) === short(sunday)
    ? `${a} – ${b} ${short(sunday)}`
    : `${a} ${short(monday)} – ${b} ${short(sunday)}`;
}

/**
 * The columns a grid draws, left to right.
 *
 * `future` is kept apart from a zero value on purpose: a day that has not
 * happened is not a day that was missed, and drawing the rest of the month
 * as solid black would make every glance look like a collapse.
 */
function columnsFor(
  view: View,
  month: string,
  year: number,
  today: string,
): { key: string; label: string; future: boolean }[] {
  if (view === 'month') {
    return monthDaysOf(month).map((day) => ({
      key: day,
      label: String(Number(day.slice(8))),
      future: day > today,
    }));
  }
  return MONTHS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    return { key, label: label.slice(0, 3), future: key > today.slice(0, 7) };
  });
}

/**
 * How gold a grid cell is, 0 to 1.
 *
 * The month is binary — a day was ticked or it was not. Only the year is
 * shaded, because a month is not a thing that can be done. See keptRatio().
 */
function valueFor(view: View, habit: Habit, column: string, days: string[], today: string): number {
  if (view === 'year') return keptRatio(days, habit.cadence, habit.target, column, today);
  return days.includes(column) ? 1 : 0;
}

/** The page's one read: the current payload, which carries the whole history. */
async function read(): Promise<Payload> {
  const response = await fetch('/work/api/habits', { cache: 'no-store' });
  if (!response.ok) throw new Error(`could not read them (${response.status})`);
  return (await response.json()) as Payload;
}

/** The icon, or a neutral mark for a habit that has not been given one. */
function Glyph({ name }: { name: string | null }) {
  const icon = iconFor(name);
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      {icon ? (
        <path d={icon.d} />
      ) : (
        // Deliberately plain — an empty circle reads as "not chosen yet"
        // rather than as a broken icon.
        <circle cx="12" cy="12" r="4" />
      )}
    </svg>
  );
}

export default function Habits() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The Monday of the week on screen. Null means this week, so the page opens
  // on today without working out what today is.
  const [week, setWeek] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [cadence, setCadence] = useState<'daily' | 'weekly'>('daily');
  const [target, setTarget] = useState(3);
  const [icon, setIcon] = useState<string>(HABIT_ICONS[0].name);
  const [picking, setPicking] = useState<number | null>(null);
  // The add card, shut by default. Adding a habit is rare next to ticking
  // one, so it costs a tap rather than a permanent panel.
  const [adding, setAdding] = useState(false);

  // The archive sheet: the Month and Year grids, and the years they cover.
  const [view, setView] = useState<View | null>(null);
  const [archiveYear, setArchiveYear] = useState<number | null>(null);
  const [archiveMonth, setArchiveMonth] = useState<string | null>(null);

  const swipe = useRef<{ x: number; y: number } | null>(null);

  // One read, always the current one. The payload carries the whole history,
  // so every week and both grids draw from what is already held — paging the
  // archive month by month (the old ?month= reads) bought nothing once the
  // page stopped drawing a month's worth of boxes.
  const load = useCallback(async () => {
    try {
      setData(await read());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read them.');
    }
  }, []);

  useEffect(() => {
    read().then(
      (payload) => {
        setData(payload);
        setError(null);
      },
      (e: unknown) => setError(e instanceof Error ? e.message : 'Could not read them.'),
    );
  }, []);

  async function act(body: Record<string, unknown>) {
    // Optimism would be wrong here: a refused tick (a future day, say) has to
    // show as refused rather than appear to work and vanish on reload.
    const response = await fetch('/work/api/habits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const { error: why } = (await response.json().catch(() => ({}))) as { error?: string };
      setError(why ?? `Failed (${response.status}).`);
      return false;
    }
    setError(null);
    await load();
    return true;
  }

  if (error && !data) return <p className={styles.status}>{error}</p>;
  if (!data) return <p className={styles.status}>Reading…</p>;

  if (!data.configured) {
    return (
      <p className={styles.status}>
        Not set up. Create the database with <code>npx wrangler d1 create master-roachi</code>,
        apply the migrations, then uncomment the <code>d1_databases</code> block in{' '}
        <code>wrangler.jsonc</code>.
      </p>
    );
  }

  const today = data.today;
  const thisWeek = weekOf(today);
  const monday = week ?? thisWeek;
  const current = monday === thisWeek;
  const days = weekDays(monday);
  // Nothing to look at before the first year the server knows of.
  const firstWeek = weekOf(`${data.years[0] ?? Number(today.slice(0, 4))}-01-01`);
  const canBack = monday > firstWeek;

  const daily = data.habits.filter((habit) => habit.cadence === 'daily');
  const weekly = data.habits.filter((habit) => habit.cadence === 'weekly');
  const historyOf = (habit: Habit) => data.history?.[String(habit.id)] ?? [];

  function move(by: number) {
    const next = addDays(monday, by * 7);
    if (next > thisWeek || next < firstWeek) return;
    setWeek(next === thisWeek ? null : next);
  }

  function openArchive(which: View) {
    setView(which);
    // Opens on the month and year in front of you, not the last one looked at.
    setArchiveYear((held) => held ?? Number(today.slice(0, 4)));
    setArchiveMonth((held) => held ?? today.slice(0, 7));
  }

  const toggle = (habit: Habit) =>
    void act({ action: 'toggle', id: habit.id, day: today });

  const pickingHabit = data.habits.find((habit) => habit.id === picking) ?? null;

  const year = archiveYear ?? Number(today.slice(0, 4));
  const month = archiveMonth ?? today.slice(0, 7);

  return (
    <div className={styles.page}>
      {/* The week bar: back, which week, forward; then the archive and adding. */}
      <div className={styles.bar}>
        <div className={styles.weekNav}>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Previous week"
            title="Previous week"
            disabled={!canBack}
            onClick={() => move(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 className={styles.weekName} aria-live="polite">
            {current ? 'This week' : weekLabel(monday)}
          </h2>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Next week"
            title="Next week"
            disabled={current}
            onClick={() => move(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className={styles.barEnd}>
          {data.habits.length > 0 && (
            <span className={styles.archiveLinks}>
              <button type="button" className={styles.link} onClick={() => openArchive('month')}>
                Month
              </button>
              <span aria-hidden="true">·</span>
              <button type="button" className={styles.link} onClick={() => openArchive('year')}>
                Year
              </button>
            </span>
          )}
          <button
            type="button"
            className={adding ? styles.addToggleOn : styles.addToggle}
            aria-expanded={adding}
            aria-controls="add-habit"
            aria-label={adding ? 'Close' : 'Add a habit'}
            title={adding ? 'Close' : 'Add a habit'}
            onClick={() => setAdding((open) => !open)}
          >
            {/* One plus, rotated to a cross when open, so the button that
                opened the card is visibly the one that shuts it. */}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {error && <p className={styles.warn}>{error}</p>}

      {adding && (
        <form
          id="add-habit"
          className={styles.addCard}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setAdding(false);
          }}
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            void act({
              action: 'add',
              name,
              cadence,
              icon,
              ...(cadence === 'weekly' ? { target } : {}),
            }).then((ok) => {
              if (!ok) return;
              setName('');
              // Shut on success, so the new row is what is on screen rather
              // than the form that made it.
              setAdding(false);
            });
          }}
        >
          <div className={styles.addRow}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Add a habit"
              aria-label="New habit"
              autoFocus
            />
            <select
              value={cadence}
              aria-label="How often"
              onChange={(event) => setCadence(event.target.value as 'daily' | 'weekly')}
            >
              <option value="daily">every day</option>
              <option value="weekly">times a week</option>
            </select>
            {cadence === 'weekly' && (
              <input
                type="number"
                min={1}
                max={7}
                value={target}
                className={styles.target}
                aria-label="Times per week"
                onChange={(event) => setTarget(Number(event.target.value))}
              />
            )}
          </div>

          {/* Thirty-six icons, which is exactly six by six. The row above is
              sized to this grid — see the --cell and --gap the card sets. */}
          <div className={styles.iconGrid}>
            {HABIT_ICONS.map((option) => (
              <button
                key={option.name}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={icon === option.name}
                className={icon === option.name ? styles.pickOn : styles.pick}
                onClick={() => setIcon(option.name)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={option.d} />
                </svg>
              </button>
            ))}
          </div>

          <button type="submit" className={styles.addGo} disabled={!name.trim()}>
            Add
          </button>
        </form>
      )}

      {data.habits.length === 0 ? (
        <p className={styles.empty}>
          Nothing tracked yet. Add one with the + above — <em>every day</em> for something
          expected daily, or <em>times a week</em> for something with a number attached, like
          the gym three times a week.
        </p>
      ) : (
        // The swipe surface: left for the next week, right for the one before.
        // Horizontal only, and only when it is clearly sideways, so scrolling
        // the page past a long list of habits does not change the week.
        <div
          className={styles.week}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            swipe.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            move(dx < 0 ? 1 : -1);
          }}
        >
          {daily.length > 0 && (
            <table className={styles.grid}>
              <thead>
                <tr>
                  <th />
                  {days.map((day, i) => (
                    <th
                      key={day}
                      scope="col"
                      className={day === today ? styles.headToday : styles.head}
                      aria-current={day === today ? 'date' : undefined}
                    >
                      <span>{DAY_INITIALS[i]}</span>
                      <span className={styles.headDate}>{Number(day.slice(8))}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daily.map((habit) => {
                  const done = new Set(historyOf(habit));
                  return (
                    <tr key={habit.id}>
                      <th scope="row" className={styles.name}>
                        <span className={styles.nameInner}>
                          <Glyph name={habit.icon} />
                          <span>{habit.name}</span>
                        </span>
                      </th>
                      {days.map((day) => {
                        const ticked = done.has(day);
                        if (day === today) {
                          return (
                            <td key={day} className={styles.todayCol}>
                              <button
                                type="button"
                                className={ticked ? styles.tickOn : styles.tick}
                                aria-pressed={ticked}
                                aria-label={`${habit.name}, today`}
                                title={`${habit.name}, today`}
                                onClick={() => toggle(habit)}
                              />
                            </td>
                          );
                        }
                        const future = day > today;
                        return (
                          <td key={day}>
                            <span
                              className={
                                future ? styles.dayFuture : ticked ? styles.dayOn : styles.day
                              }
                              title={`${habit.name}, ${day}${future ? '' : ticked ? ': done' : ': not done'}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {weekly.length > 0 && (
            <section className={styles.weekly} aria-label="Weekly habits">
              <h3 className={styles.sectionName}>Weekly</h3>
              {weekly.map((habit) => {
                const history = historyOf(habit);
                const count = history.filter((day) => days.includes(day)).length;
                const need = Math.max(1, habit.target ?? 1);
                const met = count >= need;
                const ticked = history.includes(today);
                return (
                  <div key={habit.id} className={styles.weeklyCard}>
                    <Glyph name={habit.icon} />
                    <div className={styles.weeklyBody}>
                      <div className={styles.weeklyHead}>
                        <b>{habit.name}</b>
                        <span>
                          {count} of {need}
                        </span>
                      </div>
                      <div
                        className={styles.meter}
                        role="meter"
                        aria-label={`${habit.name} this week`}
                        aria-valuemin={0}
                        aria-valuemax={need}
                        aria-valuenow={Math.min(count, need)}
                      >
                        <i
                          className={met ? styles.meterMet : undefined}
                          style={{ width: `${Math.min(100, (count / need) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* Today's tick, on this week only — a past week is a
                        read-out, like every column but today's. */}
                    {current && (
                      <button
                        type="button"
                        className={ticked ? styles.tickOn : styles.tick}
                        aria-pressed={ticked}
                        aria-label={`${habit.name}, today`}
                        title={`${habit.name}, today`}
                        onClick={() => toggle(habit)}
                      />
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}

      {/* The streaks, at the foot of the page and stuck there while the week
          scrolls under them: the runs are what the page is for. Gold when a
          run is alive, plain at nought. The unit is in the title, not
          printed — his call, 14 Oct — because a run of days and a run of
          weeks are still not the same thing. */}
      {data.habits.length > 0 && (
        <div className={styles.foot}>
          {pickingHabit && (
            <div
              className={styles.picker}
              role="group"
              aria-label={`Icon for ${pickingHabit.name}`}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setPicking(null);
              }}
            >
              <p className={styles.pickerName}>Icon for {pickingHabit.name}</p>
              <div className={styles.pickerGrid}>
                {HABIT_ICONS.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={pickingHabit.icon === option.name}
                    className={pickingHabit.icon === option.name ? styles.pickOn : styles.pick}
                    onClick={() => {
                      setPicking(null);
                      void act({ action: 'icon', id: pickingHabit.id, icon: option.name });
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d={option.d} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <section className={styles.streaks} aria-label="Streaks">
            {data.habits.map((habit) => {
              const run = data.streaks?.[String(habit.id)] ?? 0;
              const unit =
                habit.cadence === 'weekly'
                  ? run === 1 ? 'week' : 'weeks'
                  : run === 1 ? 'day' : 'days';
              return (
                <button
                  key={habit.id}
                  type="button"
                  className={run > 0 ? styles.chipOn : styles.chip}
                  aria-expanded={picking === habit.id}
                  aria-label={`${habit.name}, ${run} ${unit}. Change the icon`}
                  title={`${habit.name}: ${run} ${unit}. Tap to change the icon`}
                  onClick={() => setPicking(picking === habit.id ? null : habit.id)}
                >
                  <Glyph name={habit.icon} />
                  <span className={styles.chipName}>{habit.name}</span>
                  <span className={styles.chipRun}>{run}</span>
                </button>
              );
            })}
          </section>
        </div>
      )}

      {/* The archive: the Month and Year grids, over the page. A bottom sheet
          on a phone, a panel on a computer. Read-only, like every day but
          today. */}
      {view && (
        <div className={styles.scrim} onClick={() => setView(null)}>
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={view === 'month' ? 'Month grid' : 'Year grid'}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setView(null);
            }}
          >
            <div className={styles.sheetTop}>
              <div className={styles.tabs} role="group" aria-label="Grid">
                {(['month', 'year'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={view === key ? styles.tabOn : styles.tab}
                    aria-pressed={view === key}
                    onClick={() => setView(key)}
                  >
                    {key === 'month' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.close}
                aria-label="Close"
                title="Close"
                autoFocus
                onClick={() => setView(null)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Newest first: the year being filled in is the one wanted, and
                older years are archive. */}
            <nav className={styles.pills} aria-label="Years">
              {[...data.years].reverse().map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-current={year === option}
                  className={year === option ? styles.pillOn : styles.pill}
                  onClick={() => {
                    setArchiveYear(option);
                    // A year shows a month of it: the current month if it is
                    // this year, otherwise January.
                    setArchiveMonth(
                      option === Number(today.slice(0, 4)) ? today.slice(0, 7) : `${option}-01`,
                    );
                  }}
                >
                  {option}
                </button>
              ))}
            </nav>

            {view === 'month' && (
              <nav className={styles.pills} aria-label={`Months of ${year}`}>
                {MONTHS.map((label, i) => {
                  const value = `${year}-${String(i + 1).padStart(2, '0')}`;
                  // A month that has not happened is dimmed and inert rather
                  // than hidden, so the year still reads as twelve months.
                  const future = value > today.slice(0, 7);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={future}
                      aria-current={month === value}
                      className={month === value ? styles.pillOn : styles.pill}
                      onClick={() => setArchiveMonth(value)}
                    >
                      {label.slice(0, 3)}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Thirty-one columns do not fit a phone, and shrinking the cells
                makes them unreadable. Scrolls sideways instead, with the icon
                column pinned so a row stays identifiable. */}
            <div className={styles.sheetScroll}>
              <table className={styles.sheetGrid}>
                <thead>
                  <tr>
                    <th />
                    {columnsFor(view, month, year, today).map((column) => (
                      <th key={column.key} scope="col" className={styles.sheetHead}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.habits.map((habit) => {
                    const history = historyOf(habit);
                    return (
                      <tr key={habit.id}>
                        <th scope="row" className={styles.sheetName} title={habit.name}>
                          <Glyph name={habit.icon} />
                        </th>
                        {columnsFor(view, month, year, today).map((column) => {
                          const value = column.future
                            ? 0
                            : valueFor(view, habit, column.key, history, today);
                          // A floor, so "a little" is still visibly different
                          // from "none" — below about a fifth the mix is
                          // indistinguishable from the background.
                          const pct = value <= 0 ? 0 : Math.max(18, Math.round(value * 100));
                          return (
                            <td
                              key={column.key}
                              className={column.future ? styles.cellFuture : styles.cell}
                              title={`${habit.name} — ${column.key}`}
                              style={
                                pct > 0
                                  ? {
                                      background: `color-mix(in oklab, var(--accent) ${pct}%, var(--bg))`,
                                    }
                                  : undefined
                              }
                            />
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
