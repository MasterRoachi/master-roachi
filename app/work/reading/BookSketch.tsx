'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PAGE,
  emptyScene,
  fromSvg,
  isBlank,
  newId,
  pagesOf,
  toSvg,
  type Scene,
  type Stroke,
} from '@/lib/sketch';
import styles from './reading.module.css';

// The margin of a book, as a page you can draw on.
//
// Deliberately NOT the whole sketchpad. That page has a file list, a text
// tool, selection, PNG and PDF export and its own save flow — all of which
// belong to a page whose job is making documents. This is for notes taken
// while reading, so it is pen, eraser, colour, thickness and undo, and the
// book it belongs to decides the filename.
//
// The FILE FORMAT is shared, not reimplemented: toSvg/fromSvg from
// lib/sketch.ts, written to the same `notes` collection through the same
// /work/api/content endpoint. A page made here opens in the sketchpad and a
// page made there opens here — the two are the same kind of file, and only
// the tools around them differ.

/* Sixteen, in four rows of four: neutrals, warms, cools, greens. Chosen to
   read against the page's own dark ground rather than sampled from a wheel —
   a mid-grey and a navy both vanish on #16181d. */
const COLOURS = [
  '#f5f5f5', '#b8bcc4', '#7c818b', '#2a2d34',
  '#d9a13b', '#e8c547', '#e8833a', '#c7522a',
  '#f7768e', '#d16ba5', '#9d7cd8', '#7aa2f7',
  '#58c6d4', '#5fb3a1', '#9ece6a', '#c3d82c',
];
const WIDTHS = { min: 1, max: 18 };

function pathD(stroke: Stroke): string {
  if (stroke.points.length === 0) return '';
  const [first, ...rest] = stroke.points;
  return `M ${first[0]} ${first[1]} ` + rest.map((p) => `L ${p[0]} ${p[1]}`).join(' ');
}

/** Shortest distance from a point to a stroke, for the eraser. */
function near(stroke: Stroke, x: number, y: number, slack: number): boolean {
  return stroke.points.some(([px, py]) => Math.hypot(px - x, py - y) <= slack + stroke.width);
}

export default function BookSketch({
  bookId,
  bookTitle,
  notePath,
  onSaved,
}: {
  bookId: number;
  bookTitle: string;
  /** An existing page for this book, opened instead of a blank one. */
  notePath: string | null;
  onSaved: () => void;
}) {
  const [scene, setScene] = useState<Scene>(emptyScene());
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [colour, setColour] = useState(COLOURS[1]);
  const [width, setWidth] = useState(4);
  const [sha, setSha] = useState<string | undefined>();
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* The scene as the pointer handlers see it. They run between renders —
     a page added mid-stroke has to change the coordinate mapping at once,
     and a value captured in a closure would be one page out. */
  const sceneRef = useRef<Scene>(scene);
  sceneRef.current = scene;

  const surface = useRef<SVGSVGElement | null>(null);
  const drawing = useRef<string | null>(null);

  const pages = pagesOf(scene);
  const sheetHeight = PAGE.height * pages;

  const slug = (value: string) =>
    value
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const path = notePath ?? `notes/${slug(bookTitle) || `book-${bookId}`}.svg`;

  /* Open the book's existing page, if it has one. A book with no note starts
     blank, which is the common case and not an error. */
  useEffect(() => {
    if (!notePath) return;
    let live = true;
    (async () => {
      try {
        const response = await fetch(
          `/work/api/content?collection=notes&path=${encodeURIComponent(notePath)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) throw new Error(String(response.status));
        const { file } = (await response.json()) as { file: { text: string; sha: string } };
        const restored = fromSvg(file.text);
        if (live && restored) {
          setScene(restored);
          setSha(file.sha);
          setDirty(false);
        }
      } catch {
        if (live) setStatus('Could not open the saved page.');
      }
    })();
    return () => {
      live = false;
    };
  }, [notePath]);

  /**
   * Screen point to page coordinates. The page scales; its coordinates do not.
   *
   * THE LETTERBOX IS THE WHOLE OF THIS. The svg keeps its 4:3 inside whatever
   * box the layout gives it (preserveAspectRatio defaults to xMidYMid meet),
   * so the drawing is centred with bars on two sides. Dividing by the
   * element's own width and height ignores those bars, and the ink then lands
   * off the cursor by half the bar — further out the wider the panel gets.
   */
  const at = useCallback((event: { clientX: number; clientY: number }): [number, number] => {
    const box = surface.current!.getBoundingClientRect();
    const tall = PAGE.height * pagesOf(sceneRef.current);
    const scale = Math.min(box.width / PAGE.width, box.height / tall);
    const barX = (box.width - PAGE.width * scale) / 2;
    const barY = (box.height - tall * scale) / 2;
    return [
      (event.clientX - box.left - barX) / scale,
      (event.clientY - box.top - barY) / scale,
    ];
  }, []);

  function down(event: React.PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const [x, y] = at(event);

    if (tool === 'eraser') {
      erase(x, y);
      drawing.current = 'erasing';
      return;
    }
    const id = newId();
    drawing.current = id;
    setScene((current) => ({
      ...current,
      items: [...current.items, { kind: 'stroke', id, colour, width, points: [[x, y]] }],
    }));
    setDirty(true);
  }

  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (!drawing.current) return;
    const [x, y] = at(event);

    if (drawing.current === 'erasing') {
      erase(x, y);
      return;
    }
    const id = drawing.current;
    setScene((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.kind === 'stroke' && item.id === id
          ? { ...item, points: [...item.points, [x, y] as [number, number]] }
          : item,
      ),
    }));
  }

  function up() {
    drawing.current = null;
    grow();
  }

  /**
   * Another page, once the writing reaches the foot of the last one.
   *
   * Grown rather than asked for: this is a notebook, and stopping to press a
   * button at the bottom of every page is the thing a notebook does not make
   * you do. Trailing blank pages are trimmed again on save, so a page added
   * by a stray mark down there cannot accumulate.
   */
  function grow() {
    setScene((current) => {
      const tall = PAGE.height * pagesOf(current);
      const lowest = current.items.reduce((low, item) => {
        if (item.kind === 'stroke') {
          return item.points.reduce((m, [, y]) => Math.max(m, y), low);
        }
        return Math.max(low, item.y);
      }, 0);
      if (lowest < tall - PAGE.height * 0.12) return current;
      if (pagesOf(current) >= 40) return current;
      return { ...current, pages: pagesOf(current) + 1 };
    });
  }

  /** The last page with anything on it. Keeps the file honest about its size. */
  function trimmed(current: Scene): Scene {
    const lowest = current.items.reduce((low, item) => {
      if (item.kind === 'stroke') {
        return item.points.reduce((m, [, y]) => Math.max(m, y), low);
      }
      return Math.max(low, item.y);
    }, 0);
    const needed = Math.max(1, Math.ceil(lowest / PAGE.height));
    return { ...current, pages: Math.min(pagesOf(current), needed) };
  }

  /** Whole strokes, not pixels: the file is vector, so there is nothing else
   *  an eraser could sensibly take. */
  function erase(x: number, y: number) {
    setScene((current) => {
      const kept = current.items.filter(
        (item) => !(item.kind === 'stroke' && near(item, x, y, 8)),
      );
      if (kept.length === current.items.length) return current;
      return { ...current, items: kept };
    });
    setDirty(true);
  }

  function undo() {
    setScene((current) => ({ ...current, items: current.items.slice(0, -1) }));
    setDirty(true);
  }

  function clear() {
    if (!confirm('Clear the page?')) return;
    setScene((current) => ({ ...current, items: [] }));
    setDirty(true);
  }

  async function save() {
    if (isBlank(scene)) {
      // Saving an empty page over a real one is the one unrecoverable mistake
      // available here, so it is simply not allowed.
      setStatus('Nothing on the page.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ collection: 'notes', path, text: toSvg(trimmed(scene)), sha }),
      });
      if (response.status === 409) {
        throw new Error('It changed since you opened it — reopen before saving.');
      }
      const data = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) throw new Error(data.error ?? `Failed (${response.status}).`);

      /* Link it to the book only once the file is written: a row pointing at
         a sketch that failed to save is a dead link in the book's notes. */
      await fetch('/work/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'note-add', id: bookId, path, title: bookTitle }),
      });

      setDirty(false);
      setStatus('Saved.');
      onSaved();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save it.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.sketchWrap}>
      {/* The sheet is as tall as the note needs and the panel scrolls down
          it. aspect-ratio rather than a height, so the svg never letterboxes
          — the pointer maths depends on knowing exactly where the drawing
          sits inside the element. */}
      <div className={styles.sketchScroll}>
      <svg
        ref={surface}
        className={styles.sketch}
        viewBox={`0 0 ${PAGE.width} ${sheetHeight}`}
        style={{
          background: scene.background,
          touchAction: 'none',
          aspectRatio: `${PAGE.width} / ${sheetHeight}`,
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {scene.items.map((item) =>
          item.kind === 'stroke' ? (
            <path
              key={item.id}
              d={pathD(item)}
              fill="none"
              stroke={item.colour}
              strokeWidth={item.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <text
              key={item.id}
              x={item.x}
              y={item.y}
              fill={item.colour}
              fontSize={item.size}
              fontFamily="var(--font-sans), system-ui, sans-serif"
            >
              {item.text}
            </text>
          ),
        )}

        {/* Where one page ends and the next begins. A rule, not a gap: the
            sheet is continuous and this only says where a printed page would
            break. */}
        {Array.from({ length: pages - 1 }, (_, i) => (
          <line
            key={i}
            x1={0}
            x2={PAGE.width}
            y1={PAGE.height * (i + 1)}
            y2={PAGE.height * (i + 1)}
            stroke="#ffffff"
            strokeOpacity={0.12}
            strokeWidth={2}
            strokeDasharray="14 12"
          />
        ))}
      </svg>
      </div>

      {/* The tools, down the right. */}
      <div className={styles.tools}>
        <div className={styles.toolRow}>
          <button
            type="button"
            className={tool === 'pen' ? styles.toolOn : styles.tool}
            aria-pressed={tool === 'pen'}
            title="Pen"
            onClick={() => setTool('pen')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20l4.5-1.2L19 8.3l-3.3-3.3L5.2 15.5zM14.5 5.8l3.7 3.7" />
            </svg>
          </button>
          <button
            type="button"
            className={tool === 'eraser' ? styles.toolOn : styles.tool}
            aria-pressed={tool === 'eraser'}
            title="Eraser — takes a whole stroke"
            onClick={() => setTool('eraser')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17l-3-3 9-9 6 6-6 6zM10 20h10M7 17h5" />
            </svg>
          </button>
        </div>

        <div className={styles.swatches}>
          {COLOURS.map((option) => (
            <button
              key={option}
              type="button"
              className={colour === option ? styles.swatchOn : styles.swatch}
              style={{ background: option }}
              aria-label={`Colour ${option}`}
              aria-pressed={colour === option}
              onClick={() => {
                setColour(option);
                setTool('pen');
              }}
            />
          ))}
        </div>

        <label className={styles.thickness}>
          <span>{width}</span>
          <input
            type="range"
            min={WIDTHS.min}
            max={WIDTHS.max}
            value={width}
            aria-label="Pen thickness"
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>

        <div className={styles.toolRow}>
          <button
            type="button"
            className={styles.tool}
            title="Undo"
            disabled={scene.items.length === 0}
            onClick={undo}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 7L4 12l5 5M4 12h9a6 6 0 0 1 0 12h-1" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.tool}
            title="Clear the page"
            disabled={scene.items.length === 0}
            onClick={clear}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className={styles.saveSketch}
          disabled={busy || !dirty}
          onClick={() => void save()}
        >
          {busy ? '…' : 'Save'}
        </button>

        <p className={styles.sketchStatus}>
          {status ?? (pages > 1 ? `${pages} pages` : '1 page')}
        </p>
      </div>
    </div>
  );
}
