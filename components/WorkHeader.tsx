'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appForPath, toolFor, WORK_APPS, type ToolKey, type WorkApp } from '@/lib/work-tools';
import DoorIcon, { AppIcon } from '@/app/work/DoorIcon';
import { COUNTS } from '@/app/work/home/sources';
import Logo from '@/components/Logo';
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
//
// A SIDEBAR ON A COMPUTER (his call, 2026-11-10: "the dashboard like layout of
// the newest clients preview ... is the kind of layout i want for desktop").
// From 900px the title button and its doors give way to a fixed sidebar the
// way the CRM has one: the app's name, Dashboard, each tool with the count of
// what is waiting behind it, and the other apps at the foot. The page's own
// title then sits above the page (DeskTitle below). The phone keeps the title
// button; the two are drawn from one component and CSS shows one of them.

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
    <>
    <SideNav app={app} here={here?.key ?? null} atHome={!here} />
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
    </>
  );
}

/** The counts beside the tools, read once per page from home/sources.ts. */
function useCounts(app: WorkApp): Partial<Record<ToolKey, number>> {
  const [counts, setCounts] = useState<Partial<Record<ToolKey, number>>>({});
  useEffect(() => {
    let alive = true;
    for (const tool of app.tools) {
      const count = COUNTS[tool.key];
      if (!count) continue;
      void count()
        .catch(() => null)
        .then((n) => {
          if (alive && n !== null) setCounts((was) => ({ ...was, [tool.key]: n }));
        });
    }
    return () => {
      alive = false;
    };
  }, [app]);
  return counts;
}

/** Late is red, as the Boards page has it; every other count is plain. */
const RED: ToolKey[] = ['boards'];

/**
 * The nav sheens, in DESIGN.md's order: each link in the sidebar lights in
 * its own colour, as the site's nav does (his ruling, 11 Nov). Decoration
 * only; state is the app's --accent and the meaning colours.
 */
const SHEENS = [
  'oklch(97% 0 0)',
  'oklch(86% 0.2 135)',
  'oklch(84% 0.16 92)',
  'oklch(72% 0.26 350)',
  'oklch(74% 0.15 250)',
  'oklch(80% 0.12 190)',
  'oklch(76% 0.17 55)',
];
const sheen = (at: number) => ({ '--sheen': SHEENS[at % SHEENS.length] }) as CSSProperties;

/** Where the pointer is over a link, for the sheen's light (Nav.tsx's way). */
function trackSheen(event: ReactPointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${event.clientX - r.left}px`);
  el.style.setProperty('--my', `${event.clientY - r.top}px`);
}

function SideNav({ app, here, atHome }: { app: WorkApp; here: ToolKey | null; atHome: boolean }) {
  const counts = useCounts(app);
  const others = WORK_APPS.filter((candidate) => candidate.key !== app.key);
  return (
    <aside className={styles.side}>
      {/* The brand block (DESIGN.md, the frame): the mark, the app's own name
          in the wordmark face, and "Master Roachi ↗" under it, back to the
          public site. The same block as the CRM's and Kame's. */}
      <a className={styles.brand} href="https://masterroachi.com/" title="masterroachi.com">
        <Logo size={30} />
        <span className={styles.brandText}>
          <span className={styles.wordmark}>{app.name}</span>
          <span className={styles.brandBack}>Master Roachi ↗</span>
        </span>
      </a>
      <nav aria-label={app.name}>
        <ul className={styles.sideList}>
          <li>
            <Link href={app.home} aria-current={atHome ? 'page' : undefined} style={sheen(0)} onPointerMove={trackSheen}>
              <span className={styles.sheen}>Dashboard</span>
            </Link>
          </li>
          {app.tools.map((tool, at) => {
            const n = counts[tool.key];
            const badge = n ? (
              <span className={RED.includes(tool.key) ? styles.countBad : styles.count}>{n}</span>
            ) : null;
            return (
              <li key={tool.key}>
                {tool.outside ? (
                  <a href={tool.href} style={sheen(at + 1)} onPointerMove={trackSheen}>
                    <span className={styles.sheen}>{tool.name} ↗</span>
                  </a>
                ) : (
                  <Link
                    href={tool.href}
                    aria-current={here === tool.key ? 'page' : undefined}
                    style={sheen(at + 1)}
                    onPointerMove={trackSheen}
                  >
                    <span className={styles.sheen}>{tool.name}</span>
                    {badge}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <ul className={styles.sideApps}>
        {others.map((other) => (
          <li key={other.key}>
            <a href={other.home}>
              <AppIcon app={other.key} />
              <span>{other.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * The page's title on a computer, above the page: the site's page header
 * (see the return), with the date on the right as the CRM has it. On a dashboard the line is how much needs him across the app's
 * tools (the sidebar's counts added up); on a tool it is what the tool is for.
 * Hidden on a phone, where the header is the title.
 */
export function DeskTitle() {
  const path = usePathname();
  const app = appForPath(path) ?? WORK_APPS[0];
  const here = toolFor(path);
  const counts = useCounts(app);
  const [today, setToday] = useState('');
  // The date is the browser's, so it is read after mount: the page is built
  // once, ahead of time, and a date baked into it would be the build's.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once, from the clock.
    setToday(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);
  const waiting = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  // The page head (DESIGN.md, the frame): the eyebrow in the app's colour,
  // the title in heavy Archivo and a line under it, as the CRM and Kame
  // have it. No icon above, so the three read the same.
  return (
    <div className={styles.desk}>
      <div>
        <p className={`eyebrow ${styles.deskEyebrow}`}>{app.name}</p>
        <h1 className={styles.deskName}>{here?.name ?? 'Dashboard'}</h1>
        {here ? (
          <p className={styles.deskLine}>{here.what}</p>
        ) : waiting > 0 ? (
          <p className={styles.deskWaiting}>{waiting} need you now</p>
        ) : (
          <p className={styles.deskLine}>{app.what}</p>
        )}
      </div>
      <p className={styles.deskDate}>{today}</p>
    </div>
  );
}
