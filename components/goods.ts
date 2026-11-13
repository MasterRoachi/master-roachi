import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  type Material,
} from 'three';
import type { GoodsKind } from '@/lib/models';

// The flat goods, built rather than downloaded (BRIEF.md, 12 Nov 2026): a
// poster is a sheet, a canvas a box with its picture wrapped round the sides,
// a metal print a thin glossy slab, a button a domed disc. None of them is a
// shape anyone would license, and building them means each is exactly the
// size and proportion of the thing Printful makes — which a downloaded model
// of "a poster" would not be.
//
// Everything is in inches, the unit Printful sizes most of these in, and the
// viewer frames whatever comes back, so the scale only matters relative to
// itself: how thick a canvas is next to how wide.
//
// The texture is the print file itself, web-sized — the same crop, wrap and
// signature as what is printed — so a canvas's sides show what really goes
// round them.

export interface GoodsSpec {
  kind: GoodsKind;
  /** The printed area, in inches, including any wrap or bleed. */
  width: number;
  height: number;
  /** Wrap or bleed on each side, in inches, that is not on the face. */
  edge?: [number, number];
  /** A shaped pillow's outline, in inches, centred, y up. */
  outline?: [number, number][];
  /** The blank's colour by Printful's name, for a tote or a cap. */
  color?: string;
}

type Keep = (thing: { dispose(): void }) => void;

const PAPER = 0xf4f1ea;

function paint(texture: Texture, options: { rough?: number; gloss?: boolean } = {}): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    map: texture,
    roughness: options.rough ?? 0.8,
    metalness: 0,
    clearcoat: options.gloss ? 0.8 : 0,
    // Not mirror-sharp: under the stage's key light a sharp coat on a flat
    // face is one white disc in the middle of the picture.
    clearcoatRoughness: 0.3,
    // The art lies on the body's own front face; this keeps it in front
    // rather than flickering through it at a glancing angle.
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

function plain(color: number, rough = 0.85, metal = 0): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: new Color(color), roughness: rough, metalness: metal });
}

function roundedRect(w: number, h: number, r: number): Shape {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** UVs for a flat shape's own outline, so the texture spans it exactly once. */
function planarUv(geometry: BufferGeometry, w: number, h: number, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
  const pos = geometry.getAttribute('position');
  const uv: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    uv.push(u0 + (pos.getX(i) / w + 0.5) * (u1 - u0), v0 + (pos.getY(i) / h + 0.5) * (v1 - v0));
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
}

/**
 * A slab with a printed face: the body in `body`, the art on a face laid a
 * hair in front of it. Two pieces rather than one extruded geometry with a
 * material per group, because an extrusion caps front and back alike and a
 * poster is not printed on both sides.
 */
function slab(
  art: Material,
  body: Material,
  w: number,
  h: number,
  depth: number,
  radius: number,
  keep: Keep,
  face: [number, number, number, number] = [0, 0, 1, 1],
): Group {
  const group = new Group();
  const shape = roundedRect(w, h, radius);
  const solid = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
  solid.translate(0, 0, -depth);
  const front = new ShapeGeometry(shape, 10);
  planarUv(front, w, h, ...face);
  front.translate(0, 0, depth * 0.002 + 0.001);
  keep(solid);
  keep(front);
  group.add(new Mesh(solid, body), new Mesh(front, art));
  return group;
}

/** A gallery-wrapped canvas: the picture over the face and round all four sides. */
function canvasBox(texture: Texture, spec: GoodsSpec, keep: Keep): Group {
  const [ex, ey] = spec.edge ?? [1.5, 1.5];
  const w = spec.width - 2 * ex;
  const h = spec.height - 2 * ey;
  // The wrap is what is seen of the sides; the bars are about that deep.
  const d = Math.min(ex, ey) * 0.85;
  const geometry = new BoxGeometry(w, h, d);
  const fx = ex / spec.width;
  const fy = ey / spec.height;
  // BoxGeometry lays each face out as a 2x2 grid, vertex (ix, iy) at index
  // iy * 2 + ix, with the face's own axes running as three.js builds them.
  // Each side is mapped from the edge it shares with the face out to the
  // outer edge of the wrap strip, so the picture runs continuously round the
  // corner the way the printed canvas does.
  const L = fx;
  const R = 1 - fx;
  const T = 1 - fy;
  const B = fy;
  const sides: ((ix: number, iy: number) => [number, number])[] = [
    // +x: ix 0 is the front edge, iy 0 the top.
    (ix, iy) => [ix === 0 ? R : 1, iy === 0 ? T : B],
    // -x: ix 0 is the back edge.
    (ix, iy) => [ix === 0 ? 0 : L, iy === 0 ? T : B],
    // +y: ix 0 is the left, iy 0 the back edge.
    (ix, iy) => [ix === 0 ? L : R, iy === 0 ? 1 : T],
    // -y: iy 0 is the front edge.
    (ix, iy) => [ix === 0 ? L : R, iy === 0 ? B : 0],
    // +z, the face: iy 0 is the top.
    (ix, iy) => [ix === 0 ? L : R, iy === 0 ? T : B],
    // -z, the back, which is unprinted.
    () => [0, 0],
  ];
  const uv = geometry.getAttribute('uv');
  sides.forEach((at, f) => {
    for (let iy = 0; iy < 2; iy++) {
      for (let ix = 0; ix < 2; ix++) uv.setXY(f * 4 + iy * 2 + ix, ...at(ix, iy));
    }
  });
  uv.needsUpdate = true;
  keep(geometry);

  const art = paint(texture, { rough: 0.9 });
  const back = plain(0xd9cfbf, 0.95);
  keep(art);
  keep(back);
  return new Group().add(new Mesh(geometry, [art, art, art, art, art, back]));
}

/** A die-cut sticker: the art, with a back the colour of the paper behind it. */
function sticker(texture: Texture, w: number, h: number, keep: Keep, holo: boolean): Group {
  const group = new Group();
  const plane = new PlaneGeometry(w, h);
  keep(plane);
  const front = holo
    ? new MeshPhysicalMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.4,
        roughness: 0.25,
        metalness: 0.35,
        iridescence: 1,
        iridescenceIOR: 1.6,
        iridescenceThicknessRange: [180, 620],
      })
    : new MeshPhysicalMaterial({ map: texture, transparent: true, alphaTest: 0.4, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  // The backing paper is the sticker's outline in white. An alphaMap reads
  // the green channel, not the alpha, so the outline is drawn out of the
  // picture's own alpha onto a canvas instead.
  const back = new MeshStandardMaterial({
    map: silhouette(texture, keep),
    transparent: true,
    alphaTest: 0.4,
    roughness: 0.9,
  });
  keep(front);
  keep(back);
  const face = new Mesh(plane, front);
  const rear = new Mesh(plane, back);
  rear.rotation.y = Math.PI;
  rear.position.z = -0.002;
  group.add(face, rear);
  return group;
}

/** The picture's shape, filled white, for the back of a cut-out thing. */
function silhouette(texture: Texture, keep: Keep): Texture {
  const image = texture.image as CanvasImageSource & { width: number; height: number };
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const out = new CanvasTexture(canvas);
  out.colorSpace = SRGBColorSpace;
  keep(out);
  return out;
}

/** A pin button: a printed dome on a rolled metal rim, with the pin behind. */
function button(texture: Texture, keep: Keep): Group {
  const group = new Group();
  const r = 1.125;
  // The print file wraps the rim; the dome shows about the middle 80% of it.
  const shown = 0.8;
  const dome = new CircleGeometry(r, 64, 0, Math.PI * 2);
  const pos = dome.getAttribute('position');
  const uv: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = (x * x + y * y) / (r * r);
    pos.setZ(i, 0.16 * (1 - t));
    uv.push(0.5 + (x / r) * 0.5 * shown, 0.5 + (y / r) * 0.5 * shown);
  }
  dome.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  dome.computeVertexNormals();
  const rim = new CylinderGeometry(r, r, 0.12, 64, 1, true);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, 0, -0.06);
  const back = new CircleGeometry(r, 64);
  back.rotateY(Math.PI);
  back.translate(0, 0, -0.12);
  const pin = new TorusGeometry(0.55, 0.02, 8, 48, Math.PI * 1.2);
  pin.translate(0, -0.1, -0.16);
  for (const g of [dome, rim, back, pin]) keep(g);

  const art = paint(texture, { rough: 0.45, gloss: true });
  // The rim takes the print's own colour at its edge, as a real one does.
  const steel = plain(0xb9bcc2, 0.35, 0.9);
  keep(art);
  keep(steel);
  group.add(new Mesh(dome, art), new Mesh(rim, art), new Mesh(back, steel), new Mesh(pin, steel));
  return group;
}

/** A jigsaw's cut lines, drawn once and laid over the picture. */
function puzzleLines(w: number, h: number, keep: Keep): Texture {
  const canvas = document.createElement('canvas');
  const px = 1024;
  canvas.width = px;
  canvas.height = Math.round((px * h) / w);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cols = Math.round(w * 1.4);
    const rows = Math.round(h * 1.4);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.4;
    const cw = canvas.width / cols;
    const rh = canvas.height / rows;
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const x = c * cw;
        const y = r * rh;
        const bump = (c + r) % 2 ? 1 : -1;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rh * 0.38);
        ctx.bezierCurveTo(x + bump * cw * 0.28, y + rh * 0.3, x + bump * cw * 0.28, y + rh * 0.7, x, y + rh * 0.62);
        ctx.lineTo(x, y + rh);
      }
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const y = r * rh;
        const bump = (c + r) % 2 ? -1 : 1;
        ctx.moveTo(x, y);
        ctx.lineTo(x + cw * 0.38, y);
        ctx.bezierCurveTo(x + cw * 0.3, y + bump * rh * 0.28, x + cw * 0.7, y + bump * rh * 0.28, x + cw * 0.62, y);
        ctx.lineTo(x + cw, y);
      }
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  keep(texture);
  return texture;
}

/** A spiral binding down the top edge, as Printful's notebook has it. */
function coil(w: number, h: number, keep: Keep): Group {
  const group = new Group();
  const ring = new TorusGeometry(0.16, 0.025, 8, 24);
  ring.rotateY(Math.PI / 2);
  keep(ring);
  const wire = plain(0x222222, 0.4, 0.8);
  keep(wire);
  const count = Math.floor(w / 0.33);
  for (let i = 0; i < count; i++) {
    const m = new Mesh(ring, wire);
    m.position.set(-w / 2 + (i + 0.5) * (w / count), h / 2 - 0.02, -0.12);
    m.rotation.x = Math.PI / 2;
    group.add(m);
  }
  return group;
}

/** A hanging tapestry: a cloth with a slow wave in it. */
function tapestry(texture: Texture, w: number, h: number, keep: Keep): Group {
  const geometry = new PlaneGeometry(w, h, 48, 6);
  const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Hangs from the top, so the fold is deeper towards the bottom.
    const hang = 0.35 + 0.65 * (0.5 - y / h);
    pos.setZ(i, Math.sin((x / w) * Math.PI * 5) * 0.35 * hang);
  }
  geometry.computeVertexNormals();
  keep(geometry);
  const cloth = new MeshStandardMaterial({ map: texture, roughness: 0.95, side: DoubleSide });
  keep(cloth);
  return new Group().add(new Mesh(geometry, cloth));
}

/**
 * The thing itself, centred on the origin, in inches.
 *
 * The ornament has no builder yet: its product page shows its mockups and
 * nothing turns. The mugs, the tote, the pillow and the cap were added on
 * 13 Nov 2026 (Fjord), below the flat goods. See lib/models.ts.
 */
export function buildGood(spec: GoodsSpec, texture: Texture, keep: Keep): Group | null {
  texture.colorSpace = SRGBColorSpace;
  const { width: w, height: h } = spec;
  const [ex, ey] = spec.edge ?? [0, 0];
  const faceUv: [number, number, number, number] = [ex / w, ey / h, 1 - ex / w, 1 - ey / h];
  const fw = w - 2 * ex;
  const fh = h - 2 * ey;
  const paper = plain(PAPER, 0.9);
  keep(paper);

  switch (spec.kind) {
    case 'poster':
    case 'postcard': {
      const art = paint(texture, { rough: 0.85 });
      keep(art);
      return slab(art, paper, fw, fh, spec.kind === 'poster' ? 0.02 : 0.03, 0, keep, faceUv);
    }
    case 'framed-poster': {
      const art = paint(texture, { rough: 0.85 });
      keep(art);
      const group = slab(art, paper, fw, fh, 0.02, 0, keep, faceUv);
      const frame = plain(0x161616, 0.6);
      keep(frame);
      const bar = 0.75;
      const depth = 0.85;
      const pieces: [number, number, number, number][] = [
        [0, fh / 2 + bar / 2, fw + 2 * bar, bar],
        [0, -fh / 2 - bar / 2, fw + 2 * bar, bar],
        [fw / 2 + bar / 2, 0, bar, fh],
        [-fw / 2 - bar / 2, 0, bar, fh],
      ];
      for (const [x, y, bw, bh] of pieces) {
        const g = new BoxGeometry(bw, bh, depth);
        g.translate(x, y, -depth / 2 + 0.12);
        keep(g);
        group.add(new Mesh(g, frame));
      }
      return group;
    }
    case 'canvas':
      return canvasBox(texture, spec, keep);
    case 'metal-print': {
      const art = paint(texture, { rough: 0.35, gloss: true });
      const back = plain(0x9a9da3, 0.4, 0.8);
      keep(art);
      keep(back);
      const group = slab(art, back, fw, fh, 0.045, 0.12, keep, faceUv);
      // The float mount behind it, which is what makes it stand off the wall.
      const mount = new BoxGeometry(fw * 0.6, fh * 0.6, 0.5);
      mount.translate(0, 0, -0.3);
      keep(mount);
      group.add(new Mesh(mount, plain(0x1b1b1b, 0.7)));
      return group;
    }
    case 'mouse-pad':
    case 'desk-mat': {
      const art = paint(texture, { rough: 0.95 });
      const rubber = plain(0x111111, 0.95);
      keep(art);
      keep(rubber);
      return slab(art, rubber, fw, fh, 0.12, 0.5, keep, faceUv);
    }
    case 'laptop-sleeve': {
      const art = paint(texture, { rough: 0.9 });
      const side = plain(0x151515, 0.9);
      keep(art);
      keep(side);
      return slab(art, side, fw, fh, 0.6, 1.1, keep, faceUv);
    }
    case 'phone-case': {
      const art = paint(texture, { rough: 0.3, gloss: true });
      const shell = plain(0x101010, 0.5);
      keep(art);
      keep(shell);
      const group = slab(art, shell, fw, fh, 0.45, 0.55, keep, faceUv);
      const bump = new BoxGeometry(fw * 0.42, fw * 0.42, 0.12);
      bump.translate(-fw / 2 + fw * 0.27, fh / 2 - fw * 0.27, 0.07);
      keep(bump);
      group.add(new Mesh(bump, shell));
      return group;
    }
    case 'jigsaw-puzzle': {
      const art = paint(texture, { rough: 0.6 });
      keep(art);
      const group = slab(art, plain(0x6b5a45, 0.95), fw, fh, 0.08, 0, keep, faceUv);
      const lines = new MeshStandardMaterial({ map: puzzleLines(fw, fh, keep), transparent: true, depthWrite: false });
      keep(lines);
      const overlay = new PlaneGeometry(fw, fh);
      overlay.translate(0, 0, 0.004);
      keep(overlay);
      group.add(new Mesh(overlay, lines));
      return group;
    }
    case 'hardcover-journal':
    case 'spiral-notebook': {
      const art = paint(texture, { rough: 0.7 });
      keep(art);
      const thick = spec.kind === 'hardcover-journal' ? 0.75 : 0.45;
      const group = slab(art, paper, fw, fh, thick, 0.06, keep, faceUv);
      if (spec.kind === 'spiral-notebook') group.add(coil(fw, fh, keep));
      return group;
    }
    case 'greeting-card': {
      // Stood open, as one stands on a shelf: the front panel faces out.
      const art = paint(texture, { rough: 0.85 });
      keep(art);
      const half = fw / 2;
      const front = slab(art, paper, half, fh, 0.02, 0, keep, [0.5, faceUv[1], faceUv[2], faceUv[3]]);
      const inside = slab(paper, paper, half, fh, 0.02, 0, keep);
      front.position.x = half / 2;
      inside.position.x = -half / 2;
      const hinge = new Group().add(front);
      const leaf = new Group().add(inside);
      leaf.rotation.y = -0.7;
      return new Group().add(hinge, leaf);
    }
    case 'wall-tapestry':
      return tapestry(texture, fw, fh, keep);
    case 'die-cut-sticker':
    case 'holographic-sticker':
      return sticker(texture, w, h, keep, spec.kind === 'holographic-sticker');
    case 'pin-buttons':
      return button(texture, keep);
    case 'black-mug':
    case 'white-mug':
      return mug(texture, w, h, spec.kind === 'black-mug', keep);
    case 'eco-tote':
      return tote(texture, w, h, blank(spec.color), keep);
    case 'shaped-pillow':
      return spec.outline && spec.outline.length >= 3 ? pillow(texture, w, h, spec.outline, keep) : null;
    case 'dad-cap':
      return cap(texture, w, h, blank(spec.color), keep);
    default:
      return null;
  }
}

/** Which kinds lie on a desk rather than hang, so the viewer tips them back. */
export function liesFlat(kind: GoodsKind): boolean {
  return kind === 'mouse-pad' || kind === 'desk-mat' || kind === 'jigsaw-puzzle';
}

// ── Round goods, 13 Nov 2026 ──────────────────────────────────────────────
//
// A mug, a tote, a shaped pillow and a dad cap. Same rules as the flat goods:
// inches, centred on the origin, the texture being the print file (or the
// embroidery file) as tools/goods.py fits it.

/** A blank's colour from Printful's name for it. Black unless it says otherwise. */
function blank(name: string | undefined): number {
  const n = (name ?? 'Black').toLowerCase();
  if (n.includes('white')) return 0xf2f2f0;
  if (n.includes('natural') || n.includes('oyster')) return 0xe6dcc6;
  return 0x151515;
}

/**
 * An 11oz mug: a glazed cylinder with its handle at the back and the print
 * area wrapped round the front, centred, as far round as Printful prints it.
 */
function mug(texture: Texture, w: number, h: number, black: boolean, keep: Keep): Group {
  const group = new Group();
  const r = 1.6; // 3.2in across
  const tall = 3.8;
  const glaze = new MeshPhysicalMaterial({
    color: new Color(black ? 0x111111 : 0xf6f6f4),
    roughness: 0.25,
    clearcoat: 0.9,
    clearcoatRoughness: 0.15,
  });
  const inside = new MeshPhysicalMaterial({
    color: new Color(black ? 0x111111 : 0xf6f6f4),
    roughness: 0.3,
    side: DoubleSide,
  });
  keep(glaze);
  keep(inside);

  const body = new CylinderGeometry(r, r * 0.97, tall, 72, 1, true);
  const wall = new CylinderGeometry(r * 0.93, r * 0.9, tall * 0.97, 72, 1, true);
  wall.translate(0, tall * 0.015, 0);
  const base = new CircleGeometry(r * 0.97, 72);
  base.rotateX(Math.PI / 2);
  base.translate(0, -tall / 2, 0);
  const floor = new CircleGeometry(r * 0.9, 72);
  floor.rotateX(-Math.PI / 2);
  floor.translate(0, -tall / 2 + 0.25, 0);
  const lip = new TorusGeometry(r * 0.965, r * 0.035, 10, 72);
  lip.rotateX(Math.PI / 2);
  lip.translate(0, tall / 2, 0);
  // The handle, a C at the back (-z), standing upright.
  const handle = new TorusGeometry(0.85, 0.2, 16, 40, Math.PI * 1.15);
  handle.rotateZ(-Math.PI * 0.575);
  handle.rotateY(Math.PI / 2);
  handle.translate(0, 0, -r - 0.45);
  for (const g of [body, wall, base, floor, lip, handle]) keep(g);
  group.add(
    new Mesh(body, glaze),
    new Mesh(wall, inside),
    new Mesh(base, glaze),
    new Mesh(floor, inside),
    new Mesh(lip, glaze),
    new Mesh(handle, glaze),
  );

  // The print, a strip of the same cylinder a hair outside it. theta 0 is +z,
  // the front, and u runs left to right as seen from there.
  const arc = Math.min(w / r, Math.PI * 1.7);
  const band = new CylinderGeometry(r * 1.003, r * 1.003, Math.min(h, tall * 0.95), 72, 1, true, -arc / 2, arc);
  keep(band);
  const art = new MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05,
    roughness: 0.25,
    clearcoat: 0.9,
    clearcoatRoughness: 0.15,
  });
  keep(art);
  group.add(new Mesh(band, art));
  return group;
}

/** An eco tote: a soft bag with the print on its front and two strap handles. */
function tote(texture: Texture, w: number, h: number, color: number, keep: Keep): Group {
  const group = new Group();
  const bw = Math.max(15, w + 0.5);
  const bh = Math.max(16, h + 1);
  const cloth = new MeshStandardMaterial({ color: new Color(color), roughness: 0.95 });
  keep(cloth);
  const bag = new BoxGeometry(bw, bh, 0.5);
  keep(bag);
  group.add(new Mesh(bag, cloth));

  const art = new MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.05, roughness: 0.95 });
  keep(art);
  const face = new PlaneGeometry(w, h);
  // Printed in the middle of the front, a little below the top seam.
  face.translate(0, (bh - h) / 2 - 1, 0.252);
  keep(face);
  group.add(new Mesh(face, art));

  // Two straps, an arch each, front and back.
  const strap = new TorusGeometry(4.2, 0.28, 10, 40, Math.PI);
  strap.scale(1, 1.35, 0.35);
  keep(strap);
  for (const z of [0.18, -0.18]) {
    const m = new Mesh(strap, cloth);
    m.position.set(0, bh / 2 - 0.2, z);
    group.add(m);
  }
  return group;
}

/**
 * A shaped pillow: the character's own outline, puffed, printed both sides.
 * The faces are the outline exactly; the bevel swells the edge out past it,
 * which is what a stuffed seam does.
 */
function pillow(texture: Texture, w: number, h: number, outline: [number, number][], keep: Keep): Group {
  const group = new Group();
  const shape = new Shape();
  outline.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  const size = Math.min(w, h);
  const depth = size * 0.08;
  const puff = size * 0.07;
  const body = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: puff,
    bevelSize: size * 0.03,
    bevelSegments: 6,
    curveSegments: 4,
  });
  body.translate(0, 0, -depth / 2);
  keep(body);
  const seam = plain(0xefefec, 0.95);
  keep(seam);
  group.add(new Mesh(body, seam));

  const art = new MeshStandardMaterial({ map: texture, roughness: 0.95 });
  keep(art);
  const front = new ShapeGeometry(shape, 4);
  planarUv(front, w, h);
  const back = front.clone();
  front.translate(0, 0, depth / 2 + puff + 0.01);
  // Turned round, so from behind it reads the right way and not mirrored.
  back.rotateY(Math.PI);
  back.translate(0, 0, -(depth / 2 + puff + 0.01));
  keep(front);
  keep(back);
  group.add(new Mesh(front, art), new Mesh(back, art));
  return group;
}

/**
 * A dad cap: a soft six-panel crown, a curved brim at the front and the
 * embroidery stitched on the front panels. The embroidery is a patch of the
 * crown's own sphere, so it lies on the curve rather than through it.
 */
function cap(texture: Texture, w: number, h: number, color: number, keep: Keep): Group {
  const group = new Group();
  const r = 3.6;
  const squash = 0.72;
  const twill = new MeshStandardMaterial({ color: new Color(color), roughness: 0.92, side: DoubleSide });
  keep(twill);

  const crown = new SphereGeometry(r, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  crown.scale(1, squash, 1);
  keep(crown);
  group.add(new Mesh(crown, twill));

  const top = new SphereGeometry(0.28, 16, 8);
  top.scale(1, 0.5, 1);
  top.translate(0, r * squash, 0);
  keep(top);
  group.add(new Mesh(top, twill));

  // The brim: a crescent whose inner edge follows the crown and whose outer
  // edge reaches about 2.75in out at the front, dipping a little. A straight
  // back edge (the first version) left its corners standing out past the
  // crown on both sides, which read as a brim pointing sideways.
  const reach = 2.75;
  const brimShape = new Shape();
  brimShape.moveTo(r, 0);
  brimShape.absellipse(0, 0, r, r + reach, 0, Math.PI, false);
  brimShape.absarc(0, 0, r * 0.98, Math.PI, 0, true);
  brimShape.closePath();
  const brim = new ExtrudeGeometry(brimShape, { depth: 0.12, bevelEnabled: false, curveSegments: 48 });
  brim.rotateX(Math.PI / 2);
  // Measured from the crown's centre, so a small tilt is a big drop at the
  // tip: 0.1 rad is about 0.6in at 6.3in out.
  brim.rotateX(0.1);
  brim.translate(0, 0.15, 0);
  keep(brim);
  group.add(new Mesh(brim, twill));

  // The embroidery, centred on the front between the brim and the button.
  const across = Math.min(w / r, Math.PI * 0.6);
  const down = Math.min(h / (r * squash), Math.PI * 0.35);
  const centre = Math.PI * 0.27;
  const patch = new SphereGeometry(r * 1.004, 32, 16, Math.PI / 2 - across / 2, across, centre - down / 2, down);
  patch.scale(1, squash, 1);
  keep(patch);
  const thread = new MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.35, roughness: 0.6 });
  keep(thread);
  group.add(new Mesh(patch, thread));
  return group;
}

