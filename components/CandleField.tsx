'use client';

import { useEffect, useRef } from 'react';
import styles from './CandleField.module.css';

// The backdrop for Foundations.
//
// Starfield would have worked and would have been wrong: it is the same
// reference as three other pages, and this one should not look borrowed.
// Candlelight is the room this page is actually about — a stand of votives in
// a dark church.
//
// Structurally the same as Starfield and ArcadeField, because the performance
// work in those is sound: canvas 2D, and a loop that stops when the section is
// off screen, when the tab is hidden, and under reduced motion.
//
// What differs is the behaviour. These are few, large and soft rather than
// many and sharp; they drift upward the way heat does rather than sideways;
// and each one breathes on its own cycle, so the field never pulses in unison
// the way a single shared clock would make it.

interface Flame {
  /** Normalised, 0–1, so the field is independent of canvas size. */
  x: number;
  y: number;
  /** Radius in CSS pixels at rest. */
  size: number;
  alpha: number;
  /** Upward travel, fractions of the height per second. */
  rise: number;
  /** Its own flicker speed and offset, so no two breathe together. */
  rate: number;
  phase: number;
  /** How far it answers scroll and pointer. */
  parallax: number;
}

const COUNT = 14;

/** How far the field travels across the section's scroll, in CSS px. */
const SCROLL_SHIFT = 34;
/** How far the cursor pulls it, in CSS px. */
const POINTER_SHIFT = 12;

export default function CandleField() {
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

    const flames: Flame[] = Array.from({ length: COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      // A spread of sizes, weighted small, so a few read as near and the rest
      // as far back in the dark.
      size: 26 + Math.random() ** 2 * 90,
      alpha: 0.1 + Math.random() * 0.22,
      rise: 0.004 + Math.random() * 0.012,
      rate: 0.6 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      parallax: 0.2 + Math.random() * 0.8,
    }));

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
      // Light adds to light: two flames overlapping should be brighter, not
      // one occluding the other.
      ctx.globalCompositeOperation = 'lighter';

      for (const f of flames) {
        // Its own slow breath, never below half strength — a candle gutters,
        // it does not switch off.
        const breath = 0.75 + 0.25 * Math.sin(elapsed * f.rate + f.phase);

        const offX = pointerX * POINTER_SHIFT * f.parallax;
        const offY =
          sp * SCROLL_SHIFT * f.parallax + pointerY * POINTER_SHIFT * f.parallax;

        // Wrapped in normalised space so the rise is seamless at any height.
        let ny = (f.y - elapsed * f.rise) % 1;
        if (ny < 0) ny += 1;

        const px = f.x * w + offX;
        const py = ny * h + offY;
        const r = f.size * breath;

        // A backstop, not the fix — the pointer guard above is that. But
        // createRadialGradient throws on a non-finite argument, and a
        // decorative backdrop should never be able to take a page down. A
        // skipped flame is invisible; an exception is not.
        if (!Number.isFinite(px) || !Number.isFinite(py) || !(r > 0)) continue;

        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(255, 214, 140, ${f.alpha * breath})`);
        g.addColorStop(0.4, `rgba(226, 160, 62, ${f.alpha * breath * 0.45})`);
        g.addColorStop(1, 'rgba(180, 110, 30, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

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

    // Painted once regardless, so reduced motion gets a lit room rather than
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

  return <div ref={hostRef} className={styles.host} aria-hidden="true" />;
}
