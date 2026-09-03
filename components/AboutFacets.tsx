'use client';

import Link from 'next/link';
import type { PointerEvent } from 'react';
import styles from './AboutFacets.module.css';

// The three sides of the tagline, as three doors rather than a paragraph.
// It is the strongest structural idea in the brand and it was buried in prose.
//
// Ordered to match the nav (Work, Fun, Foundations) rather than the tagline,
// so the two ways into the same three sections agree.
//
// Each carries its own colour and the same tracked light the rest of the site
// uses, written to CSS custom properties rather than React state.

interface Facet {
  line: string;
  title: string;
  body: string;
  href: string;
  accent: string;
}

const FACETS: Facet[] = [
  {
    line: 'Work Hard',
    title: 'Work',
    body: 'Games, worlds, and the code underneath them. The long road from beginner to craftsman, in public.',
    href: '/projects/',
    accent: 'oklch(76% 0.13 78)',
  },
  {
    line: 'Rest Plenty',
    title: 'Fun',
    body: 'Played attentively enough to be worth writing about. One game at a time, finished honestly.',
    href: '/gaming/',
    accent: 'oklch(86% 0.20 135)',
  },
  {
    line: 'Study Well',
    title: 'Foundations',
    body: 'Orthodoxy taken as a real question rather than an aesthetic. The aim is not to make it trendy — it is to ask whether it is true.',
    href: '/orthodoxy/',
    accent: 'oklch(97% 0 0)',
  },
];

export default function AboutFacets() {
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
      {FACETS.map((f) => (
        <Link
          key={f.title}
          href={f.href}
          className={styles.facet}
          style={{ '--facet': f.accent } as React.CSSProperties}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <p className={styles.line}>{f.line}</p>
          <h3 className={styles.title}>{f.title}</h3>
          <p className={styles.body}>{f.body}</p>
          <span className={styles.go}>Go →</span>
        </Link>
      ))}
    </div>
  );
}
