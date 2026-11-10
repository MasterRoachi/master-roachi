'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Starfield from '@/components/Starfield';
import { appForPath, WORK_APPS } from '@/lib/work-tools';
import styles from './work.module.css';

// The backend's ground: the public site's, applied here (his call,
// 2026-11-10: "look at the site masterroachi.com ... use its fonts, colors,
// and background etc").
//
// THE APP'S COLOUR IS THE ACCENT. Each section of the public site answers in
// its own colour through --accent-a; each app here does the same, and sets
// --accent and --accent-dim too, so every page of the app (all of them written
// against --accent) takes it without a change of its own.
//
// THE STARFIELD behind everything, at the density the CRM and Kame share
// (0.55 of the site's counts, DESIGN.md): visible, but thinner than the public
// site's, so nothing fights the work for contrast. At 30 fps, and still after
// a minute without input.
//
// THE CARD HOVER (DESIGN.md, .card-link): the site's project cards tilt toward
// the cursor and carry a light that follows it (components/ProjectCard). Here
// one handler on the shell does it for every card that is a link or a button:
// it finds the .card-link under the pointer and sets the same four custom
// properties the site's cards use. Panels that hold forms or lists do not
// move. The styles are in work.module.css.

/** Maximum tilt, in degrees, as the site's cards. */
const TILT = 5;

let lit: HTMLElement | null = null;

function unlight() {
  if (!lit) return;
  for (const p of ['--mx', '--my', '--rx', '--ry']) lit.style.removeProperty(p);
  lit = null;
}

function light(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== 'mouse') return;
  const card = (event.target as HTMLElement).closest<HTMLElement>('.card-link');
  if (card !== lit) unlight();
  if (!card) return;
  lit = card;
  const r = card.getBoundingClientRect();
  const px = (event.clientX - r.left) / r.width;
  const py = (event.clientY - r.top) / r.height;
  card.style.setProperty('--mx', `${event.clientX - r.left}px`);
  card.style.setProperty('--my', `${event.clientY - r.top}px`);
  card.style.setProperty('--ry', `${(px - 0.5) * TILT * 2}deg`);
  card.style.setProperty('--rx', `${(0.5 - py) * TILT * 2}deg`);
}

export default function WorkShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const app = appForPath(path) ?? WORK_APPS[0];
  const style = {
    '--accent': app.accent,
    '--accent-a': app.accent,
    '--accent-dim': `color-mix(in oklch, ${app.accent} 14%, transparent)`,
  } as CSSProperties;
  return (
    <div className={styles.shell} style={style} onPointerMove={light} onPointerLeave={unlight}>
      <div className={styles.sky} aria-hidden="true">
        <Starfield density={0.55} fps={30} idleMs={60_000} />
      </div>
      {children}
    </div>
  );
}
