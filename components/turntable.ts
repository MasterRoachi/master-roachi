import {
  AmbientLight,
  DirectionalLight,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

// The stage both 3D viewers stand on: renderer, camera, lights, the pivot the
// thing turns on, dragging, the idle drift, and pausing when nobody can see
// it. Lifted out of ShirtViewer on 2026-11-12 when the flat goods (posters,
// canvases, buttons, mats) needed exactly the same stage with a different
// thing on it — two copies of the drag-and-drift loop would have drifted the
// first time one of them was fixed.
//
// The decisions in here were made for the shirt and still hold for a poster;
// the reasons are kept beside each one.

export interface TurntableOptions {
  /** Class for the canvas element. */
  className?: string;
  /**
   * The furthest it will ever turn from face-on, in radians.
   *
   * A half turn, so the back can be brought square to the camera. It used to
   * stop at 0.85 — about 49° — which showed the shoulder and never the back,
   * and a thing you cannot turn round is a photograph with extra steps. Past a
   * half turn the drag has become a turntable, which is a different thing
   * from examining something.
   */
  limit?: number;
  /** How far the idle drift swings either way, in radians. */
  drift?: number;
  /** A tilt down towards the camera, for things that lie flat on a desk. */
  tilt?: number;
}

export interface Turntable {
  scene: Scene;
  /** Add the thing here; it is what turns. */
  pivot: Object3D;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  /** Frame the camera on something this big, centred on the origin. */
  fit(size: Vector3): void;
  /** Mark the viewer as drawn, so the flat picture under it can fade. */
  ready(): void;
  /** Disposed with the stage. */
  keep(thing: { dispose(): void }): void;
  /** Ask for one frame, for a change made while nothing is looping. */
  redraw(): void;
  dispose(): void;
}

/** Null where there is no WebGL; the caller leaves its flat picture in place. */
export function createTurntable(host: HTMLElement, options: TurntableOptions = {}): Turntable | null {
  const limit = options.limit ?? Math.PI;
  const drift = options.drift ?? 0.34;
  const tilt = options.tilt ?? 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setClearAlpha(0);
  host.appendChild(renderer.domElement);
  if (options.className) renderer.domElement.className = options.className;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 2000);

  // Low ambient on purpose. Raised, it swamps the directionals, every facet
  // comes back equally lit, and folds and edges stop reading at all.
  scene.add(new AmbientLight(0xffffff, 0.5));
  const key = new DirectionalLight(0xfff2f7, 2.3);
  key.position.set(-3.4, 3, 4.2);
  scene.add(key);
  const fill = new DirectionalLight(0xc6e6ff, 1.1);
  fill.position.set(4.2, -0.6, 2.4);
  scene.add(fill);
  // Behind and above, to pick the edges off the background.
  const back = new DirectionalLight(0xffffff, 0.9);
  back.position.set(0.5, 2.6, -4);
  scene.add(back);

  const pivot = new Object3D();
  scene.add(pivot);

  let disposed = false;
  let size = new Vector3(1, 1, 1);
  const disposables: { dispose(): void }[] = [];

  const fitCamera = () => {
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    // Depth counts toward the width because the thing turns.
    const reach = size.x + size.z * 0.5;
    camera.position.z = Math.max(size.y / 2 / Math.tan(vFov / 2), reach / 2 / Math.tan(hFov / 2)) * 1.08;
  };

  /**
   * Radians turned per pixel dragged.
   *
   * Measured against the viewer's own width rather than fixed, so one drag
   * across it turns the thing half way round on a phone as well as a desktop.
   */
  let perPixel = 0.006;

  const resize = () => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    perPixel = limit / (r.width * 0.9);
    fitCamera();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  let turn = 0;
  let current = 0;
  let held = false;
  let lastX = 0;
  let raf = 0;
  let visible = true;
  let elapsed = 0;
  let last = performance.now();

  const down = (e: PointerEvent) => {
    held = true;
    lastX = e.clientX;
    host.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!held) return;
    turn = Math.max(-limit, Math.min(limit, turn + (e.clientX - lastX) * perPixel));
    lastX = e.clientX;
    // Under reduced motion nothing is looping, so a drag has to ask for the
    // frame that shows its result.
    if (reduced && !raf) raf = requestAnimationFrame(frame);
  };
  const up = (e: PointerEvent) => {
    held = false;
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
  };
  host.addEventListener('pointerdown', down);
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', up);

  function frame() {
    raf = 0;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced) elapsed += dt;

    const wanted = held ? turn : turn + Math.sin(elapsed * 0.5) * drift;
    // Reduced motion stops the idle drift and the easing, not the ability to
    // turn it: the setting asks for no unrequested movement, and a drag is
    // requested.
    if (reduced) current = wanted;
    else current += (wanted - current) * Math.min(1, dt * 4);
    pivot.rotation.set(tilt, current, Math.sin(elapsed * 0.37) * 0.02 + current * 0.04, 'YXZ');

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

  return {
    scene,
    pivot,
    camera,
    renderer,
    fit(next) {
      size = next.clone();
      camera.near = Math.max(0.01, size.length() / 1000);
      camera.far = size.length() * 10;
      camera.updateProjectionMatrix();
      fitCamera();
      this.redraw();
    },
    ready() {
      if (!disposed) host.dataset.ready = 'true';
      this.redraw();
    },
    keep(thing) {
      disposables.push(thing);
    },
    redraw() {
      if (!disposed && !raf) raf = requestAnimationFrame(frame);
    },
    dispose() {
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
        const mesh = child as { isMesh?: boolean; geometry?: { dispose(): void } };
        if (mesh.isMesh) mesh.geometry?.dispose();
      });
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    },
  };
}
