'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PointerEvent } from 'react';
import Logo from './Logo';
import { navLinks, site } from '@/lib/site';
import styles from './Footer.module.css';

// Closes the page the way the hero opens it: the kanji sitting on a rule, the
// mark, and the tagline set large. Links carry the same tracked light as the
// nav, so the bottom of the page behaves like the top.

export default function Footer() {
  const { contactEmail, socials } = site;
  const pathname = usePathname();

  // The footer sits outside every page's own wrapper, so it cannot inherit the
  // accent those wrappers set. It works it out from the route instead, which
  // is what lets the closing rule match the page it is closing. The longest
  // matching href wins, so /projects/terrath/ still answers as Work.
  const accent = navLinks
    .filter((l) => pathname === l.href || pathname.startsWith(l.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.accent;

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const onLeave = (e: PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty('--mx');
    e.currentTarget.style.removeProperty('--my');
  };

  const link = (href: string, label: string, external = false) =>
    external ? (
      <a
        key={href}
        className={styles.link}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {label}
      </a>
    ) : (
      <Link
        key={href}
        href={href}
        className={styles.link}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {label}
      </Link>
    );

  return (
    <footer
      className={styles.footer}
      style={accent ? ({ '--accent-a': accent } as React.CSSProperties) : undefined}
    >
      {/* The same marked rule that divides the hero, closing the page — and
          in the same colour, since the footer now knows which page it is
          under. */}
      <div className={`divider ${styles.rule}`} aria-hidden="true">
        <span />
        <img
          src="/kanji.webp"
          alt=""
          width={22}
          height={22}
          className="divider-mark"
          decoding="async"
        />
        <span />
      </div>

      <div className={styles.inner}>
        <div className={styles.identity}>
          <Logo size={64} className={styles.mark} />
          <p className={styles.tagline}>
            {site.tagline} <span>{site.taglineTail}</span>
          </p>
        </div>

        <div className={styles.columns}>
          <nav className={styles.column} aria-label="Footer">
            <p className={styles.columnHead}>Site</p>
            {navLinks.map((l) => link(l.href, l.label))}
          </nav>

          <div className={styles.column}>
            <p className={styles.columnHead}>Elsewhere</p>
            {contactEmail && link(`mailto:${contactEmail}`, 'Email', true)}
            {link(socials.github, 'GitHub', true)}
            {socials.linkedin && link(socials.linkedin, 'LinkedIn', true)}
            {link('/rss.xml', 'RSS', true)}
          </div>
        </div>
      </div>

      <div className={styles.base}>
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>{site.personName}</span>
      </div>
    </footer>
  );
}
