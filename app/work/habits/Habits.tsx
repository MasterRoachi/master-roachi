'use client';

import { useCallback, useEffect, useState } from 'react';
import { HABIT_ICONS, iconFor } from '@/lib/habit-icons';
import styles from './habits.module.css';

// Year, then month, then two cards — and a row of streaks under everything.
//
// A habit tracker is a thing you keep for years, so the page is shaped like
// the archive it becomes: a short list of years, a year opening into twelve
// months. What a month holds changed on 14 Oct 2026: it was a table of
// habits by days, and it is now TWO CARDS, daily and weekly, each one
// nothing but its habits as icon checkboxes.
//
// ONLY TODAY IS EDITABLE — his rule. The thirty-one columns are gone with the
// table, so there is no longer a square for another day to click. A box is
// the habit, not the habit-on-a-date, and ticking one ticks it for today.
//
// The streak cards at the foot are the page's one measure, which is why the
// number comes from the server: a run begun in September is still a run on
// 1 October, and a month of ticks cannot tell you that. See dayStreak() and
// weekStreak() in lib/habits.ts.
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
  /** Habit id -> run. Days for a daily habit, WEEKS for a weekly one. */
  streaks: Record<string, number>;
  month: string;
  days: string[];
  today: string;
  years: number[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The two cards a month holds, in the order they are read. */
const CARDS = [
  { cadence: 'daily' as const, label: 'Daily' },
  { cadence: 'weekly' as const, label: 'Weekly' },
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
  // The add card, which is shut by default. Adding a habit is rare next to
  // ticking one, so it costs a click rather than a permanent panel.
  const [adding, setAdding] = useState(false);

  const fetchMonth = useCallback(async (wanted: string | null, force = false) => {
    if (wanted && !force && cache[wanted]) return;
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
  // the pills must move on the click, not on the response.
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
  const thisMonth = data.today.slice(0, 7);

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {/* Adding, which is its own section above the years.
          It used to live at the foot of the open year, INSIDE the loop — so it
          belonged to a year, which is wrong twice: a habit is not a fact about
          2026, and opening two years drew two of the form sharing one set of
          state. One card above all of them instead, shut until it is wanted. */}
      <section className={styles.addSection}>
        <button
          type="button"
          className={adding ? styles.addToggleOn : styles.addToggle}
          aria-expanded={adding}
          aria-controls="add-habit"
          aria-label={adding ? 'Close' : 'Add a habit'}
          title={adding ? 'Close' : 'Add a habit'}
          onClick={() => setAdding((open) => !open)}
        >
          {/* One plus, rotated to a cross when open, so the button that opened
              the card is visibly the one that shuts it. */}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

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
              }).then(() => {
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
                sized to this grid rather than the other way round — see the
                --cell and --gap the card sets. */}
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
      </section>

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

                {!shown ? (
                  // The frame is already correct; only the boxes are not
                  // known yet. Reserving the space stops the page jumping
                  // when they arrive.
                  <div className={styles.waiting} aria-hidden="true" />
                ) : data.habits.length === 0 ? (
                  <p className={styles.empty}>
                    Nothing tracked yet. Add one above — <em>every day</em> for something
                    expected daily, or <em>times a week</em> for something with a number
                    attached, like the gym three times a week.
                  </p>
                ) : (
                  // Two cards, daily and weekly. Split rather than labelled:
                  // the two are not the same question, and a weekly habit
                  // sitting unticked among the dailies reads as a thing
                  // missed rather than a thing not due.
                  <div className={styles.decks}>
                    {CARDS.map(({ cadence, label }) => {
                      const mine = shown.habits.filter(
                        (habit) => habit.cadence === cadence,
                      );
                      if (mine.length === 0) return null;

                      return (
                        <section key={cadence} className={styles.deck} aria-label={label}>
                          <div className={styles.boxes}>
                            {mine.map((habit) => {
                              const ticked = (shown.ticks[String(habit.id)] ?? []).includes(
                                data.today,
                              );
                              return (
                                <button
                                  key={habit.id}
                                  type="button"
                                  className={ticked ? styles.boxOn : styles.box}
                                  aria-pressed={ticked}
                                  // The name is nowhere on the card, so it has
                                  // to be in the label or the box is a mystery
                                  // glyph to a screen reader and to anyone who
                                  // has forgotten which icon they chose.
                                  aria-label={`${habit.name}, today`}
                                  title={
                                    habit.cadence === 'weekly'
                                      ? `${habit.name} — ${habit.target}×/wk`
                                      : habit.name
                                  }
                                  onClick={() =>
                                    void act({
                                      action: 'toggle',
                                      id: habit.id,
                                      day: data.today,
                                    })
                                  }
                                >
                                  <Glyph name={habit.icon} />
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* The streaks, under every year rather than inside one.
          A run is not a fact about 2026 — it crosses New Year like any other
          week — and putting it in the open year would have hidden the page's
          one measure behind a disclosure.

          These cards are also where a habit is MANAGED, which is what keeps
          the two above them as bare as he asked: a box up there is a tick and
          nothing else, so changing an icon and archiving had to live
          somewhere. Clicking the icon here opens the picker; the × appears on
          hover, as it did in the old grid. */}
      {data.habits.length > 0 && (
        <section className={styles.streaks} aria-label="Streaks">
          {data.habits.map((habit) => {
            const run = data.streaks?.[String(habit.id)] ?? 0;
            const weekly = habit.cadence === 'weekly';
            const unit = weekly
              ? `${habit.name} — ${run === 1 ? 'week' : 'weeks'}`
              : `${habit.name} — ${run === 1 ? 'day' : 'days'}`;
            return (
              <div key={habit.id} className={styles.streak}>
                <button
                  type="button"
                  className={styles.streakIcon}
                  title={`${habit.name} — change the icon`}
                  aria-label={`${habit.name}, change the icon`}
                  onClick={() => setPicking(picking === habit.id ? null : habit.id)}
                >
                  <Glyph name={habit.icon} />
                </button>

                {/* The unit is not printed — his call, 14 Oct. It survives in
                    the title, because a run of days and a run of weeks still
                    are not the same thing. */}
                <span className={styles.streakRun} title={unit}>
                  {run}
                </span>

                {picking === habit.id && (
                  <div className={styles.picker}>
                    {HABIT_ICONS.map((option) => (
                      <button
                        key={option.name}
                        type="button"
                        title={option.label}
                        aria-label={option.label}
                        className={habit.icon === option.name ? styles.pickOn : styles.pick}
                        onClick={() => {
                          setPicking(null);
                          void act({ action: 'icon', id: habit.id, icon: option.name });
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d={option.d} />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
