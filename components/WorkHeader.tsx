'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appForPath, toolFor, WORK_APPS } from '@/lib/work-tools';
import DoorIcon, { AppIcon } from '@/app/work/DoorIcon';
import styles from './WorkHeader.module.css';

// The backend's own header, and all the chrome it has.
//
// The site's nav and footer are hidden under /work (see the guard in both of
// them), because none of it applies here: the backend is not part of the site
// being navigated, it is the thing the site is edited from.
//
// A TITLE THAT OPENS THE DOORS (his pick, 2026-11-10, "App frame: B" on the
// redesign page). The header is the page's title: the tool's icon and name, or
// the app's on its doors page. Pressing it opens this app's doors, with the
// other two apps under them. Nothing is fixed to the foot of the screen, so the
// page keeps the whole height, which Cards and the Sketchpad need. On a phone
// the doors slide up as a sheet; on a computer they drop down under the title.
//
// Moving to another app is a plain <a>: on the apps' own addresses that page
// belongs to another origin (worker/apps.ts forwards it), and next/link would
// try to prefetch it from this one.

export default function WorkHeader() {
  const path = usePathname();
  const app = appForPath(path) ?? WORK_APPS[0];
  const here = toolFor(path);
  const others = WORK_APPS.filter((candidate) => candidate.key !== app.key);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);

  // A new page closes the doors: the press that opened them was to go there.
  // Setting state during render on a changed key, React's own pattern for
  // resetting on a prop change, rather than an effect that paints twice.
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={styles.header}>
      <button
        ref={button}
        type="button"
        className={styles.title}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((was) => !was)}
      >
        <span className={styles.mark}>{here ? <DoorIcon tool={here.key} /> : <AppIcon app={app.key} />}</span>
        <span className={styles.name}>{here?.name ?? app.name}</span>
        <span className={styles.caret} aria-hidden="true" />
      </button>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />}

      <nav id={panelId} className={styles.panel} hidden={!open} aria-label={`${app.name} and the other apps`}>
        <span className={styles.grab} aria-hidden="true" />
        <Link href={app.home} className={styles.appHome}>
          {app.name}
        </Link>
        <ul className={styles.doors}>
          {app.tools.map((tool) => {
            const face = (
              <>
                <DoorIcon tool={tool.key} />
                <span>{tool.name}</span>
              </>
            );
            const current = here?.key === tool.key;
            return (
              <li key={tool.key}>
                {tool.outside ? (
                  <a className={styles.door} href={tool.href} title={tool.what}>
                    {face}
                  </a>
                ) : (
                  <Link
                    className={styles.door}
                    href={tool.href}
                    title={tool.what}
                    aria-current={current ? 'page' : undefined}
                  >
                    {face}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <ul className={styles.apps}>
          {others.map((other) => (
            <li key={other.key}>
              <a href={other.home}>
                <AppIcon app={other.key} />
                <span>{other.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
