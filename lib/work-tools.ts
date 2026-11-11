// The backend's apps and their tools, and the only list of them.
//
// Since 2026-11-10 the backend is three apps, each on its own address and each
// installed on his phone with its own icon (his ruling): admin runs the site,
// the shop and the business; learn is everything being studied; tools is his
// own productivity tools. Each app opens on its own page of doors, one door per
// tool, and a new tool is a new door.
//
// Everything that has to agree reads this list: the doors pages, the backend
// header, and the Worker (worker/apps.ts), which serves an app's address only
// the pages and APIs listed for it here. A page or API missing from an app's
// list answers "not found" on that address, so adding a tool means adding it
// here, or it will not open in its app.
//
// The pages keep their /work/... paths. An installed app shows no address bar,
// and keeping the paths keeps every link, editor and API as it was. Since
// 2026-11-10 masterroachi.com/work/... forwards each page to its app.
//
// Clients leads off the site: the CRM is its own Worker on its own subdomain
// behind its own Access app. Outside links are plain <a>, never next/link,
// which would try to prefetch RSC payloads from a Worker that has none.
//
// Only what exists. A door to a page that is not built is a bug report.

export type WorkAppKey = 'admin' | 'learn' | 'tools';

export type ToolKey =
  | 'shop'
  | 'projects'
  | 'writing'
  | 'boards'
  | 'clients'
  | 'curriculums'
  | 'cards'
  | 'reading'
  | 'habits'
  | 'sketchpad'
  | 'kame'
  | 'ohana';

export interface WorkTool {
  key: ToolKey;
  href: string;
  name: string;
  /** One line, under the door. The header shows names only. */
  what: string;
  /** Another origin: a plain <a>, never next/link. */
  outside?: boolean;
}

export interface WorkApp {
  key: WorkAppKey;
  /** As it appears on the phone, under the icon. */
  name: string;
  what: string;
  /** The app's own address. */
  host: string;
  /** Its doors page, where the installed app opens. */
  home: string;
  /**
   * The app's colour, as each section of the public site has its own (his
   * call, 2026-11-10: the backend takes the site's design). It becomes the
   * accent on every page of the app: Admin the site's gold, Learn the blue of
   * Thoughts, Tools the teal of Hire me.
   */
  accent: string;
  tools: WorkTool[];
  /**
   * The /work/api endpoints (and the two older private routes) this app's
   * pages call. Read from the pages themselves on 2026-11-10; anything not
   * here is refused on this app's address.
   */
  apis: string[];
  /**
   * Public pages this app's editors preview in a frame, as /projects/<slug>/?preview=1.
   * The frame has to be on the app's own address: the editor posts the draft
   * only to its own origin, and the public site refuses to be framed from
   * anywhere else. Served here only with ?preview=1; without it they forward
   * to masterroachi.com as any public page does.
   */
  previews?: string[];
}

export const WORK_APPS: WorkApp[] = [
  {
    key: 'admin',
    name: 'Admin',
    what: 'The site, the shop and the business.',
    host: 'admin.masterroachi.com',
    home: '/work/',
    accent: 'oklch(82% 0.16 85)',
    tools: [
      { key: 'shop', href: '/work/shop/', name: 'Shop', what: 'Orders, and what each design is in your own words.' },
      { key: 'projects', href: '/work/projects/', name: 'Projects', what: 'The project pages behind /projects.' },
      { key: 'writing', href: '/work/writing/', name: 'Writing', what: 'Posts. Editing one commits it, and the commit publishes it.' },
      { key: 'boards', href: '/work/boards/', name: 'Boards', what: 'What is next across Trello, and the day job.' },
      {
        key: 'clients',
        href: 'https://clients.masterroachi.com/',
        name: 'Clients',
        // The CRM's four screens since 9 Nov: Today (its home), Pipeline,
        // Accounts and Map. It has no Renewals page.
        what: 'The design business: today, the pipeline, accounts and the map.',
        outside: true,
      },
    ],
    apis: [
      '/api/work',
      '/work/api/content',
      '/work/api/orders',
      '/work/api/store-sync',
      '/work/api/reorder',
      '/work/api/rebuild',
      '/work/api/version',
    ],
    previews: ['/projects/', '/writing/', '/store/'],
  },
  {
    key: 'learn',
    name: 'Learn',
    what: 'Everything being studied.',
    host: 'learn.masterroachi.com',
    home: '/work/learn/',
    accent: 'oklch(74% 0.15 250)',
    tools: [
      { key: 'curriculums', href: '/work/curriculums/', name: 'Curriculums', what: 'What is being studied, and how far through it you are.' },
      { key: 'cards', href: '/work/cards/', name: 'Cards', what: 'What needs reviewing, and nothing else.' },
      { key: 'reading', href: '/work/reading/', name: 'Reading', what: 'What is open, what is next, and what was put down.' },
    ],
    apis: [
      '/work/api/curriculums',
      '/work/api/cards',
      '/work/api/reading',
      '/work/api/library',
      '/work/api/book-cover',
      // A book's notes can become a post.
      '/work/api/content',
      '/work/api/version',
      '/share/ohana',
    ],
  },
  {
    key: 'tools',
    name: 'Tools',
    what: 'Your own tools for the day.',
    host: 'tools.masterroachi.com',
    home: '/work/tools/',
    accent: 'oklch(80% 0.12 190)',
    tools: [
      { key: 'habits', href: '/work/habits/', name: 'Habits', what: 'What got done, and what did not.' },
      { key: 'sketchpad', href: '/work/sketchpad/', name: 'Sketchpad', what: 'Write and draw on one page. Saved as one file.' },
      // Its own Worker on its own address, behind its own Access app, as
      // Clients is (his go, 2026-11-11).
      {
        key: 'kame',
        href: 'https://kame.masterroachi.com/',
        name: 'Kame',
        what: 'Focus blocks, on their own address.',
        outside: true,
      },
      // Omega's, on its own address behind its own Access app, as Kame is
      // (his ask, 2026-11-11). The tools app is behind Access too, so this
      // door is not on the public site.
      {
        key: 'ohana',
        href: 'https://ohana.masterroachi.com/',
        name: 'Ohana',
        what: 'For the two of you, on its own address.',
        outside: true,
      },
    ],
    apis: [
      '/work/api/habits',
      // Sketches are saved as files, and the sketchpad reads the shelf.
      '/work/api/content',
      '/work/api/reading',
      '/work/api/version',
    ],
  },
];

const trim = (path: string) => path.replace(/\/+$/, '');

/** The app a backend page belongs to: its home, or one of its tools. */
export function appForPath(path: string): WorkApp | null {
  const here = trim(path);
  return (
    WORK_APPS.find(
      (app) => trim(app.home) === here || app.tools.some((t) => !t.outside && trim(t.href) === here),
    ) ?? null
  );
}

/** The app served at a hostname, or null for anywhere else. */
export function appForHost(hostname: string): WorkApp | null {
  return WORK_APPS.find((app) => app.host === hostname) ?? null;
}

/** The tool a path is, for the header's "you are here". */
export function toolFor(path: string): WorkTool | null {
  const here = trim(path);
  for (const app of WORK_APPS) {
    const tool = app.tools.find((t) => !t.outside && trim(t.href) === here);
    if (tool) return tool;
  }
  return null;
}
