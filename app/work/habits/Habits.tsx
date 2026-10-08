'use client';

import { useCallback, useEffect, useState } from 'react';
import { HABIT_ICONS, iconFor } from '@/lib/habit-icons';
import { INITIALS, streak, thisWeek, weekday } from '@/lib/habits';
import styles from './habits.module.css';

// Year, then month, then the grid.
//
// A habit tracker is a thing you keep for years, so the page is shaped like
// the archive it becomes: a short list of years, a year opening into twelve
// months, a month showing its own days. The alternative — one endless rolling
// window — reads fine in week two and is unusable in year two.
//
// The server decides what "today" is and which month is being shown. The page
// never computes a date: a browser's clock can be wrong, and a wrong one would
// tick days that never happened. See localDay() in worker/db.ts.

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
  month: string;
  days: string[];
  today: string;
  years: number[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The icon, or a neutral mark for a habit that has not been given one. */
function Glyph({ name }: { name: string | null }) {
  const icon = iconFor(name);
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      {icon ? (
        <path d={icon.d} />
      ) : (
        // Deliberately plain, and clickable like the rest — an empty circle
        // reads as "not chosen yet" rather than as a broken icon.
        <circle cx="12" cy="12" r="4" />
      )}
    </svg>
  );
}

export default function Habits() {
  /**
   * Months already fetched, kept so going back to one is free.
   *
   * A month is immutable history once it is past, and the current one only
   * changes when something on this page changes it — so a second request for
   * a month already held buys nothing and costs a round trip to Western
   * Europe. Ticking a square refetches the month it belongs to, which is the
   * only thing that can invalidate one.
   */
  const [cache, setCache] = useState<Record<string, Payload>>({});
  /** The newest payload, for the things that do not vary by month. */
  const [latest, setLatest] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Which month is being asked for. Null means "whatever the server calls
  // now", which is how the current month opens by default without the page
  // having to work out what month it is.
  const [month, setMonth] = useState<string | null>(null);
  const [openYear, setOpenYear] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [cadence, setCadence] = useState<'daily' | 'weekly'>('daily');
  const [target, setTarget] = useState(3);
  const [icon, setIcon] = useState<string>(HABIT_ICONS[0].name);
  const [picking, setPicking] = useState<number | null>(null);

  const fetchMonth = useCallback(async (wanted: string | null, force = false) => {
    if (wanted && !force && cache[wanted]) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/work/api/habits${wanted ? `?month=${wanted}` : ''}`,
        { cache: 'no-store' },
      );
      if (!response.ok) throw new Error(`could not read them (${response.status})`);
      const payload = (await response.json()) as Payload;
      setCache((held) => ({ ...held, [payload.month]: payload }));
      setLatest(payload);
      // On the first load there is no month yet, so the server's answer
      // becomes the selection — which is how the current month opens without
      // the page working out what month it is.
      setMonth((current) => current ?? payload.month);
      setOpenYear((current) => current ?? Number(payload.month.slice(0, 4)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read them.');
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    void fetchMonth(month);
  }, [month, fetchMonth]);

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
      return;
    }
    setError(null);
    // Forced: this is the one thing that makes a cached month wrong. Adding or
    // archiving a habit changes every month, so the whole cache goes.
    if (body.action === 'toggle') await fetchMonth(month, true);
    else {
      setCache({});
      await fetchMonth(month, true);
    }
  }

  if (error && !latest) return <p className={styles.status}>{error}</p>;
  if (!latest) return <p className={styles.status}>Reading…</p>;

  const data = latest;
  // What the grid draws. Undefined for a month still in flight, which is why
  // everything the CLICK affects reads from `month` rather than from here —
  // the pills and the caption must move on the click, not on the response.
  const shown = month ? cache[month] : undefined;

  if (!data.configured) {
    return (
      <p className={styles.status}>
        Not set up. Create the database with <code>npx wrangler d1 create master-roachi</code>,
        apply the migrations, then uncomment the <code>d1_databases</code> block in{' '}
        <code>wrangler.jsonc</code>.
      </p>
    );
  }

  const selected = month ?? data.month;
  const shownYear = Number(selected.slice(0, 4));
  const shownMonth = Number(selected.slice(5, 7));
  const thisMonth = data.today.slice(0, 7);

  const doneToday =
    selected === thisMonth && shown
      ? shown.habits.filter((habit) =>
          (shown.ticks[String(habit.id)] ?? []).includes(data.today),
        ).length
      : null;

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {/* Newest first: the year being filled in is the one wanted, and older
          years are archive. */}
      {[...data.years].reverse().map((year) => {
        const open = openYear === year;

        return (
          <section key={year} className={open ? styles.yearOpen : styles.year}>
            <button
              type="button"
              className={styles.yearPill}
              aria-expanded={open}
              onClick={() => {
                if (open) {
                  setOpenYear(null);
                  return;
                }
                setOpenYear(year);
                // Opening a year shows a month of it. The current month if it
                // is this year, otherwise January — never a month from the
                // year that was open before.
                setMonth(
                  year === Number(data.today.slice(0, 4)) ? thisMonth : `${year}-01`,
                );
              }}
            >
              <span>{year}</span>
              <span className={styles.chev} aria-hidden="true">
                {open ? '−' : '+'}
              </span>
            </button>

            {open && (
              <div className={styles.section}>
                <nav className={styles.months} aria-label={`Months of ${year}`}>
                  {MONTHS.map((label, i) => {
                    const value = `${year}-${String(i + 1).padStart(2, '0')}`;
                    // From the click, not from the response. This is the
                    // whole of the "serious delay": the pill used to wait for
                    // a round trip to Western Europe before lighting up, so
                    // every click looked like nothing had happened.
                    const active = selected === value;
                    // A month that has not happened cannot be ticked, so it is
                    // not offered — rather than opening an empty grid that
                    // refuses every square.
                    const future = value > thisMonth;
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={future}
                        aria-current={active}
                        className={active ? styles.monthOn : styles.month}
                        onClick={() => setMonth(value)}
                      >
                        {label.slice(0, 3)}
                      </button>
                    );
                  })}
                </nav>

                <p className={styles.caption}>
                  <strong>
                    {MONTHS[shownMonth - 1]} {shownYear}
                  </strong>
                  {loading && <span className={styles.loading}>reading…</span>}
                  {doneToday !== null && (
                    <span>
                      {doneToday} of {data.habits.length} done today
                    </span>
                  )}
                </p>

                {!shown ? (
                  // The frame is already correct; only the squares are not
                  // known yet. Reserving the space stops the page jumping when
                  // they arrive.
                  <div className={styles.waiting} aria-hidden="true" />
                ) : data.habits.length === 0 ? (
                  <p className={styles.empty}>
                    Nothing tracked yet. Add one below — <em>every day</em> for something
                    expected daily, or <em>times a week</em> for something with a number
                    attached, like the gym three times a week.
                  </p>
                ) : (
                  <div className={styles.scroll}>
                    <table className={styles.grid}>
                      <thead>
                        <tr>
                          <th scope="col" className={styles.nameCell} />
                          {shown.days.map((day) => {
                            const wd = weekday(day);
                            return (
                              <th
                                scope="col"
                                key={day}
                                className={[
                                  day === data.today ? styles.todayHead : '',
                                  wd === 0 || wd === 6 ? styles.weekend : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <span className={styles.wd}>{INITIALS[wd]}</span>
                                <abbr title={day}>{Number(day.slice(8))}</abbr>
                              </th>
                            );
                          })}
                          <th scope="col" className={styles.runHead}>
                            Run
                          </th>
                          <th scope="col" />
                        </tr>
                      </thead>
                      <tbody>
                        {shown.habits.map((habit) => {
                          const days = shown.ticks[String(habit.id)] ?? [];
                          const done = new Set(days);
                          const weekly = habit.cadence === 'weekly';
                          const week = thisWeek(days, data.today);
                          const run = streak(days, shown.days, data.today);
                          const met = weekly && habit.target !== null && week >= habit.target;

                          return (
                            <tr key={habit.id}>
                              <th scope="row" className={styles.nameCell}>
                                <button
                                  type="button"
                                  className={styles.iconButton}
                                  title="Change the icon"
                                  onClick={() =>
                                    setPicking(picking === habit.id ? null : habit.id)
                                  }
                                >
                                  <Glyph name={habit.icon} />
                                </button>
                                <span className={styles.habitName}>{habit.name}</span>
                                {weekly && (
                                  <span className={styles.cadence}>{habit.target}×/wk</span>
                                )}

                                {picking === habit.id && (
                                  <span className={styles.picker}>
                                    {HABIT_ICONS.map((option) => (
                                      <button
                                        key={option.name}
                                        type="button"
                                        title={option.label}
                                        aria-label={option.label}
                                        className={
                                          habit.icon === option.name
                                            ? styles.pickOn
                                            : styles.pick
                                        }
                                        onClick={() => {
                                          setPicking(null);
                                          void act({
                                            action: 'icon',
                                            id: habit.id,
                                            icon: option.name,
                                          });
                                        }}
                                      >
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                          <path d={option.d} />
                                        </svg>
                                      </button>
                                    ))}
                                  </span>
                                )}
                              </th>

                              {shown.days.map((day) => {
                                const wd = weekday(day);
                                const future = day > data.today;
                                return (
                                  <td
                                    key={day}
                                    className={[
                                      wd === 0 || wd === 6 ? styles.weekend : '',
                                      day === data.today ? styles.todayCol : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  >
                                    <button
                                      type="button"
                                      // A day that has not happened is not
                                      // tickable, and saying so with the
                                      // control is better than refusing the
                                      // click afterwards.
                                      disabled={future}
                                      className={
                                        future
                                          ? styles.future
                                          : done.has(day)
                                            ? styles.on
                                            : styles.off
                                      }
                                      aria-label={`${habit.name}, ${day}`}
                                      aria-pressed={done.has(day)}
                                      onClick={() =>
                                        void act({ action: 'toggle', id: habit.id, day })
                                      }
                                    />
                                  </td>
                                );
                              })}

                              {/* A streak is the wrong measure for a habit
                                  done four times a week — it would read as
                                  broken every week it succeeded. */}
                              <td className={met ? styles.runMet : styles.run}>
                                {weekly ? `${week}/${habit.target}` : run || '—'}
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className={styles.archive}
                                  title="Archive — keeps the history"
                                  onClick={() => {
                                    if (confirm(`Archive "${habit.name}"? Its history is kept.`)) {
                                      void act({ action: 'archive', id: habit.id });
                                    }
                                  }}
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <form
                  className={styles.add}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!name.trim()) return;
                    void act({
                      action: 'add',
                      name,
                      cadence,
                      icon,
                      ...(cadence === 'weekly' ? { target } : {}),
                    }).then(() => setName(''));
                  }}
                >
                  <span className={styles.iconChoice}>
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
                  </span>

                  <span className={styles.addRow}>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Add a habit"
                      aria-label="New habit"
                    />
                    <select
                      value={cadence}
                      aria-label="How often"
                      onChange={(event) =>
                        setCadence(event.target.value as 'daily' | 'weekly')
                      }
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
                    <button type="submit" disabled={!name.trim()}>
                      Add
                    </button>
                  </span>
                </form>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
