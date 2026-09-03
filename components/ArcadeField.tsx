'use client';

import { useEffect, useRef } from 'react';
import styles from './ArcadeField.module.css';

// The backdrop for the Fun hero.
//
// Starfield was reaching for space, which is not what this side of the site is
// about — it read as galaxy rather than as games. This keeps that component's
// structure, because the performance work in it is sound: canvas 2D, layers at
// different rates, and a loop that stops when the section is off screen, the
// tab is hidden, or motion is reduced.
//
// What changes is the vocabulary. Pixels are squares snapped to whole device
// pixels rather than circles, so they stay crisp and blocky at any size; they
// travel right to left like a side-scroller rather than wandering; and the
// wash behind them is a playfield grid with scanlines over the top, which is
// the CRT this is actually referring to.

interface Layer {
  /** Normalised positions, 0–1, independent of canvas size. */
  x: Float32Array;
  y: Float32Array;
  /** Square edge in CSS pixels. Whole numbers keep the blocks sharp. */
  size: number;
  alpha: number;
  /** Leftward travel, CSS pixels per second. */
  drift: number;
  /** How strongly this layer answers scroll and pointer. */
  parallax: number;
  /** Which pixels take the accent rather than white. */
  lit: Uint8Array;
}

const LAYERS: Omit<Layer, 'x' | 'y' | 'lit'>[] = [
  { size: 2, alpha: 0.3, drift: 5, parallax: 0.12 },
  { size: 3, alpha: 0.42, drift: 11, parallax: 0.28 },
  { size: 5, alpha: 0.55, drift: 21, parallax: 0.55 },
  { size: 8, alpha: 0.7, drift: 34, parallax: 0.95 },
];

const COUNTS = [110, 66, 34, 14];

/** How far the layers travel across the section's full scroll, in CSS px. */
const SCROLL_SHIFT = 40;
/** How far the cursor pulls them, in CSS px. */
const POINTER_SHIFT = 16;

/** Lime, the colour this side of the site carries. */
const ACCENT = '#a6e22e';

export default function ArcadeField() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const canvas = document.createElement('canvas');
    canvas.className = styles.canvas;
    host.appendChild(canvas);
    const ctx2d = canvas.getContext('2d', { alpha: true });
    if (!ctx2d) return;
    const ctx = ctx2d;

    const layers: Layer[] = LAYERS.map((spec, i) => {
      const n = COUNTS[i];
      const x = new Float32Array(n);
      const y = new Float32Array(n);
      const lit = new Uint8Array(n);
      for (let k = 0; k < n; k++) {
        x[k] = Math.random();
        y[k] = Math.random();
        // A minority glow in the accent, so the field belongs to this page
        // rather than being a generic texture.
        lit[k] = Math.random() < 0.16 ? 1 : 0;
      }
      return { ...spec, x, y, lit };
    });

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = r.width;
      h = r.height;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Blocks, not blurs.
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      // The one guaranteed paint happens at the end of this effect, which can
      // land before the host has been laid out — drawing into a zero-sized
      // canvas, so nothing appears. Whenever no loop is running to correct
      // that later (reduced motion, or a browser granting no animation
      // frames), repaint here so the field still arrives.
      if (!raf) draw();
    });
    ro.observe(host);

    let pointerX = 0;
    let pointerY = 0;
    const onPointer = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      // A zero-sized box divides to Infinity, and every coordinate derived
      // from it afterwards is NaN. Canvas arc() ignores that silently, so it
      // only ever showed up as a field that quietly stopped drawing;
      // createRadialGradient throws outright, which is how it was found.
      if (!r.width || !r.height) return;
      pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointerY = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    /** -1 when the section is below the fold, +1 once it has passed above. */
    const scrollProgress = () => {
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight;
      const centre = r.top + r.height / 2;
      return Math.max(
        -1,
        Math.min(1, (vh / 2 - centre) / (vh / 2 + r.height / 2)),
      );
    };

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let elapsed = 0;

    function draw() {
      raf = 0;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced) elapsed += dt;

      const sp = scrollProgress();
      ctx.clearRect(0, 0, w, h);

      for (const layer of layers) {
        // Negative, so the field travels the way a side-scroller does.
        const dx = -elapsed * layer.drift;
        const offX = pointerX * POINTER_SHIFT * layer.parallax;
        const offY =
          sp * SCROLL_SHIFT * layer.parallax +
          pointerY * POINTER_SHIFT * layer.parallax;

        for (let k = 0; k < layer.x.length; k++) {
          let px = (layer.x[k] * w + dx + offX) % w;
          if (px < 0) px += w;
          const py = layer.y[k] * h + offY;
          if (py < -layer.size || py > h + layer.size) continue;

          ctx.globalAlpha = layer.alpha;
          ctx.fillStyle = layer.lit[k] ? ACCENT : '#ffffff';
          // Snapped to whole pixels, which is what keeps the edges hard
          // instead of smeared across two subpixels.
          ctx.fillRect(
            Math.round(px),
            Math.round(py),
            layer.size,
            layer.size,
          );
        }
      }
      ctx.globalAlpha = 1;

      if (visible && !reduced) raf = requestAnimationFrame(draw);
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !reduced && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(draw);
        }
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (visible && !reduced && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Paint once regardless, so reduced motion still gets a field rather than
    // an empty rectangle.
    draw();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, []);

  return (
    <div ref={hostRef} className={styles.host} aria-hidden="true">
      {/* Drawn over the canvas rather than under it, so the scanlines fall
          across the pixels the way they would on the glass. */}
      <div className={styles.scanlines} />
    </div>
  );
}
