'use client';

import { type PointerEvent } from 'react';
import Link from 'next/link';
import { WORK_APPS, type ToolKey, type WorkAppKey } from '@/lib/work-tools';
import DoorIcon, { AppIcon } from './DoorIcon';
import styles from './doors.module.css';

// An app's doors: one door per tool, and each door goes straight to it.
//
// His ruling, 2026-11-10: the backend is three apps (admin, learn, tools), and
// tapping any of their icons opens a page of doors, so learn shows three,
// tools shows two (Kame joins when it is rebuilt), and each grows by a door as
// a tool is added. This replaced four doors that opened trays of three, which
// was a menu inside a menu once each app only holds its own handful.
//
// DOORS THAT SAY WHAT IS WAITING (his pick, 2026-11-10, redesign page, Admin
// doors: A). A door can carry one live line under its name, and a door whose
// line says nothing is waiting goes QUIET: a dark face instead of gold, so the
// busy ones are what the eye lands on. A door with no line — still loading, or
// its number failed — is drawn as it always was, gold with its name, because a
// home never shows an error and "unknown" is not "nothing to do". The numbers
// are fetched by the page that uses this (home/AdminHome.tsx); this only draws.
//
// `small` is the learn home's row (his pick, Learn doors: B): the doors sit
// under the cards there, smaller and all dark, because the cards are the page.
//
// The header already titles the page with the app's name, so the doors no
// longer repeat it above themselves.
//
// The other two apps, small, sit under the doors (OtherApps below). The header
// also offers them; this row stays because a home is where you move between
// apps. On the apps' own addresses the Worker forwards a page that belongs to
// another app to that app's address (worker/apps.ts), so a relative link lands
// right; it is a plain <a>, because that is a different origin and next/link
// would try to prefetch it from this one.
//
// The doors handle like the project cards on /projects (components/ProjectCard
// and Card.module.css): tilt toward the cursor, lift, and a soft light that
// tracks where you are pointing.

/** Maximum tilt in degrees. Past about six it stops reading as depth. */
const TILT = 5;

/** What a door says under its name, and whether it is waiting on him. */
export interface DoorLine {
  text: string;
  /** False draws the door quiet: dark, not gold. */
  waiting: boolean;
}

/**
 * Where the cursor is, as CSS custom properties on the door it is over.
 * Properties rather than React state, for ProjectCard's reason: pointermove
 * fires continuously, and re-rendering every door on each one would be waste.
 */
function track(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (event.clientX - r.left) / r.width;
  const py = (event.clientY - r.top) / r.height;
  el.style.setProperty('--mx', `${event.clientX - r.left}px`);
  el.style.setProperty('--my', `${event.clientY - r.top}px`);
  el.style.setProperty('--ry', `${(px - 0.5) * TILT * 2}deg`);
  el.style.setProperty('--rx', `${(0.5 - py) * TILT * 2}deg`);
}

function untrack(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  for (const p of ['--mx', '--my', '--rx', '--ry']) el.style.removeProperty(p);
}

/** The other two apps, as small pills. Used under every home's doors. */
export function OtherApps({ app: key }: { app: WorkAppKey }) {
  const others = WORK_APPS.filter((candidate) => candidate.key !== key);
  return (
    <nav className={styles.apps} aria-label="Other apps">
      {others.map((other) => (
        <a key={other.key} href={other.home} className={styles.appLink}>
          <AppIcon app={other.key} />
          <span>{other.name}</span>
        </a>
      ))}
    </nav>
  );
}

export default function WorkDoors({
  app: key,
  lines,
  small = false,
  apps = true,
}: {
  app: WorkAppKey;
  /** One live line per door, where there is one. A missing line is a plain gold door. */
  lines?: Partial<Record<ToolKey, DoorLine>>;
  /** Smaller and all dark, for a home whose cards come first. */
  small?: boolean;
  /** The other apps under the doors. Off where the page draws them itself. */
  apps?: boolean;
}) {
  const app = WORK_APPS.find((candidate) => candidate.key === key);
  if (!app) return null;

  return (
    <div
      className={small ? styles.doorsSmall : styles.doors}
      // How many doors, so the row sizes from the count; on a phone, at most
      // three to a row.
      style={{ '--doors': app.tools.length, '--cols': Math.min(app.tools.length, 3) } as React.CSSProperties}
    >
      <ul className={styles.row}>
        {app.tools.map((tool) => {
          const line = lines?.[tool.key];
          const quiet = small || line?.waiting === false;
          const className = quiet ? styles.doorQuiet : styles.door;
          const face = (
            <>
              <DoorIcon tool={tool.key} />
              <span className={styles.doorName}>{tool.name}</span>
              {line && <span className={styles.doorLine}>{line.text}</span>}
            </>
          );
          return (
            <li key={tool.key}>
              {tool.outside ? (
                <a className={className} href={tool.href} onPointerMove={track} onPointerLeave={untrack} title={tool.what}>
                  {face}
                </a>
              ) : (
                <Link className={className} href={tool.href} onPointerMove={track} onPointerLeave={untrack} title={tool.what}>
                  {face}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {apps && <OtherApps app={key} />}
    </div>
  );
}
