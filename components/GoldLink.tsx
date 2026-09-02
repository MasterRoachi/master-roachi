'use client';

import Link from 'next/link';
import { useRef, type PointerEvent } from 'react';
import styles from './GoldLink.module.css';

// An outline button whose border and lettering catch light as the cursor
// crosses them, the way the gilt on the book does. Nothing is filled — the
// gold lives entirely in the 1px border and the text.
//
// The cursor position is written to CSS custom properties rather than to
// React state: this fires on every pointermove, and re-rendering the tree at
// that rate to move a highlight would be wasteful. Setting two variables lets
// the compositor do the work.

export default function GoldLink({
  href,
  children,
}: {
  href: string;
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
    // Back to the resting highlight, so the button still reads as gold when
    // nothing is pointing at it.
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
  };

  return (
    <Link
      ref={ref}
      href={href}
      className={styles.gold}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
