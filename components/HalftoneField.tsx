'use client';

import { useEffect, useRef } from 'react';
import styles from './HalftoneField.module.css';

// The backdrop for the store, and the fifth of these.
//
// Halftone: the dot screen a design is broken into before it is printed, which
// is the one reference that belongs to a shop selling printed things and to
// nothing else on this site.
//
// Same structure as the other four, because their performance work is sound:
// canvas 2D, and a loop that stops when the section is off screen, when the
// tab is hidden, and under reduced motion.
//
// Unlike those, the dots are a fixed grid rather than scattered particles.
// What moves is their size — a slow standing wave across the sheet, with the
// cursor opening the screen up around itself the way a lighter tone does.

/** Grid spacing in CSS pixels. */
const PITCH = 26;
/** Largest a dot ever gets, as a fraction of the pitch. */
const MAX_RADIUS = 0.34;
/** How far from the cursor the screen opens, in CSS pixels. */
const REACH = 190;

export default function HalftoneField() {
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
      // canvas, so nothing appears. Repaint here whenever no loop is running
      // to correct it later.
      if (!raf) draw();
    });
    ro.observe(host);

    // In CSS pixels within the host, not normalised: the dots respond to
    // actual distance, so the falloff is the same size everywhere.
    let pointerX = -9999;
    let pointerY = -9999;
    const onPointer = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointerX = e.clientX - r.left;
      pointerY = e.clientY - r.top;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

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

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';

      const cols = Math.ceil(w / PITCH) + 1;
      const rows = Math.ceil(h / PITCH) + 1;

      for (let iy = 0; iy < rows; iy++) {
        const y = iy * PITCH;
        for (let ix = 0; ix < cols; ix++) {
          const x = ix * PITCH;

          // A standing wave, two frequencies crossed so the pattern never
          // repeats obviously along either axis.
          const wave =
            Math.sin(x * 0.012 + elapsed * 0.35) *
            Math.cos(y * 0.016 - elapsed * 0.27);

          // The cursor opens the screen: dots near it grow, and the effect
          // falls off smoothly rather than cutting at the edge of its reach.
          const dx = x - pointerX;
          const dy = y - pointerY;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = d < REACH ? 1 - d / REACH : 0;

          const t = 0.32 + 0.28 * wave + near * near * 0.7;
          const r = PITCH * MAX_RADIUS * Math.max(0, Math.min(1, t));
          if (r < 0.35) continue;

          ctx.globalAlpha = 0.05 + near * 0.14;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
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

    // Painted once regardless, so reduced motion gets a screen rather than an
    // empty rectangle.
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

  return <div ref={hostRef} className={styles.host} aria-hidden="true" />;
}
