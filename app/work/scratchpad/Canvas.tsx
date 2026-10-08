'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './scratchpad.module.css';

// Drawing, kept as STROKES rather than as pixels.
//
// A canvas is a bitmap with no memory: resizing it clears it, and there is no
// way to take back the last line. Keeping the strokes and redrawing from them
// solves both at once — undo drops the last stroke, and a resize replays what
// is left — where a pixel buffer solves neither.
//
// Pointer events rather than mouse or touch, so a stylus, a finger and a mouse
// are all the same code path. The rig has a drawing tablet; this is what makes
// it work without a second implementation.

interface Stroke {
  colour: string;
  width: number;
  /** Points in CANVAS coordinates, so a redraw after a resize lands correctly. */
  points: { x: number; y: number }[];
}

export interface CanvasHandle {
  /** Base64 PNG with no data-URI prefix, or null when nothing has been drawn. */
  toBase64(): string | null;
  isEmpty(): boolean;
}

const COLOURS = ['#f5f5f5', '#d9a13b', '#7aa2f7', '#9ece6a', '#f7768e'];

export default function Canvas({
  onReady,
  onChange,
}: {
  onReady: (handle: CanvasHandle) => void;
  onChange: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef<Stroke | null>(null);
  const [colour, setColour] = useState(COLOURS[0]);
  const [width, setWidth] = useState(3);
  const [, bump] = useState(0);

  /** Redraw everything from the stroke list. The only thing that paints. */
  function repaint() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.fillStyle = '#16181d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    for (const stroke of [...strokes.current, drawing.current].filter(Boolean) as Stroke[]) {
      context.strokeStyle = stroke.colour;
      context.lineWidth = stroke.width;
      context.beginPath();
      stroke.points.forEach((point, i) => {
        if (i === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      // A single tap is a dot, which a stroke of one point would not draw.
      if (stroke.points.length === 1) {
        context.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        context.fillStyle = stroke.colour;
        context.fill();
      }
      context.stroke();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sized to its box, at device resolution so lines are not soft on a
    // high-DPI screen. Strokes are in canvas coordinates, so a resize is a
    // repaint rather than a loss.
    const fit = () => {
      const box = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(box.width * ratio);
      canvas.height = Math.round(box.height * ratio);
      repaint();
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);

    onReady({
      toBase64: () => {
        if (strokes.current.length === 0) return null;
        return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
      },
      isEmpty: () => strokes.current.length === 0,
    });

    return () => observer.disconnect();
    // onReady is called once with a handle that reads live refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Pointer position in canvas coordinates. */
  function at(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * canvas.width,
      y: ((event.clientY - box.top) / box.height) * canvas.height,
    };
  }

  const ratio = () => window.devicePixelRatio || 1;

  return (
    <div className={styles.drawing}>
      <div className={styles.tools}>
        {COLOURS.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={`Colour ${option}`}
            aria-pressed={colour === option}
            className={colour === option ? styles.swatchOn : styles.swatch}
            style={{ background: option }}
            onClick={() => setColour(option)}
          />
        ))}

        <label className={styles.widthLabel}>
          <input
            type="range"
            min={1}
            max={18}
            value={width}
            aria-label="Pen width"
            onChange={(event) => setWidth(Number(event.target.value))}
          />
          {width}px
        </label>

        <button
          type="button"
          onClick={() => {
            strokes.current.pop();
            repaint();
            bump((n) => n + 1);
            onChange();
          }}
          disabled={strokes.current.length === 0}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            if (strokes.current.length === 0) return;
            if (!confirm('Clear the drawing?')) return;
            strokes.current = [];
            repaint();
            bump((n) => n + 1);
            onChange();
          }}
          disabled={strokes.current.length === 0}
        >
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={(event) => {
          // Capture, so a stroke that leaves the canvas mid-line still ends
          // on this element rather than being left open.
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = { colour, width: width * ratio(), points: [at(event)] };
          repaint();
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          drawing.current.points.push(at(event));
          repaint();
        }}
        onPointerUp={() => {
          if (!drawing.current) return;
          strokes.current.push(drawing.current);
          drawing.current = null;
          repaint();
          bump((n) => n + 1);
          onChange();
        }}
        onPointerCancel={() => {
          drawing.current = null;
          repaint();
        }}
      />
    </div>
  );
}
