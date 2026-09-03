'use client';

import Link from 'next/link';
import { useRef, type PointerEvent } from 'react';
import styles from './SheenLink.module.css';

// An outline button whose border catches light as the cursor crosses it, the
// way the gilt on the book does. Nothing is filled — the metal lives entirely
// in the 1px border and the lettering.
//
// The cursor position is written to CSS custom properties rather than to React
// state: this fires on every pointermove, and re-rendering the tree at that
// rate to move a highlight would be waste. Setting two variables lets the
// compositor do the work.

type Tone = 'gold' | 'white';

export default function SheenLink({
  href,
  tone = 'gold',
  children,
}: {
  href: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    // Back to the resting highlight, so the outline still reads as metal when
    // nothing is pointing at it.
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
  };

  // next/link is for in-app routes. A mailto: or an off-site URL wants a plain
  // anchor — routing them through the client router buys nothing and risks it
  // trying to prefetch something that is not a page.
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const className = `${styles.sheen} ${styles[tone]}`;
  const label = <span className={styles.label}>{children}</span>;

  if (external) {
    const offsite = href.startsWith('http');
    return (
      <a
        ref={ref}
        href={href}
        className={className}
        target={offsite ? '_blank' : undefined}
        rel={offsite ? 'noopener noreferrer' : undefined}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {label}
    </Link>
  );
}
