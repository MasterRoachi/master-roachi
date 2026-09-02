'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  WebGLRenderer,
} from 'three';
import styles from './HeroBook.module.css';

// A floating Orthodox volume, built procedurally — no model file, no textures,
// no licensing question. Scroll drives its rotation; dragging adds an offset
// on top of that, which decays so the book never drifts permanently away.
//
// Loaded via next/dynamic with ssr:false from HeroBookMount, so three.js is
// only fetched after the page is already usable.

const GOLD = 0xd9a441;
const COVER = 0x141414;
const PAGES = 0xe8e2d4;

/** Book proportions, in scene units. */
const W = 2.1;
const H = 3.0;
const COVER_T = 0.09;
const PAGE_T = 0.42;

function buildBook(): Group {
  const book = new Group();

  const coverMat = new MeshStandardMaterial({
    color: new Color(COVER),
    roughness: 0.72,
    metalness: 0.08,
  });
  const goldMat = new MeshStandardMaterial({
    color: new Color(GOLD),
    roughness: 0.22,
    metalness: 0.95,
  });
  const pageMat = new MeshStandardMaterial({
    color: new Color(PAGES),
    roughness: 0.95,
    metalness: 0,
  });

  const halfBlock = PAGE_T / 2;

  // Covers, front and back.
  for (const dir of [1, -1]) {
    const cover = new Mesh(new BoxGeometry(W, H, COVER_T), coverMat);
    cover.position.z = dir * (halfBlock + COVER_T / 2);
    book.add(cover);
  }

  // The page block, inset slightly so the covers overhang like a real binding.
  const pages = new Mesh(new BoxGeometry(W - 0.1, H - 0.1, PAGE_T), pageMat);
  book.add(pages);

  // Gilt edging on the three exposed page faces: fore edge, head, tail.
  const giltT = 0.012;
  const gilts: [number, number, number, number, number][] = [
    [giltT, H - 0.1, PAGE_T, (W - 0.1) / 2, 0],
    [W - 0.1, giltT, PAGE_T, 0, (H - 0.1) / 2],
    [W - 0.1, giltT, PAGE_T, 0, -(H - 0.1) / 2],
  ];
  for (const [w, h, d, x, y] of gilts) {
    const edge = new Mesh(new BoxGeometry(w, h, d), goldMat);
    edge.position.set(x, y, 0);
    book.add(edge);
  }

  // Spine, wrapping the bound edge.
  const spineX = -(W / 2 + COVER_T / 2) + 0.02;
  const spine = new Mesh(
    new BoxGeometry(COVER_T, H, PAGE_T + COVER_T * 2),
    coverMat,
  );
  spine.position.x = spineX;
  book.add(spine);

  // Two gold bands across the spine.
  for (const y of [H * 0.28, -H * 0.28]) {
    const band = new Mesh(
      new BoxGeometry(COVER_T + 0.004, 0.05, PAGE_T + COVER_T * 2 + 0.004),
      goldMat,
    );
    band.position.set(spineX, y, 0);
    book.add(band);
  }

  // The eight-pointed Orthodox cross, inlaid on the front cover: upright, a
  // short titulus above the main bar, and the slanted footrest below.
  const crossZ = halfBlock + COVER_T + 0.008;
  const bar = (w: number, h: number, y: number, rot = 0) => {
    const m = new Mesh(new BoxGeometry(w, h, 0.02), goldMat);
    m.position.set(0, y, crossZ);
    m.rotation.z = rot;
    book.add(m);
  };

  bar(0.075, 1.55, 0.05); // upright
  bar(0.42, 0.07, 0.62); // titulus
  bar(0.78, 0.08, 0.28); // main bar
  bar(0.5, 0.07, -0.42, 0.32); // slanted footrest

  return book;
}

export default function HeroBook() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 9.6);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    // Capping DPR keeps this cheap on high-density displays, where the extra
    // pixels buy nothing at this size.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    scene.add(new AmbientLight(0xffffff, 0.55));

    const key = new DirectionalLight(0xfff2dd, 2.1);
    key.position.set(3, 4, 5);
    scene.add(key);

    const rim = new DirectionalLight(0x9fb4d0, 1.1);
    rim.position.set(-4, 1, -3);
    scene.add(rim);

    // A warm point light close in front makes the gilt actually catch.
    const glint = new PointLight(0xffd9a0, 12, 14, 2);
    glint.position.set(1.6, 1.4, 3.2);
    scene.add(glint);

    const book = buildBook();
    scene.add(book);

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // `scrollRot` is where scrolling says the book should be. `dragRot` is the
    // offset the reader has added by dragging. They sum, so dragging never
    // fights scrolling — it displaces it, then decays back.
    let scrollRot = 0;
    let dragRot = 0;
    let dragVel = 0;
    let dragging = false;
    let lastX = 0;
    let pointerX = 0;
    let pointerY = 0;

    const onScroll = () => {
      const p = Math.min(window.scrollY / window.innerHeight, 1);
      scrollRot = p * Math.PI * 1.1;
    };
    onScroll();

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      dragVel = 0;
      host.setPointerCapture(e.pointerId);
      host.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointerY = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      dragVel = dx * 0.006;
      dragRot += dragVel;
    };

    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (host.hasPointerCapture(e.pointerId)) {
        host.releasePointerCapture(e.pointerId);
      }
      host.style.cursor = 'grab';
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup', endDrag);
    host.addEventListener('pointercancel', endDrag);
    host.addEventListener('pointerleave', endDrag);
    host.style.cursor = 'grab';

    // The loop only runs while the canvas is on screen and the tab is visible,
    // so an idle background tab costs nothing.
    let raf = 0;
    let visible = true;
    const start = performance.now();

    function tick() {
      raf = 0;
      const t = (performance.now() - start) / 1000;

      if (!dragging) {
        dragRot += dragVel;
        dragVel *= 0.94;
        dragRot *= 0.985;
      }

      book.rotation.y = scrollRot + dragRot + Math.sin(t * 0.35) * 0.09;
      book.rotation.x = -0.12 + Math.sin(t * 0.5) * 0.05 + pointerY * 0.12;
      book.rotation.z = Math.sin(t * 0.27) * 0.035 + pointerX * 0.04;
      book.position.y = Math.sin(t * 0.6) * 0.11;

      renderer.render(scene, camera);
      if (visible && !reduced) raf = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !reduced && !raf) raf = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (visible && !reduced && !raf) {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      // One static frame, held at a flattering angle.
      book.rotation.set(-0.12, 0.45, 0.02);
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', endDrag);
      host.removeEventListener('pointercancel', endDrag);
      host.removeEventListener('pointerleave', endDrag);
      // Three.js holds GPU resources that garbage collection will not reclaim.
      book.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (o.material as MeshStandardMaterial).dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={hostRef} className={styles.host} aria-hidden="true" />;
}
