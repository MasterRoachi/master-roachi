'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PAGE,
  emptyScene,
  fromSvg,
  isBlank,
  newId,
  toSvg,
  type Item,
  type Scene,
  type Stroke,
  type TextItem,
} from '@/lib/sketch';
import styles from './sketchpad.module.css';

// One page you can write and draw on, saved as one file.
//
// The surface is a live SVG rather than a canvas. That is what makes text stay
// text: a canvas would turn every word into pixels the moment it was drawn,
// and the saved file could then never be searched, selected or corrected. It
// also means saving is close to serialising what is already on screen, so what
// comes out matches what was left.
//
// A fixed page of 1600×1200 scaled to the container, rather than a surface
// sized to the window. Coordinates then mean the same thing on the rig and on
// a phone, and the file has a definite size instead of inheriting whichever
// screen it was made on.

interface FileRef {
  path: string;
  sha: string;
}

type Tool = 'pen' | 'text' | 'select';

const COLOURS = ['#f5f5f5', '#d9a13b', '#7aa2f7', '#9ece6a', '#f7768e'];

const slug = (title: string) =>
  title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export default function Sketchpad() {
  const [files, setFiles] = useState<FileRef[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [title, setTitle] = useState('');
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [sha, setSha] = useState<string | undefined>();

  const [scene, setScene] = useState<Scene>(emptyScene());
  const [tool, setTool] = useState<Tool>('pen');
  const [colour, setColour] = useState(COLOURS[0]);
  const [width, setWidth] = useState(4);
  const [fontSize, setFontSize] = useState(34);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const surface = useRef<SVGSVGElement | null>(null);
  const editor = useRef<HTMLTextAreaElement | null>(null);
  /**
   * Whether the text editor has actually had focus.
   *
   * Guards the delete-on-blur below. Without it an empty box could be created
   * and destroyed in the same frame — which is exactly what happened: the
   * pointerdown's default action moved focus away before the textarea mounted,
   * onBlur fired on a brand new item whose text was still empty, and the item
   * was deleted. The box flashed and text could not be added at all.
   */
  const everFocused = useRef(false);
  const drawing = useRef<Stroke | null>(null);
  const dragging = useRef<{ id: string; from: [number, number] } | null>(null);
  const [live, setLive] = useState<Stroke | null>(null);

  // autoFocus races the pointerdown that created the item. Focusing from an
  // effect runs after the element is in the document, which is deterministic.
  useEffect(() => {
    if (editing === null) return;
    everFocused.current = false;
    const element = editor.current;
    if (!element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [editing]);

  const loadList = useCallback(async () => {
    const response = await fetch('/work/api/content?collection=notes', { cache: 'no-store' });
    if (!response.ok) {
      setStatus('Not switched on — GITHUB_TOKEN is not set.');
      setFiles([]);
      return;
    }
    const data = (await response.json()) as { configured: boolean; files: FileRef[] };
    setConfigured(data.configured);
    setFiles(data.files ?? []);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  /** Screen point to page coordinates. The page scales; its coordinates do not. */
  function at(event: { clientX: number; clientY: number }): [number, number] {
    const box = surface.current!.getBoundingClientRect();
    return [
      ((event.clientX - box.left) / box.width) * PAGE.width,
      ((event.clientY - box.top) / box.height) * PAGE.height,
    ];
  }

  /** Page coordinates back to CSS pixels, for positioning the text editor. */
  function onScreen(x: number, y: number) {
    const box = surface.current?.getBoundingClientRect();
    const scale = box ? box.width / PAGE.width : 1;
    return { left: x * scale, top: y * scale, scale };
  }

  function change(items: Item[]) {
    setScene((current) => ({ ...current, items }));
    setDirty(true);
  }

  async function open(path: string) {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/work/api/content?collection=notes&path=${encodeURIComponent(path)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) throw new Error(`could not open it (${response.status})`);
      const { file } = (await response.json()) as { file: { text: string; sha: string } };

      const restored = fromSvg(file.text);
      if (!restored) {
        // An SVG without our scene cannot be edited without redrawing it from
        // its rendered form, which would not be what was left. Better to say
        // so than to open a blank page over a real file.
        throw new Error('That file has no editable sketch in it — opened nothing.');
      }

      setScene(restored);
      setOpenPath(path);
      setSha(file.sha);
      setTitle(path.replace(/^notes\//, '').replace(/\.svg$/, '').replace(/-/g, ' '));
      setSelected(null);
      setEditing(null);
      setDirty(false);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not open it.');
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setScene(emptyScene());
    setOpenPath(null);
    setSha(undefined);
    setTitle('');
    setSelected(null);
    setEditing(null);
    setDirty(false);
    setStatus(null);
  }

  async function save() {
    const name = title.trim();
    if (!name) {
      setStatus('It needs a title — that is what names the file.');
      return;
    }
    if (isBlank(scene)) {
      // Saving an empty page over a real one is the one unrecoverable mistake
      // available here, so it is simply not allowed.
      setStatus('Nothing on the page.');
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const path = openPath ?? `notes/${slug(name)}.svg`;
      if (!slug(name)) throw new Error('That title does not make a filename.');

      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collection: 'notes',
          path,
          text: toSvg(scene),
          sha: openPath ? sha : undefined,
        }),
      });
      const data = (await response.json()) as { saved?: boolean; error?: string };
      if (response.status === 409) {
        throw new Error('It changed since you opened it — reopen before saving.');
      }
      if (!response.ok || !data.saved) throw new Error(data.error ?? `Failed (${response.status}).`);

      setDirty(false);
      setStatus('Saved. One file, committed.');
      await loadList();
      if (!openPath) await open(path);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  function downloadSvg() {
    const blob = new Blob([toSvg(scene)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(title) || 'sketch'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * PNG, by letting the browser rasterise the SVG it already knows how to draw.
   *
   * At twice the page size, so the result is not soft. Text becomes pixels
   * here, which is the point of it being a separate export rather than the
   * saved format.
   */
  function downloadPng() {
    const svg = toSvg(scene);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PAGE.width * 2;
      canvas.height = PAGE.height * 2;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${slug(title) || 'sketch'}.png`;
      link.click();
    };
    image.onerror = () => setStatus('The browser could not rasterise it.');
    // A data URI rather than a blob URL: a blob URL counts as a foreign origin
    // and taints the canvas, so toDataURL would then throw.
    image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  if (files === null) return <p className={styles.status}>Reading the repo…</p>;
  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. Set <code>GITHUB_TOKEN</code> as a Worker secret.
      </p>
    );
  }

  const editingItem =
    editing !== null
      ? (scene.items.find((i) => i.id === editing && i.kind === 'text') as TextItem | undefined)
      : undefined;

  return (
    <div className={styles.pad}>
      <aside className={styles.list}>
        <button type="button" className={styles.new} onClick={startNew}>
          New sketch
        </button>
        <ul>
          {files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                className={openPath === file.path ? styles.current : undefined}
                onClick={() => void open(file.path)}
              >
                {file.path.replace(/^notes\//, '').replace(/\.svg$/, '')}
              </button>
            </li>
          ))}
        </ul>
        {files.length === 0 && <p className={styles.status}>No sketches yet.</p>}
      </aside>

      <div className={styles.pane}>
        <p className={styles.bar}>
          <input
            className={styles.title}
            value={title}
            placeholder="Title"
            aria-label="Title"
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
          />
          {dirty && <span className={styles.dirty}>unsaved</span>}
          <button type="button" onClick={() => void save()} disabled={busy}>
            {busy ? 'Working…' : 'Save'}
          </button>
          <span className={styles.exports}>
            <button type="button" onClick={downloadSvg}>
              .svg
            </button>
            <button type="button" onClick={downloadPng}>
              .png
            </button>
            <button type="button" onClick={() => window.print()}>
              PDF
            </button>
          </span>
        </p>

        <div className={styles.tools}>
          {(['pen', 'text', 'select'] as Tool[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={tool === option}
              className={tool === option ? styles.toolOn : undefined}
              onClick={() => {
                setTool(option);
                setEditing(null);
              }}
            >
              {option === 'pen' ? 'Pen' : option === 'text' ? 'Text' : 'Select'}
            </button>
          ))}

          <span className={styles.sep} />

          {COLOURS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Colour ${option}`}
              aria-pressed={colour === option}
              className={colour === option ? styles.swatchOn : styles.swatch}
              style={{ background: option }}
              onClick={() => {
                setColour(option);
                // Recolour what is selected, so the swatches work on existing
                // marks and not only on the next one.
                if (selected) {
                  change(
                    scene.items.map((item) =>
                      item.id === selected ? { ...item, colour: option } : item,
                    ),
                  );
                }
              }}
            />
          ))}

          <label className={styles.sizeLabel}>
            {tool === 'text' ? 'size' : 'pen'}
            <input
              type="range"
              min={tool === 'text' ? 12 : 1}
              max={tool === 'text' ? 96 : 24}
              value={tool === 'text' ? fontSize : width}
              aria-label={tool === 'text' ? 'Text size' : 'Pen width'}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (tool === 'text') setFontSize(value);
                else setWidth(value);
                if (selected) {
                  change(
                    scene.items.map((item) =>
                      item.id === selected
                        ? item.kind === 'text'
                          ? { ...item, size: value }
                          : { ...item, width: value }
                        : item,
                    ),
                  );
                }
              }}
            />
          </label>

          <span className={styles.sep} />

          <button
            type="button"
            onClick={() => {
              change(scene.items.slice(0, -1));
              setSelected(null);
            }}
            disabled={scene.items.length === 0}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selected) return;
              change(scene.items.filter((item) => item.id !== selected));
              setSelected(null);
              setEditing(null);
            }}
            disabled={!selected}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => {
              if (scene.items.length === 0) return;
              if (!confirm('Clear the page?')) return;
              change([]);
              setSelected(null);
              setEditing(null);
            }}
            disabled={scene.items.length === 0}
          >
            Clear
          </button>
        </div>

        <div className={styles.surfaceWrap}>
          <svg
            ref={surface}
            className={styles.surface}
            viewBox={`0 0 ${PAGE.width} ${PAGE.height}`}
            data-tool={tool}
            onPointerDown={(event) => {
              // Editing: this click is the way out of it. Blurring commits the
              // text; returning here means the same click does not also start
              // a stroke or drop a second text box.
              if (editing !== null) {
                editor.current?.blur();
                return;
              }

              const point = at(event);

              if (tool === 'pen') {
                // Capture only for drawing and dragging. On the text tool it
                // keeps the pointer — and the focus — on the surface, which is
                // half of why text could not be added.
                event.currentTarget.setPointerCapture(event.pointerId);
                drawing.current = {
                  kind: 'stroke',
                  id: newId(),
                  colour,
                  width,
                  points: [point],
                };
                setLive({ ...drawing.current });
                return;
              }

              if (tool === 'text') {
                // Stops the default action moving focus to the surface a tick
                // after this handler, which would blur the editor before it
                // was ever used.
                event.preventDefault();
                const item: TextItem = {
                  kind: 'text',
                  id: newId(),
                  x: point[0],
                  // Placed on the baseline of the first line, so the click
                  // lands where the text starts rather than above it.
                  y: point[1] + fontSize * 0.8,
                  size: fontSize,
                  colour,
                  text: '',
                };
                change([...scene.items, item]);
                setSelected(item.id);
                setEditing(item.id);
                return;
              }

              // Select: an empty click clears the selection. Capture so a drag
              // that leaves the surface still ends here.
              event.currentTarget.setPointerCapture(event.pointerId);
              setSelected(null);
            }}
            onPointerMove={(event) => {
              if (drawing.current) {
                drawing.current.points.push(at(event));
                setLive({ ...drawing.current });
                return;
              }
              if (dragging.current) {
                const [x, y] = at(event);
                const [fx, fy] = dragging.current.from;
                const id = dragging.current.id;
                dragging.current.from = [x, y];
                setScene((current) => ({
                  ...current,
                  items: current.items.map((item) => {
                    if (item.id !== id) return item;
                    if (item.kind === 'text') {
                      return { ...item, x: item.x + (x - fx), y: item.y + (y - fy) };
                    }
                    return {
                      ...item,
                      points: item.points.map(([px, py]) => [px + (x - fx), py + (y - fy)]) as [
                        number,
                        number,
                      ][],
                    };
                  }),
                }));
                setDirty(true);
              }
            }}
            onPointerUp={() => {
              if (drawing.current) {
                change([...scene.items, drawing.current]);
                drawing.current = null;
                setLive(null);
              }
              dragging.current = null;
            }}
            onPointerCancel={() => {
              drawing.current = null;
              setLive(null);
              dragging.current = null;
            }}
          >
            <rect width={PAGE.width} height={PAGE.height} fill={scene.background} />

            {scene.items.map((item) => {
              const isSelected = selected === item.id;
              const grab = (event: React.PointerEvent) => {
                if (tool !== 'select') return;
                event.stopPropagation();
                setSelected(item.id);
                dragging.current = { id: item.id, from: at(event) };
              };

              if (item.kind === 'stroke') {
                return (
                  <g key={item.id} onPointerDown={grab}>
                    {/* A wide transparent copy underneath, so a thin line can
                        actually be grabbed with a finger. */}
                    {tool === 'select' && (
                      <path
                        d={pathD(item)}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={Math.max(item.width, 24)}
                        strokeLinecap="round"
                      />
                    )}
                    <path
                      d={pathD(item)}
                      fill="none"
                      stroke={item.colour}
                      strokeWidth={item.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={isSelected ? 0.6 : 1}
                    />
                    {item.points.length === 1 && (
                      <circle
                        cx={item.points[0][0]}
                        cy={item.points[0][1]}
                        r={item.width / 2}
                        fill={item.colour}
                      />
                    )}
                  </g>
                );
              }

              return (
                <text
                  key={item.id}
                  x={item.x}
                  y={item.y}
                  fill={item.colour}
                  fontSize={item.size}
                  fontFamily="Archivo, ui-sans-serif, system-ui, sans-serif"
                  style={{ whiteSpace: 'pre', opacity: editing === item.id ? 0.25 : 1 }}
                  onPointerDown={grab}
                  onDoubleClick={() => {
                    setSelected(item.id);
                    setEditing(item.id);
                  }}
                >
                  {item.text.split('\n').map((line, i) => (
                    <tspan key={i} x={item.x} dy={i === 0 ? 0 : item.size * 1.35}>
                      {line || ' '}
                    </tspan>
                  ))}
                </text>
              );
            })}

            {live && (
              <path
                d={pathD(live)}
                fill="none"
                stroke={live.colour}
                strokeWidth={live.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* Typing happens in a textarea laid over the text being edited,
              positioned and sized to match, so what is typed sits where it
              will sit. SVG has no editable text of its own, and foreignObject
              would not render outside a browser. */}
          {editingItem && (
            <textarea
              ref={editor}
              className={styles.textEditor}
              value={editingItem.text}
              style={{
                left: onScreen(editingItem.x, editingItem.y).left,
                top: onScreen(editingItem.x, editingItem.y - editingItem.size * 0.8).top,
                fontSize: editingItem.size * onScreen(0, 0).scale,
                color: editingItem.colour,
              }}
              onChange={(event) =>
                change(
                  scene.items.map((item) =>
                    item.id === editingItem.id ? { ...item, text: event.target.value } : item,
                  ),
                )
              }
              onFocus={() => {
                everFocused.current = true;
              }}
              onBlur={() => {
                // Only discard an empty box that was actually used. A blur
                // before the editor ever had focus is the browser moving
                // focus, not him deciding against the text — and deleting on
                // that is what made text impossible to add.
                if (!everFocused.current) return;
                // An empty box left behind would be an invisible thing to
                // click on later.
                if (!editingItem.text.trim()) {
                  change(scene.items.filter((item) => item.id !== editingItem.id));
                  setSelected(null);
                }
                setEditing(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.currentTarget.blur();
              }}
            />
          )}
        </div>

        {status && <p className={styles.message}>{status}</p>}
      </div>
    </div>
  );
}

/** The same path the saved file uses, so the screen and the file agree. */
function pathD(stroke: Stroke): string {
  if (stroke.points.length === 0) return '';
  const [first, ...rest] = stroke.points;
  return `M ${first[0]} ${first[1]} ` + rest.map((p) => `L ${p[0]} ${p[1]}`).join(' ');
}
