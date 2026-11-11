import type { ToolKey, WorkAppKey } from '@/lib/work-tools';

// One mark per door, on the same 24-unit grid and in currentColor as every
// other icon in here (components/LaptopIcon.tsx, components/CurriculumIcon.tsx)
// so the door's black ink carries the icon with it.
//
// Drawn rather than fetched for the reason given on the other two: the icon set
// the site carries is simple-icons, which is brands and nothing else.
//
// Since 2026-11-10 a door is a tool rather than a group of them, so there is a
// mark per tool, plus one per app for the row that switches between apps.

const TOOLS: Record<ToolKey, React.ReactNode> = {
  // A T-shirt: the shop sells shirts.
  shop: <path d="M8.5 3.5L4 6l1.8 4 2-1v11.5h8.4V9l2 1L20 6l-4.5-2.5c-.6 1.3-1.9 2-3.5 2s-2.9-.7-3.5-2z" />,
  // A browser window with a line of copy in it: the public pages.
  projects: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M2.5 8.5h19" />
      <path d="M5.4 6.25h.01M8 6.25h.01" />
      <path d="M6 12.5h8M6 16h5.5" />
    </>
  ),
  // A pen nib writing a line.
  writing: (
    <>
      <path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" />
      <path d="M13.5 6.5l4 4" />
      <path d="M13 20.5h7" />
    </>
  ),
  // Three columns of cards, as a board is.
  boards: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M15 4v16" />
      <path d="M5 7.5h2M11 7.5h2M17 7.5h2M5 10.5h2M11 10.5h2" />
    </>
  ),
  // A briefcase: the business, kept apart from the rest.
  clients: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12.5h18" />
      <path d="M11 12.5v1.5h2v-1.5" />
    </>
  ),
  // An open book, the stroke down the middle keeping it from reading as a sheet.
  curriculums: (
    <>
      <path d="M12 6.4v13" />
      <path d="M12 6.4C10.3 5 7.9 4.4 4 4.4v12.8c3.9 0 6.3.6 8 2" />
      <path d="M12 6.4c1.7-1.4 4.1-2 8-2v12.8c-3.9 0-6.3.6-8 2" />
    </>
  ),
  // Two flashcards, one behind the other.
  cards: (
    <>
      <rect x="6.5" y="3.5" width="12" height="15" rx="1.8" />
      <path d="M4.5 7.5v11a2 2 0 0 0 2 2h9" />
      <path d="M9.5 9.5h6M9.5 12.5h4" />
    </>
  ),
  // Books standing on a shelf, one leaning.
  reading: (
    <>
      <path d="M3 20.5h18" />
      <rect x="4.5" y="5" width="3.5" height="15.5" rx=".6" />
      <rect x="9" y="7" width="3.5" height="13.5" rx=".6" />
      <path d="M14.2 8.6l3.3-1 3.4 12.9-3.3.9z" />
    </>
  ),
  // A month with one day ticked.
  habits: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M9 15l2 2 4-4.5" />
    </>
  ),
  // A pencil over a page with a line drawn on it.
  sketchpad: (
    <>
      <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4H14" />
      <path d="M7 16c2-3 4-3 5.5-1.5" />
      <path d="M19.5 6.5l-8 8-2.5.5.5-2.5 8-8a1.4 1.4 0 0 1 2 2z" />
    </>
  ),
  // A focus dial: a ring, its top mark, and a hand part-way round.
  kame: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 2.5v2.5M10 2.5h4" />
      <path d="M12 13l3.5-3.5" />
    </>
  ),
  // A roof over a heart: home, and the people in it.
  ohana: (
    <>
      <path d="M3.5 11L12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M12 17.5s-3-1.8-3-3.6a1.5 1.5 0 0 1 3-.4 1.5 1.5 0 0 1 3 .4c0 1.8-3 3.6-3 3.6z" />
    </>
  ),
};

/** The app marks, after their phone icons: keys, an open book, an hourglass. */
const APPS: Record<WorkAppKey, React.ReactNode> = {
  admin: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l8.5 8.5M16 16.5l1.8-1.8M18.2 18.7l1.6-1.6" />
    </>
  ),
  learn: TOOLS.curriculums,
  tools: (
    <>
      <path d="M6.5 3.5h11M6.5 20.5h11" />
      <path d="M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5" />
    </>
  ),
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative: the door's own title names it, right underneath.
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export default function DoorIcon({ tool }: { tool: ToolKey }) {
  return <Icon>{TOOLS[tool]}</Icon>;
}

export function AppIcon({ app }: { app: WorkAppKey }) {
  return <Icon>{APPS[app]}</Icon>;
}
