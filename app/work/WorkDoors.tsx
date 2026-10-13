'use client';

import { useState } from 'react';
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
// Picking a door does not navigate: it opens its three to the RIGHT of the row,
// so the choice and its consequence are both on screen and a wrong guess costs
// nothing. Only one is ever open — this is a menu, not an accordion of
// everything.

export default function WorkDoors() {
  const [open, setOpen] = useState<string | null>(null);
  const section = WORK_SECTIONS.find((candidate) => candidate.key === open) ?? null;

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
            aria-controls="work-door-panel"
            onClick={() => setOpen(door.key === open ? null : door.key)}
          >
            <DoorIcon section={door.key} />
            <span className={styles.doorName}>{door.name}</span>
          </button>
        ))}
      </div>

      {/* Always rendered so the width can be transitioned from nothing to
          something; empty when nothing is open, which is also why it needs no
          `inert` — a panel with no children has nothing to tab into. */}
      <div className={styles.panel} id="work-door-panel" data-open={section ? '' : undefined}>
        {section ? (
          <div className={styles.panelInner} key={section.key}>
            <p className={styles.panelWhat}>{section.what}</p>
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
  );
}
