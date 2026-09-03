'use client';

import { useEffect, useMemo, useState } from 'react';
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

/**
 * Which quote a page opens on.
 *
 * Every page now draws from one shared pool, so without this they would all
 * render the same first line into their static HTML and only diverge once
 * JavaScript ran. Hashing the page's own seed spreads the opening quote across
 * the pool at build time, and keeps it stable between server and client — a
 * random pick here would be a hydration mismatch.
 */
function openingIndex(seed: string, count: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % count;
}

export default function CyclingQuote({
  quotes,
  seed = '',
  className,
}: {
  quotes: Quote[];
  /** Distinguishes one page from another. Usually the page name. */
  seed?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);

  const start = useMemo(
    () => (quotes.length ? openingIndex(seed, quotes.length) : 0),
    [seed, quotes.length],
  );

  // The order the rest arrive in, shuffled once on mount.
  //
  // Null until then, which is what keeps the server and the first client render
  // agreeing: both show quotes[start] and nothing random has happened yet. The
  // shuffle lands after hydration, where a differing result is just a state
  // change rather than a mismatch.
  const [order, setOrder] = useState<number[] | null>(null);

  useEffect(() => {
    const rest = quotes.map((_, i) => i).filter((i) => i !== start);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    setOrder([start, ...rest]);
  }, [start, quotes.length]);

  useEffect(() => {
    if (quotes.length < 2 || held) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => setIndex((i) => i + 1), INTERVAL);
    return () => window.clearInterval(id);
  }, [quotes.length, held]);

  const sequence = order ?? [start];
  const quote = quotes[sequence[index % sequence.length]];

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
