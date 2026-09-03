'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { STATUS_LABEL } from '@/lib/format';
import type { ProjectSummary } from '@/lib/content';
import StackIcons from './StackIcons';
import styles from './ProjectDeck.module.css';

// The work on the homepage, as a deck you swipe rather than a grid.
//
// The grid was the same component in the same order as the Work page, so the
// homepage said everything that page had to say and left no reason to visit
// it. A deck shows a few at a time, gives each one a face, and asks to be
// moved through.
//
// Swiping is native scroll-snap rather than a hand-rolled gesture: it already
// handles touch, trackpad, momentum, and the browser's own accessibility
// behaviour, and none of that is worth reimplementing badly. On top of it sit
// three things a bare scroller lacks — arrows for mouse users, drag-to-pan
// with a pointer, and a depth effect driven by each card's distance from the
// centre.

/** How far a card at the edge of the viewport tips, in degrees. */
const TILT = 7;

export default function ProjectDeck({
  projects,
}: {
  projects: ProjectSummary[];
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /**
   * Writes each card's distance from the centre as a custom property, so the
   * transforms are CSS and the scroll handler stays arithmetic. Doing this in
   * React state would re-render the whole deck on every scroll frame.
   */
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const box = track.getBoundingClientRect();
    if (!box.width) return;
    const centre = box.left + box.width / 2;

    for (const child of Array.from(track.children)) {
      const el = child as HTMLElement;
      const r = el.getBoundingClientRect();
      // -1 at the left edge, 0 dead centre, +1 at the right.
      const d = Math.max(
        -1,
        Math.min(1, (r.left + r.width / 2 - centre) / (box.width / 2)),
      );
      el.style.setProperty('--d', d.toFixed(3));
      el.style.setProperty('--tilt', `${(-d * TILT).toFixed(2)}deg`);
    }

    setAtStart(track.scrollLeft <= 2);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };

    measure();
    track.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      track.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [measure]);

  /** Drag to pan, for anyone without a touchscreen or a trackpad. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;

    const down = (e: PointerEvent) => {
      // Left button only, and never on a link's own drag.
      if (e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startScroll = track.scrollLeft;
    };

    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) {
        track.scrollLeft = startScroll - dx;
        track.dataset.dragging = 'true';
      }
    };

    const up = () => {
      dragging = false;
      // Cleared on the next frame so the click that ends a drag is swallowed
      // by the CSS below rather than opening a project.
      requestAnimationFrame(() => {
        delete track.dataset.dragging;
      });
    };

    track.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      track.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  /**
   * Where the cursor is on a card, as a fraction of it, written to custom
   * properties. The foil sheen and the tilt are both CSS reading these — the
   * alternative is re-rendering a card on every pointermove to move a
   * highlight, which is a lot of React for a reflection.
   */
  const onCardMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    // Toward the cursor horizontally, away from it vertically — which is what
    // makes a surface feel pushed rather than steered.
    el.style.setProperty('--cy', `${((px - 0.5) * 14).toFixed(2)}deg`);
    el.style.setProperty('--cx', `${((0.5 - py) * 12).toFixed(2)}deg`);
  };

  const onCardLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    for (const p of ['--mx', '--my', '--cx', '--cy']) el.style.removeProperty(p);
  };

  const page = (dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 20 : 320;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className={styles.deck}>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => page(-1)}
        disabled={atStart}
        aria-label="Previous projects"
      >
        ←
      </button>

      <ul ref={trackRef} className={styles.track}>
        {projects.map((entry) => (
          <li key={entry.slug} className={styles.slide}>
            <Link
              href={entry.href ?? `/projects/${entry.slug}/`}
              className={styles.card}
              onPointerMove={onCardMove}
              onPointerLeave={onCardLeave}
              style={
                {
                  ...(entry.accent ? { '--accent-a': entry.accent } : {}),
                  ...(entry.accent2 ? { '--accent-b': entry.accent2 } : {}),
                } as React.CSSProperties
              }
            >
              <span className={styles.face}>
                {entry.cover ? (
                  <img
                    src={entry.cover}
                    alt={entry.coverAlt ?? ''}
                    width={1600}
                    height={900}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  /* No art yet. The project's own two colours make a face
                     rather than a grey box, so the deck reads as a deck now
                     and simply gets better when the art lands. */
                  <span className={styles.blank} aria-hidden="true">
                    {entry.title.charAt(0)}
                  </span>
                )}
                <span className={styles.status} data-status={entry.status}>
                  {STATUS_LABEL[entry.status]}
                </span>
              </span>

              {/* The sheen, over everything. Its own element rather than a
                  pseudo-element so it can blend against the card without the
                  copy inheriting the blend mode. */}
              <span className={styles.foil} aria-hidden="true" />

              <span className={styles.body}>
                {entry.kind && <span className={styles.kind}>{entry.kind}</span>}
                <span className={styles.title}>{entry.title}</span>
                <span className={styles.summary}>{entry.summary}</span>
                {entry.stack && entry.stack.length > 0 && (
                  <span className={styles.stack}>
                    <StackIcons stack={entry.stack} size="sm" />
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => page(1)}
        disabled={atEnd}
        aria-label="More projects"
      >
        →
      </button>
    </div>
  );
}
