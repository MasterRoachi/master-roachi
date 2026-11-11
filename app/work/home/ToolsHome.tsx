'use client';

import { useState } from 'react';
import Link from 'next/link';
import { iconFor } from '@/lib/habit-icons';
import { weekDays } from '@/lib/habits';
import DoorIcon from '../DoorIcon';
import { OtherApps } from '../WorkDoors';
import { useLive } from './live';
import { habits, release, sketches, type Habit, type HabitsPayload } from './sources';
import styles from './home.module.css';
import dash from './dash.module.css';

// The tools home: today's habits ARE the home (his pick, 2026-11-10, redesign
// page, Tools doors: B). Each habit is a tile; tapping it ticks it for today,
// and a ticked tile shows its streak. Habits, Sketchpad, Kame and Ohana sit
// underneath as small cards; Kame and Ohana are their own apps on their own
// addresses (kame. and ohana.masterroachi.com, since 2026-11-11), so their
// cards are plain <a> and say where they go, as the Clients door does on admin.
//
// The Habits page's rules hold here because they are the server's: only today
// can be ticked (the tick is sent with the server's own `today`, never the
// browser's date), and the streak is the server's number over the whole
// history (dayStreak / weekStreak in lib/habits.ts). No optimism either, for
// that page's reason — a refused tick must look refused — so a tile waits for
// the answer and then shows what was stored. If the tick fails the tile simply
// stays as it was: a home never shows an error (live.ts).

async function sketchCount(): Promise<number | null> {
  return (await sketches())?.length ?? null;
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
  const [sketchTotal] = useLive(sketchCount);
  const [sketchList] = useLive(sketches);
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
      if (response.ok) {
        // The held answer is now wrong: forget it, so the sidebar and this
        // page both read the tick.
        release('habits');
        await reload();
      }
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
    <>
    <div className={dash.phone}>
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
        <Link className={`${styles.small} card-link`} href="/work/habits/">
          <DoorIcon tool="habits" />
          <span>
            <b>Habits ›</b>
            <span className={styles.muted}>History and streaks</span>
          </span>
        </Link>
        <Link className={`${styles.small} card-link`} href="/work/sketchpad/">
          <DoorIcon tool="sketchpad" />
          <span>
            <b>Sketchpad ›</b>
            {sketchTotal !== null && (
              <span className={styles.muted}>
                {sketchTotal} {sketchTotal === 1 ? 'sketch' : 'sketches'}
              </span>
            )}
          </span>
        </Link>
        <a className={`${styles.small} card-link`} href="https://kame.masterroachi.com/">
          <DoorIcon tool="kame" />
          <span>
            <b>Kame ↗</b>
            <span className={styles.muted}>Focus blocks</span>
          </span>
        </a>
        <a className={`${styles.small} card-link`} href="https://ohana.masterroachi.com/">
          <DoorIcon tool="ohana" />
          <span>
            <b>Ohana ↗</b>
            <span className={styles.muted}>For the two of you</span>
          </span>
        </a>
      </div>

      <OtherApps app="tools" />
    </div>
    </div>

    <ToolsDash data={data} sketchList={sketchList} busy={busy} onTick={tick} />
    </>
  );
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

/** A sketch's name from its path, as the Sketchpad shows it. */
const sketchName = (path: string) => (path.split('/').pop() ?? path).replace(/\.svg$/, '').replace(/-/g, ' ');

/**
 * The tools home on a computer (his call, 2026-11-10, after the CRM): tiles
 * for today's habits, the best run going and the sketches; then today's
 * habits to tick on the left and the newest sketches on the right.
 */
function ToolsDash({
  data,
  sketchList,
  busy,
  onTick,
}: {
  data: HabitsPayload | null;
  sketchList: Awaited<ReturnType<typeof sketches>>;
  busy: number | null;
  onTick: (habit: Habit, today: string) => void;
}) {
  const list = data?.habits ?? [];
  const today = data?.today ?? '';
  const ticked = (habit: Habit) => (data?.history[String(habit.id)] ?? []).includes(today);
  const done = list.filter(ticked).length;
  const best = list.reduce<{ habit: Habit; run: number } | null>((top, habit) => {
    const run = data?.streaks?.[String(habit.id)] ?? 0;
    return run > (top?.run ?? 0) ? { habit, run } : top;
  }, null);

  return (
    <div className={dash.dash}>
      <ul className={dash.tiles}>
        <li>
          <Link className={`${dash.tile} card-link`} href="/work/habits/">
            <span className={dash.tileK}>
              <i className={data && done < list.length ? dash.dotGold : dash.dotOk} /> Today
            </span>
            <span className={dash.tileV}>{data ? `${done} of ${list.length}` : '–'}</span>
            <span className={dash.tileS}>habits done</span>
          </Link>
        </li>
        <li>
          <Link className={`${dash.tile} card-link`} href="/work/habits/">
            <span className={dash.tileK}>
              <i className={dash.dot} /> Best run
            </span>
            <span className={dash.tileV}>{best ? best.run : '–'}</span>
            <span className={dash.tileS}>
              {best ? `${best.habit.cadence === 'weekly' ? 'weeks' : 'days'} · ${best.habit.name}` : 'nothing running'}
            </span>
          </Link>
        </li>
        <li>
          <Link className={`${dash.tile} card-link`} href="/work/sketchpad/">
            <span className={dash.tileK}>
              <i className={dash.dot} /> Sketches
            </span>
            <span className={dash.tileV}>{sketchList ? sketchList.length : '–'}</span>
            <span className={dash.tileS}>
              {sketchList?.[0]?.updated ? `last on ${day(sketchList[0].updated)}` : 'in the Sketchpad'}
            </span>
          </Link>
        </li>
        <li>
          <a className={`${dash.tile} card-link`} href="https://kame.masterroachi.com/">
            <span className={dash.tileK}>
              <i className={dash.dot} /> Kame
            </span>
            <span className={dash.tileV}>Focus ↗</span>
            <span className={dash.tileS}>on its own address</span>
          </a>
        </li>
        <li>
          <a className={`${dash.tile} card-link`} href="https://ohana.masterroachi.com/">
            <span className={dash.tileK}>
              <i className={dash.dot} /> Ohana
            </span>
            <span className={dash.tileV}>Ours ↗</span>
            <span className={dash.tileS}>on its own address</span>
          </a>
        </li>
      </ul>

      <div className={dash.grid}>
        <div className={dash.col}>
          <section className={dash.panel} aria-label="Today">
            <h2 className={dash.head}>
              Today <span>{data && list.length > 0 ? `${done} of ${list.length} done` : ''}</span>
            </h2>
            {data && list.length === 0 && <p className={dash.empty}>Nothing tracked yet. Add a habit in Habits.</p>}
            <ul className={dash.rows}>
              {list.map((habit) => {
                const on = ticked(habit);
                const run = data?.streaks?.[String(habit.id)] ?? 0;
                const unit = habit.cadence === 'weekly' ? (run === 1 ? 'week' : 'weeks') : run === 1 ? 'day' : 'days';
                return (
                  <li key={habit.id}>
                    <button
                      type="button"
                      className={dash.row}
                      aria-pressed={on}
                      aria-busy={busy === habit.id}
                      disabled={busy !== null || !data}
                      onClick={() => data && onTick(habit, data.today)}
                    >
                      <i className={on ? dash.dotOk : dash.dotGold} />
                      <span className={dash.rowText}>
                        <b>{habit.name}</b>
                        <span>{run > 0 ? `${run} ${unit} running` : habit.cadence === 'weekly' ? 'Weekly' : 'Daily'}</span>
                      </span>
                      <span className={on ? dash.note : dash.noteGold}>
                        {busy === habit.id ? 'Saving…' : on ? '✓ Done' : 'Tick'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className={dash.col}>
          <section className={dash.panel} aria-label="Sketches">
            <h2 className={dash.head}>
              Newest sketches <Link href="/work/sketchpad/">Sketchpad ›</Link>
            </h2>
            {sketchList && sketchList.length === 0 && <p className={dash.empty}>No sketches yet.</p>}
            <ul className={dash.rows}>
              {(sketchList ?? []).slice(0, 8).map((sketch) => (
                <li key={sketch.path}>
                  <Link className={dash.row} href={`/work/sketchpad/?open=${encodeURIComponent(sketch.path)}`}>
                    <i className={dash.dot} />
                    <span className={dash.rowText}>
                      <b>{sketchName(sketch.path)}</b>
                    </span>
                    <span className={dash.note}>{sketch.updated ? day(sketch.updated) : ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
