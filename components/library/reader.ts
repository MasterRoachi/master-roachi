// Reading a book: its text, laid out into pages, and where its ribbon lies.
//
// A volume's text is a gzipped file under public/wyggzantium/texts/, one
// paragraph to a line (scripts/wyggzantium-texts.py says how it is made). It is
// fetched the first time the book is opened and laid out to the page the
// textures draw (PAGE in textures.ts), so a page here is exactly a page there.
//
// Pages are numbered as the book is: 0 is the blank flyleaf, 1 the title page,
// and the text starts on 2. A spread k shows pages 2k (left) and 2k + 1
// (right), so spread 0 opens on the title page.

import { PAGE, type PageLine } from './textures';

export interface Volume {
  /** Pages in the book, flyleaf and title page included. */
  count: number;
  /** The lines on page n, or null for the flyleaf and title page. */
  page(n: number): PageLine[] | null;
}

const volumes = new Map<string, Promise<Volume>>();

/** The volume whose text is at `src`: fetched and laid out once, then shared. */
export function loadVolume(src: string): Promise<Volume> {
  let p = volumes.get(src);
  if (!p) {
    p = fetchText(src).then(layOut);
    p.catch(() => volumes.delete(src));
    volumes.set(src, p);
  }
  return p;
}

async function fetchText(src: string) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src}: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // A server may already have undone the gzip (Content-Encoding); only
  // decompress what is still gzip.
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }
  return new TextDecoder().decode(bytes);
}

/** Lays the text out a few thousand paragraphs at a time, so the room keeps moving. */
async function layOut(text: string): Promise<Volume> {
  const g = document.createElement('canvas').getContext('2d')!;
  const widths = new Map<string, number>();
  const measure = (font: string, s: string) => {
    const key = font + '\u0000' + s;
    let w = widths.get(key);
    if (w === undefined) {
      g.font = font;
      w = g.measureText(s).width;
      widths.set(key, w);
    }
    return w;
  };
  const space = (font: string) => measure(font, ' ');

  const pages: PageLine[][] = [];
  let page: PageLine[] = [];
  const room = () => PAGE.lines - page.length;
  const newPage = () => {
    if (page.length) pages.push(page);
    page = [];
  };
  const push = (l: PageLine) => {
    if (!room()) newPage();
    page.push(l);
  };

  /** Breaks words into lines no wider than the text column. */
  const wrap = (words: string[], font: string, indent: number) => {
    const out: { words: string[]; indent: number }[] = [];
    let line: string[] = [];
    let w = indent;
    let first = true;
    for (const word of words) {
      const ww = measure(font, word);
      const add = line.length ? space(font) + ww : ww;
      if (line.length && w + add > PAGE.textW) {
        out.push({ words: line, indent: first ? indent : 0 });
        first = false;
        line = [word];
        w = ww;
      } else {
        line.push(word);
        w += add;
      }
    }
    if (line.length) out.push({ words: line, indent: first ? indent : 0 });
    return out;
  };

  const paras = text.split('\n');
  for (let i = 0; i < paras.length; i++) {
    if (i % 3000 === 2999) await new Promise((r) => setTimeout(r, 0));
    const p = paras[i];
    if (!p) continue;
    if (p === '---') {
      if (page.length) push({ kind: 'rule', text: '' });
      continue;
    }
    if (p.startsWith('# ')) {
      const lines = wrap(p.slice(2).split(' ').filter(Boolean), PAGE.headFont, 0);
      // A heading keeps at least two lines of what follows it on its page.
      if (page.length && room() < lines.length + 3) newPage();
      if (page.length && page.at(-1)!.kind !== 'rule') push({ kind: 'gap', text: '' });
      for (const l of lines) push({ kind: 'head', text: l.words.join(' ') });
      continue;
    }
    const lines = wrap(p.split(' ').filter(Boolean), PAGE.bodyFont, PAGE.indent);
    lines.forEach((l, n) =>
      push({ kind: 'body', text: l.words.join(' '), indent: l.indent, justify: n < lines.length - 1 }),
    );
  }
  newPage();
  return { count: pages.length + 2, page: (n) => (n >= 2 ? (pages[n - 2] ?? []) : null) };
}

// ---- the ribbon ------------------------------------------------------------
// Where each book was left open, kept in this browser only. It is a reader's
// convenience, so a private window or cleared storage simply opens at the start.

const KEY = 'wyggzantium:ribbons';

function ribbons(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

/** The spread a book's ribbon marks: 0, the title page, if it has none. */
export function ribbonAt(id: string) {
  const n = ribbons()[id];
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export function setRibbon(id: string, spread: number) {
  try {
    const all = ribbons();
    if (spread > 0) all[id] = spread;
    else delete all[id];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage refused: the ribbon is simply not kept.
  }
}
