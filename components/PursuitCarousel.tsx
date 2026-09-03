'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ControllerIcon from './ControllerIcon';
import OrthodoxCross from './OrthodoxCross';
import { useEffect, useRef, useState } from 'react';
import styles from './PursuitCarousel.module.css';

// The two pursuits, one at a time, each over its own footage.
//
// Video is expensive, so it is handled carefully: only the visible panel ever
// plays, playback stops when the section scrolls away or the tab is hidden,
// and a missing file or a reduced-motion preference falls back to the panel's
// gradient rather than a black rectangle. Nothing here is load-bearing — the
// copy and the link work with no video at all.

interface Pursuit {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  /** Dropped in public/video/. Absent files degrade to the gradient. */
  video: string;
  /** Fallback wash, and what shows behind the video while it buffers. */
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
    video: '/video/orthodoxy.mp4',
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
    video: '/video/gaming.mp4',
    icon: <ControllerIcon size="sm" />,
    iconColour: 'oklch(86% 0.20 135)',
    tint: 'radial-gradient(120% 100% at 30% 70%, oklch(30% 0.08 285 / 0.55), oklch(12% 0.02 280 / 0.9) 70%)',
  },
];

export default function PursuitCarousel() {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const next = () => setIndex((i) => (i + 1) % PURSUITS.length);

  // Only the visible panel plays, and only while the section is on screen.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let onScreen = true;

    const sync = () => {
      videoRefs.current.forEach((v, i) => {
        if (!v) return;
        if (i === index && onScreen && !document.hidden && !reduced) {
          void v.play().catch(() => {
            // Autoplay refused. The poster and tint still carry the panel.
          });
        } else {
          v.pause();
        }
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    io.observe(host);

    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [index]);

  const current = PURSUITS[index];

  return (
    <div className={styles.carousel} ref={hostRef}>
      {PURSUITS.map((p, i) => (
        <div
          key={p.title}
          className={styles.panel}
          data-active={i === index}
          aria-hidden={i !== index}
        >
          <div className={styles.tint} style={{ background: p.tint }} />

          {!broken[i] && (
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              className={styles.video}
              src={p.video}
              muted
              loop
              playsInline
              preload={i === index ? 'auto' : 'none'}
              onError={() => setBroken((b) => ({ ...b, [i]: true }))}
            />
          )}

          {/* Black overlay: the footage is atmosphere, the words are the point. */}
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
