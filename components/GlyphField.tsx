'use client';

import { useEffect, useRef } from 'react';
import styles from './GlyphField.module.css';

// The backdrop for Thoughts, and the fourth of these.
//
// Stars, arcade pixels and candles are all taken, and reusing one would have
// made this the page that borrowed. Letterforms are what the page is about:
// punctuation and characters drifting in the dark, sparse and slow enough to
// read as texture rather than as text you are meant to decipher.
//
// Same structure as the other three, because their performance work is sound:
// canvas 2D, and a loop that stops when the section is off screen, when the
// tab is hidden, and under reduced motion.

interface Glyph {
  char: string;
  /** Normalised, 0–1, so the field is independent of canvas size. */
  x: number;
  y: number;
  /** Font size in CSS pixels. */
  size: number;
  alpha: number;
  /** Upward travel, fractions of the height per second. */
  rise: number;
  /** A slow lean, so nothing sits perfectly square. */
  tilt: number;
  /** How far it answers scroll and pointer. */
  parallax: number;
}

/**
 * Marks and letterforms from several writing systems, because a page about
 * words should not assume they are only ever written in one.
 *
 * Chosen to read as shapes rather than as a message — nothing here spells
 * anything, and the Japanese are single characters rather than fragments of a
 * sentence.
 */
const CHARS = [
  // Punctuation: the parts of writing that are decisions, not vocabulary.
  '¶', '§', '&', '”', '“', ';', ':', '—', '?', '!', '*', '…', '·', '†',
  // Latin
  'a', 'g', 'e', 'R', 'w', 'ß', 'æ', 'Q', 'k', 'y',
  // Greek
  'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ψ', 'Ω', 'Σ', 'Φ',
  // Japanese — kana, and kanji for word, write, book, way, text, character
  'あ', 'い', 'う', 'か', 'さ', 'ゆ', 'を', 'ん',
  'ア', 'カ', 'サ', 'ヲ', 'ネ', 'ミ',
  '言', '書', '本', '道', '文', '字',
  // Cyrillic
  'д', 'ж', 'з', 'и', 'я', 'ф', 'Ж',
];

const COUNT = 46;

/** How far the field travels across the section's scroll, in CSS px. */
const SCROLL_SHIFT = 44;
/** How far the cursor pulls it, in CSS px. */
const POINTER_SHIFT = 18;

export default function GlyphField() {
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

    const glyphs: Glyph[] = Array.from({ length: COUNT }, () => ({
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      x: Math.random(),
      y: Math.random(),
      // A wide spread, weighted small: most sit far back and a few come right
      // forward. The exponent is what keeps the large ones rare, rather than
      // giving an even scatter of middling sizes.
      size: 11 + Math.random() ** 2.8 * 165,
      alpha: 0.05 + Math.random() * 0.13,
      rise: 0.006 + Math.random() * 0.018,
      tilt: (Math.random() - 0.5) * 0.5,
      parallax: 0.15 + Math.random() * 0.85,
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
      // from it afterwards is NaN — which canvas swallows silently, leaving a
      // field that simply stops drawing.
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
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const g of glyphs) {
        const offX = pointerX * POINTER_SHIFT * g.parallax;
        const offY =
          sp * SCROLL_SHIFT * g.parallax + pointerY * POINTER_SHIFT * g.parallax;

        // Wrapped in normalised space so the drift is seamless at any height.
        let ny = (g.y - elapsed * g.rise) % 1;
        if (ny < 0) ny += 1;

        const px = g.x * w + offX;
        const py = ny * h + offY;
        if (!Number.isFinite(px) || !Number.isFinite(py)) continue;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(g.tilt);
        ctx.globalAlpha = g.alpha;
        ctx.fillStyle = '#ffffff';
        // A real font stack, not a CSS custom property. Canvas parses this
        // string itself and knows nothing about var(), so an unresolvable
        // font is discarded silently and every glyph falls back to the
        // default 10px. The CJK families are named so those characters render
        // as themselves rather than as tofu.
        ctx.font = `600 ${g.size}px system-ui, "Segoe UI", "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", sans-serif`;
        ctx.fillText(g.char, 0, 0);
        ctx.restore();
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

    // Painted once regardless, so reduced motion gets a field rather than an
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
