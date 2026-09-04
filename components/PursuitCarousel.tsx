'use client';

import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import ControllerIcon from './ControllerIcon';
import OrthodoxCross from './OrthodoxCross';
import CandleField from './CandleField';
import ArcadeField from './ArcadeField';
import styles from './PursuitCarousel.module.css';

// The two pursuits, one at a time, each over the field its own page uses.
//
// This ran on video first — two clips in public/video/ that never arrived.
// Chasing footage turned out to be the wrong problem: CandleField is already
// candlelight and already sits behind Foundations, ArcadeField is already the
// Fun page's backdrop, and those are precisely the two subjects. Using them
// costs nothing to download, cannot fail to load, cannot be a licensing
// question, and makes the homepage agree with the pages it points at.
//
// Only the active panel's field is mounted. Both fields stop themselves when
// the section scrolls off or the tab is hidden, but neither can tell that its
// panel has been faded to nothing — an element at opacity 0 still intersects.
// Unmounting is what actually stops the hidden one, and it is why there is no
// play/pause bookkeeping here any more.

interface Pursuit {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  /** The canvas backdrop, the same one this pursuit's own page runs. */
  Field: ComponentType;
  /** Shows under the field, and on its own under reduced motion. */
  tint: string;
  /**
   * The mark for this side of the site, above the eyebrow.
   */
  icon?: ReactNode;
  /** Gold for the cross, lime for the controller. */
  iconColour?: string;
}

const PURSUITS: Pursuit[] = [
  {
    eyebrow: 'Study Well',
    title: 'Orthodoxy',
    body: 'Long-form video and written argument, for anyone willing to ask whether it is true.',
    href: '/orthodoxy/',
    cta: 'Go to Foundations',
    Field: CandleField,
    icon: <OrthodoxCross size="sm" />,
    iconColour: 'oklch(84% 0.16 92)',
    tint: 'radial-gradient(120% 100% at 70% 30%, oklch(30% 0.07 70 / 0.55), oklch(12% 0.02 60 / 0.9) 70%)',
  },
  {
    eyebrow: 'Rest Plenty',
    title: 'Gaming',
    body: 'Completionist runs, achievement hunting, and analysis of the games that reward it.',
    href: '/gaming/',
    cta: 'Go to Fun',
    Field: ArcadeField,
    icon: <ControllerIcon size="sm" />,
    iconColour: 'oklch(86% 0.20 135)',
    tint: 'radial-gradient(120% 100% at 30% 70%, oklch(30% 0.08 285 / 0.55), oklch(12% 0.02 280 / 0.9) 70%)',
  },
];

export default function PursuitCarousel() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % PURSUITS.length);

  const current = PURSUITS[index];

  return (
    <div className={styles.carousel}>
      {PURSUITS.map((p, i) => (
        <div
          key={p.title}
          className={styles.panel}
          data-active={i === index}
          aria-hidden={i !== index}
        >
          <div className={styles.tint} style={{ background: p.tint }} />

          {i === index && <p.Field />}

          {/* Black overlay: the field is atmosphere, the words are the point. */}
          <div className={styles.overlay} />
        </div>
      ))}

      <div className={styles.content}>
        {current.icon && (
          <span
            className={styles.mark}
            style={{ color: current.iconColour }}
          >
            {current.icon}
          </span>
        )}
        <p className="eyebrow">{current.eyebrow}</p>
        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.body}>{current.body}</p>
        <Link href={current.href} className={styles.cta}>
          {current.cta} →
        </Link>
      </div>

      <button
        type="button"
        className={styles.next}
        onClick={next}
        aria-label={`Show ${PURSUITS[(index + 1) % PURSUITS.length].title}`}
      >
        <span aria-hidden="true">→</span>
      </button>

      <div className={styles.dots} aria-hidden="true">
        {PURSUITS.map((p, i) => (
          <span key={p.title} data-active={i === index} />
        ))}
      </div>
    </div>
  );
}
