'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import styles from './HeroBook.module.css';

// A floating Orthodox volume, built procedurally — no model file, no textures,
// so there is nothing to license and the whole scene is a few KB of geometry.
//
// Scrolling opens it: the covers hinge back on the spine and the leaves turn
// one after another, each one bowing as it crosses so it reads as paper rather
// than a rotating plane. Dragging turns the whole book on its axis.
//
// Loaded via next/dynamic with ssr:false from HeroBookMount, so three.js stays
// out of the initial bundle.

const GOLD = 0xd9a441;
const COVER = 0x141414;
const PAGE = 0xe8e2d4;

/** Book proportions, in scene units. */
const W = 2.1;
const H = 3.0;
const COVER_T = 0.09;
const BLOCK_T = 0.42;

/** Leaves that actually turn. More is smoother and costs more per frame. */
const LEAVES = 14;
/** Horizontal segments per leaf — the resolution the curl is drawn at. */
const SEG = 16;
/**
 * Peak bend of a turning leaf, in radians at the free edge.
 *
 * The leaf is bent into an arc rather than displaced by a curve, so arc length
 * is preserved and the whole page curves instead of only its tip lifting. An
 * earlier version offset z by u-squared, which put 96% of the page within 15%
 * of flat and read as a rotating rectangle. At 1.2 rad the free edge swings
 * out by about half the page width.
 */
const CURL_THETA = 1.2;

// Timing. The cover has to stay ahead of every leaf for the whole sweep, or
// the leaves sweep straight through it — which is exactly what an earlier
// version did, the lead leaf running up to 93 degrees ahead of the cover.
// The cover therefore opens fast and early, and no leaf starts until it is
// most of the way back. Worst-case clearance with these numbers is 0 degrees
// at rest and about 14 degrees once open.
/** Sweep over which the front cover completes its swing. */
const COVER_SPAN = 0.38;
/** Cover travel, just short of flat so it never crosses the back cover. */
const COVER_OPEN = Math.PI * 0.98;
/** Nothing turns before this point; the cover is at ~156 degrees by then. */
const LEAF_START = 0.3;
/** Fraction of the sweep a single leaf takes to cross. */
const TURN_SPAN = 0.35;
/** Leaf travel, kept under COVER_OPEN so a leaf can never overtake the cover. */
const LEAF_OPEN = Math.PI * 0.9;

/** The hinge runs down the left edge; everything pivots about it. */
const HINGE_X = -W / 2;

interface Leaf {
  pivot: Group;
  mesh: Mesh;
  /** Rest position in the closed block, front-most leaf first. */
  z0: number;
  /** Where it lands once turned, mirrored to the other stack. */
  z1: number;
  /** Point in the open sweep at which this leaf starts moving. */
  start: number;
  /** Flat x of every vertex, kept because bending overwrites the live values. */
  restX: Float32Array;
}

interface BookParts {
  root: Group;
  frontCover: Group;
  backCover: Group;
  rightStack: Mesh;
  leftStack: Mesh;
  leaves: Leaf[];
}

/**
 * The Pantokrator marking on the first leaf, drawn to a canvas rather than
 * loaded from an image.
 *
 * Deliberately the iconography rather than a portrait: the cruciform halo and
 * the IC XC christogram are what identify the image, and they hold up at the
 * size this is actually seen. Drawing a face procedurally would only look
 * crude.
 *
 * To use a real icon instead, load an image into a texture here. Note that
 * while the ancient icons are long out of copyright, modern photographs of
 * them frequently are not — use a public-domain scan.
 */
function makeIconTexture(): CanvasTexture {
  const w = 512;
  const h = 740; // matches the page aspect
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d')!;

  c.fillStyle = '#e8e2d4';
  c.fillRect(0, 0, w, h);

  const gold = '#b8892f';
  const cx = w / 2;
  const cy = h * 0.36;
  const r = w * 0.28;

  c.strokeStyle = gold;
  c.lineCap = 'round';

  // Halo.
  c.lineWidth = 5;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.stroke();

  // Cruciform nimbus: the three arms visible behind the head.
  c.lineWidth = 12;
  c.beginPath();
  c.moveTo(cx, cy - r);
  c.lineTo(cx, cy + r * 0.1);
  c.moveTo(cx - r, cy);
  c.lineTo(cx - r * 0.34, cy);
  c.moveTo(cx + r * 0.34, cy);
  c.lineTo(cx + r, cy);
  c.stroke();

  // IC XC, the christogram, flanking the halo.
  c.fillStyle = gold;
  c.font = `600 ${Math.round(w * 0.11)}px Georgia, serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('IC', cx - r * 1.32, cy - r * 0.5);
  c.fillText('XC', cx + r * 1.32, cy - r * 0.5);

  // Overline abbreviation marks.
  c.lineWidth = 4;
  for (const dx of [-r * 1.32, r * 1.32]) {
    c.beginPath();
    c.moveTo(cx + dx - w * 0.06, cy - r * 0.5 - w * 0.075);
    c.lineTo(cx + dx + w * 0.06, cy - r * 0.5 - w * 0.075);
    c.stroke();
  }

  // A rule and a line of ruled text below, so the leaf reads as a page rather
  // than a poster.
  c.strokeStyle = 'rgba(120, 100, 70, 0.35)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(w * 0.2, h * 0.62);
  c.lineTo(w * 0.8, h * 0.62);
  c.stroke();

  c.strokeStyle = 'rgba(120, 100, 70, 0.16)';
  c.lineWidth = 6;
  for (let i = 0; i < 7; i++) {
    const y = h * 0.68 + i * h * 0.035;
    const inset = i === 6 ? w * 0.3 : w * 0.16;
    c.beginPath();
    c.moveTo(w * 0.16, y);
    c.lineTo(w - inset, y);
    c.stroke();
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A pivot at the hinge with its mesh pushed out to span hinge → fore edge. */
function hinged(mesh: Mesh, z: number): Group {
  const pivot = new Group();
  pivot.position.set(HINGE_X, 0, z);
  mesh.position.x = W / 2;
  pivot.add(mesh);
  return pivot;
}

function buildBook(): BookParts {
  const root = new Group();

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
  // Leaves are seen from both sides as they cross, so they cannot be culled.
  const leafMat = new MeshStandardMaterial({
    color: new Color(PAGE),
    roughness: 0.95,
    metalness: 0,
    side: DoubleSide,
  });
  const stackMat = new MeshStandardMaterial({
    color: new Color(PAGE),
    roughness: 0.95,
    metalness: 0,
  });

  const half = BLOCK_T / 2;

  // --- covers -------------------------------------------------------------
  // The inside faces get a warmer endpaper. Without it an opened cover is
  // near-black against a near-black page, so the book reads as still shut even
  // while it is swinging.
  const endpaperMat = new MeshStandardMaterial({
    color: new Color(0x33291c),
    roughness: 0.88,
    metalness: 0.04,
  });

  // BoxGeometry material groups run [+x, -x, +y, -y, +z, -z]. The front
  // cover's outward face is +z and its inside is -z; the back cover is the
  // other way round.
  const frontMesh = new Mesh(new BoxGeometry(W, H, COVER_T), [
    coverMat,
    coverMat,
    coverMat,
    coverMat,
    coverMat,
    endpaperMat,
  ]);
  const frontCover = hinged(frontMesh, half + COVER_T / 2);
  root.add(frontCover);

  // The Orthodox eight-pointed cross, inlaid on the front cover so it swings
  // with it. Bars are children of the cover mesh, in its local space.
  const bar = (w: number, h: number, y: number, rot = 0) => {
    const m = new Mesh(new BoxGeometry(w, h, 0.02), goldMat);
    m.position.set(0, y, COVER_T / 2 + 0.008);
    m.rotation.z = rot;
    frontMesh.add(m);
  };
  bar(0.075, 1.55, 0.05); // upright
  bar(0.42, 0.07, 0.62); // titulus
  bar(0.78, 0.08, 0.28); // main bar
  bar(0.5, 0.07, -0.42, 0.32); // slanted footrest

  const backMesh = new Mesh(new BoxGeometry(W, H, COVER_T), [
    coverMat,
    coverMat,
    coverMat,
    coverMat,
    endpaperMat,
    coverMat,
  ]);
  const backCover = hinged(backMesh, -half - COVER_T / 2);
  root.add(backCover);

  // --- page stacks --------------------------------------------------------
  // Two solid blocks standing in for the leaves that are not currently
  // turning. They shrink and grow as pages move between them, which is what
  // sells the thickness without animating hundreds of planes.
  const stackGeo = new BoxGeometry(W - 0.08, H - 0.08, 1);

  // The first leaf carries the Pantokrator, so it is the top face of the
  // right-hand stack — the page revealed the moment the cover swings back.
  const iconMat = new MeshStandardMaterial({
    map: makeIconTexture(),
    roughness: 0.95,
    metalness: 0,
  });
  const rightStack = new Mesh(stackGeo, [
    stackMat,
    stackMat,
    stackMat,
    stackMat,
    iconMat,
    stackMat,
  ]);
  rightStack.position.x = 0;
  root.add(rightStack);

  const leftStack = new Mesh(stackGeo.clone(), stackMat);
  leftStack.position.x = 0;
  root.add(leftStack);

  // Gilt on the fore edge, head and tail of the closed block.
  const giltT = 0.012;
  const gilts: [number, number, number, number, number][] = [
    [giltT, H - 0.08, BLOCK_T, (W - 0.08) / 2, 0],
    [W - 0.08, giltT, BLOCK_T, 0, (H - 0.08) / 2],
    [W - 0.08, giltT, BLOCK_T, 0, -(H - 0.08) / 2],
  ];
  for (const [w, h, d, x, y] of gilts) {
    const edge = new Mesh(new BoxGeometry(w, h, d), goldMat);
    edge.position.set(x, y, 0);
    root.add(edge);
  }

  // --- spine --------------------------------------------------------------
  const spineX = HINGE_X - COVER_T / 2;
  const spine = new Mesh(
    new BoxGeometry(COVER_T, H, BLOCK_T + COVER_T * 2),
    coverMat,
  );
  spine.position.x = spineX;
  root.add(spine);

  for (const y of [H * 0.28, -H * 0.28]) {
    const band = new Mesh(
      new BoxGeometry(COVER_T + 0.004, 0.05, BLOCK_T + COVER_T * 2 + 0.004),
      goldMat,
    );
    band.position.set(spineX, y, 0);
    root.add(band);
  }

  // --- turning leaves -----------------------------------------------------
  const leaves: Leaf[] = [];
  const gap = BLOCK_T / (LEAVES + 1);
  for (let i = 0; i < LEAVES; i++) {
    const geo = new PlaneGeometry(W - 0.08, H - 0.08, SEG, 1);
    const mesh = new Mesh(geo, leafMat);
    const z0 = half - gap * (i + 1);
    const z1 = -half + gap * (i + 1);
    const pivot = hinged(mesh, z0);
    pivot.visible = false;
    root.add(pivot);

    leaves.push({
      pivot,
      mesh,
      z0,
      z1,
      // Staggered so the leaves cascade instead of moving as a slab, and all
      // held back until LEAF_START so the cover is well clear first.
      start: LEAF_START + (i / LEAVES) * (1 - LEAF_START - TURN_SPAN),
      restX: Float32Array.from(geo.attributes.position.array.filter((_, n) => n % 3 === 0)),
    });
  }

  return { root, frontCover, backCover, rightStack, leftStack, leaves };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smoothstep — eases a leaf in and out of its turn. */
const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * Bend a leaf into an arc about the hinge, the way a sheet of paper actually
 * behaves when it is pushed across. Each vertex keeps its distance along the
 * page — arc length is preserved — while the sheet rolls away from flat, so
 * the whole page curves rather than only the free edge lifting.
 *
 * The bend peaks halfway through the turn and flattens at both ends, so a leaf
 * lies flat in each stack and is at its most curved as it crosses the spine.
 */
function curlLeaf(leaf: Leaf, turn: number) {
  const geo = leaf.mesh.geometry as PlaneGeometry;
  const pos = geo.attributes.position;
  const width = W - 0.08;
  const theta = Math.sin(turn * Math.PI) * CURL_THETA;

  // Straight through: below this the arc radius explodes and the maths is both
  // pointless and numerically nasty.
  if (theta < 1e-3) {
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, leaf.restX[i]);
      pos.setZ(i, 0);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return;
  }

  const k = theta / width; // curvature: 1 / radius
  for (let i = 0; i < pos.count; i++) {
    const s = leaf.restX[i] + width / 2; // distance from the hinge
    const a = k * s;
    pos.setX(i, -width / 2 + Math.sin(a) / k);
    pos.setZ(i, (1 - Math.cos(a)) / k);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
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

    const parts = buildBook();
    scene.add(parts.root);

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

    // Scroll opens the book. Dragging spins it. The two drive different things
    // so they can never fight each other.
    let openTarget = 0;
    let open = 0;
    let spin = 0;
    let spinVel = 0;
    let dragging = false;
    let lastX = 0;
    let pointerX = 0;
    let pointerY = 0;

    const onScroll = () => {
      openTarget = clamp01(window.scrollY / (window.innerHeight * 0.85));
    };
    onScroll();

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      spinVel = 0;
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
      // Dragging turns the whole book on its axis. Page turning is left to
      // scrolling alone, so the two inputs stay separate.
      spinVel = dx * 0.006;
      spin += spinVel;
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

    /** Drive every moving part from a single 0–1 open value. */
    function applyOpen(o: number) {
      const { frontCover, backCover, rightStack, leftStack, leaves } = parts;

      // The front cover completes its swing over the first COVER_SPAN of the
      // sweep, well before any leaf moves.
      const coverT = ease(clamp01(o / COVER_SPAN));
      frontCover.rotation.y = -coverT * COVER_OPEN;
      backCover.rotation.y = coverT * Math.PI * 0.06;

      let turnedTotal = 0;
      for (const leaf of leaves) {
        const raw = clamp01((o - leaf.start) / TURN_SPAN);
        const t = ease(raw);
        turnedTotal += t;

        // A leaf only exists while it is between the two stacks; the rest of
        // the time the solid blocks stand in for it.
        const moving = raw > 0.001 && raw < 0.999;
        leaf.pivot.visible = moving;
        if (!moving) continue;

        leaf.pivot.rotation.y = -t * LEAF_OPEN;
        leaf.pivot.position.z = leaf.z0 + (leaf.z1 - leaf.z0) * t;
        curlLeaf(leaf, t);
      }

      // Stacks take up the slack: the right block thins as leaves leave it and
      // the left block thickens as they arrive.
      const gap = BLOCK_T / (LEAVES + 1);
      const right = Math.max(0.001, BLOCK_T - turnedTotal * gap);
      const left = Math.max(0.001, turnedTotal * gap);
      rightStack.scale.z = right;
      rightStack.position.z = BLOCK_T / 2 - right / 2;
      leftStack.scale.z = left;
      leftStack.position.z = -BLOCK_T / 2 + left / 2;
      leftStack.visible = left > 0.004;
    }

    let raf = 0;
    let visible = true;
    const start = performance.now();

    function tick() {
      raf = 0;
      const t = (performance.now() - start) / 1000;

      // Ease toward the scroll target so spinning the wheel does not snap.
      open += (openTarget - open) * 0.12;

      if (!dragging) {
        // Inertia after release, then a slow settle so the book never ends up
        // permanently facing away.
        spin += spinVel;
        spinVel *= 0.94;
        spin *= 0.985;
      }

      applyOpen(open);

      parts.root.rotation.y = spin + Math.sin(t * 0.35) * 0.09 - open * 0.32;
      parts.root.rotation.x = -0.12 + Math.sin(t * 0.5) * 0.05 + pointerY * 0.12;
      parts.root.rotation.z = Math.sin(t * 0.27) * 0.035 + pointerX * 0.04;
      parts.root.position.y = Math.sin(t * 0.6) * 0.11;

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
      // One static frame, part-open so the cross and the leaves both read.
      applyOpen(0.34);
      parts.root.rotation.set(-0.12, -0.25, 0.02);
      renderer.render(scene, camera);
    } else {
      // Paint the closed state immediately, so the canvas is never blank if the
      // first animation frame is delayed.
      applyOpen(0);
      renderer.render(scene, camera);
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
      // Materials are shared between meshes, and the covers carry an array of
      // six (one per box face) so the endpaper can differ from the boards —
      // hence the dedupe and the array check rather than a single dispose.
      const spent = new Set<{ dispose(): void }>();
      parts.root.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m || spent.has(m)) continue;
          spent.add(m);
          // The icon's canvas texture is a GPU resource of its own.
          const map = (m as MeshStandardMaterial).map;
          if (map && !spent.has(map)) {
            spent.add(map);
            map.dispose();
          }
          m.dispose();
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
