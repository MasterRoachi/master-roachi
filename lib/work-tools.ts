// The backend's own pages, and the only list of them.
//
// It lived in app/work/page.tsx, which was fine while the work home was the
// only thing that linked to them. The backend has its own header now — the
// site's nav and footer are hidden under /work — so two places need this list
// and neither should be the one that happens to own it.
//
// Only what exists. A link to a page that is not built is a bug report.

export interface WorkTool {
  href: string;
  name: string;
  /** One line, for the home page. The header shows names only. */
  what: string;
}

export const WORK_TOOLS: WorkTool[] = [
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
    href: '/work/reading/',
    name: 'Reading',
    what: 'What is open, what is next, and what was put down.',
  },
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
    href: '/work/sketchpad/',
    name: 'Sketchpad',
    what: 'Write and draw on one page. Saved as one file.',
  },
  {
    href: '/work/writing/',
    name: 'Writing',
    what: 'Posts. Editing one commits it, and the commit publishes it.',
  },
  {
    href: '/work/projects/',
    name: 'Projects',
    what: 'The project pages behind /projects.',
  },
  {
    href: '/work/store/',
    name: 'Product copy',
    what: 'What each design is, in your own words.',
  },
];
