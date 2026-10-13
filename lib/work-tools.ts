// The backend's own pages, and the only list of them.
//
// It lived in app/work/page.tsx, which was fine while the work home was the
// only thing that linked to them. The backend has its own header now — the
// site's nav and footer are hidden under /work — so two places need this list
// and neither should be the one that happens to own it.
//
// GROUPED, because nine links in one list is nine things to read every time
// you want one of them, and they are not nine of a kind: three edit the public
// site, three are study, three are the day's own admin. The home page is three
// doors and the header is the same three, so the grouping is the structure and
// not a heading printed over a flat list.
//
// Only what exists. A link to a page that is not built is a bug report.

export interface WorkTool {
  href: string;
  name: string;
  /** One line, for the panel a door opens. The header shows names only. */
  what: string;
}

export interface WorkSection {
  /** Stable, for `data-` hooks and panel ids. */
  key: 'site' | 'studies' | 'admin';
  name: string;
  /** What the three under it have in common. One short line: it is an
   *  eyebrow over the open panel, not a sentence. */
  what: string;
  tools: WorkTool[];
}

export const WORK_SECTIONS: WorkSection[] = [
  {
    key: 'site',
    name: 'Site',
    what: 'The public side of the site.',
    tools: [
      {
        href: '/work/store/',
        name: 'Products',
        what: 'What each design is, in your own words.',
      },
      {
        href: '/work/projects/',
        name: 'Projects',
        what: 'The project pages behind /projects.',
      },
      {
        href: '/work/writing/',
        name: 'Writing',
        what: 'Posts. Editing one commits it, and the commit publishes it.',
      },
    ],
  },
  {
    key: 'studies',
    name: 'Studies',
    what: 'What is being learned.',
    tools: [
      {
        href: '/work/curriculums/',
        name: 'Curriculums',
        what: 'What is being studied, and how far through it you are.',
      },
      {
        href: '/work/cards/',
        name: 'Cards',
        what: 'What needs reviewing, and nothing else.',
      },
      {
        href: '/work/reading/',
        name: 'Reading',
        what: 'What is open, what is next, and what was put down.',
      },
    ],
  },
  {
    key: 'admin',
    name: 'Admin',
    what: 'The day itself.',
    tools: [
      {
        href: '/work/boards/',
        name: 'Boards',
        what: 'What is next across Trello, and the day job.',
      },
      {
        href: '/work/habits/',
        name: 'Habits',
        what: 'What got done, and what did not.',
      },
      {
        href: '/work/sketchpad/',
        name: 'Sketchpad',
        what: 'Write and draw on one page. Saved as one file.',
      },
    ],
  },
];

/**
 * The section a path belongs to, or null for the work home itself.
 *
 * Matched with the trailing slash stripped from both sides: trailingSlash is
 * on (next.config.mjs) so a pathname may or may not carry one depending on how
 * the page was reached.
 */
export function sectionFor(path: string): WorkSection | null {
  const here = path.replace(/\/$/, '');
  return (
    WORK_SECTIONS.find((section) =>
      section.tools.some((tool) => tool.href.replace(/\/$/, '') === here),
    ) ?? null
  );
}
