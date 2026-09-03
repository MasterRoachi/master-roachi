'use client';

import { useEffect, useState } from 'react';
import type { Quote } from '@/lib/quotes';
import styles from './CyclingQuote.module.css';

// A line of copy that changes every few seconds, in place of a fixed lede.
//
// The first quote is rendered on the server, so the page has real words in its
// HTML rather than an empty slot waiting for JavaScript. Cycling starts after
// that.
//
// It stops when hovered or focused — text that moves while being read is worse
// than text that never moved — and never starts at all under reduced motion,
// where one quote simply stands.
//
// Deliberately not an aria-live region. Announcing a new quote every seven
// seconds would interrupt whatever a screen reader is doing elsewhere on the
// page, for decoration.

const INTERVAL = 7000;

export default function CyclingQuote({
  quotes,
  className,
}: {
  quotes: Quote[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (quotes.length < 2 || held) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % quotes.length),
      INTERVAL,
    );
    return () => window.clearInterval(id);
  }, [quotes.length, held]);

  const quote = quotes[index];

  return (
    <figure
      className={`${styles.figure} ${className ?? ''}`}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      {/* Keyed on the index so React replaces the node rather than editing it,
          which is what lets the fade run again on every change. */}
      <blockquote key={index} className={styles.quote}>
        {/* The words are wrapped so the quotation marks can hang off them.
            On the blockquote itself, ::after came after the attribution —
            which is inside it — and left a closing mark stranded on its own
            line below the name. */}
        <span className={styles.words}>{quote.text}</span>
        <footer className={styles.source}>{quote.source}</footer>
      </blockquote>
    </figure>
  );
}
