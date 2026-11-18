'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent, PointerEvent } from 'react';
import CyclingQuote from './CyclingQuote';
import LaptopIcon from './LaptopIcon';
import { quotes } from '@/lib/quotes';
import styles from './WorkHero.module.css';

// The hero over Work's three tabs (app/(work)/layout.tsx). One layout for all
// three, his rules of 18 Nov 2026: the same height and alignment on every tab,
// the words on the left and four picture tiles on the right, as the Websites
// hero was. The tiles are real work, on the two hire tabs only (his picks);
// My work has its laptop mark instead, as Fun has its controller and
// Foundations its cross. The layout chooses the tiles.
//
// The same height without measuring anything: all three heroes are drawn into
// one grid cell, and only the current one is visible. The cell is as tall as
// the tallest at every width, so choosing a tab never moves what is below it.
// The hidden two are inert and hidden from screen readers, and only the
// current one has the page's <h1>.

type Hero = {
  href: string;
  accent: string;
  eyebrow: string;
  title: string;
  em: string;
  lede?: string;
  /** The section's mark above the eyebrow, as PageHeader draws it. */
  mark?: boolean;
  buttons: {
    label: string;
    href: string;
    primary?: boolean;
  }[];
};

/** One picture tile beside a hero, chosen in app/(work)/layout.tsx. */
export type Tile = {
  label: string;
  title: string;
  status: string;
  cover?: string;
  /** The picture is a logo: drawn whole above the words, not as a backdrop. */
  logo?: boolean;
  /** Absent for work with no public page: the tile is then not a link. */
  href?: string;
};

const HEROES: Hero[] = [
  {
    href: '/projects/',
    accent: 'oklch(97% 0 0)',
    eyebrow: 'Work',
    mark: true,
    title: 'Work',
    em: 'Hard.',
    buttons: [
      { label: 'See the work', href: '#work', primary: true },
      { label: 'Hire me', href: '/hire/' },
    ],
  },
  {
    href: '/hire/',
    accent: 'oklch(80% 0.12 190)',
    eyebrow: 'Hire me · Websites',
    title: 'A website for your business,',
    em: 'and a person who answers.',
    lede: 'I build websites for small businesses in and around Pretoria. Quick on a phone, with your hours, map and WhatsApp a tap away.',
    buttons: [
      { label: 'Contact me', href: '#contact', primary: true },
      { label: 'See prices', href: '#prices' },
    ],
  },
  {
    href: '/hire/software/',
    accent: 'oklch(76% 0.15 300)',
    eyebrow: 'Hire me · Software',
    title: 'Apps and tools,',
    em: 'built to the job.',
    lede: 'Phone apps, web apps, the tools behind a business and the jobs that connect them. You tell me the problem; I build the thing that fixes it.',
    buttons: [
      { label: 'Contact me', href: '#contact', primary: true },
      { label: 'See prices', href: '#prices' },
    ],
  },
];

function active(pathname: string): string {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return (
    [...HEROES].sort((a, b) => b.href.length - a.href.length).find((h) => path.startsWith(h.href))?.href ?? '/projects/'
  );
}

/**
 * "Contact me" and "See prices" slide down to their section rather than jump
 * (his ask, 18 Nov 2026); straight there under reduced motion. The address
 * still gets the #contact, so the link can be copied and Back works.
 */
function slide(e: MouseEvent<HTMLAnchorElement>) {
  const id = e.currentTarget.hash.slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  history.pushState(null, '', `#${id}`);
}

/** The project cards' cursor light and tilt, on a smaller scale. */
const TILT = 5;

function onTileMove(e: PointerEvent<HTMLAnchorElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
  el.style.setProperty('--ry', `${(px - 0.5) * TILT * 2}deg`);
  el.style.setProperty('--rx', `${(0.5 - py) * TILT * 2}deg`);
}

function onTileLeave(e: PointerEvent<HTMLAnchorElement>) {
  for (const p of ['--mx', '--my', '--rx', '--ry']) e.currentTarget.style.removeProperty(p);
}

export default function WorkHero({ tiles }: { tiles: Record<string, Tile[]> }) {
  const current = active(usePathname());

  return (
    <div className={`shell ${styles.stack}`}>
      {HEROES.map((h) => {
        const on = h.href === current;
        const Title = on ? 'h1' : 'p';
        return (
          <header
            key={h.href}
            className={styles.hero}
            data-active={on || undefined}
            aria-hidden={on ? undefined : true}
            inert={!on}
            style={{ '--accent-a': h.accent } as React.CSSProperties}
          >
            <div className={styles.text}>
              {h.mark && (
                <span className={styles.mark}>
                  <LaptopIcon />
                </span>
              )}
              <p className="eyebrow">{h.eyebrow}</p>
              <Title className={styles.title}>
                {h.title} <em>{h.em}</em>
              </Title>
              {h.lede ? (
                <p className={styles.lede}>{h.lede}</p>
              ) : (
                <div className={styles.quote}>
                  <CyclingQuote quotes={quotes} seed="work" />
                </div>
              )}
              <div className={styles.buttons}>
                {h.buttons.map((b) =>
                  b.href.startsWith('/') ? (
                    <Link key={b.label} href={b.href} className={`${styles.btn} ${b.primary ? styles.primary : ''}`}>
                      {b.label}
                    </Link>
                  ) : (
                    <a
                      key={b.label}
                      href={b.href}
                      className={`${styles.btn} ${b.primary ? styles.primary : ''}`}
                      onClick={slide}
                    >
                      {b.label}
                    </a>
                  ),
                )}
              </div>
            </div>
            {(tiles[h.href] ?? []).length > 0 && (
              <ul className={styles.tiles}>
                {tiles[h.href].map((t) => {
                  const inside = (
                    <>
                      {t.cover && (
                        // A static export with no image loader: see eslint.config.mjs.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.cover} alt="" loading="lazy" decoding="async" />
                      )}
                      <span className={styles.label}>{t.label}</span>
                      <span className={styles.name}>{t.title}</span>
                      <span className={styles.status}>
                        {t.status} {t.href && <span aria-hidden="true">→</span>}
                      </span>
                    </>
                  );
                  return (
                    <li key={t.title}>
                      {t.href ? (
                        <Link
                          href={t.href}
                          className={styles.tile}
                          data-logo={t.logo || undefined}
                          onPointerMove={onTileMove}
                          onPointerLeave={onTileLeave}
                        >
                          {inside}
                        </Link>
                      ) : (
                        <div className={styles.tile} data-logo={t.logo || undefined}>
                          {inside}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </header>
        );
      })}
    </div>
  );
}
