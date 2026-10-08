'use client';

import { useCallback, useEffect, useState } from 'react';
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

/** Consecutive days up to today. Stops at the first gap, so it is a streak and not a count. */
function streak(days: string[], window: string[], today: string): number {
  const done = new Set(days);
  let run = 0;
  for (let i = window.length - 1; i >= 0; i -= 1) {
    const day = window[i];
    if (done.has(day)) run += 1;
    // Today not yet ticked does not break a streak — the day is not over.
    else if (day !== today) break;
  }
  return run;
}

export default function Habits() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState('');

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

  return (
    <>
      {error && <p className={styles.warn}>{error}</p>}

      <div className={styles.scroll}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th scope="col" className={styles.nameCell}>
                Habit
              </th>
              {data.window.map((day) => (
                // Just the day number: thirty-five full dates is a wall of
                // text, and the month boundary is visible from the gap below.
                <th scope="col" key={day} className={day === data.today ? styles.today : undefined}>
                  <abbr title={day}>{day.slice(8)}</abbr>
                </th>
              ))}
              <th scope="col">Run</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {data.habits.map((habit) => {
              const done = new Set(data.ticks[String(habit.id)] ?? []);
              return (
                <tr key={habit.id}>
                  <th scope="row" className={styles.nameCell}>
                    {habit.name}
                    {habit.cadence === 'weekly' && (
                      <span className={styles.cadence}>{habit.target}×/wk</span>
                    )}
                  </th>
                  {data.window.map((day) => (
                    <td key={day}>
                      <button
                        type="button"
                        className={done.has(day) ? styles.on : styles.off}
                        aria-label={`${habit.name}, ${day}`}
                        aria-pressed={done.has(day)}
                        onClick={() => void act({ action: 'toggle', id: habit.id, day })}
                      />
                    </td>
                  ))}
                  <td className={styles.run}>
                    {streak(data.ticks[String(habit.id)] ?? [], data.window, data.today) || '—'}
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

      {data.habits.length === 0 && <p className={styles.status}>Nothing tracked yet.</p>}

      <form
        className={styles.add}
        onSubmit={(event) => {
          event.preventDefault();
          if (!adding.trim()) return;
          void act({ action: 'add', name: adding }).then(() => setAdding(''));
        }}
      >
        <input
          value={adding}
          onChange={(event) => setAdding(event.target.value)}
          placeholder="Add a habit"
          aria-label="New habit"
        />
        <button type="submit" disabled={!adding.trim()}>
          Add
        </button>
      </form>
    </>
  );
}
