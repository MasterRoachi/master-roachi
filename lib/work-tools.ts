// The backend's own pages, and the only list of them.
//
// It lived in app/work/page.tsx, which was fine while the work home was the
// only thing that linked to them. The backend has its own header now — the
// site's nav and footer are hidden under /work — so two places need this list
// and neither should be the one that happens to own it.
//
// GROUPED, because a dozen links in one list is a dozen things to read every
// time you want one of them, and they are not of a kind: three edit the public
// site, three are study, three are the day's own admin, and three are the
// design business. The home page is four doors and the header is the same
// four, so the grouping is the structure and not a heading printed over a flat
// list.
//
// THE FOURTH DOOR LEADS OFF THE SITE. The client CRM is its own Worker on its
// own subdomain behind its own Access app, so that nothing on this origin can
// reach it — one XSS here would otherwise be able to read it. Its tools are
// absolute links marked `outside`, rendered as a plain <a>: next/link would
// try to prefetch RSC payloads from a Worker that has none.
//
// Only what exists. A link to a page that is not built is a bug report.

export interface WorkTool {
  href: string;
  name: string;
  /** One line, for the panel a door opens. The header shows names only. */
  what: string;
  /** Another origin: a plain <a>, never next/link. */
  outside?: boolean;
}

export interface WorkSection {
  /** Stable, for `data-` hooks and panel ids. */
  key: 'site' | 'studies' | 'admin' | 'clients';
  name: string;
  /** What the three under it have in common. One short line: it is an
   *  eyebrow over the open panel, not a sentence. */
  what: string;
  /** Where the eyebrow itself leads, if anywhere — an outside link. */
  href?: string;
  tools: WorkTool[];
}

export const WORK_SECTIONS: WorkSection[] = [
  {
    key: 'site',
    name: 'Site',
    what: 'The public side of the site.',
    tools: [
      {
        href: '/work/shop/',
        name: 'Shop',
        what: 'Orders, and what each design is in your own words.',
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
  {
    key: 'clients',
    name: 'Clients',
    what: 'The design business.',
    href: 'https://clients.masterroachi.com/',
    tools: [
      {
        href: 'https://clients.masterroachi.com/pipeline/',
        name: 'Pipeline',
        what: 'Prospects, and who to follow up.',
        outside: true,
      },
      {
        href: 'https://clients.masterroachi.com/accounts/',
        name: 'Accounts',
        what: 'Clients, their sites and their care plans.',
        outside: true,
      },
      {
        href: 'https://clients.masterroachi.com/renewals/',
        name: 'Renewals',
        what: 'Domains, billing and uptime coming due.',
        outside: true,
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
