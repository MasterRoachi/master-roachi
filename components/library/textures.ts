import { CanvasTexture, NoColorSpace, SRGBColorSpace } from 'three';
import type { Book, Cd } from '@/lib/library';

// Every printed surface in the library is drawn on a canvas: covers, spines,
// booklet and book pages, disc labels and the players' displays. While the
// shelves hold placeholders that is the whole of the artwork; when real covers
// arrive, a cover becomes an image drawn into the same canvas, and nothing
// that uses these textures has to change.

function font() {
  return getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
}

export function canvasTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The colour moved toward white (amt > 0) or black (amt < 0). */
export function shade(hex: string, amt: number) {
  const [r, g, b] = rgb(hex);
  const to = amt > 0 ? 255 : 0;
  const k = Math.abs(amt);
  const m = (v: number) => Math.round(v + (to - v) * k);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

/** Ink that reads on the colour: near-black on light, near-white on dark. */
function inkOn(hex: string) {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#141414' : '#f6f4ef';
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > max && line) {
      g.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = next;
  }
  if (line) g.fillText(line, x, y);
  return y + lh;
}

/** A placeholder cover: the item's colour, a quiet pattern, and its name. */
function drawCover(g: CanvasRenderingContext2D, w: number, h: number, id: string, colour: string, title: string, by: string) {
  const seed = hash(id);
  g.fillStyle = colour;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = shade(colour, seed & 1 ? 0.18 : -0.18);
  g.lineWidth = w * 0.012;
  const style = seed % 3;
  if (style === 0) {
    for (let r = w * 0.08; r < w; r += w * 0.06) {
      g.beginPath();
      g.arc(w * 0.72, h * 0.32, r, 0, Math.PI * 2);
      g.stroke();
    }
  } else if (style === 1) {
    for (let x = -h; x < w; x += w * 0.07) {
      g.beginPath();
      g.moveTo(x, h);
      g.lineTo(x + h, 0);
      g.stroke();
    }
  } else {
    g.fillStyle = shade(colour, -0.25);
    g.beginPath();
    g.arc(w * 0.5, h * 0.42, w * 0.26, 0, Math.PI * 2);
    g.fill();
  }
  // The name and the maker, fitted into the lower half: a long title shrinks
  // and wraps rather than running off the cover or over its maker.
  g.fillStyle = inkOn(colour);
  g.textBaseline = 'alphabetic';
  const x = w * 0.07;
  const maxW = w * 0.86;
  const bottom = h * 0.93;
  const t = fitText(g, title, maxW, h * 0.3, w * 0.075, w * 0.038, '800', font());
  const b = fitText(g, by.toUpperCase(), maxW, h * 0.09, w * 0.042, w * 0.028, '600', font());
  let y = bottom - t.lines.length * t.lineH;
  g.font = b.font;
  b.lines.forEach((l, i) => g.fillText(l, x, y - (b.lines.length - 1 - i) * b.lineH - b.lineH * 0.6));
  g.font = t.font;
  for (const l of t.lines) g.fillText(l, x, (y += t.lineH));
}

/**
 * The largest size from `max` down to `min` at which `text` wraps to fit `maxW`
 * by `maxH`. At the smallest size it is cut to the lines that fit, the last one
 * ending in an ellipsis.
 */
function fitText(
  g: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxH: number,
  max: number,
  min: number,
  weight: string,
  family: string,
  leading = 1.12,
) {
  for (let size = max; ; size = Math.max(min, size * 0.92)) {
    const f = `${weight} ${Math.round(size)}px ${family}`;
    g.font = f;
    const lines = wrapLines(g, text, maxW);
    const lineH = size * leading;
    if (lines.length * lineH <= maxH || size <= min) {
      const fit = Math.max(1, Math.floor(maxH / lineH));
      if (lines.length > fit) {
        lines.length = fit;
        let last = lines[fit - 1];
        while (last && g.measureText(last + '…').width > maxW) last = last.slice(0, -1);
        lines[fit - 1] = last.trimEnd() + '…';
      }
      return { lines, lineH, font: f };
    }
  }
}

/**
 * Cover art from an image file, drawn into a texture once it has loaded: the
 * texture shows its drawn stand-in until then. Images are fetched once each.
 */
const images = new Map<string, Promise<HTMLImageElement>>();
function image(src: string) {
  let p = images.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
}

function withArt(t: CanvasTexture, src: string | undefined, draw: (g: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => void) {
  if (!src) return t;
  image(src).then(
    (img) => {
      const c = t.image as HTMLCanvasElement;
      draw(c.getContext('2d')!, img, c.width, c.height);
      t.needsUpdate = true;
    },
    () => {},
  );
  return t;
}

/** A sleeve's front: its cover art, edge to edge, or a drawn stand-in until it loads. */
export function cdCover(cd: Cd) {
  const t = canvasTexture(512, 512, (g, w, h) => drawCover(g, w, h, cd.id, cd.colour, cd.title, cd.artist));
  return withArt(t, cd.cover, (g, img, w, h) => g.drawImage(img, 0, 0, w, h));
}

/** The tray card seen through the back of the case: the track list. */
export function cdBack(cd: Cd) {
  return canvasTexture(512, 452, (g, w, h) => {
    g.fillStyle = shade(cd.colour, 0.82);
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1a1a';
    g.font = `700 ${Math.round(w * 0.05)}px ${font()}`;
    g.fillText(cd.title, w * 0.08, h * 0.16, w * 0.84);
    g.font = `400 ${Math.round(w * 0.036)}px ${font()}`;
    const step = Math.min(0.06, 0.5 / Math.max(cd.tracks.length, 1));
    g.font = `400 ${Math.round(w * Math.min(0.036, step * 0.6))}px ${font()}`;
    cd.tracks.forEach((t, i) => g.fillText(`${i + 1}.  ${t.title}`, w * 0.08, h * 0.28 + i * w * step, w * 0.84));
    g.fillStyle = '#555';
    g.font = `400 ${Math.round(w * 0.026)}px ${font()}`;
    g.fillText(`${cd.artist}${cd.year ? ` · ${cd.year}` : ''}`, w * 0.08, h * 0.9);
  });
}

/** A spine: the title running top to bottom, the English way. */
export function spine(colour: string, text: string, w = 48, h = 640) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, w, h);
    g.save();
    g.translate(w * 0.5, h * 0.05);
    g.rotate(Math.PI / 2);
    g.fillStyle = inkOn(colour);
    g.font = `700 ${Math.round(w * 0.42)}px ${font()}`;
    g.textBaseline = 'middle';
    g.fillText(text, 0, 0, h * 0.9);
    g.restore();
  });
}

/**
 * The spine every filler on a wall shares: white, with bands and a run of
 * marks where a title would be. Each filler's own colour multiplies it, so
 * one texture serves thousands of spines.
 */
export function fillerSpine(kind: 'cd' | 'dvd' | 'book') {
  return canvasTexture(64, 512, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    if (kind === 'book') {
      g.fillRect(0, h * 0.06, w, h * 0.012);
      g.fillRect(0, h * 0.09, w, h * 0.006);
      g.fillRect(0, h * 0.91, w, h * 0.012);
    } else {
      g.fillRect(0, 0, w, h * 0.04);
      g.fillRect(0, h * 0.96, w, h * 0.04);
    }
    g.fillStyle = 'rgba(0,0,0,0.42)';
    for (let y = h * 0.16; y < h * 0.72; y += h * 0.05) g.fillRect(w * 0.38, y, w * 0.24, h * 0.032);
    g.fillRect(w * 0.3, h * 0.8, w * 0.4, h * 0.05);
  });
}

/** What a DVD case or box set's cover shows. */
export interface CaseFace {
  id: string;
  title: string;
  /** The line under the title: the series a disc belongs to, or a box's count of discs. */
  subtitle: string;
  colour: string;
  cover?: string;
  /** A box set's front has a gold band; a case in it has a disc number. */
  box?: boolean;
  number?: number;
}

/** A DVD case's front: a banner, the cover art in the middle, the title under it. */
export function dvdCover(c: CaseFace) {
  const art = { y: 0.09, h: 0.52 };
  const t = canvasTexture(384, 540, (g, w, h) => {
    g.fillStyle = shade(c.colour, -0.45);
    g.fillRect(0, 0, w, h);
    g.fillStyle = shade(c.colour, -0.2);
    g.fillRect(0, h * art.y, w, w);
    g.fillStyle = c.box ? '#c9a24a' : 'rgba(0,0,0,0.8)';
    g.fillRect(0, 0, w, h * 0.07);
    g.fillStyle = c.box ? '#1b120a' : '#fff';
    g.font = `800 ${Math.round(h * 0.04)}px ${font()}`;
    g.fillText(c.box ? 'DVD · BOX SET' : c.number ? `DVD · DISC ${c.number}` : 'DVD', w * 0.05, h * 0.052);
    g.fillStyle = '#f4ead2';
    g.font = `700 ${Math.round(w * 0.072)}px 'Palatino Linotype', Palatino, Georgia, serif`;
    const y = wrap(g, c.title, w * 0.06, h * (art.y + 0.06) + w, w * 0.88, w * 0.08);
    g.fillStyle = '#d9b45f';
    g.font = `400 ${Math.round(w * 0.042)}px ${font()}`;
    wrap(g, c.subtitle, w * 0.06, y + w * 0.01, w * 0.88, w * 0.05);
  });
  return withArt(t, c.cover, (g, img, w, h) => g.drawImage(img, 0, h * art.y, w, w));
}

export function dvdBack(dvd: { colour: string; title: string; subtitle: string }) {
  return canvasTexture(384, 540, (g, w, h) => {
    g.fillStyle = shade(dvd.colour, -0.35);
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.font = `400 ${Math.round(w * 0.04)}px ${font()}`;
    g.font = `700 ${Math.round(w * 0.05)}px ${font()}`;
    const y = wrap(g, dvd.title, w * 0.08, h * 0.12, w * 0.84, w * 0.06);
    g.font = `400 ${Math.round(w * 0.04)}px ${font()}`;
    wrap(g, dvd.subtitle, w * 0.08, y + w * 0.02, w * 0.84, w * 0.055);
  });
}

export function bookCover(book: Book) {
  return canvasTexture(384, 576, (g, w, h) => drawCover(g, w, h, book.id, book.colour, book.title, book.author));
}

export function bookBack(book: Book) {
  return canvasTexture(384, 576, (g, w, h) => {
    g.fillStyle = shade(book.colour, -0.15);
    g.fillRect(0, 0, w, h);
  });
}

export function pageEdges() {
  return canvasTexture(64, 256, (g, w, h) => {
    g.fillStyle = '#efe9db';
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) {
      g.fillStyle = x % 4 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.25)';
      g.fillRect(x, 0, 1, h);
    }
  });
}

// ---- a book's pages --------------------------------------------------------
// The page a book's text is laid out to (reader.ts) and drawn on (bookPage):
// one set of numbers, so the lines the reader breaks are the lines printed.

const SERIF = 'Georgia, "Times New Roman", "Liberation Serif", "DejaVu Serif", serif';
export const PAGE = {
  w: 640,
  h: 960,
  left: 64,
  top: 104,
  textW: 512,
  lineH: 34,
  lines: 22,
  indent: 28,
  bodyFont: `24px ${SERIF}`,
  headFont: `700 24px ${SERIF}`,
} as const;

/** One line of a laid-out page. */
export interface PageLine {
  kind: 'body' | 'head' | 'rule' | 'gap';
  text: string;
  indent?: number;
  /** Spread to the full width: every line of a paragraph but its last. */
  justify?: boolean;
}

const PAPER = '#f7f3ea';
const INK = '#1d1a16';

/**
 * One page of a book. With `lines` it is that page of the text; page 0 is the
 * blank flyleaf and page 1 the title page. A book with no text (`text` unset)
 * shows grey lines where the text would be; one whose text is still loading
 * shows only its running head and number.
 */
export function bookPage(book: Book, n: number, lines?: PageLine[] | null) {
  return canvasTexture(PAGE.w, PAGE.h, (g, w, h) => {
    g.fillStyle = PAPER;
    g.fillRect(0, 0, w, h);
    if (n === 0) return;
    g.fillStyle = INK;
    if (n === 1) return titlePage(g, w, h, book);
    if (book.text) return textPage(g, w, h, book, n, lines ?? null);
    const seed = hash(`${book.id}:${n}`);
    g.fillStyle = 'rgba(0,0,0,0.5)';
    for (let i = 0, y = h * 0.1; y < h * 0.88; i++, y += h * 0.032) {
      const short = (seed >> i % 24) & 1 && i % 7 === 6;
      g.fillRect(w * 0.12, y, w * (short ? 0.45 : 0.76), h * 0.008);
    }
    g.fillStyle = '#555';
    g.textAlign = 'center';
    g.font = `400 ${Math.round(w * 0.035)}px ${font()}`;
    g.fillText(String(n), w / 2, h * 0.95);
  });
}

/** "Ante-Nicene Fathers, Vol. X: Bibliographic Synopsis" as its set, volume and contents. */
function volumeParts(title: string) {
  const m = title.match(/^(.*?),\s*Vol\.\s*([IVXLC\d]+):\s*(.*)$/);
  return m ? { set: m[1], vol: m[2], contents: m[3] } : { set: '', vol: '', contents: title };
}

function titlePage(g: CanvasRenderingContext2D, w: number, h: number, book: Book) {
  const { set, vol, contents } = volumeParts(book.title);
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  const cx = w / 2;
  const maxW = w * 0.76;
  let y = h * 0.17;
  if (set) {
    const s = fitText(g, set.toUpperCase(), maxW, h * 0.1, w * 0.04, w * 0.028, '600', SERIF, 1.3);
    g.font = s.font;
    for (const l of s.lines) g.fillText(l, cx, (y += s.lineH));
  }
  if (vol) {
    g.font = `italic ${Math.round(w * 0.034)}px ${SERIF}`;
    g.fillText(`Volume ${vol}`, cx, (y += h * 0.055));
  }
  g.fillRect(cx - w * 0.08, (y += h * 0.04), w * 0.16, 1.5);
  const c = fitText(g, contents, maxW, h * 0.3, w * 0.058, w * 0.032, '700', SERIF, 1.22);
  y += h * 0.04;
  g.font = c.font;
  for (const l of c.lines) g.fillText(l, cx, (y += c.lineH));
  const a = fitText(g, book.author, maxW, h * 0.1, w * 0.034, w * 0.026, 'italic 400', SERIF, 1.3);
  y = Math.max(y + h * 0.08, h * 0.7);
  g.font = a.font;
  for (const l of a.lines) g.fillText(l, cx, (y += a.lineH));
  if (book.text) {
    g.fillStyle = '#6b6258';
    g.font = `${Math.round(w * 0.022)}px ${SERIF}`;
    g.fillText('Public domain · from the Christian Classics Ethereal Library', cx, h * 0.93, maxW);
  }
}

function textPage(g: CanvasRenderingContext2D, w: number, h: number, book: Book, n: number, lines: PageLine[] | null) {
  const { set, contents } = volumeParts(book.title);
  // Running heads: the set on the left page, the volume's contents on the right.
  g.fillStyle = '#6b6258';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `italic 17px ${SERIF}`;
  let head = n % 2 === 0 ? set || contents : contents;
  while (head && g.measureText(head).width > PAGE.textW) head = head.slice(0, -2).trimEnd() + '…';
  g.fillText(head.replace(/……$/, '…'), w / 2, PAGE.top - 44);
  g.font = `17px ${SERIF}`;
  g.fillText(String(n), w / 2, h - 40);
  if (!lines) return;
  g.fillStyle = INK;
  lines.forEach((l, i) => {
    const y = PAGE.top + i * PAGE.lineH;
    if (l.kind === 'gap') return;
    if (l.kind === 'rule') {
      g.fillRect(w / 2 - 40, y - 6, 80, 1);
      return;
    }
    if (l.kind === 'head') {
      g.font = PAGE.headFont;
      g.textAlign = 'center';
      g.fillText(l.text, w / 2, y, PAGE.textW);
      return;
    }
    g.font = PAGE.bodyFont;
    g.textAlign = 'left';
    const x0 = PAGE.left + (l.indent ?? 0);
    const words = l.text.split(' ');
    if (!l.justify || words.length < 2) {
      g.fillText(l.text, x0, y);
      return;
    }
    const ws = words.map((s) => g.measureText(s).width);
    const gap = (PAGE.left + PAGE.textW - x0 - ws.reduce((a, b) => a + b, 0)) / (words.length - 1);
    // A line too loose to justify cleanly is set ragged instead.
    if (gap > 20) {
      g.fillText(l.text, x0, y);
      return;
    }
    let x = x0;
    words.forEach((s, k) => {
      g.fillText(s, x, y);
      x += ws[k] + gap;
    });
  });
}

/**
 * The booklet's pages, two faces per leaf: cover, inside cover, the track
 * list, the credits, notes, and the back. Made only when the booklet is first
 * taken out, not for every CD on the shelf.
 */
export function bookletFaces(cd: Cd, leaves: number) {
  const paper = shade(cd.colour, 0.9);
  const notes = cd.booklet ?? [];
  const page = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) =>
    canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = paper;
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1b1b1b';
      draw(g, w, h);
    });
  const heading = (g: CanvasRenderingContext2D, w: number, text: string) => {
    g.font = `700 ${Math.round(w * 0.05)}px ${font()}`;
    g.fillText(text, w * 0.09, w * 0.15);
    g.font = `400 ${Math.round(w * 0.034)}px ${font()}`;
  };
  const textPage = (title: string, body: string) =>
    page((g, w) => {
      heading(g, w, title);
      wrap(g, body, w * 0.09, w * 0.26, w * 0.82, w * 0.052);
    });

  const faces = [
    cdCover(cd),
    textPage(cd.title, notes[0] ?? `${cd.artist}${cd.year ? `, ${cd.year}` : ''}. ${cd.tracks.length} ${cd.tracks.length === 1 ? 'track' : 'tracks'}, embedded from YouTube and credited to the channels they are posted on.`),
    page((g, w) => {
      heading(g, w, 'Tracks');
      // As many lines as fit: smaller type for a long list.
      const step = Math.min(0.065, 0.68 / Math.max(cd.tracks.length, 1));
      g.font = `400 ${Math.round(w * Math.min(0.034, step * 0.55))}px ${font()}`;
      cd.tracks.forEach((t, i) => g.fillText(`${i + 1}.  ${t.title}`, w * 0.09, w * (0.27 + i * step), w * 0.82));
    }),
    page((g, w) => {
      heading(g, w, 'Credits');
      // One line per channel the recordings are posted on, with where to find it.
      let y = w * 0.27;
      const seen = new Set<string>();
      for (const t of cd.tracks) {
        if (seen.has(t.credit.name)) continue;
        seen.add(t.credit.name);
        g.font = `700 ${Math.round(w * 0.032)}px ${font()}`;
        g.fillText(t.credit.name, w * 0.09, y, w * 0.82);
        g.font = `400 ${Math.round(w * 0.026)}px ${font()}`;
        y = wrap(g, (t.credit.url ?? '').replace(/^https:\/\/(www\.)?/, ''), w * 0.09, y + w * 0.04, w * 0.82, w * 0.036);
        y += w * 0.025;
        if (y > w * 0.9) break;
      }
    }),
  ];
  for (let i = 1; faces.length < leaves * 2 - 1; i++) {
    faces.push(textPage(i === 1 ? 'Notes' : '', notes[i] ?? ''));
  }
  faces.push(
    canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = shade(cd.colour, -0.2);
      g.fillRect(0, 0, w, h);
      g.fillStyle = inkOn(cd.colour);
      g.font = `400 ${Math.round(w * 0.03)}px ${font()}`;
      g.fillText(`${cd.artist} · ${cd.title}`, w * 0.09, h * 0.9, w * 0.82);
    }),
  );
  return faces;
}

/** The printed face of a disc. The canvas spans the disc's full diameter. */
/**
 * A disc's printed face. With `cover` the art is printed across the whole
 * disc, the way a pressed disc carries its sleeve, with the title on a band
 * across the bottom; without, a coloured label.
 */
export function discLabel(title: string, by: string, colour: string, dvd = false, cover?: string) {
  const t = canvasTexture(512, 512, (g, w) => {
    const c = w / 2;
    g.fillStyle = dvd ? '#d9dadc' : shade(colour, 0.15);
    g.beginPath();
    g.arc(c, c, c, 0, Math.PI * 2);
    g.fill();
    if (dvd) {
      g.fillStyle = colour;
      g.beginPath();
      g.arc(c, c, c, Math.PI * 1.1, Math.PI * 1.9);
      g.lineTo(c, c);
      g.fill();
    }
    g.strokeStyle = shade(colour, -0.2);
    g.lineWidth = 6;
    g.beginPath();
    g.arc(c, c, c * 0.42, 0, Math.PI * 2);
    g.stroke();
    const ink = dvd ? '#1b1b1b' : inkOn(colour);
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.font = `800 ${Math.round(w * 0.06)}px ${font()}`;
    g.fillText(title, c, c * (dvd ? 1.6 : 0.55), w * 0.6);
    g.font = `500 ${Math.round(w * 0.04)}px ${font()}`;
    g.fillText(dvd ? 'DVD VIDEO' : by, c, c * (dvd ? 1.75 : 1.55), w * 0.6);
  });
  return withArt(t, cover, (g, img, w) => {
    const c = w / 2;
    g.save();
    g.beginPath();
    g.arc(c, c, c, 0, Math.PI * 2);
    g.clip();
    g.drawImage(img, 0, 0, w, w);
    // A band across the bottom for the title, and the clear hub in the middle.
    g.fillStyle = 'rgba(10,8,6,0.72)';
    g.fillRect(0, w * 0.74, w, w * 0.12);
    g.fillStyle = '#f2e6c8';
    g.textAlign = 'center';
    g.font = `700 ${Math.round(w * 0.04)}px 'Palatino Linotype', Palatino, Georgia, serif`;
    g.fillText(title, c, w * 0.795, w * 0.62);
    g.font = `500 ${Math.round(w * 0.026)}px ${font()}`;
    g.fillStyle = '#d9b45f';
    g.fillText(dvd ? 'DVD VIDEO' : by || 'COMPACT DISC', c, w * 0.84, w * 0.5);
    g.fillStyle = '#d9dadc';
    g.beginPath();
    g.arc(c, c, c * 0.24, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 3;
    g.stroke();
    g.restore();
  });
}

// ---------------------------------------------------------------------------
// Box sets: a collector's slipcase. A deep lacquered colour with a fine
// pattern pressed into it, gold foil rules and corner ornaments, the cover
// art inset in a gilt frame, the title in foil capitals, and the double-headed
// eagle stamped below. Each face is drawn twice: once in colour, once as a
// map of where the foil is, so the gold catches the light as metal.

export interface BoxFaceSpec {
  title: string;
  subtitle: string;
  by: string;
  colour: string;
  cover?: string;
  /** DVD or CD: the box's proportions, and what its badge says. */
  format: 'dvd' | 'cd';
}

const FOIL = '#e2bd62';
const serif = (px: number, weight = 400) => `${weight} ${px}px 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif`;

let eagleImg: Promise<HTMLImageElement> | null = null;
const eagle = () => (eagleImg ??= image('/wyggzantium/eagle.png'));

/** Draws the eagle in a colour, centred, `w` wide. */
function stampEagle(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, colour: string) {
  const h = (w * img.height) / img.width;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  const t = c.getContext('2d')!;
  t.drawImage(img, 0, 0, w, h);
  t.globalCompositeOperation = 'source-in';
  t.fillStyle = colour;
  t.fillRect(0, 0, w, h);
  g.drawImage(c, x - w / 2, y - h / 2);
}

/** A small foil ornament for a corner: a quarter rosette with a scroll. */
function cornerOrnament(g: CanvasRenderingContext2D, x: number, y: number, s: number, sx: number, sy: number) {
  g.save();
  g.translate(x, y);
  g.scale(sx, sy);
  g.lineWidth = s * 0.08;
  g.beginPath();
  g.moveTo(0, s);
  g.lineTo(0, 0);
  g.lineTo(s, 0);
  g.stroke();
  g.beginPath();
  g.arc(s * 0.32, s * 0.32, s * 0.16, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(s * 0.55, s * 0.12);
  g.quadraticCurveTo(s * 0.9, s * 0.1, s * 0.75, s * 0.4);
  g.moveTo(s * 0.12, s * 0.55);
  g.quadraticCurveTo(s * 0.1, s * 0.9, s * 0.4, s * 0.75);
  g.stroke();
  g.restore();
}

/** The box's front: colour and foil maps, drawn alike, foil white in the second. */
export function boxFront(spec: BoxFaceSpec) {
  const W = 512;
  const H = Math.round(spec.format === 'dvd' ? 512 * (0.198 / 0.142) : 512 * (0.128 / 0.148));
  const art = spec.format === 'dvd' ? { x: 0.13, y: 0.17, w: 0.74 } : { x: 0.3, y: 0.2, w: 0.4 };
  // mode: the picture; where the foil is (white: metal); or how rough each part is (foil glossy).
  const draw = (g: CanvasRenderingContext2D, mode: Mode) => {
    const foilOnly = mode !== 'colour';
    const gold = mode === 'colour' ? FOIL : mode === 'foil' ? '#ffffff' : '#505050';
    if (foilOnly) {
      g.fillStyle = mode === 'foil' ? '#000' : '#e8e8e8';
      g.fillRect(0, 0, W, H);
    } else {
      // Lacquer: a deep gradient, with a fine diaper pattern pressed in.
      const grd = g.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, shade(spec.colour, -0.25));
      grd.addColorStop(0.5, shade(spec.colour, -0.45));
      grd.addColorStop(1, shade(spec.colour, -0.65));
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(0,0,0,0.18)';
      g.lineWidth = 1;
      for (let d = -H; d < W; d += 14) {
        g.beginPath();
        g.moveTo(d, 0);
        g.lineTo(d + H, H);
        g.moveTo(d + H, 0);
        g.lineTo(d, H);
        g.stroke();
      }
    }
    g.strokeStyle = gold;
    g.fillStyle = gold;
    // A double rule round the face, and ornaments in its corners.
    g.lineWidth = 5;
    g.strokeRect(W * 0.04, W * 0.04, W * 0.92, H - W * 0.08);
    g.lineWidth = 1.5;
    g.strokeRect(W * 0.06, W * 0.06, W * 0.88, H - W * 0.12);
    const o = W * 0.085;
    const os = W * 0.07;
    cornerOrnament(g, o, o, os, 1, 1);
    cornerOrnament(g, W - o, o, os, -1, 1);
    cornerOrnament(g, o, H - o, os, 1, -1);
    cornerOrnament(g, W - o, H - o, os, -1, -1);
    // The art's gilt frame.
    const ax = W * art.x;
    const ay = H * art.y;
    const aw = W * art.w;
    g.lineWidth = 7;
    g.strokeRect(ax - 7, ay - 7, aw + 14, aw + 14);
    if (!foilOnly) {
      g.fillStyle = shade(spec.colour, -0.7);
      g.fillRect(ax, ay, aw, aw);
      g.fillStyle = gold;
    } else if (mode === 'rough') {
      // The art is printed, matte.
      g.fillStyle = '#d0d0d0';
      g.fillRect(ax, ay, aw, aw);
      g.fillStyle = gold;
    }
    // The title in foil capitals, and the rest beneath it.
    const ty = ay + aw + (spec.format === 'dvd' ? H * 0.075 : H * 0.1);
    g.textAlign = 'center';
    g.font = serif(Math.round(W * (spec.format === 'dvd' ? 0.062 : 0.052)), 700);
    const lines = wrapLines(g, spec.title.toUpperCase(), W * 0.8);
    lines.slice(0, 2).forEach((l, i) => g.fillText(l, W / 2, ty + i * W * 0.068, W * 0.82));
    const after = ty + Math.min(lines.length, 2) * W * 0.068;
    g.font = serif(Math.round(W * 0.034));
    // A CD box is short: its subtitle alone fits under the title.
    const credit = spec.format === 'cd' || !spec.by ? spec.subtitle : `${spec.by}  ·  ${spec.subtitle}`;
    g.fillText(credit.toUpperCase(), W / 2, after + W * 0.005, W * 0.8);
    // The badge across the top.
    g.font = `700 ${Math.round(W * 0.026)}px ${font()}`;
    g.fillText(`${spec.format.toUpperCase()}  ·  THE COLLECTOR'S BOX`, W / 2, H * (spec.format === 'cd' ? 0.15 : 0.085) + W * 0.02, W * 0.7);
  };
  const colour = canvasTexture(W, H, (g) => draw(g, 'colour'));
  const foil = canvasTexture(W, H, (g) => draw(g, 'foil'));
  const rough = canvasTexture(W, H, (g) => draw(g, 'rough'));
  foil.colorSpace = rough.colorSpace = NoColorSpace;
  const ax = W * art.x;
  const ay = H * art.y;
  const aw = W * art.w;
  withArt(colour, spec.cover, (g, img) => g.drawImage(img, ax, ay, aw, aw));
  // The eagle, stamped in foil at the foot, on both maps.
  void eagle().then(
    (img) => {
      const ey = H - W * (spec.format === 'dvd' ? 0.115 : 0.085);
      const ew = W * (spec.format === 'dvd' ? 0.16 : 0.11);
      for (const [t, c] of [[colour, FOIL], [foil, '#ffffff'], [rough, '#505050']] as const) {
        stampEagle((t.image as HTMLCanvasElement).getContext('2d')!, img, W / 2, ey, ew, c);
        t.needsUpdate = true;
      }
    },
    () => {},
  );
  return { colour, foil, rough };
}

/** The box's spine: foil bands, the title running down in capitals, the eagle at its head. */
export function boxSpine(spec: BoxFaceSpec, thicknessPx: number) {
  const W = Math.max(48, thicknessPx);
  const H = 900;
  const draw = (g: CanvasRenderingContext2D, mode: Mode) => {
    const gold = mode === 'colour' ? FOIL : mode === 'foil' ? '#ffffff' : '#505050';
    g.fillStyle = mode === 'colour' ? shade(spec.colour, -0.45) : mode === 'foil' ? '#000' : '#e8e8e8';
    g.fillRect(0, 0, W, H);
    g.fillStyle = gold;
    for (const y of [0.03, 0.045, 0.955, 0.97]) g.fillRect(0, H * y, W, H * 0.006);
    g.save();
    g.translate(W / 2, H * 0.22);
    g.rotate(Math.PI / 2);
    g.textBaseline = 'middle';
    g.font = serif(Math.round(Math.min(W * 0.5, 34)), 700);
    g.fillText(spec.title.toUpperCase(), 0, 0, H * 0.66);
    g.restore();
    g.font = `700 ${Math.round(Math.min(W * 0.28, 16))}px ${font()}`;
    g.textAlign = 'center';
    g.fillText(spec.format.toUpperCase(), W / 2, H * 0.925);
  };
  const colour = canvasTexture(W, H, (g) => draw(g, 'colour'));
  const foil = canvasTexture(W, H, (g) => draw(g, 'foil'));
  const rough = canvasTexture(W, H, (g) => draw(g, 'rough'));
  foil.colorSpace = rough.colorSpace = NoColorSpace;
  void eagle().then(
    (img) => {
      for (const [t, c] of [[colour, FOIL], [foil, '#ffffff'], [rough, '#505050']] as const) {
        stampEagle((t.image as HTMLCanvasElement).getContext('2d')!, img, W / 2, H * 0.11, Math.min(W * 0.8, H * 0.11), c);
        t.needsUpdate = true;
      }
    },
    () => {},
  );
  return { colour, foil, rough };
}

type Mode = 'colour' | 'foil' | 'rough';

function wrapLines(g: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > max && line) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** A player's display, redrawn as it plays. */
export function lcd(colour = '#7ff0c0') {
  const tex = canvasTexture(256, 64, () => {});
  const c = tex.image as HTMLCanvasElement;
  const g = c.getContext('2d')!;
  let last = '';
  const draw = (top: string, bottom: string) => {
    const key = `${top}|${bottom}`;
    if (key === last) return;
    last = key;
    g.fillStyle = '#0b1310';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = colour;
    g.font = `600 22px ui-monospace, monospace`;
    g.fillText(top, 10, 27, 236);
    g.font = `400 16px ui-monospace, monospace`;
    g.globalAlpha = 0.7;
    g.fillText(bottom, 10, 52, 236);
    g.globalAlpha = 1;
    tex.needsUpdate = true;
  };
  draw('', 'NO DISC');
  return { texture: tex, draw };
}
