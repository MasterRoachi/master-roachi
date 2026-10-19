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
  //
  // Adjusted during render rather than in an effect. React re-runs this
  // component immediately with the new state and before anything is painted,
  // so the panel never shows open on the new page for a frame the way an
  // effect would let it.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Escape closes it, matching normal disclosure behaviour.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* A scrim once the page has scrolled — his ruling, 2026-10-19, when the
   * nav was switched to sticky. Transparent at the top of a page, as it was
   * designed; once anything can pass under it, a dark blurred band fades in,
   * because a link shadow could not hold its own over a page of text. Passive
   * and coalesced to one state change per crossing, not one per scroll event. */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* The backend wears its own header and no site nav.
   *
   * BELOW every hook on purpose. Returning early above one changes the hook
   * count when a client navigation moves from /work to a public page, and
   * React throws "rendered fewer hooks than expected" — which is how this was
   * written the first time.
   *
   * Hidden here rather than by lifting every public page into a route group:
   * that is the tidier Next answer and it would mean moving every page in the
   * repository to change the chrome on nine of them. /work is not part of the
   * site being navigated; it is the thing the site is edited from. */
  if (pathname.startsWith('/work')) return null;

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
    <header className={styles.nav} data-scrolled={scrolled || undefined}>
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
              // The section colour, read by the sheen gradient in the CSS.
              style={{ '--sheen': link.accent } as React.CSSProperties}
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
