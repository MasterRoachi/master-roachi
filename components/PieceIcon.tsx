// A mark and a colour for each kind of piece, keyed off its first tag.
//
// The Odin deck is twenty-four cards that otherwise look identical, and a
// number in the corner is not much to tell them apart by. The tag already says
// what kind of exercise each one is — layout, state, testing, a data structure
// — so it decides the mark and the colour too.
//
// Drawn here rather than pulled from an icon set: none of these are brands.
// "State" and "Algorithms" have no logo, and inventing one would be worse than
// a plain glyph that says what it means.

export interface PieceKind {
  colour: string;
  path: React.ReactNode;
}

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 } as const;

const KINDS: Record<string, PieceKind> = {
  html: {
    colour: 'oklch(72% 0.17 40)',
    path: (
      <>
        <path {...S} strokeLinecap="round" d="M9 8 5 12l4 4" />
        <path {...S} strokeLinecap="round" d="m15 8 4 4-4 4" />
      </>
    ),
  },
  flexbox: {
    colour: 'oklch(74% 0.15 250)',
    path: (
      <>
        <rect {...S} x="4" y="5" width="4.5" height="14" rx="1" />
        <rect {...S} x="9.75" y="5" width="4.5" height="14" rx="1" />
        <rect {...S} x="15.5" y="5" width="4.5" height="14" rx="1" />
      </>
    ),
  },
  'css grid': {
    colour: 'oklch(74% 0.15 250)',
    path: (
      <>
        <rect {...S} x="4" y="4" width="7" height="7" rx="1" />
        <rect {...S} x="13" y="4" width="7" height="7" rx="1" />
        <rect {...S} x="4" y="13" width="7" height="7" rx="1" />
        <rect {...S} x="13" y="13" width="7" height="7" rx="1" />
      </>
    ),
  },
  dom: {
    colour: 'oklch(72% 0.17 300)',
    path: (
      <>
        <rect {...S} x="9.5" y="3" width="5" height="4" rx="1" />
        <rect {...S} x="3" y="17" width="5" height="4" rx="1" />
        <rect {...S} x="16" y="17" width="5" height="4" rx="1" />
        <path {...S} d="M12 7v5m0 0H5.5V17M12 12h6.5V17" />
      </>
    ),
  },
  logic: {
    colour: 'oklch(80% 0.15 85)',
    path: (
      <>
        <rect {...S} x="4" y="3" width="16" height="18" rx="2" />
        <path {...S} strokeLinecap="round" d="M8 8h8M8 13h3M13 13h3M8 17h3M13 17h3" />
      </>
    ),
  },
  forms: {
    colour: 'oklch(76% 0.13 195)',
    path: (
      <>
        <rect {...S} x="3" y="6" width="18" height="5" rx="1.5" />
        <rect {...S} x="3" y="14" width="12" height="5" rx="1.5" />
        <path {...S} strokeLinecap="round" d="M18 16.5h3" />
      </>
    ),
  },
  state: {
    colour: 'oklch(80% 0.17 145)',
    path: (
      <>
        <circle {...S} cx="12" cy="12" r="7.5" />
        <path {...S} strokeLinecap="round" d="M12 7.5V12l3 2" />
      </>
    ),
  },
  objects: {
    colour: 'oklch(80% 0.17 145)',
    path: (
      <>
        <path {...S} strokeLinejoin="round" d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path {...S} strokeLinejoin="round" d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </>
    ),
  },
  modules: {
    colour: 'oklch(70% 0.16 275)',
    path: (
      <>
        <rect {...S} x="3" y="3" width="8" height="8" rx="1.5" />
        <rect {...S} x="13" y="3" width="8" height="8" rx="1.5" />
        <rect {...S} x="3" y="13" width="8" height="8" rx="1.5" />
        <rect {...S} x="13" y="13" width="8" height="8" rx="1.5" />
      </>
    ),
  },
  async: {
    colour: 'oklch(80% 0.13 220)',
    path: (
      <>
        <path
          {...S}
          strokeLinecap="round"
          d="M6.5 18.5A4.5 4.5 0 0 1 7 9.6a5.5 5.5 0 0 1 10.6-1.2A4 4 0 0 1 18 18.5Z"
        />
      </>
    ),
  },
  api: {
    colour: 'oklch(80% 0.13 220)',
    path: (
      <>
        <circle {...S} cx="12" cy="12" r="8.5" />
        <path {...S} d="M3.5 12h17M12 3.5a13 13 0 0 1 0 17a13 13 0 0 1 0-17Z" />
      </>
    ),
  },
  testing: {
    colour: 'oklch(84% 0.19 130)',
    path: (
      <>
        <path {...S} strokeLinecap="round" strokeLinejoin="round" d="m4 12.5 5 5L20 6.5" />
      </>
    ),
  },
  tdd: {
    colour: 'oklch(84% 0.19 130)',
    path: (
      <>
        <path {...S} strokeLinecap="round" strokeLinejoin="round" d="m4 12.5 5 5L20 6.5" />
      </>
    ),
  },
  'data structures': {
    colour: 'oklch(72% 0.17 320)',
    path: (
      <>
        <circle {...S} cx="12" cy="5" r="2.5" />
        <circle {...S} cx="5.5" cy="19" r="2.5" />
        <circle {...S} cx="18.5" cy="19" r="2.5" />
        <path {...S} d="M10.5 7.2 7 16.6M13.5 7.2 17 16.6" />
      </>
    ),
  },
  algorithms: {
    colour: 'oklch(74% 0.19 15)',
    path: (
      <>
        <path
          {...S}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 19h4a4 4 0 0 0 4-4V9a4 4 0 0 1 4-4h4"
        />
        <path {...S} strokeLinecap="round" strokeLinejoin="round" d="m17 2.5 3 2.5-3 2.5" />
      </>
    ),
  },
  react: {
    colour: 'oklch(82% 0.12 210)',
    path: (
      <>
        <circle {...S} cx="12" cy="12" r="2" />
        <ellipse {...S} cx="12" cy="12" rx="9.5" ry="3.8" />
        <ellipse {...S} cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
        <ellipse {...S} cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
      </>
    ),
  },
  sql: {
    colour: 'oklch(76% 0.14 235)',
    path: (
      <>
        <ellipse {...S} cx="12" cy="6" rx="7.5" ry="3" />
        <path {...S} d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
        <path {...S} d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
      </>
    ),
  },
  sqlite: {
    colour: 'oklch(76% 0.14 235)',
    path: (
      <>
        <ellipse {...S} cx="12" cy="6" rx="7.5" ry="3" />
        <path {...S} d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
        <path {...S} d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
      </>
    ),
  },
  'node.js': {
    colour: 'oklch(78% 0.16 140)',
    path: (
      <>
        <path {...S} strokeLinejoin="round" d="m12 2.5 8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4L12 2.5Z" />
        <path {...S} strokeLinecap="round" d="M9 15V9l6 6V9" />
      </>
    ),
  },
};

/** Falls back to a plain document mark rather than nothing. */
const FALLBACK: PieceKind = {
  colour: 'oklch(78% 0.02 260)',
  path: (
    <>
      <path {...S} strokeLinejoin="round" d="M6 3h8l4 4v14H6V3Z" />
      <path {...S} strokeLinejoin="round" d="M14 3v4h4" />
    </>
  ),
};

export function kindFor(tags?: string[]): PieceKind {
  for (const tag of tags ?? []) {
    const hit = KINDS[tag.toLowerCase()];
    if (hit) return hit;
  }
  return FALLBACK;
}

export default function PieceIcon({ tags }: { tags?: string[] }) {
  const kind = kindFor(tags);
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {kind.path}
    </svg>
  );
}
