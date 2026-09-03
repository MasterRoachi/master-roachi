'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import styles from './ShirtViewer.module.css';

// The featured garment, turning in space.
//
// Worth being straight about what this is: the cut-out mockup mapped onto a
// curved surface and lit, not a modelled garment. A real 3D tee needs a mesh
// and a fabric shader, and neither exists here.
//
// So it turns rather than spins. The texture is a front view, and rotating it
// past about sixty degrees would show a mirrored front pretending to be a
// back. Held inside that range it reads as cloth catching the light; taken
// beyond it, the trick shows.
//
// The curve is a cylindrical bend of the plane, the same arithmetic the book
// on the homepage uses for its page leaves — bending across the width while
// preserving arc length, so the garment keeps its proportions instead of
// squashing toward the middle.

/** How far the plane bends across its width, in radians. */
const CURL = 0.55;
/** The furthest it will ever turn from face-on, in radians. */
const LIMIT = 0.62;
/** How far the idle drift swings. */
const DRIFT = 0.26;

export default function ShirtViewer({
  src,
  alt,
}: {
  src: string;
  alt?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // No WebGL. The caller leaves the plain <img> in place underneath.
      return;
    }
    renderer.setClearAlpha(0);
    host.appendChild(renderer.domElement);
    renderer.domElement.className = styles.canvas;

    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    scene.add(new AmbientLight(0xffffff, 1.5));
    // Two lights, off to either side, so turning the garment moves a highlight
    // across it. One light and the curve would be invisible.
    const key = new DirectionalLight(0xfff0f6, 2.1);
    key.position.set(-3, 2.5, 4);
    scene.add(key);
    const rim = new DirectionalLight(0xbfe4ff, 1.5);
    rim.position.set(4, -1, 2.5);
    scene.add(rim);

    // Enough segments across the width to bend smoothly; the height needs
    // almost none, since the curve runs one way only.
    const geometry = new PlaneGeometry(3.4, 4.4, 60, 2);
    const pos = geometry.attributes.position;
    const width = 3.4;
    const k = CURL / width;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Arc length is preserved: the flat distance from centre becomes the
      // angle swept, so the garment does not narrow as it bends.
      const a = x * k;
      pos.setX(i, Math.sin(a) / k);
      pos.setZ(i, (Math.cos(a) - 1) / k);
    }
    geometry.computeVertexNormals();

    const material = new MeshStandardMaterial({
      transparent: true,
      roughness: 0.86,
      metalness: 0,
      // Kills the fringe that bilinear filtering leaves around a cut-out.
      alphaTest: 0.06,
    });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    let disposed = false;
    new TextureLoader().load(src, (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      material.map = texture;
      material.needsUpdate = true;
      host.dataset.ready = 'true';
    });

    const resize = () => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Where the user has dragged it to, and where it is actually pointing —
    // eased toward the target so a flick settles rather than snapping.
    let target = 0;
    let current = 0;
    let held = false;
    let lastX = 0;

    const down = (e: PointerEvent) => {
      held = true;
      lastX = e.clientX;
      host.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!held) return;
      target = Math.max(
        -LIMIT,
        Math.min(LIMIT, target + (e.clientX - lastX) * 0.006),
      );
      lastX = e.clientX;
    };
    const up = (e: PointerEvent) => {
      held = false;
      if (host.hasPointerCapture(e.pointerId)) {
        host.releasePointerCapture(e.pointerId);
      }
    };
    host.addEventListener('pointerdown', down);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', up);

    let raf = 0;
    let visible = true;
    let elapsed = 0;
    let last = performance.now();

    function frame() {
      raf = 0;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced) elapsed += dt;

      // Left alone it drifts; touched, it goes where it is put and stays
      // there until released.
      const wanted = held ? target : target + Math.sin(elapsed * 0.5) * DRIFT;
      current += (wanted - current) * Math.min(1, dt * 4);
      mesh.rotation.y = current;
      mesh.rotation.z = current * 0.05;

      renderer.render(scene, camera);
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !reduced && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
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
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    frame();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('pointerdown', down);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up);
      host.removeEventListener('pointercancel', up);
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [src]);

  return (
    <div
      ref={hostRef}
      className={styles.host}
      role="img"
      aria-label={alt || 'The garment, rotating'}
    />
  );
}
