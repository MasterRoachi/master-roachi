'use client';

import { useEffect, useRef } from 'react';
import styles from './ReadingProgress.module.css';

// A hairline across the top of the window showing how far through a post you
// are. Cheap, and on a long read it is the difference between "this is going on
// a bit" and knowing you are two thirds of the way down.
//
// Measured against the article rather than the document, so the footer and the
// related posts underneath do not count as reading and the bar actually
// completes when the words do.
//
// Written to a CSS custom property rather than React state: this fires on every
// scroll frame, and re-rendering a component that often to move one bar is a
// waste of everything.

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const article = document.querySelector('article');
    if (!article) return;

    let raf = 0;

    const measure = () => {
      raf = 0;
      const r = article.getBoundingClientRect();
      // How far the viewport top has travelled through the article, as 0–1.
      const scrolled = -r.top;
      const runway = r.height - window.innerHeight;
      const p = runway <= 0 ? 1 : Math.min(1, Math.max(0, scrolled / runway));
      bar.style.setProperty('--read', String(p));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div ref={barRef} className={styles.bar} aria-hidden="true" />;
}
