'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { navLinks, site } from '@/lib/site';
import styles from './Nav.module.css';

// The Astro nav laid all links out in a single row with a fixed 72px gutter,
// which overflowed the viewport below ~400px and clipped "CONTACT" off the
// right edge. Below 820px this collapses into a toggle instead.
export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the menu on navigation, so tapping a link does not leave the panel
  // hanging open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes it, matching normal disclosure behaviour.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // The same tracked light the hero buttons use, so the nav answers the cursor
  // the way the rest of the page does. Written to CSS custom properties rather
  // than state — pointermove fires continuously.
  const onLinkMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const onLinkLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty('--mx');
    e.currentTarget.style.removeProperty('--my');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${site.name} — home`}>
          <Logo size={34} />
          <span className={styles.wordmark}>Master Roachi</span>
        </Link>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.toggleLabel}>{open ? 'Close' : 'Menu'}</span>
          <span className={styles.bars} data-open={open} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>

        <nav
          id="primary-nav"
          className={styles.links}
          data-open={open}
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.link}
              data-active={isActive(link.href)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              onPointerMove={onLinkMove}
              onPointerLeave={onLinkLeave}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
