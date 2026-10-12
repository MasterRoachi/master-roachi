// An icon per curriculum, matched on its name.
//
// Matched on KEYWORDS rather than stored, for the same reason the card colour
// and the pile's scatter are derived: a new curriculum should look like
// something without anyone choosing an icon for it. Anything unrecognised gets
// a book, which is what most study is.
//
// Drawn as inline paths on a 24-unit grid, in currentColor, so each one takes
// the colour of whatever it sits in. The site has an icon set already
// (lib/habit-icons.ts) and none of it fits: a piano is not a music note and a
// torii is not a book.
//
// WHICH icon a name gets lives in lib/curriculum-icons.ts, so the matching can
// be tested without bundling JSX to ask it a question.

import { ICON_TITLES, iconFor, type IconKey } from '@/lib/curriculum-icons';

const PATHS: Record<IconKey, React.ReactNode> = {
  // Keys, white and black, as a keyboard seen head on.
  piano: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="1.5" />
      <path d="M6.5 6v7M11 6v7M15.5 6v7M20 6v7" />
      <path d="M4.6 6v4.5h1.8V6M9.1 6v4.5h1.8V6M13.6 6v4.5h1.8V6M18.1 6v4.5h1.8V6" fill="currentColor" />
    </>
  ),
  // A torii, which says Japanese without needing a font that has the glyphs.
  torii: (
    <>
      <path d="M3 6h18M4.5 9h15" />
      <path d="M7 9v11M17 9v11" />
      <path d="M2 6c1.6-1.4 4.4-2 10-2s8.4.6 10 2" />
    </>
  ),
  // A fluted column with its capital.
  column: (
    <>
      <path d="M4 5h16M6 8h12M6 19h12M3.5 21h17" />
      <path d="M8 8v11M12 8v11M16 8v11" />
    </>
  ),
  // A raven's head, for Odin. Simplified because a whole bird is a smudge at
  // this size.
  raven: (
    <>
      <path d="M7 17c-2.2-1-3.5-3-3.5-5.4C3.5 7.9 6.6 5 10.5 5c3.2 0 5.3 1.7 6.2 3.6L21 10l-3.2 1.3" />
      <path d="M10.5 19h7" />
      <circle cx="9.2" cy="9.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  controller: (
    <>
      <path d="M7.5 8h9a5.5 5.5 0 0 1 5.5 5.5A4.5 4.5 0 0 1 17.5 18c-1.6 0-2.4-1-3-1.6-.6-.6-1.3-.9-2.5-.9s-1.9.3-2.5.9C8.9 17 8.1 18 6.5 18A4.5 4.5 0 0 1 2 13.5A5.5 5.5 0 0 1 7.5 8Z" />
      <path d="M7 11.2v2.6M5.7 12.5h2.6M16.4 12h.02M18.2 13.8h.02" />
    </>
  ),
  pixels: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      <path d="M9 9h6v6H9z" fill="currentColor" stroke="none" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l1.2-4.2L16.4 4.6a2 2 0 0 1 2.8 2.8L8.2 18.8 4 20Z" />
      <path d="M14.8 6.2l3 3" />
    </>
  ),
  // The national flower, for South African politics. A flag at 24px is a
  // smudge; a protea is a shape.
  protea: (
    <>
      <path d="M12 21v-6" />
      <path d="M12 15c-3.3 0-6-2.4-6-5.4C6 6.6 8.7 4 12 4s6 2.6 6 5.6c0 3-2.7 5.4-6 5.4Z" />
      <path d="M12 15V4M6.6 7.2l10.8 4.6M17.4 7.2L6.6 11.8" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5.5A1.5 1.5 0 0 1 4 18.5Z" />
      <path d="M8 4v16" />
    </>
  ),
};

export default function CurriculumIcon({
  name,
  className,
  size = 40,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const key = iconFor(name);

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={ICON_TITLES[key]}
    >
      {PATHS[key]}
    </svg>
  );
}
