'use client';

import { useEffect, useRef, useState } from 'react';
import { NOTE_SECTION, NOTE_WIDTH, sectionsToShow } from '@/lib/card-note';
import { newId, type Item, type Scene, type Stroke, type TextItem } from '@/lib/sketch';
import styles from './cards.module.css';

// The panel beside the card, where the writing happens.
//
// ONE SECTION IS VISIBLE AT A TIME. The panel does not scroll through a tall
// page — it pages between sections by moving the viewBox, which is why the
// surface is exactly the shape of one section and never taller.
//
// How many sections exist is decided ONCE, when the card arrives, and then
// frozen while it is on screen. That is the correction to the first version:
// deriving it continuously meant a new empty section appeared the moment a
// stroke was made, because the stroke was what made the count go up. Now the
// next section appears the next time the card comes round — which is also the
// moment the last attempt becomes worth comparing against.
//
// The surface is a live SVG and not a canvas, for the sketchpad's reason: a
// canvas turns every word into pixels the moment it is drawn, and these notes
// have text in them.

/** Past this many pixels of wheel or drag, the section changes. */
const PAGE_THRESHOLD = 40;

export default function Note({
  scene,
  onChange,
  onSection,
}: {
  scene: Scene;
  onChange: (scene: Scene) => void;
  /** The measured section height, reported up so it can be saved with the note. */
  onSection: (height: number) => void;
}) {
  const [tool, setTool] = useState<'pen' | 'text'>('pen');
  const [live, setLive] = useState<Stroke | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const surface = useRef<SVGSVGElement | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const wheel = useRef(0);
  const swipe = useRef<number | null>(null);

  /* A section is exactly the shape of the panel, measured, so the surface
   * fills it. A fixed shape left a bar of dead space above and below — the one
   * thing a writing area cannot afford. NOTE_SECTION is only the value before
   * the first measurement lands. */
  const [section, setSection] = useState(NOTE_SECTION);

  /* Counted ONCE, from the note this panel was mounted with and the section
   * height it was first measured at. The panel is keyed by card, so a new card
   * is a new panel and this happens again — which is what keeps the count
   * frozen while a card is on screen without having to watch for the card
   * changing underneath it.
   *
   * It waits for the measurement rather than counting at the fallback height
   * and correcting afterwards: a count taken at one section height and drawn
   * at another is a note whose dots do not match its contents. */
  const [sections, setSections] = useState(1);
  const [at_, setAt] = useState(0);
  const counted = useRef(false);

  useEffect(() => {
    const element = surface.current;
    if (!element) return;

    const measure = () => {
      const box = element.getBoundingClientRect();
      if (box.width === 0) return;
      const height = Math.round((box.height / box.width) * NOTE_WIDTH);
      setSection(height);
      onSection(height);

      if (!counted.current) {
        counted.current = true;
        const count = sectionsToShow(scene, height);
        setSections(count);
        // Open on the empty one at the end, which is where this attempt goes.
        setAt(count - 1);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
    // `scene` is read once, on the first measurement, and must not re-run this
    // when the drawing changes — that is the bug this whole design exists to
    // avoid. The panel is keyed by card, so the mount already scopes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSection]);

  /** The top of the visible section, in scene units. */
  const top = at_ * section;

  const go = (delta: number) =>
    setAt((was) => Math.min(sections - 1, Math.max(0, was + delta)));

  /** Screen point to scene coordinates, offset into the visible section. */
  function point(event: { clientX: number; clientY: number }): [number, number] {
    const box = surface.current!.getBoundingClientRect();
    return [
      ((event.clientX - box.left) / box.width) * NOTE_WIDTH,
      top + ((event.clientY - box.top) / box.height) * section,
    ];
  }

  function change(items: Item[]) {
    onChange({ ...scene, items });
  }

  const scale = () => {
    const box = surface.current?.getBoundingClientRect();
    return box ? box.width / NOTE_WIDTH : 1;
  };

  return (
    <div className={styles.note}>
      {/* Its own corner, over the panel rather than in a band of its own:
          a toolbar row would take height from the writing, which is the thing
          that wanted to be bigger. */}
      <div className={styles.noteTools}>
        <button
          type="button"
          className={`${styles.tool} ${tool === 'pen' ? styles.toolOn : ''}`}
          onClick={() => setTool('pen')}
          title="Draw"
          aria-label="Draw"
          aria-pressed={tool === 'pen'}
        >
          <PenIcon />
        </button>
        <button
          type="button"
          className={`${styles.tool} ${tool === 'text' ? styles.toolOn : ''}`}
          onClick={() => setTool('text')}
          title="Type"
          aria-label="Type"
          aria-pressed={tool === 'text'}
        >
          <span className={styles.toolLetter}>T</span>
        </button>
        <button
          type="button"
          className={styles.tool}
          // The last thing added, removed. There is no eraser on purpose: a
          // note is the record of the attempts, and rubbing out a bad one
          // throws away the comparison the note exists for. Undo is for the
          // stroke that went wrong on the way out of the pen.
          onClick={() => change(scene.items.slice(0, -1))}
          disabled={scene.items.length === 0}
          title="Undo the last stroke"
          aria-label="Undo the last stroke"
        >
          <UndoIcon />
        </button>
      </div>

      {/* One dot per section, on the right and vertically centred. Hidden
          while there is only one, because a single dot would be saying there
          is somewhere else to be when there is not. */}
      {sections > 1 && (
        <div className={styles.dots} aria-hidden="true">
          {Array.from({ length: sections }, (_, which) => (
            <button
              key={which}
              type="button"
              className={`${styles.dot} ${which === at_ ? styles.dotHere : ''}`}
              onClick={() => setAt(which)}
              tabIndex={-1}
              title={which === sections - 1 ? 'This attempt' : `Attempt ${which + 1}`}
            />
          ))}
        </div>
      )}

      <svg
        ref={surface}
        className={styles.noteSurface}
        // A surface full of paths and text is, to the browser, something to
        // select and drag — which is where the grab cursor came from, and why
        // the stroke after the first one started a drag instead of a line. The
        // rest of the answer is in the CSS: no selection, no native drag, and
        // the drawn items take no pointer events at all.
        onDragStart={(event) => event.preventDefault()}
        // Paging IS the viewBox moving down a section at a time. Nothing
        // scrolls, so nothing can be left half way between two sections.
        viewBox={`0 ${top} ${NOTE_WIDTH} ${section}`}
        data-tool={tool}
        onWheel={(event) => {
          // Accumulated rather than acted on per event: one flick of a wheel
          // is a dozen events and would otherwise cross every section at once.
          wheel.current += event.deltaY;
          if (Math.abs(wheel.current) < PAGE_THRESHOLD) return;
          go(wheel.current < 0 ? -1 : 1);
          wheel.current = 0;
        }}
        onPointerDown={(event) => {
          /* A finger pages, a pen and a mouse draw. Without the split there is
           * no way to reach an earlier attempt on a tablet at all, since the
           * panel has nothing to scroll. */
          if (event.pointerType === 'touch') {
            swipe.current = event.clientY;
            return;
          }

          if (editing !== null) {
            setEditing(null);
            return;
          }

          const where = point(event);

          if (tool === 'pen') {
            event.currentTarget.setPointerCapture(event.pointerId);
            drawing.current = {
              kind: 'stroke',
              id: newId(),
              colour: '#e8e6e1',
              // In scene units, so a stroke is the same weight whatever the
              // panel is scaled to.
              width: 5,
              points: [where],
            };
            setLive({ ...drawing.current });
            return;
          }

          event.preventDefault();
          const item: TextItem = {
            kind: 'text',
            id: newId(),
            x: where[0],
            // On the baseline of the first line, so the click lands where the
            // text starts rather than above it.
            y: where[1] + 34 * 0.8,
            size: 34,
            colour: '#e8e6e1',
            text: '',
          };
          change([...scene.items, item]);
          setEditing(item.id);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          drawing.current.points.push(point(event));
          setLive({ ...drawing.current });
        }}
        onPointerUp={(event) => {
          if (swipe.current !== null) {
            const moved = event.clientY - swipe.current;
            swipe.current = null;
            // Up for the previous attempt, down for the next — his direction,
            // and the same sign as the wheel so the two cannot disagree.
            if (Math.abs(moved) > PAGE_THRESHOLD) go(moved > 0 ? -1 : 1);
            return;
          }
          if (!drawing.current) return;
          change([...scene.items, drawing.current]);
          drawing.current = null;
          setLive(null);
        }}
        onPointerCancel={() => {
          drawing.current = null;
          swipe.current = null;
          setLive(null);
        }}
      >
        <rect x={0} y={top} width={NOTE_WIDTH} height={section} fill={scene.background} />

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
              style={{ whiteSpace: 'pre' }}
            >
              {item.text.split('\n').map((line, index) => (
                <tspan key={index} x={item.x} dy={index === 0 ? 0 : item.size * 1.35}>
                  {line || ' '}
                </tspan>
              ))}
            </text>
          ),
        )}

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

      {/* The text editor, over the item being typed. data-note-input is what
          the page's keyboard handler looks for: space means Good everywhere
          except in here, where it has to mean a space. */}
      {editing !== null &&
        (() => {
          const item = scene.items.find((one) => one.id === editing);
          if (!item || item.kind !== 'text') return null;
          const factor = scale();
          return (
            <textarea
              data-note-input
              autoFocus
              className={styles.noteEditor}
              value={item.text}
              style={{
                left: item.x * factor,
                // Offset into the visible section, same as the pointer maths.
                top: (item.y - top - item.size * 0.8) * factor,
                fontSize: item.size * factor,
                lineHeight: 1.35,
              }}
              onChange={(event) =>
                change(
                  scene.items.map((one) =>
                    one.id === editing ? { ...one, text: event.target.value } : one,
                  ),
                )
              }
              onBlur={() => {
                // An empty box is removed rather than saved. Otherwise a
                // mis-click leaves an invisible item that counts towards the
                // note's length and cannot be found to delete.
                if (!item.text.trim()) {
                  change(scene.items.filter((one) => one.id !== editing));
                }
                setEditing(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.currentTarget.blur();
              }}
            />
          );
        })()}
    </div>
  );
}

/** The same path the saved record uses, so the screen and the record agree. */
function pathD(stroke: Stroke): string {
  if (stroke.points.length === 0) return '';
  const [first, ...rest] = stroke.points;
  if (rest.length === 0) {
    // A tap has no line, so it is drawn as a dot of its own width — otherwise
    // tapping produces nothing and reads as a dropped input.
    return `M ${first[0]} ${first[1]} l 0.01 0`;
  }
  return `M ${first[0]} ${first[1]} ` + rest.map((p) => `L ${p[0]} ${p[1]}`).join(' ');
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        d="M4 20 L5.5 15.5 L16 5 L19 8 L8.5 18.5 Z M14 7 L17 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        d="M8 7 L4 11 L8 15 M4 11 H14 a5 5 0 0 1 0 10 H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
