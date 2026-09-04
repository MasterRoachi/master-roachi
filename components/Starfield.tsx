'use client';

import { useEffect, useRef } from 'react';
import styles from './Starfield.module.css';

// A drifting starfield behind the projects grid, to give the section depth.
//
// Canvas 2D rather than WebGL: this is points and translations, and three.js
// would be roughly half a megabyte for something a few hundred lines of
// arithmetic does. It is a plain client component rather than a dynamic import
// for the same reason — there is nothing here worth code-splitting.
//
// Depth comes from four layers moving at different rates. Near stars are
// larger, brighter and drift faster; far stars barely move. Scrolling and the
// cursor both displace the layers by amounts scaled to their depth, which is
// what makes it read as distance rather than as a moving texture.

interface Layer {
  /** Normalised positions, 0–1, independent of canvas size. */
  x: Float32Array;
  y: Float32Array;
  /** Per-star radius in CSS pixels. */
  size: number;
  alpha: number;
  /** Horizontal drift, CSS pixels per second. */
  drift: number;
  /** How strongly this layer responds to scroll and pointer. */
  parallax: number;
  /** Index into the palette per star. */
  warm: Uint8Array;
}

const LAYERS: Omit<Layer, 'x' | 'y' | 'warm'>[] = [
  { size: 0.7, alpha: 0.32, drift: 1.6, parallax: 0.12 },
  { size: 1.0, alpha: 0.46, drift: 3.4, parallax: 0.28 },
  { size: 1.45, alpha: 0.64, drift: 6.5, parallax: 0.55 },
  { size: 2.1, alpha: 0.85, drift: 10.5, parallax: 0.95 },
];

const COUNTS = [150, 95, 58, 28];

/** How far the layers travel across the section's full scroll, in CSS px. */
const SCROLL_SHIFT = 46;
/** How far the cursor pulls them, in CSS px. */
const POINTER_SHIFT = 14;

export default function Starfield({
  tint,
  density = 1,
}: {
  tint?: string;
  /**
   * Scales the star count. Below 1 thins the field without changing how it
   * moves, for pages that want the black broken rather than filled — About
   * runs at a quarter.
   */
  density?: number;
} = {}) {
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
    // Aliased after the guard: the render loop is called later, so TypeScript
    // cannot carry the narrowing into it from the original binding.
    const ctx = ctx2d;

    // A fixed seed would be nicer for reproducibility, but the field is
    // decorative and never compared between loads.
    const layers: Layer[] = LAYERS.map((spec, i) => {
      // At least a couple per layer, so a very low density thins the field
      // rather than emptying a layer and losing its parallax entirely.
      const n = Math.max(2, Math.round(COUNTS[i] * density));
      const x = new Float32Array(n);
      const y = new Float32Array(n);
      const warm = new Uint8Array(n);
      for (let k = 0; k < n; k++) {
        x[k] = Math.random();
        y[k] = Math.random();
        // A minority of stars take the accent, so the field sits in the
        // palette rather than reading as a generic space background.
        warm[k] = Math.random() < 0.09 ? 1 : 0;
      }
      return { ...spec, x, y, warm };
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
      return Math.max(-1, Math.min(1, (vh / 2 - centre) / (vh / 2 + r.height / 2)));
    };

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let elapsed = 0;

    function draw() {
      raf = 0;
      const now = performance.now();
      // Clamped so a backgrounded tab returning does not jump the drift.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced) elapsed += dt;

      const sp = scrollProgress();
      ctx.clearRect(0, 0, w, h);

      for (const layer of layers) {
        const dx = elapsed * layer.drift;
        const offX = pointerX * POINTER_SHIFT * layer.parallax;
        const offY =
          sp * SCROLL_SHIFT * layer.parallax +
          pointerY * POINTER_SHIFT * layer.parallax;

        for (let k = 0; k < layer.x.length; k++) {
          // Wrap in normalised space so the field is seamless at any width.
          let px = (layer.x[k] * w + dx + offX) % w;
          if (px < 0) px += w;
          const py = layer.y[k] * h + offY;
          if (py < -4 || py > h + 4) continue;

          ctx.globalAlpha = layer.alpha;
          ctx.fillStyle = layer.warm[k] ? '#d9a441' : '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, layer.size, 0, Math.PI * 2);
          ctx.fill();
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

    // Always paint once, so reduced-motion and pre-scroll both show a field
    // rather than an empty rectangle.
    draw();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [density]);

  // A tint lets a page colour its own depth — project pages use their own
  // accent so the field belongs to that project rather than being generic.
  return (
    <div
      ref={hostRef}
      className={styles.host}
      style={tint ? { background: tint } : undefined}
      aria-hidden="true"
    />
  );
}
