import {
  Box3,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  Shape,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Materials } from './style';
import { canvasTexture, hash, shade } from './textures';

// The games room's consoles, eighteen of them, at their real sizes in metres,
// and the discs and cartridges that go into them. Each is built from rounded
// boxes, lathes and bevelled extrusions so it reads as the machine by its
// outline, colour, vents, ports and lids. No logos or wordmarks: shape and
// colour only.
//
// Every console stands on y = 0, centred on its base, its front towards +z.
// Handhelds stand upright, screen towards +z. Drawn from primitives only: no
// model files to source or license.

export type ConsoleId =
  | 'ps1' | 'ps2' | 'ps3' | 'xbox' | 'x360' | 'gc' | 'wii' | 'saturn' | 'dc'
  | 'nes' | 'snes' | 'n64' | 'md'
  | 'gb' | 'gba' | 'nds' | 'psp' | 'vita';
export type MediumKind = 'cd' | 'dvd' | 'bluray' | 'gcdisc' | 'gdrom' | 'umd' | 'cart' | 'card';

export interface ConsoleModel {
  id: ConsoleId;
  root: Group;
  handheld: boolean;
  medium: MediumKind;
  size: { w: number; h: number; d: number };
  seat: Object3D;
  approach: Object3D;
  setOpen(k: number): void;
  setPower(on: boolean): void;
  screen?: Object3D;
  screenSize?: { w: number; h: number };
  screen2?: Object3D;
  screen2Size?: { w: number; h: number };
}

export const MEDIUM: Record<ConsoleId, MediumKind> = {
  ps1: 'cd', ps2: 'dvd', ps3: 'bluray', xbox: 'dvd', x360: 'dvd', gc: 'gcdisc', wii: 'dvd', saturn: 'cd', dc: 'gdrom',
  nes: 'cart', snes: 'cart', n64: 'cart', md: 'cart', gb: 'cart', gba: 'cart', nds: 'card', psp: 'umd', vita: 'card',
};

const HANDHELD = new Set<ConsoleId>(['gb', 'gba', 'nds', 'psp', 'vita']);

// ---------------------------------------------------------------------------
// Helpers.

const PI = Math.PI;
const DISC_R = 0.06;
const GC_R = 0.04;

const plastic = (colour: string, roughness = 0.5, metalness = 0) => new MeshStandardMaterial({ color: colour, roughness, metalness });
const glossy = (colour: string, roughness = 0.14) =>
  new MeshPhysicalMaterial({ color: colour, roughness, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });

/** Positions (and turns) an object and adds it to a parent. */
function put<T extends Object3D>(parent: Object3D, o: T, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): T {
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  parent.add(o);
  return o;
}

function rbox(w: number, h: number, d: number, r: number, m: Material, seg = 3) {
  const rr = Math.max(1e-5, Math.min(r, (Math.min(w, h, d) / 2) * 0.98));
  return new Mesh(new RoundedBoxGeometry(w, h, d, seg, rr), m);
}

const box = (w: number, h: number, d: number, m: Material) => new Mesh(new BoxGeometry(w, h, d), m);

/** An upright cylinder (axis y). */
const cyl = (rt: number, rb: number, h: number, m: Material, seg = 24) => new Mesh(new CylinderGeometry(rt, rb, h, seg), m);

/** A cylinder facing +z: a button or port on a front face. */
function zcyl(r: number, t: number, m: Material, seg = 20) {
  const g = new CylinderGeometry(r, r, t, seg);
  g.rotateX(PI / 2);
  return new Mesh(g, m);
}

/** A cylinder lying along x. */
function xcyl(r: number, len: number, m: Material, seg = 16) {
  const g = new CylinderGeometry(r, r, len, seg);
  g.rotateZ(PI / 2);
  return new Mesh(g, m);
}

const lathe = (pts: [number, number][], m: Material, seg = 48) => new Mesh(new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg), m);

/** A rounded rectangle, corners [top-left, top-right, bottom-right, bottom-left]. */
function rrect(w: number, h: number, r: number | [number, number, number, number], cx = 0, cy = 0) {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const s = new Shape();
  s.moveTo(x0 + bl, y0);
  s.lineTo(x1 - br, y0);
  if (br) s.absarc(x1 - br, y0 + br, br, -PI / 2, 0, false);
  s.lineTo(x1, y1 - tr);
  if (tr) s.absarc(x1 - tr, y1 - tr, tr, 0, PI / 2, false);
  s.lineTo(x0 + tl, y1);
  if (tl) s.absarc(x0 + tl, y1 - tl, tl, PI / 2, PI, false);
  s.lineTo(x0, y0 + bl);
  if (bl) s.absarc(x0 + bl, y0 + bl, bl, PI, PI * 1.5, false);
  return s;
}

function poly(pts: [number, number][]) {
  const s = new Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) s.lineTo(x, y);
  s.closePath();
  return s;
}

/** A shape extruded along z, `depth` deep in all, centred on z = 0, its edges bevelled by `bevel`. */
function extrude(shape: Shape, depth: number, bevel: number, curveSegments = 10): BufferGeometry {
  // Inlays a millimetre or two thick show no bevel; save the triangles.
  const b = depth < 0.003 ? 0 : Math.max(0, Math.min(bevel, depth / 2 - 1e-4));
  const g = new ExtrudeGeometry(shape, {
    depth: depth - 2 * b,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b,
    bevelSegments: 3,
    curveSegments,
  });
  g.translate(0, 0, -(depth - 2 * b) / 2);
  return g;
}

/** A side profile drawn as (z, y), extruded across x, `width` wide and centred. */
function alongX(shape: Shape, width: number, bevel: number, seg = 10) {
  const g = extrude(shape, width, bevel, seg);
  g.rotateY(-PI / 2);
  return g;
}

/** A plan drawn as (x, z), extruded up y, `height` tall and centred on y = 0. */
function alongY(shape: Shape, height: number, bevel: number, seg = 10) {
  const g = extrude(shape, height, bevel, seg);
  g.rotateX(PI / 2);
  return g;
}

/** A row of grooves or slots: n thin boxes, stepped along an axis. */
function slots(parent: Object3D, n: number, size: [number, number, number], step: [number, number, number], start: [number, number, number], m: Material) {
  for (let i = 0; i < n; i++) put(parent, box(...size, m), start[0] + step[0] * i, start[1] + step[1] * i, start[2] + step[2] * i);
}

interface Ctx {
  leds: { mat: MeshStandardMaterial; on: Color }[];
  screens: MeshStandardMaterial[];
  hole: MeshStandardMaterial;
  port: MeshStandardMaterial;
  chrome: MeshStandardMaterial;
  led(colour: string): MeshStandardMaterial;
  screen(): MeshStandardMaterial;
}

function context(): Ctx {
  const c: Ctx = {
    leds: [],
    screens: [],
    hole: plastic('#060607', 0.9),
    port: plastic('#1c1c1e', 0.7),
    chrome: plastic('#c8cacd', 0.22, 1),
    led(colour) {
      const on = new Color(colour);
      const mat = new MeshStandardMaterial({ color: on.clone().multiplyScalar(0.25), emissive: on, emissiveIntensity: 0, roughness: 0.3 });
      c.leds.push({ mat, on });
      return mat;
    },
    screen() {
      const mat = new MeshStandardMaterial({ color: '#3a3c3b', roughness: 0.2, metalness: 0.1, emissive: '#000000' });
      c.screens.push(mat);
      return mat;
    },
  };
  return c;
}

interface Built {
  root: Group;
  seat: Object3D;
  approach: Object3D;
  open?: (k: number) => void;
  screen?: Object3D;
  screenSize?: { w: number; h: number };
  screen2?: Object3D;
  screen2Size?: { w: number; h: number };
}

/** An empty point to hang the medium on. */
function point(parent: Object3D, x: number, y: number, z: number) {
  return put(parent, new Object3D(), x, y, z);
}

/** A controller port in the PlayStation's shape: a dark rounded mouth with a lip. */
function psPort(parent: Object3D, c: Ctx, x: number, y: number, z: number, w = 0.04, h = 0.014) {
  put(parent, rbox(w, h, 0.004, 0.003, c.port, 2), x, y, z - 0.0014);
  put(parent, rbox(w * 0.8, h * 0.45, 0.002, 0.001, c.hole, 1), x, y, z - 0.0001);
}

/** A disc bay under a lid: the dark well, the spindle's hub and the lens. Returns the seat's height. */
function discBay(parent: Object3D, c: Ctx, x: number, y: number, z: number, r: number, discR: number) {
  put(parent, cyl(r, r, 0.0016, c.hole, 48), x, y + 0.0008, z);
  put(parent, cyl(0.0125, 0.014, 0.002, c.chrome, 24), x, y + 0.0026, z);
  put(parent, cyl(0.004, 0.004, 0.0026, c.chrome, 12), x, y + 0.0029, z);
  put(parent, box(0.014, 0.0012, discR * 0.7, plastic('#2a2a2c', 0.5)), x + discR * 0.55, y + 0.0018, z);
  put(parent, cyl(0.0025, 0.0025, 0.0016, new MeshStandardMaterial({ color: '#4a63a8', roughness: 0.05, metalness: 0.5 }), 12), x + discR * 0.55, y + 0.0026, z + discR * 0.1);
  return y + 0.0036 + 0.0006;
}

/** A front-loading tray: closed with its face flush at zFront; slides out `travel` m. */
function frontTray(
  parent: Object3D,
  c: Ctx,
  o: { x: number; y: number; zFront: number; w: number; d: number; faceW: number; faceH: number; face: Material; floor: Material; travel: number },
) {
  const g = put(parent, new Group(), o.x, o.y, o.zFront);
  put(g, rbox(o.faceW, o.faceH, 0.005, 0.0015, o.face, 2), 0, 0, -0.0025 + 0.0006);
  put(g, box(o.w, 0.005, o.d, o.floor), 0, -0.001, -o.d / 2 - 0.004);
  const cz = -o.d / 2 - 0.004;
  put(g, cyl(DISC_R + 0.002, DISC_R + 0.002, 0.0012, c.hole, 48), 0, 0.0021, cz);
  put(g, cyl(GC_R + 0.002, GC_R + 0.002, 0.0013, plastic('#1a1a1c', 0.6), 40), 0, 0.0022, cz);
  const seat = point(g, 0, 0.0029 + 0.0006, cz);
  const approach = point(g, 0, 0.07, cz);
  return { seat, approach, open: (k: number) => (g.position.z = o.zFront + o.travel * k) };
}

/** A lid hinged at its back edge (the -z side) that flips up. Returns the pivot. */
function backHinged(parent: Object3D, x: number, y: number, zBack: number) {
  return put(parent, new Group(), x, y, zBack);
}

/** Small rubber feet at the corners of a base. */
function feet(parent: Object3D, w: number, d: number, m: Material, r = 0.008, inset = 0.03) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(parent, cyl(r, r, 0.003, m, 12), sx * (w / 2 - inset), 0.0015, sz * (d / 2 - inset));
}

// ---------------------------------------------------------------------------
// Home consoles, disc.

/** PlayStation: grey, a round lid in the middle of the top that flips up. */
function ps1(c: Ctx): Built {
  const W = 0.27;
  const H = 0.06;
  const D = 0.188;
  const root = new Group();
  const grey = plastic('#bfbcb5', 0.55);
  const lidGrey = plastic('#c9c6c0', 0.5);
  const ft = plastic('#2a2a2a', 0.9);
  feet(root, W, D, ft);
  const prof = poly([[-D / 2, 0.003], [D / 2 - 0.004, 0.003], [D / 2, 0.012], [D / 2, 0.04], [D / 2 - 0.014, H], [-D / 2, H]]);
  put(root, new Mesh(alongX(prof, W, 0.004), grey));
  // A groove running round the front, as on the real shell.
  put(root, box(W - 0.012, 0.0012, 0.002, plastic('#8f8c86', 0.6)), 0, 0.03, D / 2 + 0.0003);
  const zc = -0.012;
  const R = 0.069;
  // The ring the lid sits in.
  put(root, new Mesh(new RingGeometry(R + 0.0005, R + 0.003, 64).rotateX(-PI / 2), plastic('#8a8780', 0.7)), 0, H + 0.0002, zc);
  const seatY = discBay(root, c, 0, H, zc, R - 0.003, DISC_R);
  const pivot = backHinged(root, 0, H, zc - R);
  put(pivot, lathe([[0, 0], [R, 0], [R, 0.003], [R - 0.004, 0.0062], [R * 0.5, 0.0074], [0, 0.0076]], lidGrey, 56), 0, 0, R);
  // Top buttons: reset on the left, open and power on the right.
  const btn = plastic('#aeaba4', 0.45);
  put(root, cyl(0.0075, 0.0075, 0.004, btn), -0.105, H + 0.0012, 0.068);
  put(root, cyl(0.0105, 0.0105, 0.004, btn), 0.082, H + 0.0012, 0.068);
  put(root, cyl(0.0095, 0.0095, 0.004, btn), 0.112, H + 0.0012, 0.066);
  put(root, cyl(0.002, 0.002, 0.002, c.led('#3dff5a'), 10), 0.112, H + 0.0006, 0.05);
  // Memory card slots over the controller ports.
  for (const x of [-0.085, 0.085]) {
    psPort(root, c, x, 0.02, D / 2);
    put(root, rbox(0.052, 0.006, 0.004, 0.0015, c.hole, 1), x, 0.035, D / 2 - 0.0012);
  }
  // Vent grooves on the top's back right, over the power supply.
  slots(root, 9, [0.075, 0.0012, 0.0016], [0, 0, 0.0055], [0.085, H + 0.0002, -0.089], c.hole);
  const seat = point(root, 0, seatY, zc);
  const approach = point(root, 0, H + 0.08, zc + 0.01);
  return { root, seat, approach, open: (k) => (pivot.rotation.x = -k * 1.35) };
}

/** PlayStation 2, the original: black, lying flat, ridged, a tray across the upper front. */
function ps2(c: Ctx): Built {
  const W = 0.301;
  const H = 0.078;
  const D = 0.182;
  const root = new Group();
  const black = plastic('#16171b', 0.42);
  const satin = plastic('#1d1e23', 0.3);
  feet(root, W, D, c.port);
  // Two slabs with a recessed waist between them, the PS2's split look.
  put(root, rbox(W, 0.036, D, 0.004, black), 0, 0.021, 0);
  put(root, rbox(W - 0.008, 0.006, D - 0.008, 0.002, c.hole, 2), 0, 0.041, 0);
  put(root, rbox(W, 0.034, D, 0.004, satin), 0, 0.061, 0);
  // The ridges: fine grooves running front to back over the top's left, down the front.
  slots(root, 16, [0.0012, 0.0012, D - 0.03], [0.0045, 0, 0], [-0.142, H + 0.0001, 0.006], c.hole);
  slots(root, 4, [0.044, 0.0012, 0.0016], [0, 0.005, 0], [-0.128, 0.052, D / 2 + 0.0002], c.hole);
  // The tray across the upper front.
  const t = frontTray(root, c, { x: 0.01, y: 0.061, zFront: D / 2, w: 0.185, d: 0.15, faceW: 0.205, faceH: 0.018, face: satin, floor: plastic('#111215', 0.6), travel: 0.135 });
  // Reset and eject on the right, each with its light.
  const btn = plastic('#24252b', 0.35);
  put(root, rbox(0.026, 0.008, 0.004, 0.002, btn, 2), 0.133, 0.066, D / 2 + 0.0008);
  put(root, rbox(0.026, 0.008, 0.004, 0.002, btn, 2), 0.133, 0.054, D / 2 + 0.0008);
  put(root, zcyl(0.0016, 0.002, c.led('#3dff6a'), 10), 0.117, 0.066, D / 2 + 0.0008);
  put(root, zcyl(0.0016, 0.002, c.led('#3e7bff'), 10), 0.117, 0.054, D / 2 + 0.0008);
  // Controller ports with the memory card slots over them, and the USB and i.LINK ports.
  for (const x of [-0.095, -0.045]) {
    psPort(root, c, x, 0.013, D / 2, 0.036, 0.012);
    put(root, rbox(0.044, 0.005, 0.004, 0.0015, c.hole, 1), x, 0.03, D / 2 - 0.0012);
  }
  for (const x of [0.04, 0.056]) put(root, rbox(0.012, 0.005, 0.004, 0.001, c.hole, 1), x, 0.016, D / 2 - 0.0012);
  put(root, rbox(0.009, 0.005, 0.004, 0.001, c.hole, 1), 0.075, 0.016, D / 2 - 0.0012);
  // The fan grille on the back.
  slots(root, 10, [0.0016, 0.05, 0.003], [0.004, 0, 0], [-0.13, 0.04, -D / 2], c.hole);
  return { root, seat: t.seat, approach: t.approach, open: t.open };
}

/** PlayStation 3, the original: glossy black, its top an arch, a slot in the front. */
function ps3(c: Ctx): Built {
  const W = 0.325;
  const H = 0.098;
  const D = 0.274;
  const root = new Group();
  const gloss = glossy('#0b0b0d', 0.1);
  const matte = plastic('#131315', 0.6);
  const front = new Shape();
  front.moveTo(-W / 2, 0.012);
  front.lineTo(W / 2, 0.012);
  front.lineTo(W / 2, 0.066);
  front.quadraticCurveTo(0, H + (H - 0.066), -W / 2, 0.066);
  front.closePath();
  put(root, new Mesh(extrude(front, D, 0.01, 24), gloss));
  // The matte base it floats on.
  put(root, rbox(W - 0.012, 0.014, D - 0.012, 0.004, matte), 0, 0.007, 0);
  // A silver trim along the front's foot.
  put(root, rbox(W - 0.02, 0.0028, 0.004, 0.0012, c.chrome, 1), 0, 0.0145, D / 2 - 0.0012);
  // The slot, a little above centre.
  put(root, rbox(0.132, 0.0045, 0.004, 0.0018, c.hole, 1), 0.0, 0.058, D / 2 - 0.0012);
  // Touch buttons on the right: power and eject, each a fine line with a light.
  put(root, box(0.012, 0.0008, 0.0012, c.chrome), 0.128, 0.052, D / 2 + 0.0002);
  put(root, box(0.012, 0.0008, 0.0012, c.chrome), 0.128, 0.045, D / 2 + 0.0002);
  put(root, zcyl(0.0012, 0.0015, c.led('#ff3030'), 10), 0.142, 0.052, D / 2 + 0.0002);
  // Four USB ports low on the left.
  for (let i = 0; i < 4; i++) put(root, rbox(0.012, 0.0045, 0.004, 0.0008, c.hole, 1), -0.135 + i * 0.016, 0.026, D / 2 - 0.0012);
  // Grilles down the sides of the base and across the back.
  for (const s of [-1, 1]) slots(root, 14, [0.003, 0.0055, 0.0045], [0, 0, 0.013], [s * (W / 2 - 0.0045), 0.0075, -0.09], c.hole);
  slots(root, 18, [0.004, 0.04, 0.003], [0.012, 0, 0], [-0.1, 0.045, -D / 2 + 0.0005], c.hole);
  const seat = point(root, 0, 0.058, D / 2 - 0.09);
  const approach = point(root, 0, 0.058, D / 2 + 0.075);
  return { root, seat, approach };
}

/** Xbox, the original: a big black box, a green jewel in the top, a tray in the front. */
function xbox(c: Ctx): Built {
  const W = 0.32;
  const H = 0.1;
  const D = 0.26;
  const root = new Group();
  const black = plastic('#151616', 0.4);
  const deep = plastic('#0e1010', 0.55);
  feet(root, W, D, c.port, 0.012, 0.04);
  const prof = poly([[-D / 2, 0.004], [D / 2 - 0.006, 0.004], [D / 2, 0.014], [D / 2, 0.06], [D / 2 - 0.026, H], [-D / 2, H]]);
  put(root, new Mesh(alongX(prof, W, 0.008), black));
  // The X raised from the top: four ribs running from the corners into the jewel.
  const ang = Math.atan2(D, W);
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const len = Math.hypot(W, D) / 2 - 0.06;
    const rib = rbox(len, 0.007, 0.03, 0.0035, black, 2);
    const mid = 0.035 + len / 2;
    put(root, rib, sx * Math.cos(ang) * mid, H, sz * Math.sin(ang) * mid - 0.006, 0, -Math.atan2(sz * Math.sin(ang), sx * Math.cos(ang)), 0);
  }
  // The jewel: a black boss, and a green dome set in it.
  put(root, lathe([[0, 0], [0.045, 0], [0.045, 0.006], [0.04, 0.009], [0, 0.009]], black, 48), 0, H - 0.002, -0.006);
  const jewel = new MeshPhysicalMaterial({ color: '#2f8a24', emissive: '#1d6a12', emissiveIntensity: 0.3, roughness: 0.08, clearcoat: 1, transmission: 0.2, thickness: 0.01 });
  put(root, lathe([[0, 0], [0.032, 0], [0.03, 0.004], [0.02, 0.008], [0, 0.0095]], jewel, 40), 0, H + 0.007, -0.006);
  // A lip over the controller ports.
  put(root, rbox(W - 0.02, 0.006, 0.012, 0.002, deep, 2), 0, 0.033, D / 2 - 0.002);
  const t = frontTray(root, c, { x: -0.035, y: 0.047, zFront: D / 2, w: 0.17, d: 0.16, faceW: 0.19, faceH: 0.02, face: deep, floor: plastic('#101111', 0.6), travel: 0.14 });
  // Power and eject on the right; the power button ringed in green light.
  put(root, zcyl(0.011, 0.005, black, 28), 0.115, 0.048, D / 2 + 0.0015);
  put(root, new Mesh(new TorusGeometry(0.0125, 0.0014, 8, 32), c.led('#36ff3a')), 0.115, 0.048, D / 2 + 0.0035);
  put(root, zcyl(0.0065, 0.005, black, 24), 0.083, 0.048, D / 2 + 0.0015);
  // Four controller ports along the bottom, in pairs.
  for (const x of [-0.115, -0.075, 0.075, 0.115]) {
    put(root, rbox(0.03, 0.016, 0.004, 0.004, c.port, 2), x, 0.019, D / 2 + 0.0008);
    put(root, rbox(0.022, 0.006, 0.003, 0.002, c.hole, 1), x, 0.019, D / 2 + 0.0022);
  }
  slots(root, 22, [0.004, 0.05, 0.003], [0.012, 0, 0], [-0.126, 0.052, -D / 2], c.hole);
  return { root, seat: t.seat, approach: t.approach, open: t.open };
}

/** Xbox 360: white, its sides drawn in, a tray, the ring of light on the right. */
function x360(c: Ctx): Built {
  const W = 0.309;
  const H = 0.083;
  const D = 0.258;
  const root = new Group();
  const white = plastic('#f1f1ee', 0.35);
  const grey = plastic('#b9bbbd', 0.4);
  const inset = 0.018;
  const front = new Shape();
  front.moveTo(-W / 2, 0.004);
  front.lineTo(W / 2, 0.004);
  front.quadraticCurveTo(W / 2 - inset, H / 2, W / 2, H);
  front.lineTo(-W / 2, H);
  front.quadraticCurveTo(-W / 2 + inset, H / 2, -W / 2, 0.004);
  put(root, new Mesh(extrude(front, D, 0.008, 20), white));
  feet(root, W - 0.05, D, plastic('#9c9c9c', 0.8), 0.01, 0.04);
  // The faceplate: a slightly proud panel across the front.
  const plate = rrect(W - 0.03, H - 0.012, 0.006, 0, H / 2 + 0.002);
  put(root, new Mesh(extrude(plate, 0.004, 0.0015, 8), plastic('#f7f7f5', 0.25)), 0, 0, D / 2 + 0.001);
  const t = frontTray(root, c, { x: -0.04, y: 0.058, zFront: D / 2 + 0.0025, w: 0.16, d: 0.16, faceW: 0.17, faceH: 0.014, face: plastic('#e6e6e3', 0.35), floor: plastic('#2a2b2d', 0.6), travel: 0.14 });
  // The ring of light round the power button, and the eject button by it.
  put(root, zcyl(0.0125, 0.004, plastic('#d6d8da', 0.2, 0.6), 32), 0.115, 0.042, D / 2 + 0.004);
  put(root, new Mesh(new TorusGeometry(0.0145, 0.0018, 8, 40), c.led('#53ff3c')), 0.115, 0.042, D / 2 + 0.0045);
  put(root, rbox(0.009, 0.004, 0.003, 0.0012, grey, 1), 0.09, 0.058, D / 2 + 0.004);
  // The flap over the USB ports, low on the left.
  put(root, rbox(0.03, 0.012, 0.002, 0.002, plastic('#e8e8e5', 0.35), 1), -0.12, 0.02, D / 2 + 0.0035);
  // The grilles in the hollow of each side.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 16; i++) put(root, box(0.002, 0.03, 0.004, grey), s * (W / 2 - inset / 2 + 0.0005), H / 2 + 0.002, -0.09 + i * 0.011);
  }
  // The hard drive clipped on top.
  put(root, rbox(0.13, 0.008, 0.2, 0.004, plastic('#d9dadc', 0.3), 2), -0.07, H + 0.002, -0.008);
  slots(root, 10, [0.09, 0.0012, 0.003], [0, 0, 0.008], [-0.07, H + 0.0062, -0.07], grey);
  return { root, seat: t.seat, approach: t.approach, open: t.open };
}

/** GameCube: an indigo cube, a carry handle at the back, a round lid on top for the small disc. */
function gc(c: Ctx): Built {
  const W = 0.15;
  const H = 0.11;
  const D = 0.161;
  const root = new Group();
  const indigo = plastic('#4d3f88', 0.42);
  const dark = plastic('#2f2758', 0.5);
  feet(root, W, D, c.port, 0.01, 0.025);
  put(root, rbox(W, H - 0.003, D, 0.012, indigo, 4), 0, H / 2 + 0.0015, 0);
  // The recessed bands down each side.
  for (const s of [-1, 1]) put(root, rbox(0.004, H - 0.04, D - 0.05, 0.002, dark, 2), s * (W / 2 - 0.0012), H / 2, 0);
  // The lid, hinged at its back, over the mini disc's bay.
  const zc = 0.004;
  const R = 0.05;
  put(root, new Mesh(new RingGeometry(R + 0.0005, R + 0.0035, 56).rotateX(-PI / 2), dark), 0, H + 0.0002, zc);
  const seatY = discBay(root, c, 0, H, zc, R - 0.003, GC_R);
  const pivot = backHinged(root, 0, H, zc - R);
  put(pivot, lathe([[0, 0], [R, 0], [R, 0.003], [R - 0.004, 0.006], [0, 0.007]], indigo, 48), 0, 0, R);
  // Power, reset and open, round buttons in the top's front corners.
  const btn = plastic('#3f3374', 0.4);
  put(root, cyl(0.0085, 0.0085, 0.005, btn), -0.052, H + 0.001, 0.062);
  put(root, cyl(0.005, 0.005, 0.004, btn), -0.03, H + 0.001, 0.068);
  put(root, cyl(0.0105, 0.0105, 0.005, btn), 0.05, H + 0.001, 0.06);
  put(root, cyl(0.0018, 0.0018, 0.002, c.led('#5bff6a'), 10), -0.052, H + 0.0005, 0.044);
  // Four controller ports along the front, and the door over the memory card slots.
  for (let i = 0; i < 4; i++) {
    const x = -0.051 + i * 0.034;
    put(root, zcyl(0.0095, 0.004, c.port, 24), x, 0.024, D / 2 + 0.0006);
    put(root, zcyl(0.006, 0.002, c.hole, 16), x, 0.024, D / 2 + 0.0024);
  }
  put(root, rbox(0.12, 0.03, 0.004, 0.003, plastic('#56489a', 0.4), 2), 0, 0.068, D / 2 + 0.0006);
  // The handle: a loop round the back, standing a little proud of the top.
  const handle = new Mesh(new TorusGeometry(0.06, 0.0075, 10, 32, PI), indigo);
  handle.scale.set(1, 0.55, 1);
  put(root, handle, 0, H - 0.008, -D / 2 + 0.01, PI / 2, 0, PI);
  for (const s of [-1, 1]) put(root, rbox(0.014, 0.014, 0.02, 0.005, indigo, 2), s * 0.06, H - 0.008, -D / 2 + 0.008);
  const seat = point(root, 0, seatY, zc);
  const approach = point(root, 0, H + 0.07, zc + 0.005);
  return { root, seat, approach, open: (k) => (pivot.rotation.x = -k * 1.4) };
}

/** Wii, lying flat: slim, glossy white, a slot across its front that glows blue. */
function wii(c: Ctx): Built {
  const W = 0.157;
  const H = 0.044;
  const D = 0.2154;
  const root = new Group();
  const white = glossy('#f4f5f4', 0.2);
  feet(root, W, D, plastic('#c8c8c8', 0.8), 0.006, 0.02);
  put(root, rbox(W, H - 0.002, D, 0.007, white, 4), 0, H / 2 + 0.001, 0);
  // The front: a gently bowed panel.
  put(root, new Mesh(extrude(rrect(W - 0.008, H - 0.008, 0.005, 0, H / 2 + 0.001), 0.006, 0.0025, 8), plastic('#f8f8f8', 0.25)), 0, 0, D / 2 + 0.0005);
  // The slot, with its blue light inside.
  put(root, rbox(0.125, 0.0042, 0.004, 0.0018, c.hole, 1), 0.004, 0.028, D / 2 + 0.0018);
  put(root, box(0.118, 0.0012, 0.001, c.led('#3fa8ff')), 0.004, 0.0275, D / 2 + 0.0034);
  // Power and reset on the left, eject on the right.
  const btn = plastic('#ececec', 0.3);
  put(root, rbox(0.012, 0.007, 0.003, 0.002, btn, 1), -0.06, 0.013, D / 2 + 0.0034);
  put(root, zcyl(0.0012, 0.001, c.led('#4cff58'), 8), -0.06, 0.013, D / 2 + 0.0051);
  put(root, rbox(0.009, 0.005, 0.003, 0.0018, btn, 1), -0.043, 0.013, D / 2 + 0.0034);
  put(root, rbox(0.012, 0.007, 0.003, 0.002, btn, 1), 0.062, 0.013, D / 2 + 0.0034);
  // The flap over the SD slot.
  put(root, box(0.0004, 0.022, 0.0008, plastic('#d8d8d8', 0.4)), 0.035, 0.016, D / 2 + 0.0034);
  // The doors over the GameCube ports and card slots, on top.
  const lines = plastic('#d3d4d4', 0.4);
  put(root, box(0.11, 0.0006, 0.0008, lines), 0, H + 0.0001, 0.035);
  put(root, box(0.0008, 0.0006, 0.06, lines), -0.055, H + 0.0001, 0.065);
  put(root, box(0.0008, 0.0006, 0.06, lines), 0.055, H + 0.0001, 0.065);
  slots(root, 12, [0.002, 0.03, 0.003], [0.009, 0, 0], [-0.05, 0.022, -D / 2], c.port);
  const seat = point(root, 0.004, 0.028, D / 2 - 0.075);
  const approach = point(root, 0.004, 0.028, D / 2 + 0.075);
  return { root, seat, approach };
}

/** Saturn: near-black, a round lid in the top, the cartridge slot behind it. */
function saturn(c: Ctx): Built {
  const W = 0.26;
  const H = 0.083;
  const D = 0.23;
  const root = new Group();
  const body = plastic('#1d1d21', 0.45);
  const trim = plastic('#2b2b30', 0.4);
  feet(root, W, D, c.port);
  const prof = poly([[-D / 2, 0.004], [D / 2 - 0.004, 0.004], [D / 2, 0.012], [D / 2, 0.042], [D / 2 - 0.04, H], [-D / 2, H]]);
  put(root, new Mesh(alongX(prof, W, 0.007), body));
  // The lid: a broad disc ringed in grey.
  const zc = -0.01;
  const R = 0.074;
  put(root, new Mesh(new RingGeometry(R + 0.001, R + 0.006, 64).rotateX(-PI / 2), trim), 0, H + 0.0002, zc);
  const seatY = discBay(root, c, 0, H, zc, R - 0.004, DISC_R);
  const pivot = backHinged(root, 0, H, zc - R);
  put(pivot, lathe([[0, 0], [R, 0], [R, 0.004], [R - 0.006, 0.007], [R - 0.0075, 0.0055], [R * 0.45, 0.0065], [0, 0.0066]], plastic('#232327', 0.35), 64), 0, 0, R);
  // The cartridge slot behind the lid, under its flap.
  put(root, rbox(0.12, 0.004, 0.02, 0.002, trim, 2), 0, H + 0.001, -0.097);
  put(root, box(0.105, 0.0008, 0.005, c.hole), 0, H + 0.003, -0.097);
  // Power and reset on the left of the slope, open on the right.
  const btn = plastic('#38383d', 0.35);
  put(root, rbox(0.02, 0.006, 0.014, 0.003, btn, 2), -0.1, 0.0755, 0.083, 0.8, 0, 0);
  put(root, rbox(0.014, 0.005, 0.01, 0.0025, btn, 2), -0.073, 0.0755, 0.083, 0.8, 0, 0);
  put(root, rbox(0.02, 0.006, 0.014, 0.003, btn, 2), 0.1, 0.0755, 0.083, 0.8, 0, 0);
  put(root, cyl(0.0018, 0.0018, 0.002, c.led('#3dff5a'), 10), -0.115, H + 0.0006, 0.05);
  // Two controller ports on the front.
  for (const x of [-0.06, 0.06]) {
    put(root, rbox(0.04, 0.016, 0.004, 0.004, c.port, 2), x, 0.025, D / 2 + 0.0005);
    put(root, rbox(0.032, 0.006, 0.002, 0.002, c.hole, 1), x, 0.025, D / 2 + 0.0024);
  }
  slots(root, 14, [0.003, 0.04, 0.003], [0.009, 0, 0], [-0.0585, 0.045, -D / 2], c.hole);
  const seat = point(root, 0, seatY, zc);
  const approach = point(root, 0, H + 0.08, zc + 0.01);
  return { root, seat, approach, open: (k) => (pivot.rotation.x = -k * 1.35) };
}

/** Dreamcast: white and nearly square, the round lid filling most of the top. */
function dc(c: Ctx): Built {
  const W = 0.19;
  const H = 0.0755;
  const D = 0.1958;
  const root = new Group();
  const white = plastic('#ecebe5', 0.4);
  const grey = plastic('#cfcec8', 0.45);
  feet(root, W, D, plastic('#8c8c8c', 0.8), 0.008, 0.025);
  const prof = new Shape();
  prof.moveTo(-D / 2, 0.004);
  prof.lineTo(D / 2, 0.004);
  prof.lineTo(D / 2, 0.042);
  prof.quadraticCurveTo(D / 2 - 0.004, H, D / 2 - 0.035, H);
  prof.lineTo(-D / 2, H);
  prof.closePath();
  put(root, new Mesh(alongX(prof, W, 0.006, 16), white));
  const zc = -0.015;
  const R = 0.07;
  put(root, new Mesh(new RingGeometry(R + 0.0005, R + 0.0025, 64).rotateX(-PI / 2), grey), 0, H + 0.0002, zc);
  const seatY = discBay(root, c, 0, H, zc, R - 0.003, DISC_R);
  const pivot = backHinged(root, 0, H, zc - R);
  put(pivot, lathe([[0, 0], [R, 0], [R, 0.003], [R - 0.005, 0.0075], [R * 0.5, 0.0095], [0, 0.0098]], white, 64), 0, 0, R);
  // Power on the left, open on the right, the light between power and the lid.
  put(root, cyl(0.009, 0.009, 0.004, grey), -0.075, H + 0.001, 0.062);
  put(root, cyl(0.009, 0.009, 0.004, grey), 0.075, H + 0.001, 0.062);
  put(root, cyl(0.0018, 0.0018, 0.002, c.led('#ff9a20'), 10), -0.058, H + 0.0006, 0.064);
  // Four controller ports along the front.
  for (let i = 0; i < 4; i++) {
    const x = -0.066 + i * 0.044;
    put(root, rbox(0.03, 0.013, 0.004, 0.003, plastic('#d8d7d0', 0.4), 2), x, 0.02, D / 2 + 0.0006);
    put(root, rbox(0.022, 0.006, 0.002, 0.002, c.port, 1), x, 0.02, D / 2 + 0.0024);
  }
  // The fan grille on the left side, and the vents at the back.
  for (let i = 0; i < 7; i++) put(root, box(0.002, 0.003, 0.05, grey), -W / 2 - 0.0002, 0.022 + i * 0.006, -0.03);
  slots(root, 10, [0.003, 0.035, 0.003], [0.01, 0, 0], [-0.045, 0.035, -D / 2], c.port);
  const seat = point(root, 0, seatY, zc);
  const approach = point(root, 0, H + 0.08, zc + 0.01);
  return { root, seat, approach, open: (k) => (pivot.rotation.x = -k * 1.35) };
}

// ---------------------------------------------------------------------------
// Home consoles, cartridge.

/** Dust flaps over a top slot: two halves that fold down into it. */
function flaps(parent: Object3D, x: number, y: number, z: number, w: number, d: number, m: Material) {
  const front = put(parent, new Group(), x, y, z + d / 2);
  const back = put(parent, new Group(), x, y, z - d / 2);
  put(front, box(w, 0.0012, d / 2 - 0.0003, m), 0, 0, -d / 4);
  put(back, box(w, 0.0012, d / 2 - 0.0003, m), 0, 0, d / 4);
  return (k: number) => {
    front.rotation.x = k * 1.4;
    back.rotation.x = -k * 1.4;
  };
}

/** NES, the front-loader: two greys and a black band, a door in the front the cartridge slides in at. */
function nes(c: Ctx): Built {
  const W = 0.256;
  const H = 0.09;
  const D = 0.203;
  const root = new Group();
  const light = plastic('#cbc9c3', 0.55);
  const dark = plastic('#8e8c88', 0.55);
  const band = plastic('#1e1e1f', 0.5);
  feet(root, W, D, c.port);
  put(root, rbox(W, 0.047, D, 0.005, dark), 0, 0.0265, 0);
  put(root, rbox(W, 0.04, D, 0.005, light), 0, 0.07, 0);
  // The black band between the halves, round the front.
  put(root, rbox(W + 0.001, 0.006, D + 0.001, 0.002, band, 2), 0, 0.051, 0);
  // The ridges across the top.
  slots(root, 18, [W - 0.02, 0.0012, 0.0016], [0, 0, 0.006], [0, H + 0.0001, -0.09], plastic('#a5a39e', 0.6));
  // The door: the opening behind it, and the flap, hinged at its top, that tips in.
  const doorX = -0.018;
  const doorW = 0.138;
  const doorH = 0.034;
  put(root, box(doorW, doorH, 0.001, c.hole), doorX, 0.069, D / 2 + 0.0005);
  const hinge = put(root, new Group(), doorX, 0.069 + doorH / 2, D / 2 + 0.0022);
  put(hinge, rbox(doorW, doorH, 0.004, 0.0015, light, 2), 0, -doorH / 2, 0);
  slots(hinge, 4, [doorW - 0.03, 0.0008, 0.001], [0, 0.005, 0], [0, -doorH + 0.01, 0.0021], plastic('#a5a39e', 0.6));
  // Power and reset with the red light, and the two controller ports.
  const btn = plastic('#d64131', 0.5);
  put(root, rbox(0.024, 0.009, 0.006, 0.0015, light, 2), -0.09, 0.025, D / 2 + 0.002);
  put(root, rbox(0.024, 0.009, 0.006, 0.0015, light, 2), -0.058, 0.025, D / 2 + 0.002);
  put(root, box(0.018, 0.0012, 0.001, btn), -0.09, 0.0225, D / 2 + 0.0051);
  put(root, box(0.018, 0.0012, 0.001, btn), -0.058, 0.0225, D / 2 + 0.0051);
  put(root, rbox(0.006, 0.004, 0.003, 0.001, c.led('#ff2a1a'), 1), -0.115, 0.025, D / 2 + 0.001);
  for (const x of [0.055, 0.098]) {
    put(root, rbox(0.022, 0.014, 0.004, 0.0035, band, 2), x, 0.025, D / 2 + 0.0008);
    put(root, rbox(0.014, 0.005, 0.002, 0.0015, c.hole, 1), x, 0.025, D / 2 + 0.0026);
  }
  // The cartridge goes in label up, its connector end first.
  const seat = new Object3D();
  seat.position.set(doorX, 0.069, D / 2 - 0.137);
  seat.rotateZ(PI);
  seat.rotateX(PI / 2);
  root.add(seat);
  const approach = seat.clone();
  approach.position.z = D / 2 + 0.03;
  root.add(approach);
  return { root, seat, approach, open: (k) => (hinge.rotation.x = k * 1.45) };
}

/** Super Famicom / SNES (PAL): light grey and rounded, a top slot with flaps, sliders either side. */
function snes(c: Ctx): Built {
  const W = 0.2;
  const H = 0.072;
  const D = 0.242;
  const root = new Group();
  const light = plastic('#d2d0ca', 0.5);
  const mid = plastic('#a9a7a3', 0.5);
  const purple = plastic('#7c73a8', 0.45);
  feet(root, W, D, c.port, 0.01, 0.035);
  put(root, new Mesh(alongY(rrect(W, D, 0.035), 0.064, 0.014, 16), light), 0, 0.033, 0);
  // The raised hump the slot sits in, its sides darker.
  const slotZ = -0.025;
  put(root, new Mesh(alongY(rrect(0.15, 0.07, 0.012), 0.014, 0.005, 10), mid), 0, 0.066, slotZ);
  put(root, rbox(0.136, 0.003, 0.026, 0.0012, c.hole, 1), 0, H + 0.0002, slotZ);
  const openFlaps = flaps(root, 0, H + 0.0018, slotZ, 0.13, 0.024, purple);
  // Power slider on the left, reset slider on the right, eject in front of the slot.
  for (const x of [-0.06, 0.06]) {
    put(root, rbox(0.036, 0.002, 0.012, 0.001, c.port, 1), x, 0.0655, 0.035);
    put(root, rbox(0.014, 0.006, 0.014, 0.003, purple, 2), x - 0.008, 0.068, 0.035);
  }
  put(root, rbox(0.04, 0.006, 0.014, 0.003, purple, 2), 0, 0.067, 0.025);
  put(root, rbox(0.006, 0.003, 0.004, 0.001, c.led('#ff2a1a'), 1), -0.08, 0.065, 0.075);
  // Two controller ports on the front.
  for (const x of [-0.035, 0.035]) {
    put(root, rbox(0.03, 0.018, 0.004, 0.004, mid, 2), x, 0.027, D / 2 - 0.0012);
    put(root, rbox(0.02, 0.008, 0.002, 0.002, c.hole, 1), x, 0.027, D / 2 + 0.0006);
  }
  // Vent ridges at the back of the top.
  slots(root, 10, [0.14, 0.0012, 0.0016], [0, 0, 0.006], [0, 0.0652, -0.1], mid);
  const seat = point(root, 0, H - 0.055, slotZ);
  const approach = point(root, 0, H + 0.07, slotZ);
  return { root, seat, approach, open: openFlaps };
}

/** Nintendo 64: charcoal, swept up to a central ridge with the slot in it. */
function n64(c: Ctx): Built {
  const W = 0.26;
  const H = 0.073;
  const D = 0.19;
  const root = new Group();
  const black = plastic('#28282b', 0.45);
  const deep = plastic('#1d1d20', 0.5);
  feet(root, W, D, c.port);
  const prof = new Shape();
  prof.moveTo(-D / 2, 0.003);
  prof.lineTo(D / 2, 0.003);
  prof.lineTo(D / 2, 0.026);
  prof.quadraticCurveTo(D / 2 - 0.01, 0.046, 0.02, 0.058);
  prof.quadraticCurveTo(-0.02, 0.062, -0.05, 0.056);
  prof.quadraticCurveTo(-D / 2, 0.05, -D / 2, 0.04);
  prof.closePath();
  const Wc = 0.17;
  put(root, new Mesh(alongX(prof, Wc, 0.012, 16), black));
  // The wings: the outer ends are lower, the same sweep pressed down.
  const wing = alongX(prof, 0.05, 0.014, 16);
  wing.scale(1, 0.74, 1);
  for (const s of [-1, 1]) put(root, new Mesh(wing, black), s * (Wc / 2 + 0.019), 0, 0);
  // The ridge with the slot, and its flaps.
  const slotZ = -0.02;
  put(root, rbox(0.134, 0.03, 0.052, 0.012, black, 4), 0, H - 0.015, slotZ);
  put(root, rbox(0.122, 0.003, 0.024, 0.0012, c.hole, 1), 0, H + 0.0002, slotZ);
  const openFlaps = flaps(root, 0, H + 0.0018, slotZ, 0.118, 0.022, deep);
  // Power slider on the left of the ridge, reset on the right.
  for (const x of [-0.074, 0.074]) {
    put(root, rbox(0.02, 0.002, 0.01, 0.001, c.hole, 1), x, 0.0575, 0.022);
    put(root, rbox(0.01, 0.006, 0.012, 0.003, plastic('#3a3a3e', 0.4), 2), x - 0.004, 0.0595, 0.022);
  }
  put(root, cyl(0.0018, 0.0018, 0.002, c.led('#ff2a1a'), 10), 0.05, 0.0525, 0.05);
  // The memory expansion door in front of the ridge.
  put(root, rbox(0.08, 0.002, 0.03, 0.0015, deep, 1), 0, 0.0555, 0.037, -0.25, 0, 0);
  // Four controller ports along the front.
  for (const x of [-0.064, -0.024, 0.024, 0.064]) {
    put(root, rbox(0.026, 0.014, 0.004, 0.004, deep, 2), x, 0.015, D / 2 + 0.0006);
    put(root, rbox(0.016, 0.007, 0.002, 0.0025, c.hole, 1), x, 0.015, D / 2 + 0.0024);
  }
  slots(root, 12, [0.004, 0.022, 0.003], [0.011, 0, 0], [-0.06, 0.025, -D / 2], c.hole);
  const seat = point(root, 0, H - 0.045, slotZ);
  const approach = point(root, 0, H + 0.07, slotZ);
  return { root, seat, approach, open: openFlaps };
}

/** Mega Drive, the first model: black, a great raised disc on top with the slot across its middle. */
function md(c: Ctx): Built {
  const W = 0.28;
  const D = 0.212;
  const root = new Group();
  const black = plastic('#151517', 0.35);
  const deep = plastic('#0d0d0f', 0.5);
  feet(root, W, D, c.port);
  const top = 0.055;
  const prof = poly([[-D / 2, 0.003], [D / 2 - 0.003, 0.003], [D / 2, 0.01], [D / 2, 0.03], [D / 2 - 0.028, top], [-D / 2, top]]);
  put(root, new Mesh(alongX(prof, W, 0.006), black));
  // The round platform, stepped in rings.
  const zc = -0.012;
  put(root, lathe([[0, 0], [0.094, 0], [0.094, 0.004], [0.09, 0.006], [0.082, 0.006], [0.08, 0.008], [0.07, 0.0085], [0.068, 0.0105], [0, 0.011]], black, 64), 0, top, zc);
  put(root, new Mesh(new RingGeometry(0.0795, 0.0815, 64).rotateX(-PI / 2), deep), 0, top + 0.0081, zc);
  // The slot in a raised housing across the platform.
  put(root, rbox(0.15, 0.006, 0.032, 0.002, black, 2), 0, top + 0.012, zc);
  put(root, rbox(0.134, 0.003, 0.022, 0.0012, c.hole, 1), 0, top + 0.0145, zc);
  const openFlaps = flaps(root, 0, top + 0.016, zc, 0.13, 0.02, deep);
  // Power slider on the left, reset on the right, the volume slider on the front's left.
  put(root, rbox(0.03, 0.002, 0.012, 0.001, deep, 1), -0.115, top + 0.0005, 0.04);
  put(root, rbox(0.012, 0.005, 0.012, 0.002, plastic('#2a2a2d', 0.4), 2), -0.121, top + 0.0025, 0.04);
  put(root, cyl(0.007, 0.007, 0.004, plastic('#2a2a2d', 0.4)), 0.115, top + 0.001, 0.04);
  put(root, rbox(0.006, 0.003, 0.004, 0.001, c.led('#ff2a1a'), 1), 0.115, top + 0.0005, 0.06);
  put(root, rbox(0.026, 0.004, 0.003, 0.001, deep, 1), -0.1, 0.02, D / 2 + 0.0005);
  put(root, zcyl(0.0025, 0.003, c.hole, 12), -0.07, 0.02, D / 2 + 0.0005);
  // Two controller ports.
  for (const x of [0.04, 0.085]) {
    put(root, rbox(0.032, 0.014, 0.004, 0.004, deep, 2), x, 0.018, D / 2 + 0.0006);
    put(root, rbox(0.024, 0.006, 0.002, 0.002, c.port, 1), x, 0.018, D / 2 + 0.0024);
  }
  // Vent grille at the back of the top.
  slots(root, 20, [0.003, 0.0012, 0.03], [0.008, 0, 0], [-0.08, top + 0.0001, -0.085], c.hole);
  const seat = point(root, 0, 0.006, zc);
  const approach = point(root, 0, top + 0.09, zc);
  return { root, seat, approach, open: openFlaps };
}

// ---------------------------------------------------------------------------
// Handhelds.

/** A screen: its glass at z, and the point the live picture is laid on. */
function screenAt(parent: Object3D, c: Ctx, x: number, y: number, z: number, w: number, h: number) {
  put(parent, new Mesh(new PlaneGeometry(w, h), c.screen()), x, y, z);
  return put(parent, new Object3D(), x, y, z + 0.0003);
}

/** A D-pad: a plus of two rounded bars. */
function dpad(parent: Object3D, x: number, y: number, z: number, s: number, m: Material) {
  put(parent, rbox(s, s * 0.32, 0.004, s * 0.08, m, 2), x, y, z);
  put(parent, rbox(s * 0.32, s, 0.004, s * 0.08, m, 2), x, y, z);
}

/** Game Boy, the original grey brick. */
function gb(c: Ctx): Built {
  const W = 0.09;
  const H = 0.148;
  const D = 0.032;
  const root = new Group();
  const grey = plastic('#c6c3b9', 0.55);
  const bezel = plastic('#5b5c6e', 0.45);
  put(root, new Mesh(extrude(rrect(W, H, [0.006, 0.006, 0.032, 0.006], 0, H / 2), D, 0.004, 12), grey));
  const zf = D / 2;
  // The lines across the top front.
  for (const y of [H - 0.0045, H - 0.0075]) put(root, box(W - 0.012, 0.0006, 0.0006, plastic('#a9a69d', 0.6)), 0, y, zf + 0.0001);
  // The screen's dark surround, its corner rounded to echo the case.
  put(root, new Mesh(extrude(rrect(0.074, 0.06, [0.004, 0.004, 0.014, 0.004], 0, 0.112), 0.0012, 0.0004, 8), bezel), 0, 0, zf + 0.0004);
  const sw = 0.047;
  const sh = 0.043;
  const screen = screenAt(root, c, 0.005, 0.112, zf + 0.0012, sw, sh);
  put(root, zcyl(0.0015, 0.001, c.led('#ff2a1a'), 10), -0.031, 0.12, zf + 0.0012);
  // D-pad, the two buttons on the slant, select and start.
  dpad(root, -0.024, 0.061, zf + 0.001, 0.024, plastic('#1b1b1d', 0.4));
  const ab = plastic('#9b2457', 0.35);
  put(root, zcyl(0.0052, 0.004, ab, 24), 0.018, 0.055, zf + 0.001);
  put(root, zcyl(0.0052, 0.004, ab, 24), 0.033, 0.064, zf + 0.001);
  const rubber = plastic('#83838f', 0.7);
  for (const x of [-0.017, 0]) put(root, rbox(0.012, 0.0035, 0.003, 0.0016, rubber, 2), x, 0.031, zf + 0.0005, 0, 0, 0.45);
  // The speaker's slots, low on the right.
  for (let i = 0; i < 5; i++) put(root, rbox(0.014, 0.0022, 0.001, 0.001, plastic('#77746c', 0.7), 1), 0.014 + i * 0.0042, 0.03 - i * 0.0024, zf + 0.0002, 0, 0, PI / 3);
  // The power switch on the top edge, and the battery cover on the back.
  put(root, rbox(0.01, 0.003, 0.006, 0.0012, plastic('#9d9a91', 0.6), 1), -0.026, H + 0.0005, 0.007);
  put(root, rbox(0.06, 0.05, 0.003, 0.002, plastic('#bdbab0', 0.55), 2), 0, 0.04, -zf - 0.0005);
  // The cartridge slot in the top at the back, the label facing out of the back.
  put(root, box(0.06, 0.0012, 0.0095, c.hole), 0, H + 0.0001, -0.008);
  const seat = new Object3D();
  seat.position.set(0, H - 0.056, -0.008);
  seat.rotation.y = PI;
  root.add(seat);
  const approach = seat.clone();
  approach.position.y = H + 0.04;
  root.add(approach);
  return { root, seat, approach, screen, screenSize: { w: sw, h: sh } };
}

/** Game Boy Advance: indigo, held sideways, the screen between the controls. */
function gba(c: Ctx): Built {
  const W = 0.1445;
  const H = 0.082;
  const root = new Group();
  const indigo = plastic('#4f418f', 0.45);
  const lilac = plastic('#8f8ac0', 0.4);
  const shape = new Shape();
  // Rounded ends that swell out at the grips, a straight top and bottom.
  shape.moveTo(-0.045, 0);
  shape.lineTo(0.045, 0);
  shape.bezierCurveTo(0.068, 0, W / 2, 0.012, W / 2, 0.036);
  shape.bezierCurveTo(W / 2, 0.064, 0.066, H, 0.05, H);
  shape.lineTo(-0.05, H);
  shape.bezierCurveTo(-0.066, H, -W / 2, 0.064, -W / 2, 0.036);
  shape.bezierCurveTo(-W / 2, 0.012, -0.068, 0, -0.045, 0);
  put(root, new Mesh(extrude(shape, 0.017, 0.005, 20), indigo), 0, 0, 0.0035);
  // The bulge across the back, where the batteries sit.
  put(root, rbox(0.1, 0.05, 0.012, 0.005, indigo, 3), 0, 0.032, -0.006);
  const zf = 0.012;
  // The glass over the screen.
  put(root, new Mesh(extrude(rrect(0.084, 0.058, 0.004, 0, 0.047), 0.0012, 0.0004, 8), plastic('#2b2a33', 0.15)), 0, 0, zf + 0.0004);
  const sw = 0.0612;
  const sh = 0.0408;
  const screen = screenAt(root, c, 0, 0.048, zf + 0.0012, sw, sh);
  put(root, zcyl(0.0012, 0.001, c.led('#3dff5a'), 10), -0.034, 0.012, zf + 0.0002);
  dpad(root, -0.055, 0.046, zf + 0.0006, 0.019, lilac);
  put(root, zcyl(0.0045, 0.004, lilac, 20), 0.06, 0.051, zf + 0.0006);
  put(root, zcyl(0.0045, 0.004, lilac, 20), 0.049, 0.043, zf + 0.0006);
  for (const y of [0.018, 0.026]) put(root, zcyl(0.0022, 0.0025, plastic('#2e2a55', 0.5), 12), -0.055, y, zf + 0.0002);
  for (let i = 0; i < 6; i++) put(root, zcyl(0.0008, 0.001, c.hole, 8), 0.05 + (i % 3) * 0.003, 0.017 + Math.floor(i / 3) * 0.003, zf + 0.0002);
  // L and R at the top corners.
  for (const s of [-1, 1]) put(root, rbox(0.03, 0.007, 0.014, 0.003, plastic('#b9b7c9', 0.4), 2), s * 0.052, H - 0.001, -0.004, 0, 0, s * -0.08);
  // The cartridge slot along the back of the top edge; the label faces out of the back.
  put(root, box(0.06, 0.0012, 0.009, c.hole), 0, H + 0.0001, -0.003);
  const seat = new Object3D();
  seat.position.set(0, H - 0.028, -0.003);
  seat.rotation.y = PI;
  root.add(seat);
  const approach = seat.clone();
  approach.position.y = H + 0.04;
  root.add(approach);
  return { root, seat, approach, screen, screenSize: { w: sw, h: sh } };
}

/** Nintendo DS, the original: silver, open to 150°, two screens, the card slot in the back of the top edge. */
function nds(c: Ctx): Built {
  const W = 0.1487;
  const L = 0.0847;
  const root = new Group();
  const silver = plastic('#c3c5ca', 0.35, 0.35);
  const inner = plastic('#3d3f45', 0.45);
  const btn = plastic('#2a2b30', 0.4);
  // The lower half, standing upright.
  const lowT = 0.016;
  put(root, new Mesh(extrude(rrect(W, L, [0.006, 0.006, 0.014, 0.014], 0, L / 2), lowT, 0.004, 10), silver));
  const zf = lowT / 2;
  put(root, new Mesh(extrude(rrect(W - 0.008, L - 0.012, 0.01, 0, L / 2 - 0.002), 0.001, 0.0003, 8), inner), 0, 0, zf + 0.0003);
  const sw = 0.062;
  const sh = 0.0465;
  put(root, rbox(sw + 0.006, sh + 0.006, 0.001, 0.001, plastic('#18181b', 0.3), 1), 0, 0.044, zf + 0.0009);
  const screen2 = screenAt(root, c, 0, 0.044, zf + 0.0015, sw, sh);
  dpad(root, -0.052, 0.054, zf + 0.0012, 0.018, btn);
  for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) put(root, zcyl(0.0032, 0.003, btn, 16), 0.052 + dx * 0.0085, 0.054 + dy * 0.0085, zf + 0.0012);
  for (const y of [0.025, 0.033]) put(root, zcyl(0.0022, 0.002, btn, 12), 0.054, y, zf + 0.001);
  put(root, zcyl(0.0024, 0.002, btn, 12), -0.054, 0.077, zf + 0.001);
  // The hinge across the top, with the lights in it.
  const hy = L;
  const hz = 0.0025;
  for (const s of [-1, 1]) put(root, xcyl(0.0058, 0.034, silver), s * 0.055, hy, hz);
  put(root, xcyl(0.0055, 0.05, silver), 0, hy, hz);
  put(root, zcyl(0.0012, 0.001, c.led('#3dff5a'), 8), -0.012, hy, hz + 0.0055);
  // The card slot behind the hinge; the card's label faces the back.
  put(root, box(0.037, 0.0012, 0.0052, c.hole), 0.03, L + 0.0001, -0.0055);
  const seat = new Object3D();
  seat.position.set(0.03, L - 0.03, -0.0055);
  seat.rotation.y = PI;
  root.add(seat);
  const approach = seat.clone();
  approach.position.y = L + 0.035;
  root.add(approach);
  // The upper half, hinged forward 30° from straight up: open to 150°.
  const top = put(root, new Group(), 0, hy, hz, PI / 6, 0, 0);
  const topT = 0.0125;
  const tz = 0.008 - hz - topT / 2;
  put(top, new Mesh(extrude(rrect(W, L, [0.014, 0.014, 0.006, 0.006], 0, L / 2 + 0.006), topT, 0.0035, 10), silver), 0, 0, tz);
  const tf = tz + topT / 2;
  put(top, new Mesh(extrude(rrect(W - 0.008, L - 0.012, 0.01, 0, L / 2 + 0.008), 0.001, 0.0003, 8), inner), 0, 0, tf + 0.0003);
  put(top, rbox(sw + 0.006, sh + 0.006, 0.001, 0.001, plastic('#18181b', 0.3), 1), 0, 0.047, tf + 0.0009);
  const screen = screenAt(top, c, 0, 0.047, tf + 0.0015, sw, sh);
  // The speaker grilles either side of the top screen.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 9; i++) put(top, zcyl(0.0008, 0.001, c.hole, 6), s * 0.052 + ((i % 3) - 1) * 0.004, 0.05 + (Math.floor(i / 3) - 1) * 0.004, tf + 0.0006);
  }
  return {
    root,
    seat,
    approach,
    screen,
    screenSize: { w: sw, h: sh },
    screen2,
    screen2Size: { w: sw, h: sh },
  };
}

/** PSP, the first model: piano black, wide, the UMD door on the back. */
function psp(c: Ctx): Built {
  const W = 0.17;
  const H = 0.074;
  const D = 0.023;
  const root = new Group();
  const black = glossy('#0c0c0e', 0.12);
  const grey = plastic('#4a4b50', 0.35);
  put(root, new Mesh(extrude(rrect(W, H, 0.032, 0, H / 2), D, 0.006, 10), black));
  const zf = D / 2;
  // The glass across the middle.
  put(root, new Mesh(extrude(rrect(0.112, 0.064, 0.003, 0, 0.04), 0.0012, 0.0004, 8), glossy('#070708', 0.05)), 0, 0, zf + 0.0002);
  const sw = 0.095;
  const sh = 0.054;
  const screen = screenAt(root, c, 0, 0.0405, zf + 0.001, sw, sh);
  // The D-pad as four pads, the analogue nub under it.
  for (let i = 0; i < 4; i++) {
    const a = (i * PI) / 2;
    put(root, rbox(0.0075, 0.0058, 0.003, 0.0015, grey, 1), -0.066 + Math.cos(a) * 0.0065, 0.047 + Math.sin(a) * 0.0065, zf + 0.0004, 0, 0, a);
  }
  put(root, zcyl(0.0065, 0.002, plastic('#55565b', 0.7), 20), -0.066, 0.02, zf + 0.0004);
  // The four face buttons.
  for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) put(root, zcyl(0.0036, 0.003, grey, 16), 0.066 + dx * 0.0085, 0.047 + dy * 0.0085, zf + 0.0004);
  // The row of small buttons under the screen.
  for (let i = 0; i < 7; i++) put(root, rbox(0.0075, 0.0025, 0.002, 0.001, grey, 1), -0.036 + i * 0.012, 0.0045, zf + 0.0002);
  put(root, zcyl(0.001, 0.001, c.led('#3dff5a'), 8), -0.052, 0.0055, zf + 0.0002);
  // L and R along the top corners.
  for (const s of [-1, 1]) put(root, rbox(0.035, 0.005, 0.016, 0.0024, plastic('#2c2d31', 0.35), 2), s * 0.058, H - 0.0006, -0.001, 0, 0, s * -0.12);
  // The UMD door on the back, hinged along its top, with a smoked window.
  const dw = 0.07;
  const dh = 0.066;
  const doorTop = 0.0375 + dh / 2;
  const door = put(root, new Group(), 0, doorTop, -zf);
  const frame = rrect(dw, dh, [0.006, 0.006, 0.026, 0.026], 0, -dh / 2);
  frame.holes.push(rrect(dw - 0.012, dh - 0.016, [0.003, 0.003, 0.02, 0.02], 0, -dh / 2 + 0.001));
  put(door, new Mesh(extrude(frame, 0.006, 0.0018, 12), black), 0, 0, -0.0035);
  const smoke = new MeshPhysicalMaterial({ color: '#1a1a1e', roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1 });
  put(door, new Mesh(new PlaneGeometry(dw - 0.012, dh - 0.016).rotateY(PI), smoke), 0, -dh / 2 + 0.001, -0.0058);
  // The well the UMD sits in, behind the window.
  put(root, new Mesh(extrude(rrect(0.066, 0.064, [0.004, 0.004, 0.024, 0.024], 0, 0.0375), 0.001, 0.0003, 8), plastic('#151518', 0.6)), 0, 0, -zf - 0.0002);
  const seat = new Object3D();
  seat.position.set(0, -dh / 2 + 0.0005, -0.0028);
  seat.rotateY(PI);
  seat.rotateX(PI / 2);
  door.add(seat);
  const approach = seat.clone();
  approach.position.z = -0.06;
  door.add(approach);
  return { root, seat, approach, open: (k) => (door.rotation.x = k * 1.25), screen, screenSize: { w: sw, h: sh } };
}

/** PS Vita, the first model: black, a wide oval, two sticks, the card slot in the top edge. */
function vita(c: Ctx): Built {
  const W = 0.182;
  const H = 0.0835;
  const D = 0.0186;
  const root = new Group();
  const black = glossy('#0b0b0d', 0.14);
  const grey = plastic('#3e3f44', 0.35);
  const shape = new Shape();
  // An oval: straight-ish top and bottom easing round into deep ends.
  shape.moveTo(-0.06, 0);
  shape.lineTo(0.06, 0);
  shape.bezierCurveTo(0.08, 0, W / 2, 0.018, W / 2, H / 2);
  shape.bezierCurveTo(W / 2, H - 0.018, 0.08, H, 0.06, H);
  shape.lineTo(-0.06, H);
  shape.bezierCurveTo(-0.08, H, -W / 2, H - 0.018, -W / 2, H / 2);
  shape.bezierCurveTo(-W / 2, 0.018, -0.08, 0, -0.06, 0);
  put(root, new Mesh(extrude(shape, D, 0.006, 14), black));
  const zf = D / 2;
  const sw = 0.11;
  const sh = 0.063;
  put(root, rbox(sw + 0.006, sh + 0.006, 0.001, 0.001, glossy('#050506', 0.05), 1), 0, H / 2, zf + 0.0002);
  const screen = screenAt(root, c, 0, H / 2, zf + 0.0008, sw, sh);
  // Left: D-pad and stick. Right: face buttons and stick.
  dpad(root, -0.074, 0.055, zf + 0.0002, 0.016, grey);
  for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) put(root, zcyl(0.003, 0.003, grey, 16), 0.074 + dx * 0.0078, 0.055 + dy * 0.0078, zf + 0.0002);
  for (const s of [-1, 1]) {
    put(root, zcyl(0.0075, 0.003, plastic('#1c1c1f', 0.6), 20), s * 0.07, 0.028, zf + 0.0002);
    put(root, zcyl(0.0055, 0.003, plastic('#2e2e32', 0.75), 20), s * 0.07, 0.028, zf + 0.0022);
  }
  // The PS button lit round its rim, start and select, the camera.
  put(root, zcyl(0.0035, 0.002, grey, 16), -0.074, 0.012, zf + 0.0002);
  put(root, new Mesh(new TorusGeometry(0.004, 0.0006, 6, 24), c.led('#4a8cff')), -0.074, 0.012, zf + 0.0012);
  for (const x of [0.07, 0.079]) put(root, rbox(0.005, 0.0022, 0.002, 0.001, grey, 1), x, 0.012, zf + 0.0002);
  put(root, zcyl(0.0018, 0.001, plastic('#16161a', 0.1), 12), 0.078, 0.073, zf + 0.0001);
  // L and R at the top corners.
  for (const s of [-1, 1]) put(root, rbox(0.03, 0.004, 0.012, 0.002, grey, 2), s * 0.06, H - 0.0005, -0.0005, 0, 0, s * -0.1);
  // The card slot in the top edge, under a little hinged cover.
  const sx = 0.045;
  put(root, box(0.024, 0.0012, 0.003, c.hole), sx, H + 0.0001, 0);
  const cover = put(root, new Group(), sx, H + 0.0006, -0.002);
  put(cover, rbox(0.026, 0.001, 0.005, 0.0004, black, 1), 0, 0, 0.002);
  const seat = point(root, sx, H - 0.014, 0);
  const approach = point(root, sx, H + 0.03, 0);
  return { root, seat, approach, open: (k) => (cover.rotation.x = -k * 1.6), screen, screenSize: { w: sw, h: sh } };
}

// ---------------------------------------------------------------------------
// Building one.

const BUILDERS: Record<ConsoleId, (c: Ctx) => Built> = { ps1, ps2, ps3, xbox, x360, gc, wii, saturn, dc, nes, snes, n64, md, gb, gba, nds, psp, vita };

export function makeConsole(id: ConsoleId, _m: Materials): ConsoleModel {
  const c = context();
  const b = BUILDERS[id](c);
  b.root.traverse((o) => {
    o.userData.part = 'console';
    o.userData.consoleId = id;
    if ((o as Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  b.root.name = `console:${id}`;
  b.open?.(0);
  // The size as built, closed: its bounds, lights and buttons included.
  b.root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(b.root).getSize(new Vector3());
  return {
    id,
    root: b.root,
    handheld: HANDHELD.has(id),
    medium: MEDIUM[id],
    size: { w: bounds.x, h: bounds.y, d: bounds.z },
    seat: b.seat,
    approach: b.approach,
    setOpen: (k) => b.open?.(Math.max(0, Math.min(1, k))),
    setPower(on) {
      for (const l of c.leds) {
        l.mat.emissiveIntensity = on ? 2.4 : 0;
        l.mat.color.copy(l.on).multiplyScalar(on ? 1 : 0.25);
      }
      for (const s of c.screens) {
        s.color.set(on ? '#050506' : '#3a3c3b');
        s.emissive.set(on ? '#020203' : '#000000');
      }
    },
    screen: b.screen,
    screenSize: b.screenSize,
    screen2: b.screen2,
    screen2Size: b.screen2Size,
  };
}

// ---------------------------------------------------------------------------
// The media.

const LABEL_COLOURS = ['#8a3a30', '#3a5580', '#b89a50', '#4a6a48', '#5a4468', '#a0603a', '#3a6470', '#6e6a60', '#2a2a2a', '#c8c0aa'];

/** The label's picture: the given image or canvas, or a plain coloured one with the title on it. */
function labelTexture(title: string, label: string | HTMLCanvasElement | undefined, w: number, h: number, round: boolean): Texture {
  if (typeof label === 'string') {
    const t = new TextureLoader().load(label);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  if (label) {
    const t = new CanvasTexture(label);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  const colour = LABEL_COLOURS[hash(title) % LABEL_COLOURS.length];
  return canvasTexture(w, h, (g, W, H) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, W, H);
    const n = parseInt(colour.slice(1), 16);
    const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    const ink = lum > 150 ? '#1a1814' : '#f4f1ea';
    g.strokeStyle = shade(colour, 0.35);
    g.lineWidth = Math.max(2, W * 0.012);
    if (round) {
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.46, 0, PI * 2);
      g.stroke();
    } else g.strokeRect(W * 0.05, H * 0.07, W * 0.9, H * 0.86);
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const size = round ? W * 0.075 : Math.min(H * 0.2, W * 0.13);
    g.font = `600 ${size}px Georgia, 'Palatino Linotype', serif`;
    const words = title.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (g.measureText(next).width > W * (round ? 0.6 : 0.82) && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    const y0 = (round ? H * 0.27 : H / 2) - ((lines.length - 1) * size * 1.15) / 2;
    lines.slice(0, 3).forEach((l, i) => g.fillText(l, W / 2, y0 + i * size * 1.15, W * 0.86));
  });
}

function tagMedium(g: Group) {
  g.traverse((o) => {
    o.userData.part = 'medium';
    if ((o as Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/** A disc lying flat, label up: its clear edge and hub, its label, and its playing side underneath. */
function disc(r: number, under: Material, label: Texture, opts: { hub: number; inner?: Material; band?: [number, number, Material] } = { hub: 0.017 }) {
  const g = new Group();
  const t = 0.0012;
  const hole = 0.0075;
  const clear = new MeshPhysicalMaterial({ color: '#dfe3e6', roughness: 0.1, transparent: true, opacity: 0.7 });
  g.add(lathe([[hole, -t / 2], [r, -t / 2], [r, t / 2], [hole, t / 2], [hole, -t / 2]], clear, 64));
  const face = new Mesh(new RingGeometry(opts.hub + 0.004, r - 0.001, 64).rotateX(-PI / 2), new MeshStandardMaterial({ map: label, roughness: 0.6 }));
  face.position.y = t / 2 + 0.00005;
  g.add(face);
  const play = new Mesh(new RingGeometry(opts.hub + 0.005, r - 0.0012, 64).rotateX(PI / 2), under);
  play.position.y = -t / 2 - 0.00005;
  g.add(play);
  if (opts.band) {
    const [a, b, m] = opts.band;
    const ring = new Mesh(new RingGeometry(a, b, 64).rotateX(PI / 2), m);
    ring.position.y = -t / 2 - 0.0001;
    g.add(ring);
  }
  // The stacking ring round the hub.
  g.add(lathe([[opts.hub, -t / 2 - 0.0002], [opts.hub + 0.0015, -t / 2 - 0.0002], [opts.hub + 0.0015, t / 2 + 0.0002], [opts.hub, t / 2 + 0.0002], [opts.hub, -t / 2 - 0.0002]], opts.inner ?? clear, 48));
  return g;
}

const playSide = (colour: string, roughness = 0.12) => new MeshStandardMaterial({ color: colour, roughness, metalness: 1 });

/** A UMD: the disc in its shell, lying flat, label up, the rounded end towards -z. */
function umd(label: Texture) {
  const g = new Group();
  const shell = new MeshPhysicalMaterial({ color: '#2a2b30', roughness: 0.25, transparent: true, opacity: 0.92, clearcoat: 0.6 });
  const t = 0.0042;
  const outline = rrect(0.064, 0.065, [0.004, 0.004, 0.03, 0.03]);
  g.add(new Mesh(alongY(outline, t, 0.0008, 20), shell));
  const face = new Mesh(new PlaneGeometry(0.052, 0.034).rotateX(-PI / 2), new MeshStandardMaterial({ map: label, roughness: 0.55 }));
  face.position.set(0, t / 2 + 0.0001, 0.008);
  g.add(face);
  // The disc showing through the window underneath.
  const win = new Mesh(new RingGeometry(0.009, 0.029, 48).rotateX(PI / 2), playSide('#cfd2d8', 0.1));
  win.position.set(0, -t / 2 - 0.0001, -0.002);
  g.add(win);
  return g;
}

interface CartSpec {
  w: number;
  h: number;
  t: number;
  colour: string;
  corners: [number, number, number, number];
  /** The label: width, height, and the height of its centre. */
  label: [number, number, number];
  /** Grip ridges: how many, from what height, stepped by how much. */
  ridges?: [number, number, number];
  /** Cut the top-right corner off, as on a Game Boy cart. */
  notch?: number;
}

const CARTS: Partial<Record<ConsoleId, CartSpec>> = {
  nes: { w: 0.12, h: 0.133, t: 0.017, colour: '#8e8d8a', corners: [0.003, 0.003, 0.002, 0.002], label: [0.104, 0.062, 0.097], ridges: [8, 0.012, 0.0055] },
  snes: { w: 0.12, h: 0.088, t: 0.02, colour: '#a4a39f', corners: [0.012, 0.012, 0.003, 0.003], label: [0.094, 0.052, 0.05], ridges: [5, 0.008, 0.004] },
  n64: { w: 0.116, h: 0.075, t: 0.019, colour: '#8c8c8d', corners: [0.016, 0.016, 0.003, 0.003], label: [0.084, 0.048, 0.034], ridges: [4, 0.064, 0.0025] },
  md: { w: 0.12, h: 0.108, t: 0.019, colour: '#1a1a1c', corners: [0.008, 0.008, 0.003, 0.003], label: [0.094, 0.074, 0.062], ridges: [5, 0.008, 0.004] },
  gb: { w: 0.057, h: 0.065, t: 0.0077, colour: '#a6a39d', corners: [0.002, 0, 0.0015, 0.0015], label: [0.046, 0.04, 0.036], ridges: [4, 0.059, 0.0013], notch: 0.006 },
  gba: { w: 0.057, h: 0.035, t: 0.008, colour: '#5c5c61', corners: [0.004, 0.004, 0.0015, 0.0015], label: [0.046, 0.021, 0.016], ridges: [3, 0.03, 0.0012] },
  nds: { w: 0.035, h: 0.033, t: 0.0038, colour: '#4a4b4f', corners: [0.002, 0.002, 0.001, 0.001], label: [0.029, 0.023, 0.016] },
  vita: { w: 0.022, h: 0.015, t: 0.0016, colour: '#151517', corners: [0.0015, 0.0015, 0.0008, 0.0008], label: [0.019, 0.01, 0.0075] },
};

/** A cartridge or card standing up, its bottom edge at y = 0, label towards +z. */
function cart(s: CartSpec, label: Texture) {
  const g = new Group();
  const body = plastic(s.colour, 0.5);
  let shape: Shape;
  if (s.notch) {
    const n = s.notch;
    const [x0, x1] = [-s.w / 2, s.w / 2];
    shape = poly([[x0, 0], [x1, 0], [x1, s.h - n], [x1 - n, s.h], [x0, s.h]]);
  } else shape = rrect(s.w, s.h, s.corners, 0, s.h / 2);
  g.add(new Mesh(extrude(shape, s.t, Math.min(0.0015, s.t / 4), 10), body));
  const face = new Mesh(new PlaneGeometry(s.label[0], s.label[1]), new MeshStandardMaterial({ map: label, roughness: 0.6 }));
  face.position.set(0, s.label[2], s.t / 2 + 0.0002);
  g.add(face);
  if (s.ridges) {
    const [n, y0, step] = s.ridges;
    const groove = plastic(shade(s.colour, -0.35), 0.6);
    for (let i = 0; i < n; i++) put(g, box(s.w * 0.8, step * 0.35, 0.0008, groove), 0, y0 + i * step, s.t / 2 + 0.0001);
  }
  // The connector's edge at the bottom.
  put(g, box(s.w * 0.85, 0.001, s.t * 0.6, plastic('#1a1a1a', 0.6)), 0, 0.0004, 0);
  return g;
}

export function makeMedium(id: ConsoleId, title: string, label?: string | HTMLCanvasElement): Group {
  const kind = MEDIUM[id];
  let g: Group;
  if (kind === 'cart' || kind === 'card') {
    const s = CARTS[id]!;
    const px = 512;
    g = cart(s, labelTexture(title, label, px, Math.round((px * s.label[1]) / s.label[0]), false));
  } else if (kind === 'umd') {
    g = umd(labelTexture(title, label, 512, Math.round((512 * 0.034) / 0.052), false));
  } else {
    const tex = labelTexture(title, label, 512, 512, true);
    if (kind === 'gcdisc') g = disc(GC_R, playSide('#d4d6da'), tex, { hub: 0.011 });
    else if (kind === 'gdrom') g = disc(DISC_R, playSide('#cfd1d4'), tex, { hub: 0.017, band: [0.0325, 0.0335, playSide('#9a9ca0', 0.3)] });
    else if (kind === 'bluray') g = disc(DISC_R, playSide('#b9c2d4', 0.1), tex, { hub: 0.017 });
    else if (kind === 'dvd') g = disc(DISC_R, playSide(id === 'ps2' ? '#4b5aa8' : '#d8d2c0', 0.12), tex, { hub: 0.017 });
    // PlayStation discs are black underneath.
    else g = disc(DISC_R, id === 'ps1' ? playSide('#16161a', 0.08) : playSide('#d6d8dc'), tex, { hub: 0.017 });
  }
  g.name = `medium:${id}`;
  return tagMedium(g);
}
