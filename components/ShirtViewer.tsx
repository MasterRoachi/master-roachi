'use client';

import { useEffect, useRef } from 'react';
import {
  Box3,
  Color,
  DoubleSide,
  Euler,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { createTurntable } from './turntable';
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

/**
 * The furthest it will ever turn from face-on, in radians.
 *
 * A half turn, so the back of the garment can be brought square to the
 * camera. It used to stop at 0.85 — about 49° — which showed the shoulder and
 * never the back, and a shirt you cannot turn round is a photograph with extra
 * steps. Nothing is hidden back there: the decal is projected shallow enough
 * not to print through, so the reverse is plain cloth, which is what it is.
 *
 * Still a limit rather than a free spin. Past a half turn the garment is
 * coming round to the front again and the drag has become a turntable, which
 * is a different thing from examining something.
 */
const LIMIT = Math.PI;
/** How far the idle drift swings. */
const DRIFT = 0.34;

/**
 * The garment, when the caller does not name one.
 *
 * Kept as a default rather than required so an existing call site cannot end
 * up rendering nothing; which model a product gets is decided in lib/models.ts.
 */
const DEFAULT_MODEL = '/store/tshirt.glb';

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
  model = DEFAULT_MODEL,
  printBand,
}: {
  print?: PrintPlacement | null;
  /** The garment colour, measured off the mockup. */
  fabric?: string;
  alt?: string;
  /** Which .glb to draw. See lib/models.ts. */
  model?: string;
  /** Where the printable front of that model is. See lib/models.ts. */
  printBand?: { top: number; bottom: number };
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const stage = createTurntable(host, { className: styles.canvas, limit: LIMIT, drift: DRIFT });
    // No WebGL. The caller leaves the flat mockup in place underneath.
    if (!stage) return;
    const { pivot, renderer } = stage;
    let disposed = false;
    const ready = () => stage.ready();

    new GLTFLoader().load(
      model,
      (gltf) => {
        if (disposed) return;

        const cloth = new MeshStandardMaterial({
          color: new Color(fabric),
          roughness: 0.93,
          metalness: 0,
          side: DoubleSide,
        });
        stage.keep(cloth);

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
        const size = box.getSize(new Vector3());
        gltf.scene.position.sub(box.getCenter(new Vector3()));
        stage.fit(size);

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
            stage.keep(texture);

            // Fire a ray at the chest from exactly where the print sits in the
            // photograph, and put the decal wherever it lands.
            // The mockup's vertical fraction, mapped into the part of this
            // model that can actually be printed on. Without the band a
            // hood-up model takes a chest print somewhere inside its hood.
            const band = printBand ?? { top: 0, bottom: 1 };
            const down = band.top + print.y * (band.bottom - band.top);

            const from = new Vector3(
              bounds.min.x + print.x * (bounds.max.x - bounds.min.x),
              bounds.max.y - down * (bounds.max.y - bounds.min.y),
              bounds.max.z + Math.max(1, size.z),
            );
            const ray = new Raycaster(from, new Vector3(0, 0, -1));
            const hit = ray.intersectObject(shirt, true)[0];
            if (!hit) {
              ready();
              return;
            }

            // Projected straight from the front, as a screen print is laid
            // on, not along the cloth's normal where the ray struck. On the
            // tee's flat chest the two were the same; a print the size of
            // Grumpy Television's lands on the hoodie's folds, where the
            // normal at one point tipped the whole print sideways and cut an
            // arm off (Master Roachi, 12 Nov 2026). The decal's depth is what
            // carries it over the folds.
            const orientation = new Euler(0, 0, 0);

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
            stage.keep(geometry);
            stage.keep(material);
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

    return () => {
      disposed = true;
      stage.dispose();
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
