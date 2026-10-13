import type { WorkSection } from '@/lib/work-tools';

// One mark per door, on the same 24-unit grid and in currentColor as every
// other icon in here (components/LaptopIcon.tsx, components/CurriculumIcon.tsx)
// so the door's black ink carries the icon with it.
//
// Drawn rather than fetched for the reason given on the other two: the icon set
// the site carries is simple-icons, which is brands and nothing else, and there
// is no logo for "the day's admin".

const PATHS: Record<WorkSection['key'], React.ReactNode> = {
  // A browser window with a line of copy in it — the public side, seen the way
  // a visitor sees it.
  site: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M2.5 8.5h19" />
      <path d="M5.4 6.25h.01M8 6.25h.01" />
      <path d="M6 12.5h8M6 16h5.5" />
    </>
  ),
  // An open book. Most study is reading something, and the stroke down the
  // middle is what keeps it from reading as a folded sheet.
  studies: (
    <>
      <path d="M12 6.4v13" />
      <path d="M12 6.4C10.3 5 7.9 4.4 4 4.4v12.8c3.9 0 6.3.6 8 2" />
      <path d="M12 6.4c1.7-1.4 4.1-2 8-2v12.8c-3.9 0-6.3.6-8 2" />
    </>
  ),
  // A clipboard with two things ticked off it.
  admin: (
    <>
      <path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H15" />
      <rect x="9" y="2.8" width="6" height="3.4" rx="1.1" />
      <path d="M8.6 11.4l1.5 1.5 2.6-2.8" />
      <path d="M8.6 16.4l1.5 1.5 2.6-2.8" />
      <path d="M14.8 11.6h1.8M14.8 16.6h1.8" />
    </>
  ),
};

export default function DoorIcon({ section }: { section: WorkSection['key'] }) {
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
      {PATHS[section]}
    </svg>
  );
}
