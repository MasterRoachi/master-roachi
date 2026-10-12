'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WORK_TOOLS } from '@/lib/work-tools';
import styles from './WorkHeader.module.css';

// The backend's own header, and all the chrome it has.
//
// The site's nav and footer are hidden under /work — see the guard in both of
// them — because none of it applies here: the backend is not part of the site
// being navigated, it is the thing the site is edited from, and a footer with
// an RSS link at the bottom of a lesson grid is furniture.
//
// Just the names, centred, with the current one marked. No eyebrow, no page
// title, no back arrow: every page in here used to open with "Private" and its
// own name, which said nothing the header does not, and a back link to a home
// page that is one of these links anyway.

export default function WorkHeader() {
  const path = usePathname();

  return (
    <header className={styles.header}>
      <nav aria-label="Backend">
        <ul>
          <li>
            <Link href="/work/" className={path === '/work' || path === '/work/' ? styles.here : undefined}>
              Work
            </Link>
          </li>
          {WORK_TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                // Trailing slashes are on (next.config.mjs sets
                // trailingSlash: true) so the pathname may or may not carry
                // one depending on how the page was reached.
                className={path.replace(/\/$/, '') === tool.href.replace(/\/$/, '') ? styles.here : undefined}
              >
                {tool.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
