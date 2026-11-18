'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './WorkTabs.module.css';

// The switcher over Work and Hire me (app/(work)/layout.tsx). Plain links, one
// per address, so it works before any script and each tab can be shared.
//
// It must not make the page jump (his rule, 18 Nov 2026). It lives in the
// layout, so it is never re-rendered away; it sits above every tab's hero, at
// the same place on all three; the hero below it is one height on all three
// (WorkHero.tsx); and the links pass scroll={false}, so Next leaves the
// scroll alone. Not sticky, his word the same day.

const TABS = [
  {
    href: '/projects/',
    label: 'My work',
    sub: 'Games, worlds, stores',
    accent: 'oklch(97% 0 0)',
  },
  {
    href: '/hire/',
    label: 'Websites',
    sub: 'For your business',
    accent: 'oklch(80% 0.12 190)',
  },
  {
    href: '/hire/software/',
    label: 'Software',
    sub: 'Apps and tools',
    accent: 'oklch(76% 0.15 300)',
  },
] as const;

/** The tab a path belongs to: the longest href it starts with. */
function current(pathname: string): string {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return (
    [...TABS].sort((a, b) => b.href.length - a.href.length).find((t) => path.startsWith(t.href))?.href ?? '/projects/'
  );
}

export default function WorkTabs() {
  const pathname = usePathname();
  const active = current(pathname);

  return (
    <div className={styles.bar}>
      <nav className={`shell ${styles.tabs}`} aria-label="Work and hire me">
        <ul className={styles.list}>
          {TABS.map((t) => {
            const on = t.href === active;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  scroll={false}
                  className={styles.tab}
                  style={{ '--tab': t.accent } as React.CSSProperties}
                  data-active={on || undefined}
                  aria-current={on ? 'page' : undefined}
                >
                  <b>{t.label}</b>
                  <small>{t.sub}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
