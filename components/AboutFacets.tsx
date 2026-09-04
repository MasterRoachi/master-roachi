'use client';

import Link from 'next/link';
import type { PointerEvent } from 'react';
import styles from './AboutFacets.module.css';

// The five sections of the site, as doors rather than a paragraph.
//
// About is the one page that does not have a subject of its own — it is where
// the other five meet. So instead of describing them it shows them, each in its
// own colour with a number off its own page. The counts are passed in from the
// server rather than hardcoded, so a door is never boasting about work that is
// no longer there.
//
// This used to be three doors carrying the three halves of the tagline, with
// accents that had drifted out of step with the nav — Work was amber here and
// white there, Foundations the reverse. They come from lib/site.ts now, so
// there is one place to change a page's colour.

export interface Facet {
  title: string;
  body: string;
  href: string;
  accent: string;
  /** The number off that page, and what it counts. */
  count: string;
  unit: string;
}

export default function AboutFacets({ facets }: { facets: Facet[] }) {
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
    // Toward the cursor horizontally, away from it vertically — the same
    // arithmetic the homepage deck uses, which is what makes a surface feel
    // pushed rather than steered.
    el.style.setProperty('--cy', `${((px - 0.5) * 14).toFixed(2)}deg`);
    el.style.setProperty('--cx', `${((0.5 - py) * 12).toFixed(2)}deg`);
  };

  const onLeave = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    for (const p of ['--mx', '--my', '--cx', '--cy']) el.style.removeProperty(p);
  };

  return (
    <div className={styles.facets}>
      {facets.map((f) => (
        <Link
          key={f.title}
          href={f.href}
          className={styles.facet}
          style={{ '--facet': f.accent } as React.CSSProperties}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <p className={styles.count}>
            <span className={styles.number}>{f.count}</span>
            <span className={styles.unit}>{f.unit}</span>
          </p>
          <h3 className={styles.title}>{f.title}</h3>
          <p className={styles.body}>{f.body}</p>
          <span className={styles.go}>Go →</span>
        </Link>
      ))}
    </div>
  );
}
