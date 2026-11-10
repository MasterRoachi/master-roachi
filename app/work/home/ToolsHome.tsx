'use client';

import { useState } from 'react';
import Link from 'next/link';
import { iconFor } from '@/lib/habit-icons';
import { weekDays } from '@/lib/habits';
import DoorIcon from '../DoorIcon';
import { OtherApps } from '../WorkDoors';
import { getJson, useLive } from './live';
import styles from './home.module.css';

// The tools home: today's habits ARE the home (his pick, 2026-11-10, redesign
// page, Tools doors: B). Each habit is a tile; tapping it ticks it for today,
// and a ticked tile turns gold and shows its streak. Habits and Sketchpad sit
// underneath as two small cards.
//
// The Habits page's rules hold here because they are the server's: only today
// can be ticked (the tick is sent with the server's own `today`, never the
// browser's date), and the streak is the server's number over the whole
// history (dayStreak / weekStreak in lib/habits.ts). No optimism either, for
// that page's reason — a refused tick must look refused — so a tile waits for
// the answer and then shows what was stored. If the tick fails the tile simply
// stays as it was: a home never shows an error (live.ts).

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
  /** Habit id -> run. Days for a daily habit, WEEKS for a weekly one. */
  streaks: Record<string, number>;
  /** Habit id -> every day ever ticked. */
  history: Record<string, string[]>;
  today: string;
}

async function habits(): Promise<Payload | null> {
  const data = await getJson<Payload>('/work/api/habits');
  return data?.configured ? data : null;
}

async function sketchCount(): Promise<number | null> {
  const data = await getJson<{ configured: boolean; files: unknown[] }>('/work/api/content?collection=notes');
  return data?.configured ? (data.files ?? []).length : null;
}

/** The habit's icon, or the Habits page's plain circle for one without. */
function Glyph({ name }: { name: string | null }) {
  const icon = iconFor(name);
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      {icon ? <path d={icon.d} /> : <circle cx="12" cy="12" r="4" />}
    </svg>
  );
}

export default function ToolsHome() {
  const [data, reload] = useLive(habits);
  const [sketches] = useLive(sketchCount);
  const [busy, setBusy] = useState<number | null>(null);

  async function tick(habit: Habit, today: string) {
    if (busy !== null) return;
    setBusy(habit.id);
    try {
      const response = await fetch('/work/api/habits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id: habit.id, day: today }),
      });
      if (response.ok) await reload();
    } catch {
      /* the tile stays as it was, which is the truth */
    } finally {
      setBusy(null);
    }
  }

  const today = data?.today ?? '';
  const week = today ? weekDays(today) : [];
  const list = data?.habits ?? [];
  const tickedToday = (habit: Habit) => (data?.history[String(habit.id)] ?? []).includes(today);
  const done = list.filter(tickedToday).length;

  return (
    <div className={styles.home}>
      {data && (
        <section aria-labelledby="today">
          <div className={styles.todayHead}>
            <h2 id="today" className={styles.todayTitle}>
              Today
            </h2>
            {list.length > 0 && (
              <span className={styles.muted}>
                {done} of {list.length} done
              </span>
            )}
          </div>

          {list.length === 0 ? (
            <p className={styles.muted}>Nothing tracked yet. Add a habit in Habits.</p>
          ) : (
            <ul className={styles.tiles}>
              {list.map((habit) => {
                const on = tickedToday(habit);
                const weekly = habit.cadence === 'weekly';
                const run = data.streaks?.[String(habit.id)] ?? 0;
                const days = data.history[String(habit.id)] ?? [];
                const thisWeek = days.filter((day) => week.includes(day)).length;
                const target = Math.max(1, habit.target ?? 1);
                const line = on
                  ? `✓ ${run} ${weekly ? (run === 1 ? 'week' : 'weeks') : run === 1 ? 'day' : 'days'}`
                  : weekly
                    ? `${thisWeek} of ${target} this week`
                    : 'Tap to tick';
                return (
                  <li key={habit.id}>
                    <button
                      type="button"
                      className={on ? styles.tileOn : styles.tile}
                      aria-pressed={on}
                      aria-busy={busy === habit.id}
                      disabled={busy !== null}
                      onClick={() => void tick(habit, data.today)}
                    >
                      <Glyph name={habit.icon} />
                      <span className={styles.tileName}>{habit.name}</span>
                      <span className={styles.tileLine}>{busy === habit.id ? 'Saving…' : line}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <div className={styles.grow} />

      <div className={styles.pair}>
        <Link className={styles.small} href="/work/habits/">
          <DoorIcon tool="habits" />
          <span>
            <b>Habits ›</b>
            <span className={styles.muted}>History and streaks</span>
          </span>
        </Link>
        <Link className={styles.small} href="/work/sketchpad/">
          <DoorIcon tool="sketchpad" />
          <span>
            <b>Sketchpad ›</b>
            {sketches !== null && (
              <span className={styles.muted}>
                {sketches} {sketches === 1 ? 'sketch' : 'sketches'}
              </span>
            )}
          </span>
        </Link>
      </div>

      <OtherApps app="tools" />
    </div>
  );
}
