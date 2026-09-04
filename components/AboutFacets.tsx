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
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const onLeave = (e: PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty('--mx');
    e.currentTarget.style.removeProperty('--my');
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
