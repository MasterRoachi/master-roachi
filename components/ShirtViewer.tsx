'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';
import styles from './ShirtViewer.module.css';

// The featured garment, modelled rather than photographed.
//
// The first version of this took Printful's mockup and bent it over a curved
// plane. That could never work, and it is worth writing down why: the mockup
// is a photograph of a shirt, so its folds, its shadows and its perspective
// are painted into the pixels. Curving the image curves the picture — the
// highlights stay where the photographer put them while the surface moves
// underneath, which is exactly the flat look it had. No amount of extra bend
// fixes a texture that already contains its own lighting.
//
// So the shirt is built here instead, the same way the book on the homepage is
// built: geometry generated at runtime, with one texture for the artwork. The
// mockup is still the source, but only for the two things that cannot be
// modelled — the printed design, which scripts/store-art.mjs lifts off the
// garment, and where on the chest it sits.
//
// The body is a swept superellipse: a cross-section flat across the front and
// back and tight at the sides, widening at the shoulders and drawn in at the
// waist. The sleeves are tapered tubes rooted inside the body so the join is
// buried. Collar and hem are tubes swept around their own outlines. The print
// is a patch of the body surface lifted a hair along its normal, so it curves
// with the chest instead of floating over it.

const TAU = Math.PI * 2;

/** Hem to shoulder, in scene units. */
const BODY_H = 2.62;
const HEM_Y = -1.46;
const SHOULDER_Y = HEM_Y + BODY_H;

/**
 * Cross-section roundness.
 *
 * At 1 the body is an ellipse — a tube, which is what it looked like. Below 1
 * the front and back flatten into panels and the sides draw in, which is the
 * difference between a garment and a pipe.
 */
const FLAT = 0.72;

/** Neck opening.
 *
 * The lift is negative on purpose: the collar sits below the top of the
 * shoulders, in a dip. Raised above them, the yoke domed over the opening and
 * the garment read as a bag with no neck at all — from the front you saw the
 * top of the dome rather than the hole. */
const NECK_W = 0.29;
const NECK_D = 0.225;
const NECK_LIFT = -0.11;
const COLLAR_R = 0.055;
const HEM_R = 0.03;

/** Where on the body the sleeves are rooted, and how far they run. */
const SLEEVE_T = 0.8;
const SLEEVE_LEN = 0.86;

/** How far the print stands off the chest. Enough to clear it, not to float. */
const PRINT_LIFT = 0.012;

const UP = new Vector3(0, 1, 0);

/** Half the body width at height t, where 0 is the hem and 1 the shoulder. */
function halfWidth(t: number): number {
  return (
    0.76 +
    0.05 * Math.sin(t * Math.PI) +
    0.19 * Math.pow(t, 2.1) +
    0.03 * Math.pow(1 - t, 2.2)
  );
}

/**
 * How far up the body the top edge reaches, at angle a around it.
 *
 * This is the neckline. Without it the body was a closed tube running flat to
 * the shoulders, the yoke capped it, and from the front there was no opening
 * to see — the garment read as a bag. A real tee is cut away at the front and
 * back centre and left high at the sides, which is what puts a collar in view
 * from straight on.
 */
function shoulderT(a: number): number {
  // 1 at the front and back centre, 0 at the shoulder points.
  const centre = Math.abs(Math.sin(a));
  return 1 - 0.15 * Math.pow(centre, 2.4);
}

/** Half the body depth at the same t. Deepest across the chest. */
function halfDepth(t: number): number {
  return 0.3 + 0.12 * Math.sin(Math.min(1, t * 1.05) * Math.PI * 0.9);
}

/** A point on the body: t up the garment, a around it. */
function surfacePoint(t: number, a: number, out: Vector3): Vector3 {
  const w = halfWidth(t);
  const d = halfDepth(t);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return out.set(
    w * Math.sign(c) * Math.pow(Math.abs(c), FLAT),
    HEM_Y + t * BODY_H,
    d * Math.sign(s) * Math.pow(Math.abs(s), FLAT),
  );
}

const _np = new Vector3();
const _na = new Vector3();
const _nt = new Vector3();

/** Outward normal of the body, by difference rather than by algebra. */
function surfaceNormal(t: number, a: number, out: Vector3): Vector3 {
  const e = 0.0025;
  surfacePoint(t, a, _np);
  surfacePoint(t, a + e, _na).sub(_np);
  const atTop = t > 0.999;
  surfacePoint(atTop ? t - e : t + e, a, _nt).sub(_np);
  if (atTop) _nt.negate();
  return out.crossVectors(_nt, _na).normalize();
}

function neckPoint(a: number, out: Vector3): Vector3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return out.set(
    NECK_W * Math.sign(c) * Math.pow(Math.abs(c), FLAT),
    SHOULDER_Y + NECK_LIFT,
    NECK_D * Math.sign(s) * Math.pow(Math.abs(s), FLAT),
  );
}

/** A parametric patch: u and v both run 0 to 1. */
type Surface = (u: number, v: number, out: Vector3) => Vector3;

/**
 * Turns a parametric surface into geometry.
 *
 * Normals come from differencing the surface rather than from averaging face
 * normals afterwards. Everything here wraps, and averaging leaves a seam where
 * the last column of vertices cannot see the first — a seam that catches the
 * light as a stripe down the side of the garment.
 */
function buildSurface(fn: Surface, us: number, vs: number): BufferGeometry {
  const count = (us + 1) * (vs + 1);
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const index: number[] = [];
  const p = new Vector3();
  const du = new Vector3();
  const dv = new Vector3();
  const n = new Vector3();
  const e = 0.0015;

  let k = 0;
  for (let j = 0; j <= vs; j++) {
    const v = j / vs;
    // Forward difference everywhere except the last row, which has nothing in
    // front of it to difference against.
    const step = v < 1 ? e : -e;
    for (let i = 0; i <= us; i++) {
      const u = i / us;
      fn(u, v, p);
      fn(u + e, v, du).sub(p);
      fn(u, v + step, dv).sub(p);
      if (step < 0) dv.negate();
      n.crossVectors(dv, du).normalize();

      position[k * 3] = p.x;
      position[k * 3 + 1] = p.y;
      position[k * 3 + 2] = p.z;
      normal[k * 3] = n.x;
      normal[k * 3 + 1] = n.y;
      normal[k * 3 + 2] = n.z;
      uv[k * 2] = u;
      uv[k * 2 + 1] = 1 - v;
      k++;
    }
  }

  for (let j = 0; j < vs; j++) {
    for (let i = 0; i < us; i++) {
      const a = j * (us + 1) + i;
      const b = a + 1;
      const c = a + us + 1;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }

  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(position, 3));
  g.setAttribute('normal', new BufferAttribute(normal, 3));
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

const _ya = new Vector3();
const _yb = new Vector3();
const _ring = new Vector3();
const _outward = new Vector3();

/** The body, running from the hem up to the neckline. */
const bodySurface: Surface = (u, v, out) => {
  const a = u * TAU;
  return surfacePoint(v * shoulderT(a), a, out);
};

/** The shoulders: from the top of the body inward to the neck opening. */
const yokeSurface: Surface = (u, v, out) => {
  const a = u * TAU;
  surfacePoint(shoulderT(a), a, _ya);
  neckPoint(a, _yb);
  out.lerpVectors(_ya, _yb, v);
  // The shoulders rise a little before falling to the collar, so the yoke is
  // not a flat plate with a hole in it.
  out.y += Math.sin(v * Math.PI) * 0.05;
  return out;
};

/** A tube swept around a closed outline — the collar and the hem. */
function bandSurface(
  outline: (a: number, out: Vector3) => Vector3,
  radius: number,
): Surface {
  return (u, v, out) => {
    outline(u * TAU, _ring);
    _outward.set(_ring.x, 0, _ring.z).normalize();
    const phi = v * TAU;
    return out
      .copy(_ring)
      .addScaledVector(_outward, Math.cos(phi) * radius)
      .addScaledVector(UP, Math.sin(phi) * radius);
  };
}

/** One sleeve, as a tapered tube leaving the body at the shoulder. */
function sleeveSurface(side: number): Surface {
  const root = surfacePoint(SLEEVE_T, side > 0 ? 0 : Math.PI, new Vector3());
  const axis = new Vector3(side * 0.84, -0.56, 0).normalize();
  // Started inside the body, so the seam is buried rather than butted against
  // the surface where it would show as a ring.
  root.addScaledVector(axis, -0.2);
  // The axis lies in the XY plane, so one perpendicular is simply Z and the
  // other is the axis turned a quarter turn within that plane.
  const across = new Vector3(0, 0, 1);
  const along = new Vector3(-axis.y, axis.x, 0).normalize();

  return (u, v, out) => {
    // A cuff band at the very end, and a slight swell partway down so the
    // sleeve hangs instead of coning to a point.
    const cuff = v > 0.86 ? 0.028 * Math.sin(((v - 0.86) / 0.14) * Math.PI) : 0;
    const ra = 0.4 - 0.14 * v + 0.025 * Math.sin(v * Math.PI) + cuff;
    const rb = 0.34 - 0.1 * v + 0.025 * Math.sin(v * Math.PI) + cuff;
    const a = u * TAU;
    return out
      .copy(root)
      .addScaledVector(axis, v * SLEEVE_LEN)
      .addScaledVector(along, ra * Math.cos(a))
      .addScaledVector(across, rb * Math.sin(a));
  };
}

const _pn = new Vector3();

/** The printed patch, riding on the body surface. */
function printSurface(
  aC: number,
  tC: number,
  aSpan: number,
  tSpan: number,
): Surface {
  return (u, v, out) => {
    // u increases to the right on screen, which means a decreasing, since the
    // camera looks down positive z.
    const a = aC - (u - 0.5) * aSpan;
    const t = tC + (0.5 - v) * tSpan;
    surfacePoint(t, a, out);
    surfaceNormal(t, a, _pn);
    return out.addScaledVector(_pn, PRINT_LIFT);
  };
}

export interface PrintPlacement {
  src: string;
  /** Centre of the print, as a fraction across and down the whole silhouette. */
  x: number;
  y: number;
  /** Its width, as a fraction of the silhouette width. */
  width: number;
}

/** The furthest it will ever turn from face-on, in radians. */
const LIMIT = 0.85;
/** How far the idle drift swings. */
const DRIFT = 0.34;

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
    const camera = new PerspectiveCamera(38, 1, 0.1, 100);

    // Low ambient on purpose. Raised, it swamps the directionals, every facet
    // comes back equally lit, and a curved surface with no gradient across it
    // reads as flat however well it is modelled.
    scene.add(new AmbientLight(0xffffff, 0.55));
    const key = new DirectionalLight(0xfff2f7, 2.2);
    key.position.set(-3.4, 3, 4.2);
    scene.add(key);
    const fill = new DirectionalLight(0xc6e6ff, 1.15);
    fill.position.set(4.2, -0.6, 2.4);
    scene.add(fill);
    // Behind and above, to pick the shoulders and sleeves off the background.
    const back = new DirectionalLight(0xffffff, 0.85);
    back.position.set(0.5, 2.6, -4);
    scene.add(back);

    const cloth = new MeshStandardMaterial({
      color: new Color(fabric),
      roughness: 0.94,
      metalness: 0,
      // The hem is open, so the inside of the garment shows when it turns.
      side: DoubleSide,
    });
    const trim = new MeshStandardMaterial({
      color: new Color(fabric).multiplyScalar(0.82),
      roughness: 0.88,
      metalness: 0,
      side: DoubleSide,
    });

    const shirt = new Group();
    const geometries: BufferGeometry[] = [];

    const add = (g: BufferGeometry, m: MeshStandardMaterial) => {
      geometries.push(g);
      shirt.add(new Mesh(g, m));
    };

    add(buildSurface(bodySurface, 96, 64), cloth);
    add(buildSurface(yokeSurface, 96, 16), cloth);
    add(buildSurface(sleeveSurface(1), 44, 26), cloth);
    add(buildSurface(sleeveSurface(-1), 44, 26), cloth);
    add(buildSurface(bandSurface(neckPoint, COLLAR_R), 72, 18), trim);
    add(
      buildSurface(
        bandSurface((a, out) => surfacePoint(0, a, out), HEM_R),
        84,
        18,
      ),
      trim,
    );

    scene.add(shirt);

    // Fit the camera to whatever the geometry actually came out as, rather
    // than to numbers guessed from the constants above.
    const box = new Box3().setFromObject(shirt);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    shirt.position.sub(centre);

    // Fitting on height alone overflowed a portrait stage sideways, which is
    // how the shirt ended up wider than its own box. Both axes are checked,
    // and the depth is added to the width because the garment turns.
    const fitCamera = () => {
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const reach = size.x + size.z * 0.5;
      camera.position.z =
        Math.max(
          size.y / 2 / Math.tan(vFov / 2),
          reach / 2 / Math.tan(hFov / 2),
        ) * 1.1;
    };

    let disposed = false;
    let printMaterial: MeshStandardMaterial | null = null;

    const ready = () => {
      if (!disposed) host.dataset.ready = 'true';
    };

    if (print) {
      new TextureLoader().load(
        print.src,
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

          // The recorded placement is relative to the whole silhouette,
          // sleeves included, so it is resolved against the measured bounding
          // box rather than against the body alone.
          const wantW = print.width * size.x;
          const cx = (print.x - 0.5) * size.x;
          const cy = box.max.y - print.y * size.y;

          const t = Math.min(0.94, Math.max(0.06, (cy - HEM_Y) / BODY_H));
          // Invert the cross-section to get the angle that lands the print at
          // that distance from the centre line.
          const ratio = Math.min(0.97, Math.abs(cx) / halfWidth(t));
          const aC = Math.acos(Math.pow(ratio, 1 / FLAT)) * (cx < 0 ? -1 : 1);

          // Solve the angular span that gives the wanted width on the curve.
          // Cheaper to bisect than to differentiate a superellipse.
          const p1 = new Vector3();
          const p2 = new Vector3();
          let lo = 0.01;
          let hi = 1.6;
          for (let i = 0; i < 34; i++) {
            const mid = (lo + hi) / 2;
            surfacePoint(t, aC - mid / 2, p1);
            surfacePoint(t, aC + mid / 2, p2);
            if (p1.distanceTo(p2) < wantW) lo = mid;
            else hi = mid;
          }
          const aSpan = (lo + hi) / 2;
          const image = texture.image as { width: number; height: number };
          const tSpan = (wantW * (image.height / image.width)) / BODY_H;

          printMaterial = new MeshStandardMaterial({
            map: texture,
            transparent: true,
            roughness: 0.7,
            metalness: 0,
            // Ink sits on cloth; it should catch the same light, not glow.
            alphaTest: 0.02,
          });
          const g = buildSurface(printSurface(aC, t, aSpan, tSpan), 40, 40);
          geometries.push(g);
          shirt.add(new Mesh(g, printMaterial));
          ready();
        },
        undefined,
        // A missing print is a plain shirt, not a broken one.
        ready,
      );
    } else {
      ready();
    }

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

      const wanted = held ? target : target + Math.sin(elapsed * 0.5) * DRIFT;
      current += (wanted - current) * Math.min(1, dt * 4);
      shirt.rotation.y = current;
      // A shallow sway on the other two axes, so it hangs rather than spins on
      // a spindle.
      shirt.rotation.z = Math.sin(elapsed * 0.37) * 0.022 + current * 0.04;
      shirt.rotation.x = Math.abs(current) * 0.05;

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
      for (const g of geometries) g.dispose();
      printMaterial?.map?.dispose();
      printMaterial?.dispose();
      cloth.dispose();
      trim.dispose();
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
