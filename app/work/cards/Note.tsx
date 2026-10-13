'use client';

import { useEffect, useRef, useState } from 'react';
import { NOTE_BAND, NOTE_WIDTH, noteHeight } from '@/lib/card-note';
import { newId, type Item, type Scene, type Stroke, type TextItem } from '@/lib/sketch';
import styles from './cards.module.css';

// The panel beside the card, where the writing happens.
//
// A kanji card says "read it, then write it from memory", and the obvious
// question was where. Here, with a tablet pen or with text, in a note that
// belongs to that one card for as long as both exist.
//
// IT GROWS DOWNWARD AND NOTHING IS ERASED BY WRITING AGAIN. Every band that
// has ink, plus one empty one at the bottom, which is where the next attempt
// goes — so the note becomes every attempt at that character in order, with
// the previous one still there to compare against. That comparison is most of
// the reason for writing kanji by hand at all. The arithmetic is in
// lib/card-note.ts; see noteHeight().
//
// The surface is a live SVG and not a canvas, for the sketchpad's reason: a
// canvas turns every word into pixels the moment it is drawn, and these notes
// have text in them.

export default function Note({
  scene,
  onChange,
  /** Changing this scrolls back to the empty band — a new card, a new attempt. */
  cardId,
}: {
  scene: Scene;
  onChange: (scene: Scene) => void;
  cardId: number;
}) {
  const [tool, setTool] = useState<'pen' | 'text'>('pen');
  const [live, setLive] = useState<Stroke | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const pane = useRef<HTMLDivElement | null>(null);
  const surface = useRef<SVGSVGElement | null>(null);
  const drawing = useRef<Stroke | null>(null);

  const height = noteHeight(scene);
  const bands = Math.round(height / NOTE_BAND);

  /* Open at the bottom, which is the empty band. The whole append design
   * depends on this: land anywhere else and the next attempt is written over
   * the last one instead of under it. */
  useEffect(() => {
    const box = pane.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [cardId, bands]);

  /** Screen point to scene coordinates. The page scales; its coordinates do not. */
  function at(event: { clientX: number; clientY: number }): [number, number] {
    const box = surface.current!.getBoundingClientRect();
    return [
      ((event.clientX - box.left) / box.width) * NOTE_WIDTH,
      ((event.clientY - box.top) / box.height) * height,
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
      <div className={styles.noteTools}>
        <button
          type="button"
          className={tool === 'pen' ? styles.toolOn : undefined}
          onClick={() => setTool('pen')}
          title="Draw"
        >
          Pen
        </button>
        <button
          type="button"
          className={tool === 'text' ? styles.toolOn : undefined}
          onClick={() => setTool('text')}
          title="Type"
        >
          Text
        </button>
        <button
          type="button"
          // The last thing added, removed. There is no eraser on purpose: a
          // note is the record of the attempts, and rubbing out a bad one
          // throws away the comparison the note exists for. Undo is for the
          // stroke that went wrong on the way out of the pen.
          onClick={() => change(scene.items.slice(0, -1))}
          disabled={scene.items.length === 0}
          title="Undo the last stroke"
        >
          Undo
        </button>
        <span className={styles.noteHint}>
          {bands > 1 ? `attempt ${bands}` : 'write it here'}
        </span>
      </div>

      <div className={styles.notePane} ref={pane}>
        <svg
          ref={surface}
          className={styles.noteSurface}
          viewBox={`0 0 ${NOTE_WIDTH} ${height}`}
          style={{ aspectRatio: `${NOTE_WIDTH} / ${height}` }}
          data-tool={tool}
          onPointerDown={(event) => {
            // A finger scrolls, a pen and a mouse draw. Without this the only
            // way to look back at an earlier attempt on a tablet would be the
            // scrollbar, because a surface that draws on touch cannot pan.
            if (event.pointerType === 'touch') return;

            if (editing !== null) {
              setEditing(null);
              return;
            }

            const point = at(event);

            if (tool === 'pen') {
              event.currentTarget.setPointerCapture(event.pointerId);
              drawing.current = {
                kind: 'stroke',
                id: newId(),
                colour: '#e8e6e1',
                // In scene units, so a stroke is the same weight whatever the
                // panel is scaled to.
                width: 5,
                points: [point],
              };
              setLive({ ...drawing.current });
              return;
            }

            event.preventDefault();
            const item: TextItem = {
              kind: 'text',
              id: newId(),
              x: point[0],
              // On the baseline of the first line, so the click lands where
              // the text starts rather than above it.
              y: point[1] + 34 * 0.8,
              size: 34,
              colour: '#e8e6e1',
              text: '',
            };
            change([...scene.items, item]);
            setEditing(item.id);
          }}
          onPointerMove={(event) => {
            if (!drawing.current) return;
            drawing.current.points.push(at(event));
            setLive({ ...drawing.current });
          }}
          onPointerUp={() => {
            if (!drawing.current) return;
            change([...scene.items, drawing.current]);
            drawing.current = null;
            setLive(null);
          }}
          onPointerCancel={() => {
            drawing.current = null;
            setLive(null);
          }}
        >
          <rect width={NOTE_WIDTH} height={height} fill={scene.background} />

          {/* A rule where each band ends, so the attempts read as separate
              rather than as one long scribble. */}
          {Array.from({ length: bands - 1 }, (_, band) => (
            <line
              key={band}
              x1={0}
              x2={NOTE_WIDTH}
              y1={(band + 1) * NOTE_BAND}
              y2={(band + 1) * NOTE_BAND}
              stroke="oklch(34% 0 0)"
              strokeWidth={2}
              strokeDasharray="12 10"
            />
          ))}

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
                {item.text.split('\n').map((line, at_) => (
                  <tspan key={at_} x={item.x} dy={at_ === 0 ? 0 : item.size * 1.35}>
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
                  top: (item.y - item.size * 0.8) * factor,
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
                  // note's height and cannot be found to delete.
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
    </div>
  );
}

/** The same path the saved file uses, so the screen and the record agree. */
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
