// A sketch: ink and text on one page, saved as one file.
//
// The file is an SVG, and that choice carries the whole design:
//
//   · ONE file. Not a document plus images — what was left on the page is
//     what is in the file.
//   · It renders anywhere. A browser, GitHub's file view, an image viewer,
//     a print dialogue. A proprietary scene format would need this app to be
//     looked at, which is a poor thing to keep notes in.
//   · Text stays TEXT. Flattening to PNG would make every word a pixel —
//     unsearchable, unselectable, and unfixable without redrawing it.
//   · It prints properly, which is where PDF export comes from.
//
// The catch is that an SVG rendered from a scene cannot always be read back
// into that scene exactly: stroke smoothing, text wrapping and grouping are
// all one-way. So the scene is also embedded in the file, in <metadata>,
// where every SVG consumer ignores it and this app can restore the page
// precisely. One file, viewable by anything, and lossless to reopen.

/** The page, in its own coordinates. Everything is positioned inside this. */
export const PAGE = { width: 1600, height: 1200 };

export interface Stroke {
  kind: 'stroke';
  id: string;
  colour: string;
  width: number;
  points: [number, number][];
}

export interface TextItem {
  kind: 'text';
  id: string;
  x: number;
  y: number;
  size: number;
  colour: string;
  text: string;
}

export type Item = Stroke | TextItem;

export interface Scene {
  /** Bumped only if the shape changes in a way an older file would not match. */
  version: 1;
  background: string;
  items: Item[];
}

export function emptyScene(): Scene {
  return { version: 1, background: '#16181d', items: [] };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** XML text escaping. Unescaped, a single ampersand in a note breaks the file. */
function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Round to a sane precision — full float coordinates triple the file size. */
const n = (value: number) => Math.round(value * 10) / 10;

function pathFor(stroke: Stroke): string {
  if (stroke.points.length === 0) return '';
  const [first, ...rest] = stroke.points;
  // A single tap has no line to draw, so it becomes a round dot of its own
  // width — otherwise tapping produces nothing and looks like a dropped input.
  if (rest.length === 0) {
    return `<circle cx="${n(first[0])}" cy="${n(first[1])}" r="${n(stroke.width / 2)}" fill="${xml(stroke.colour)}"/>`;
  }
  const d = `M ${n(first[0])} ${n(first[1])} ` + rest.map((p) => `L ${n(p[0])} ${n(p[1])}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${xml(stroke.colour)}" stroke-width="${n(stroke.width)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function textFor(item: TextItem): string {
  const lines = item.text.split('\n');
  // Each line is a tspan rather than a separate <text>, so the block moves and
  // reads as one thing. 1.35em matches the line-height used while editing, so
  // the saved file looks like what was typed.
  const spans = lines
    .map(
      (line, i) =>
        `<tspan x="${n(item.x)}" dy="${i === 0 ? 0 : n(item.size * 1.35)}">${xml(line) || ' '}</tspan>`,
    )
    .join('');
  return `<text x="${n(item.x)}" y="${n(item.y)}" fill="${xml(item.colour)}" font-size="${n(item.size)}" font-family="Archivo, ui-sans-serif, system-ui, sans-serif" style="white-space:pre">${spans}</text>`;
}

/**
 * The scene as a standalone SVG file.
 *
 * The metadata block holds the scene verbatim. JSON can contain the one
 * sequence CDATA cannot carry, so `]]>` is split across the boundary — a
 * detail that only matters once, and silently truncates the file if missed.
 */
export function toSvg(scene: Scene): string {
  const body = scene.items
    .map((item) => (item.kind === 'stroke' ? pathFor(item) : textFor(item)))
    .join('\n  ');

  const embedded = JSON.stringify(scene).replace(/]]>/g, ']]]]><![CDATA[>');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.width} ${PAGE.height}" width="${PAGE.width}" height="${PAGE.height}">
  <metadata><sketch xmlns="https://masterroachi.com/ns/sketch"><![CDATA[${embedded}]]></sketch></metadata>
  <rect width="${PAGE.width}" height="${PAGE.height}" fill="${xml(scene.background)}"/>
  ${body}
</svg>
`;
}

/**
 * Read a scene back out of a file this wrote.
 *
 * Returns null rather than throwing or guessing. A file that is an SVG but not
 * one of ours — hand-edited, or from somewhere else — has no scene to restore,
 * and opening it as an empty page would invite saving that emptiness over it.
 */
export function fromSvg(svg: string): Scene | null {
  const found = svg.match(/<sketch[^>]*>\s*<!\[CDATA\[([\s\S]*?)]]>\s*<\/sketch>/);
  if (!found) return null;

  try {
    const parsed = JSON.parse(found[1].replace(/]]]]><!\[CDATA\[>/g, ']]>')) as Scene;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) return null;
    return {
      version: 1,
      background: typeof parsed.background === 'string' ? parsed.background : '#16181d',
      items: parsed.items.filter(
        (item) =>
          item &&
          ((item.kind === 'stroke' && Array.isArray(item.points)) ||
            (item.kind === 'text' && typeof item.text === 'string')),
      ),
    };
  } catch {
    return null;
  }
}

/** Nothing on the page. Used to refuse saving a blank file over a real one. */
export function isBlank(scene: Scene): boolean {
  return scene.items.every((item) => item.kind === 'text' && !item.text.trim());
}
