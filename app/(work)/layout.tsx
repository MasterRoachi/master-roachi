import type { ReactNode } from 'react';
import Starfield from '@/components/Starfield';
import WorkTabs from '@/components/WorkTabs';
import WorkHero, { type Tile } from '@/components/WorkHero';
import { getProjects, type Status } from '@/lib/content';
import { STATUS_LABEL } from '@/lib/format';
import styles from './work-tabs.module.css';

// Work and Hire me, one page in three tabs (his ask, 18 Nov 2026; mockup
// https://claude.ai/artifact/NGEkKAJReRVjtqQdzirazF). Each tab is its own
// address, so a link, the printed price sheet (masterroachi.com/hire) and
// Google each land on the right one:
//
//   /projects/        My work
//   /hire/            Websites
//   /hire/software/   Software
//
// Not /work/: that address is the backend's, and the Nav hides itself there.
//
// The layout holds the starfield, the switcher and the hero, so moving
// between tabs re-renders only the panel below, and the hero is one height on
// all three (components/WorkHero.tsx). The switcher sits above every header, at
// the same place on all three, so it never moves when a tab is chosen (his
// rule: the page must not jump). It is not sticky. /projects/<slug>/ is outside this group and
// keeps its own page.
// The four picture tiles beside the two hire tabs' heroes (his picks, 18 Nov
// 2026): the client sites on Websites; on Software, Obedience, the two tools
// he and Timon use (from Greg and Larry's Tools) and Ohana. My work has none:
// its page below already shows the work. A project is named by slug, so a
// renamed or removed one fails the build here rather than leaving a gap; the
// rest are written out, with no page of their own to link to.
type TileSource = { slug: string; label?: string; cover?: string; logo?: boolean } | Tile;

const TILES: Record<string, TileSource[]> = {
  '/hire/': [{ slug: 'prodromos' }, { slug: 'irm-prayer-ropes' }, { slug: 'imprint-knysna' }, { slug: 'fabled-threads' }],
  '/hire/software/': [
    // Its logo rather than the project's placeholder cover (his ask, 18 Nov).
    { slug: 'obedience', cover: '/projects/tile-obedience.webp', logo: true },
    {
      label: 'Tool',
      title: 'Drawing Things',
      status: 'Building',
      cover: '/projects/tile-drawing-things.webp',
      logo: true,
      href: '/projects/greg-and-larrys-tools/',
    },
    {
      label: 'Tool',
      title: 'Making Noise',
      status: 'Building',
      cover: '/projects/tile-making-noise.webp',
      logo: true,
      href: '/projects/greg-and-larrys-tools/',
    },
    // Private: no page and no address to link to. His call to show it, 18 Nov.
    { label: 'App', title: 'Ohana', status: 'In use, private', cover: '/projects/tile-ohana.webp', logo: true },
  ],
};

function hireStatus(status: Status): string {
  if (status === 'released') return 'Live';
  if (status === 'building' || status === 'ongoing') return 'In progress';
  return STATUS_LABEL[status];
}

function tiles(): Record<string, Tile[]> {
  const bySlug = new Map(getProjects().map((e) => [e.slug, e]));
  return Object.fromEntries(
    Object.entries(TILES).map(([tab, list]) => [
      tab,
      list.map((t) => {
        if (!('slug' in t)) return t;
        const e = bySlug.get(t.slug);
        if (!e) throw new Error(`Work hero tile: no project "${t.slug}"`);
        const f = e.frontmatter;
        return {
          label: t.label ?? f.kind ?? 'Project',
          title: f.title,
          // The words the client list used before: a client site reads
          // "In progress" until it is live (his ruling).
          status: hireStatus(f.status ?? 'building'),
          cover: t.cover ?? f.cover,
          logo: t.logo,
          // A project whose home is another page (Fabled Threads: /store/).
          href: f.href ?? `/projects/${t.slug}/`,
        };
      }),
    ]),
  );
}

export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <Starfield density={0.5} />
      <WorkTabs />
      <WorkHero tiles={tiles()} />
      <div className={styles.panel}>{children}</div>
    </div>
  );
}
