'use client';

import { useState } from 'react';
import styles from './Achievements.module.css';

// A game's full achievement list as a grid of its own Steam icons.
//
// Data comes from scripts/achievements.mjs, which pulls the schema straight
// from Steam and stores the icons locally. So these are the real marks, in the
// real order, with the real descriptions — not a list somebody retyped.
//
// The detail shows on hover and on focus. Hover alone would put it out of reach
// of a keyboard and of anyone on a phone, so each tile is a button: tap to open
// on touch, tab to it and it opens the same way.

export interface Achievement {
  key: string;
  title: string;
  description: string | null;
  hidden: boolean;
  icon: string | null;
  unlocked: boolean;
}

export default function Achievements({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <figure className={styles.wrap}>
      <ul className={styles.grid}>
        {achievements.map((a) => (
          <li key={a.key} className={styles.cell}>
            <button
              type="button"
              className={styles.tile}
              data-unlocked={a.unlocked}
              data-open={open === a.key || undefined}
              aria-expanded={open === a.key}
              onPointerEnter={() => setOpen(a.key)}
              onPointerLeave={() => setOpen((k) => (k === a.key ? null : k))}
              onFocus={() => setOpen(a.key)}
              onBlur={() => setOpen((k) => (k === a.key ? null : k))}
              onClick={() => setOpen((k) => (k === a.key ? null : a.key))}
            >
              {a.icon ? (
                <img src={a.icon} alt="" width={64} height={64} loading="lazy" />
              ) : (
                <span className={styles.noIcon} aria-hidden="true" />
              )}
              {/* The name is here for a screen reader whether or not the panel
                  is showing, so the grid is not sixty-five unlabelled buttons. */}
              <span className={styles.sr}>{a.title}</span>
            </button>

            <div className={styles.detail} role="presentation">
              <p className={styles.title}>{a.title}</p>
              <p className={styles.desc}>
                {a.description ?? 'Hidden until you get it.'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
