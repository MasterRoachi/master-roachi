'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Frontmatter } from '@/lib/content';
import PieceIcon, { kindFor } from './PieceIcon';
import styles from './ProjectPieces.module.css';

// The pieces of a project that is a collection rather than one thing — the
// Odin exercises, which is what prompted it.
//
// A stack rather than a list. Twenty-four rows is a wall you scroll past; a
// deck is something you go through, and going through them one at a time is
// closer to what they are — a sequence, in the order they were done.
//
// Every piece links to a live demo where there is one: a list of exercise
// names is a claim, a list of working links is evidence.
//
// Depth is real here. Cards behind the front one are pushed back on Z and
// scaled down by the same perspective rather than by a fudged transform, so
// the stack has actual thickness, and the card leaving rotates out of the
// plane instead of sliding.

type Piece = NonNullable<Frontmatter['pieces']>[number];

/** How many cards behind the front one are drawn. The rest are not rendered. */
const DEPTH = 4;

export default function ProjectPieces({ pieces }: { pieces: Piece[] }) {
  const [index, setIndex] = useState(0);
  // Which way the last move went, so the card leaving knows where to go.
  const [dir, setDir] = useState<1 | -1>(1);
  const hostRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const total = pieces.length;

  const go = useCallback(
    (delta: 1 | -1) => {
      setDir(delta);
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  // Arrow keys, but only while the deck has focus — hijacking them for the
  // whole page would break scrolling everywhere else on it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  // Drag, for touch and for anyone who would rather throw it than click.
  const drag = useRef<{ x: number; active: boolean }>({ x: 0, active: false });
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, active: true };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
  };

  // Announced rather than left silent: the visible card changes without the
  // focused control changing, which a screen reader would otherwise miss.
  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `${index + 1} of ${total}: ${pieces[index].title}`;
    }
  }, [index, total, pieces]);

  return (
    <div className={styles.deck}>
      <div
        ref={hostRef}
        className={styles.stage}
        tabIndex={0}
        role="group"
        aria-roledescription="deck"
        aria-label={`${total} pieces, use the arrow keys or the buttons to move through them`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current.active = false)}
      >
        {pieces.map((piece, i) => {
          // Distance forward from the front card, wrapping, so the deck is a
          // loop rather than a run that empties out at the end.
          const offset = (i - index + total) % total;
          const behind = offset <= DEPTH;
          // The one just behind the back of the stack is the card that has
          // most recently left, kept mounted so it can animate away.
          const leaving = offset === total - 1;
          if (!behind && !leaving) return null;

          return (
            <article
              key={piece.title}
              className={styles.card}
              data-state={leaving ? 'gone' : offset === 0 ? 'front' : 'behind'}
              aria-hidden={offset !== 0}
              style={
                {
                  '--depth': offset,
                  '--dir': dir,
                  '--piece': kindFor(piece.tags).colour,
                  zIndex: total - offset,
                } as React.CSSProperties
              }
            >
              <div className={styles.head}>
                <span className={styles.index} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={styles.mark} aria-hidden="true">
                  <PieceIcon tags={piece.tags} />
                </span>
              </div>

              <h3 className={styles.title}>{piece.title}</h3>
              <p className={styles.summary}>{piece.summary}</p>

              {piece.tags && piece.tags.length > 0 && (
                <div className={styles.tags}>
                  {piece.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              )}

              <div className={styles.links}>
                {piece.demo ? (
                  <a
                    className={styles.link}
                    href={piece.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    // Only the front card is reachable; the ones behind it are
                    // decoration and must not be tab stops.
                    tabIndex={offset === 0 ? 0 : -1}
                  >
                    {/* Stretched over the whole card by the CSS, so anywhere
                        on it opens the demo. */}
                    Open <span className={styles.arrow}>↗</span>
                  </a>
                ) : (
                  <span className={styles.noDemo}>Command line only</span>
                )}
                {piece.source && (
                  <a
                    className={`${styles.link} ${styles.linkQuiet}`}
                    href={piece.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={offset === 0 ? 0 : -1}
                  >
                    Source <span className={styles.arrow}>↗</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.nav}
          onClick={() => go(-1)}
          aria-label="Previous piece"
        >
          <span aria-hidden="true">←</span>
        </button>

        <p className={styles.count}>
          <span className={styles.now}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.of}>/ {String(total).padStart(2, '0')}</span>
        </p>

        <button
          type="button"
          className={styles.nav}
          onClick={() => go(1)}
          aria-label="Next piece"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <p ref={liveRef} className={styles.live} aria-live="polite" />
    </div>
  );
}
