'use client';

import { type PointerEvent } from 'react';
import Link from 'next/link';
import { WORK_APPS, type WorkAppKey } from '@/lib/work-tools';
import DoorIcon, { AppIcon } from './DoorIcon';
import styles from './doors.module.css';

// An app's front door: one door per tool, and each door goes straight to it.
//
// His ruling, 2026-11-10: the backend is three apps (admin, learn, tools), and
// tapping any of their icons opens a page of doors, so learn shows three,
// tools shows two (Kame joins when it is rebuilt), and each grows by a door as
// a tool is added. This replaced four doors that opened trays of three, which
// was a menu inside a menu once each app only holds its own handful.
//
// Below the doors, the other two apps, small, for moving between them. On the
// apps' own addresses the Worker forwards a page that belongs to another app
// to that app's address (worker/apps.ts), so a relative link lands right; it
// is a plain <a>, because that is a different origin and next/link would try
// to prefetch it from this one.
//
// The doors handle like the project cards on /projects (components/ProjectCard
// and Card.module.css): tilt toward the cursor, lift, and a soft light that
// tracks where you are pointing.

/** Maximum tilt in degrees. Past about six it stops reading as depth. */
const TILT = 5;

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

export default function WorkDoors({ app: key }: { app: WorkAppKey }) {
  const app = WORK_APPS.find((candidate) => candidate.key === key);
  if (!app) return null;
  const others = WORK_APPS.filter((candidate) => candidate.key !== key);

  return (
    <div
      className={styles.doors}
      // How many doors, so the row sizes from the count; on a phone, at most
      // three to a row.
      style={{ '--doors': app.tools.length, '--cols': Math.min(app.tools.length, 3) } as React.CSSProperties}
    >
      <p className={styles.appName}>{app.name}</p>

      <ul className={styles.row}>
        {app.tools.map((tool) => {
          const face = (
            <>
              <DoorIcon tool={tool.key} />
              <span className={styles.doorName}>{tool.name}</span>
            </>
          );
          return (
            <li key={tool.key}>
              {tool.outside ? (
                <a className={styles.door} href={tool.href} onPointerMove={track} onPointerLeave={untrack} title={tool.what}>
                  {face}
                </a>
              ) : (
                <Link className={styles.door} href={tool.href} onPointerMove={track} onPointerLeave={untrack} title={tool.what}>
                  {face}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <nav className={styles.apps} aria-label="Other apps">
        {others.map((other) => (
          <a key={other.key} href={other.home} className={styles.appLink}>
            <AppIcon app={other.key} />
            <span>{other.name}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
