'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  DoubleSide,
  Euler,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import styles from './ShirtViewer.module.css';

// The featured garment: a real modelled shirt, with the printed design
// projected onto it.
//
// Two earlier versions of this are worth remembering, because both were wrong
// in the same direction. The first bent Printful's mockup over a curved plane,
// which can never work — the mockup is a photograph, so its folds and
// highlights are painted into the pixels and stay put while the surface moves
// underneath. The second modelled the shirt from swept superellipses, which
// did turn properly but only ever looked like a shirt-shaped object; cloth is
// mostly folds, and folds are not a formula.
//
// This one is Tabbuso's model, credited on the page as its licence requires.
// See public/store/tshirt-license.txt.
//
// The mockup still supplies the two things the model cannot: the artwork, and
// where on the chest it belongs. scripts/store-art.mjs lifts the print off the
// garment and records its position as fractions of the silhouette. Since both
// the mockup and the model are a front-facing shirt, those fractions carry
// across directly — a ray is fired at the model from where the print sits in
// the photograph, and the decal is laid on wherever it lands.

/** The furthest it will ever turn from face-on, in radians. */
const LIMIT = 0.85;
/** How far the idle drift swings. */
const DRIFT = 0.34;

const MODEL_SRC = '/store/tshirt.glb';

export interface PrintPlacement {
  src: string;
  /** Centre of the print, as a fraction across and down the silhouette. */
  x: number;
  y: number;
  /** Its width, as a fraction of the silhouette width. */
  width: number;
}

export default function ShirtViewer({
  print,
  fabric = '#2f2f2f',
  alt,
}: {
  print?: PrintPlacement | null;
  /** The garment colour, measured off the mockup. */
  fabric?: string;
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
      // No WebGL. The caller leaves the flat mockup in place underneath.
      return;
    }
    renderer.setClearAlpha(0);
    host.appendChild(renderer.domElement);
    renderer.domElement.className = styles.canvas;

    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, 0.1, 2000);

    // Low ambient on purpose. Raised, it swamps the directionals, every facet
    // comes back equally lit, and the folds this model was chosen for stop
    // reading at all.
    scene.add(new AmbientLight(0xffffff, 0.5));
    const key = new DirectionalLight(0xfff2f7, 2.3);
    key.position.set(-3.4, 3, 4.2);
    scene.add(key);
    const fill = new DirectionalLight(0xc6e6ff, 1.1);
    fill.position.set(4.2, -0.6, 2.4);
    scene.add(fill);
    // Behind and above, to pick the shoulders off the background.
    const back = new DirectionalLight(0xffffff, 0.9);
    back.position.set(0.5, 2.6, -4);
    scene.add(back);

    const pivot = new Object3D();
    scene.add(pivot);

    let disposed = false;
    let size = new Vector3(1, 1, 1);
    const disposables: { dispose(): void }[] = [];

    const ready = () => {
      if (!disposed) host.dataset.ready = 'true';
    };

    const fitCamera = () => {
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      // Depth counts toward the width because the garment turns.
      const reach = size.x + size.z * 0.5;
      camera.position.z =
        Math.max(
          size.y / 2 / Math.tan(vFov / 2),
          reach / 2 / Math.tan(hFov / 2),
        ) * 1.08;
    };

    new GLTFLoader().load(
      MODEL_SRC,
      (gltf) => {
        if (disposed) return;

        const cloth = new MeshStandardMaterial({
          color: new Color(fabric),
          roughness: 0.93,
          metalness: 0,
          side: DoubleSide,
        });
        disposables.push(cloth);

        let target: Mesh | null = null;
        gltf.scene.traverse((child) => {
          const mesh = child as Mesh;
          if (!mesh.isMesh) return;
          mesh.material = cloth;
          // The optimiser joins the model into a single mesh; taking the
          // largest is only insurance in case that ever changes, since a decal
          // can be projected onto one mesh at a time.
          const count = mesh.geometry.getAttribute('position')?.count ?? 0;
          const best =
            target?.geometry.getAttribute('position')?.count ?? -1;
          if (count > best) target = mesh;
        });

        pivot.add(gltf.scene);

        // Centre on the origin so it turns about itself rather than swinging
        // around wherever the modeller left it.
        const box = new Box3().setFromObject(gltf.scene);
        size = box.getSize(new Vector3());
        gltf.scene.position.sub(box.getCenter(new Vector3()));
        camera.near = Math.max(0.01, size.length() / 1000);
        camera.far = size.length() * 10;
        camera.updateProjectionMatrix();
        fitCamera();

        if (!print || !target) {
          ready();
          return;
        }

        const shirt = target as Mesh;
        pivot.updateMatrixWorld(true);
        const bounds = new Box3().setFromObject(shirt);

        new TextureLoader().load(
          print.src,
          (texture) => {
            if (disposed) {
              texture.dispose();
              return;
            }
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            disposables.push(texture);

            // Fire a ray at the chest from exactly where the print sits in the
            // photograph, and put the decal wherever it lands.
            const from = new Vector3(
              bounds.min.x + print.x * (bounds.max.x - bounds.min.x),
              bounds.max.y - print.y * (bounds.max.y - bounds.min.y),
              bounds.max.z + Math.max(1, size.z),
            );
            const ray = new Raycaster(from, new Vector3(0, 0, -1));
            const hit = ray.intersectObject(shirt, true)[0];
            if (!hit) {
              ready();
              return;
            }

            // Face the decal along the surface normal at the point it struck.
            const look = new Vector3();
            if (hit.face) {
              look
                .copy(hit.face.normal)
                .transformDirection(shirt.matrixWorld)
                .add(hit.point);
            } else {
              look.copy(hit.point).add(new Vector3(0, 0, 1));
            }
            const aim = new Object3D();
            aim.position.copy(hit.point);
            aim.lookAt(look);
            const orientation = new Euler().copy(aim.rotation);

            const image = texture.image as { width: number; height: number };
            const wide = print.width * (bounds.max.x - bounds.min.x);
            const decalSize = new Vector3(
              wide,
              wide * (image.height / image.width),
              // Deep enough to wrap a fold, shallow enough not to reach the
              // back of the garment and print there as well.
              Math.max(wide * 0.6, size.z * 0.18),
            );

            const geometry = new DecalGeometry(
              shirt,
              hit.point,
              orientation,
              decalSize,
            );
            const material = new MeshStandardMaterial({
              map: texture,
              transparent: true,
              roughness: 0.72,
              metalness: 0,
              // Ink sits on cloth: it takes the same light and must not fight
              // the surface it is printed on for depth.
              depthTest: true,
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -4,
            });
            disposables.push(geometry, material);
            // Added to the pivot, NOT to gltf.scene.
            //
            // DecalGeometry bakes the mesh's world matrix into the vertices it
            // emits, so what comes back is already positioned in world space.
            // Parenting it to gltf.scene — which carries the offset that
            // centres the model — applied that translation a second time and
            // threw the print clean off the garment. The pivot is identity at
            // this point, so the decal lands where it was projected and still
            // turns with everything else.
            pivot.add(new Mesh(geometry, material));
            ready();
          },
          undefined,
          // A missing print is a plain shirt, not a broken one.
          ready,
        );
      },
      undefined,
      // No model is not a broken page — the flat mockup stays visible.
      () => {},
    );

    const resize = () => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      fitCamera();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let turn = 0;
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
      turn = Math.max(
        -LIMIT,
        Math.min(LIMIT, turn + (e.clientX - lastX) * 0.006),
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

      const wanted = held ? turn : turn + Math.sin(elapsed * 0.5) * DRIFT;
      current += (wanted - current) * Math.min(1, dt * 4);
      pivot.rotation.y = current;
      // A shallow sway, so it hangs rather than spins on a spindle.
      pivot.rotation.z = Math.sin(elapsed * 0.37) * 0.02 + current * 0.04;

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
      pivot.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [print, fabric]);

  return (
    <div
      ref={hostRef}
      className={styles.host}
      role="img"
      aria-label={alt || 'The garment, which can be turned'}
    />
  );
}
