'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WORK_SECTIONS, sectionFor } from '@/lib/work-tools';
import styles from './WorkHeader.module.css';

// The backend's own header, and all the chrome it has.
//
// The site's nav and footer are hidden under /work — see the guard in both of
// them — because none of it applies here: the backend is not part of the site
// being navigated, it is the thing the site is edited from, and a footer with
// an RSS link at the bottom of a lesson grid is furniture.
//
// THE SAME THREE CATEGORIES AS THE HOME, so the structure is the same wherever
// you meet it. It listed all nine names flat, which fit but said nothing about
// which of them belonged together, and read as a wall of words above every
// page. Three now, each one dropping its three, with the category the current
// page lives in marked — a tool page is still one hop from any other tool, and
// the hop now tells you where you are going.

export default function WorkHeader() {
  const path = usePathname();
  const here = sectionFor(path);
  const [open, setOpen] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);

  // A menu left hanging after you have looked somewhere else is clutter, and
  // clicking out of one is the thing everybody tries first.
  useEffect(() => {
    if (!open) return;
    function away(event: PointerEvent) {
      if (!nav.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  // Navigating is the other way a menu is finished with. Next keeps this
  // component mounted across a route change, so nothing else closes it.
  useEffect(() => {
    setOpen(null);
  }, [path]);

  return (
    <header className={styles.header}>
      <nav
        aria-label="Backend"
        ref={nav}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) setOpen(null);
        }}
      >
        <ul className={styles.bar}>
          <li>
            <Link
              href="/work/"
              className={path === '/work' || path === '/work/' ? styles.here : undefined}
            >
              Work
            </Link>
          </li>

          {WORK_SECTIONS.map((section) => (
            <li key={section.key} className={styles.section}>
              <button
                type="button"
                // The category the current page is in is marked the way the
                // current page itself used to be: it is the same question.
                className={here?.key === section.key ? styles.here : undefined}
                aria-expanded={open === section.key}
                onClick={() => setOpen(open === section.key ? null : section.key)}
              >
                {section.name}
              </button>

              {open === section.key ? (
                <ul className={styles.menu}>
                  {section.tools.map((tool) => (
                    <li key={tool.href}>
                      <Link
                        href={tool.href}
                        // Trailing slashes are on (next.config.mjs sets
                        // trailingSlash: true) so the pathname may or may not
                        // carry one depending on how the page was reached.
                        className={
                          path.replace(/\/$/, '') === tool.href.replace(/\/$/, '')
                            ? styles.here
                            : undefined
                        }
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
