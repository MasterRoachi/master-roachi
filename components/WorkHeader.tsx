'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appForPath, toolFor, WORK_APPS } from '@/lib/work-tools';
import styles from './WorkHeader.module.css';

// The backend's own header, and all the chrome it has.
//
// The site's nav and footer are hidden under /work (see the guard in both of
// them), because none of it applies here: the backend is not part of the site
// being navigated, it is the thing the site is edited from.
//
// ONE APP AT A TIME (2026-11-10). The backend is three apps now, each on its
// own address and installed on its own, so the header names the app you are
// in, which leads back to its doors, and lists that app's tools and nothing
// else. It used to drop menus for four groups across everything; with each
// app holding a handful of tools, a flat row is shorter than a menu. Moving to
// another app is the row of apps under each app's doors.

export default function WorkHeader() {
  const path = usePathname();
  const app = appForPath(path) ?? WORK_APPS[0];
  const here = toolFor(path);
  const home = path.replace(/\/$/, '') === app.home.replace(/\/$/, '');

  return (
    <header className={styles.header}>
      <nav aria-label={app.name}>
        <ul className={styles.bar}>
          <li>
            <Link href={app.home} className={home ? styles.here : undefined}>
              {app.name}
            </Link>
          </li>
          {app.tools.map((tool) => (
            <li key={tool.key}>
              {tool.outside ? (
                <a href={tool.href}>{tool.name}</a>
              ) : (
                <Link href={tool.href} className={here?.key === tool.key ? styles.here : undefined}>
                  {tool.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
