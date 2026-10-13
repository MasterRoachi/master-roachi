'use client';

import { useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { WORK_SECTIONS } from '@/lib/work-tools';
import DoorIcon from './DoorIcon';
import styles from './doors.module.css';

// The front door, which is now three doors.
//
// It was one list of nine links — Boards, Habits, Reading, Curriculums, Cards,
// Sketchpad, Writing, Projects, Product copy — read top to bottom every
// morning to find the one you came for. Nine unrelated things in a column is
// the same amount of reading whichever one you want.
//
// Three doors instead, and the nine live behind whichever one they belong to.
// Picking a door does not navigate: it opens its three in a tray UNDER the
// row, with a gold arrow pointing down out of whichever door is open — so the
// choice and its consequence are both on screen, and which door the tray
// belongs to is said rather than implied. Only one is ever open — this is a
// menu, not an accordion of everything.
//
// They handle like the project cards on /projects — see components/ProjectCard
// and Card.module.css, which this follows deliberately so the backend's one
// decorated surface behaves the way the front of the site already taught him a
// card behaves: tilt toward the cursor, lift, and a soft light that tracks
// where you are pointing.

/** Maximum tilt in degrees. Past about six it stops reading as depth. */
const TILT = 5;

/**
 * Where the cursor is, as CSS custom properties on the door it is over.
 *
 * Properties rather than React state, for ProjectCard's reason: pointermove
 * fires continuously, and re-rendering three doors on every one of those to
 * move a highlight would be waste.
 */
function track(event: PointerEvent<HTMLButtonElement>) {
  const el = event.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (event.clientX - r.left) / r.width;
  const py = (event.clientY - r.top) / r.height;

  el.style.setProperty('--mx', `${event.clientX - r.left}px`);
  el.style.setProperty('--my', `${event.clientY - r.top}px`);
  // Tilt away from the cursor on the vertical axis and toward it on the
  // horizontal, which is what makes a surface feel pushed rather than steered.
  el.style.setProperty('--ry', `${(px - 0.5) * TILT * 2}deg`);
  el.style.setProperty('--rx', `${(0.5 - py) * TILT * 2}deg`);
}

function untrack(event: PointerEvent<HTMLButtonElement>) {
  const el = event.currentTarget;
  for (const p of ['--mx', '--my', '--rx', '--ry']) el.style.removeProperty(p);
}

export default function WorkDoors() {
  const [open, setOpen] = useState<string | null>(null);
  // Which door the arrow is under. Kept across a close so the tray folds up
  // under the door it came out of rather than sliding home first.
  const [index, setIndex] = useState(0);
  const section = WORK_SECTIONS.find((candidate) => candidate.key === open) ?? null;

  function pick(key: string) {
    setIndex(WORK_SECTIONS.findIndex((candidate) => candidate.key === key));
    setOpen(key === open ? null : key);
  }

  return (
    <div
      className={styles.doors}
      // Escape closes it, because the panel is a menu and a menu that can only
      // be dismissed by clicking the thing that opened it is a trap.
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(null);
        }
      }}
    >
      <div className={styles.row}>
        {WORK_SECTIONS.map((door) => (
          <button
            key={door.key}
            type="button"
            className={styles.door}
            data-open={door.key === open ? '' : undefined}
            aria-expanded={door.key === open}
            aria-controls="work-door-tray"
            onClick={() => pick(door.key)}
            onPointerMove={track}
            onPointerLeave={untrack}
          >
            <DoorIcon section={door.key} />
            <span className={styles.doorName}>{door.name}</span>
          </button>
        ))}
      </div>

      {/* Always rendered so the height can be transitioned from nothing to
          something; empty when nothing is open, which is also why it needs no
          `inert` — a tray with no children has nothing to tab into. */}
      <div className={styles.below} id="work-door-tray" data-open={section ? '' : undefined}>
        <div className={styles.caretStrip}>
          <span
            className={styles.caret}
            // Where the arrow points. Held at the last door while the tray
            // closes, so it slides between doors and does not jump home on
            // the way out.
            style={{ '--col': Math.max(0, index) } as React.CSSProperties}
            aria-hidden="true"
          />
        </div>

        <div className={styles.tray}>
          {section ? (
            <div key={section.key}>
              <p className={styles.trayWhat}>{section.what}</p>
              <ul>
                {section.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link href={tool.href}>
                      <span className={styles.toolName}>{tool.name}</span>
                      <span className={styles.toolWhat}>{tool.what}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
