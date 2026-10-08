'use client';

import { useCallback, useEffect, useState } from 'react';
import { INITIALS, streak, thisWeek, weekday } from '@/lib/habits';
import styles from './habits.module.css';

// A grid: one row per habit, one column per day, today on the right.
//
// The server decides what "today" is and sends the window with the data — the
// page never computes a date. A browser's clock can be wrong, and a wrong one
// would tick days that never happened; see localDay() in worker/db.ts for why
// the zone is fixed rather than read from here.

interface Habit {
  id: number;
  name: string;
  cadence: 'daily' | 'weekly';
  target: number | null;
}

interface Payload {
  configured: boolean;
  habits: Habit[];
  ticks: Record<string, string[]>;
  window: string[];
  today: string;
}

export default function Habits() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [cadence, setCadence] = useState<'daily' | 'weekly'>('daily');
  const [target, setTarget] = useState(3);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/work/api/habits?days=35', { cache: 'no-store' });
      if (!response.ok) throw new Error(`could not read them (${response.status})`);
      setData((await response.json()) as Payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read them.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    await load();
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

  const doneToday = data.habits.filter((habit) =>
    (data.ticks[String(habit.id)] ?? []).includes(data.today),
  ).length;

  return (
    <>
      {error && <p className={styles.warn}>{error}</p>}

      {data.habits.length > 0 && (
        // The one number worth seeing before anything else, and the only
        // thing on the page that answers "am I done for today".
        <p className={styles.todayLine}>
          <strong>
            {doneToday} of {data.habits.length}
          </strong>{' '}
          done today
          {doneToday === data.habits.length && <span className={styles.all}>all of it</span>}
        </p>
      )}

      <div className={styles.scroll}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th scope="col" className={styles.nameCell} />
              {data.window.map((day, i) => {
                const wd = weekday(day);
                const newMonth = i > 0 && day.slice(5, 7) !== data.window[i - 1].slice(5, 7);
                return (
                  <th
                    scope="col"
                    key={day}
                    className={[
                      day === data.today ? styles.today : '',
                      wd === 0 || wd === 6 ? styles.weekend : '',
                      newMonth ? styles.monthStart : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {/* The weekday matters more than the date when reading a
                        grid — a gap every seventh column is a pattern, a run
                        of numbers is not. */}
                    <span className={styles.wd}>{INITIALS[wd]}</span>
                    <abbr title={day}>{day.slice(8)}</abbr>
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
            {data.habits.map((habit) => {
              const days = data.ticks[String(habit.id)] ?? [];
              const done = new Set(days);
              const weekly = habit.cadence === 'weekly';
              const week = thisWeek(days, data.today);
              const run = streak(days, data.window, data.today);
              const met = weekly && habit.target !== null && week >= habit.target;

              return (
                <tr key={habit.id}>
                  <th scope="row" className={styles.nameCell}>
                    {habit.name}
                    {weekly && <span className={styles.cadence}>{habit.target}×/wk</span>}
                  </th>

                  {data.window.map((day, i) => {
                    const wd = weekday(day);
                    const newMonth = i > 0 && day.slice(5, 7) !== data.window[i - 1].slice(5, 7);
                    return (
                      <td
                        key={day}
                        className={[
                          wd === 0 || wd === 6 ? styles.weekend : '',
                          newMonth ? styles.monthStart : '',
                          day === data.today ? styles.todayCol : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className={done.has(day) ? styles.on : styles.off}
                          aria-label={`${habit.name}, ${day}`}
                          aria-pressed={done.has(day)}
                          onClick={() => void act({ action: 'toggle', id: habit.id, day })}
                        />
                      </td>
                    );
                  })}

                  {/* A streak is the wrong measure for a habit done four times
                      a week — it would read as broken every week it succeeded.
                      Weekly habits show the week instead. */}
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

      {data.habits.length === 0 && (
        <p className={styles.empty}>
          Nothing tracked yet. Add one below — <em>daily</em> for something expected every day,
          or <em>weekly</em> for something with a number attached, like the gym three times a
          week.
        </p>
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
            ...(cadence === 'weekly' ? { target } : {}),
          }).then(() => setName(''));
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add a habit"
          aria-label="New habit"
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

        <button type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>
    </>
  );
}
