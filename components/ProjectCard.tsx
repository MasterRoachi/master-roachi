'use client';

import Link from 'next/link';
import { useRef, type PointerEvent } from 'react';
import { STATUS_LABEL } from '@/lib/format';
import type { ProjectSummary } from '@/lib/content';
import StackIcons from './StackIcons';
import styles from './Card.module.css';

// The cards sit in the starfield, so they behave like objects floating in it
// rather than tiles printed on it: they tilt toward the cursor, lift, and
// carry a soft light that tracks where you are pointing.
//
// Cursor position goes into CSS custom properties rather than React state.
// pointermove fires continuously, and re-rendering a card on every one of
// those to move a highlight would be waste.

/** Maximum tilt in degrees. Past about six it stops reading as depth. */
const TILT = 5;

export default function ProjectCard({
  entry,
  featured = false,
}: {
  entry: ProjectSummary;
  /** The lead project, given a wide card at the top of the page. */
  featured?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
    // Tilt away from the cursor on the vertical axis and toward it on the
    // horizontal, which is what makes a surface feel pushed rather than
    // steered.
    el.style.setProperty('--ry', `${(px - 0.5) * TILT * 2}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * TILT * 2}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    for (const p of ['--mx', '--my', '--rx', '--ry']) el.style.removeProperty(p);
  };

  return (
    <Link
      ref={ref}
      // A project whose home is another page sends the card there instead.
      href={entry.href ?? `/projects/${entry.slug}/`}
      className={styles.card}
      data-featured={featured || undefined}
      data-status={entry.status}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      /* Each project carries its own hover colour, set from frontmatter so it
         lives with the project rather than in a lookup table in here. */
      style={
        {
          ...(entry.accent ? { '--accent-a': entry.accent } : {}),
          ...(entry.accent2 ? { '--accent-b': entry.accent2 } : {}),
        } as React.CSSProperties
      }
    >
      {entry.cover && (
        <span className={styles.cover}>
          <img
            src={entry.cover}
            alt={entry.coverAlt ?? ''}
            width={1600}
            height={900}
            loading={featured ? 'eager' : 'lazy'}
            decoding="async"
          />
        </span>
      )}
      <span className={styles.cardBody}>
      <div className={styles.cardTop}>
        {entry.kind && <span className={styles.kind}>{entry.kind}</span>}
        <span className={styles.status} data-status={entry.status}>
          {STATUS_LABEL[entry.status]}
        </span>
      </div>
      <h3 className={styles.title}>{entry.title}</h3>
      <p className={styles.body}>{entry.summary}</p>
      {entry.stack && entry.stack.length > 0 && (
        <div className={styles.meta}>
          <StackIcons stack={entry.stack} size="sm" />
        </div>
      )}
      </span>
    </Link>
  );
}
