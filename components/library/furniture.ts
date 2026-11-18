import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  type Material,
} from 'three';
import type { Materials } from './style';

// The furniture that makes the hall somewhere to sit: a chesterfield, wingback
// armchairs, a coffee table, side tables and lamps, a drinks sideboard with
// decanters and bottles, a chess table, and a wireless set.
//
// Every piece is built facing -z (towards the screen, for the seats), standing
// on y = 0, in metres, and casts and takes shadows. Built from primitives and
// drawn textures only: no model files to source or license.

function shadowed<T extends Group>(g: T, part: string): T {
  g.traverse((o) => {
    o.userData.part = part;
    if ((o as Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/** Deep-buttoned leather: a diamond grid of tufts, drawn once per colour. */
function tufted(colour: string, repeat: [number, number]) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = colour;
  g.fillRect(0, 0, 256, 256);
  // Creases running into each button, and the button itself.
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 3;
  const pts: [number, number][] = [[0, 0], [256, 0], [0, 256], [256, 256], [128, 128]];
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(256, 256);
  g.moveTo(256, 0);
  g.lineTo(0, 256);
  g.stroke();
  for (const [x, y] of pts) {
    const grd = g.createRadialGradient(x, y, 0, x, y, 40);
    grd.addColorStop(0, 'rgba(0,0,0,0.45)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(x - 40, y - 40, 80, 80);
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fill();
  }
  // The leather's sheen in the puffs between buttons.
  for (const [x, y] of [[128, 0], [0, 128], [256, 128], [128, 256]]) {
    const grd = g.createRadialGradient(x, y, 0, x, y, 70);
    grd.addColorStop(0, 'rgba(255,255,255,0.10)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(x - 70, y - 70, 140, 140);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = 1000; // Repeat
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

const leather = (colour: string, repeat: [number, number] = [1, 1]) =>
  new MeshStandardMaterial({ map: tufted(colour, repeat), roughness: 0.42, metalness: 0 });
const plainLeather = (colour: string) => new MeshStandardMaterial({ color: colour, roughness: 0.45 });

function box(w: number, h: number, d: number, m: Material, x = 0, y = 0, z = 0) {
  const b = new Mesh(new BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  return b;
}

function cyl(rt: number, rb: number, h: number, m: Material, x = 0, y = 0, z = 0, seg = 20) {
  const c = new Mesh(new CylinderGeometry(rt, rb, h, seg), m);
  c.position.set(x, y, z);
  return c;
}

/** Turned bun feet, one at each corner. */
function feet(g: Group, m: Material, w: number, d: number, h = 0.1) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.035, 0.025, h, m, sx * (w / 2 - 0.06), h / 2, sz * (d / 2 - 0.06), 12));
}

// ---------------------------------------------------------------------------
// Seating.

/** A chesterfield: tufted back and arms the same height, rolled over, nailhead trim. */
export function chesterfield(m: Materials, width = 2.3) {
  const g = new Group();
  const d = 0.95;
  const body = plainLeather('#5a1414');
  const tuft = leather('#5a1414', [width * 4, 2]);
  const armTuft = leather('#5a1414', [3, 2]);
  feet(g, m.walnut, width, d);
  g.add(box(width, 0.3, d, body, 0, 0.25, 0));
  // Seat cushions.
  const cushions = 3;
  const cw = (width - 0.42) / cushions;
  for (let i = 0; i < cushions; i++) {
    const c = box(cw - 0.01, 0.14, d - 0.28, body, -width / 2 + 0.21 + cw * (i + 0.5), 0.47, 0.06);
    g.add(c);
  }
  // The back, and its roll.
  g.add(box(width, 0.42, 0.22, tuft, 0, 0.61, d / 2 - 0.11));
  const roll = new Mesh(new CylinderGeometry(0.11, 0.11, width, 20), body);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 0.82, d / 2 - 0.11);
  g.add(roll);
  // Arms the height of the back, rolled outward.
  for (const s of [-1, 1]) {
    g.add(box(0.2, 0.42, d, armTuft, s * (width / 2 - 0.1), 0.61, 0));
    const r = new Mesh(new CylinderGeometry(0.12, 0.12, d, 20), body);
    r.rotation.x = Math.PI / 2;
    r.position.set(s * (width / 2 - 0.06), 0.82, 0);
    g.add(r);
  }
  // A line of brass nailheads along the base.
  const nail = new SphereGeometry(0.008, 6, 4);
  for (let x = -width / 2 + 0.03; x <= width / 2 - 0.03; x += 0.03) {
    const n = new Mesh(nail, m.brass);
    n.position.set(x, 0.14, -d / 2 - 0.002);
    g.add(n);
  }
  return shadowed(g, 'furniture');
}

/** A wingback armchair in green velvet, with tufted back and walnut cabriole legs. */
export function wingback(m: Materials) {
  const g = new Group();
  const w = 0.88;
  const d = 0.85;
  const velvet = new MeshStandardMaterial({ color: '#1f4a36', roughness: 0.85 });
  const tuft = leather('#1f4a36', [2, 3]);
  (tuft as MeshStandardMaterial).roughness = 0.8;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = cyl(0.03, 0.02, 0.22, m.walnut, sx * (w / 2 - 0.07), 0.11, sz * (d / 2 - 0.07), 10);
      leg.rotation.z = sx * 0.12;
      g.add(leg);
    }
  g.add(box(w, 0.2, d, velvet, 0, 0.3, 0));
  g.add(box(w - 0.26, 0.12, d - 0.2, velvet, 0, 0.46, -0.04));
  // The tall back, gently curved at its crest.
  g.add(box(w, 0.86, 0.16, tuft, 0, 0.83, d / 2 - 0.08));
  const crest = new Mesh(new CylinderGeometry(0.08, 0.08, w, 16), velvet);
  crest.rotation.z = Math.PI / 2;
  crest.position.set(0, 1.26, d / 2 - 0.08);
  g.add(crest);
  // The wings either side of the head, and the arms below them.
  for (const s of [-1, 1]) {
    const wing = box(0.1, 0.5, 0.42, velvet, s * (w / 2 - 0.05), 0.98, d / 2 - 0.3);
    wing.rotation.y = s * -0.2;
    g.add(wing);
    g.add(box(0.13, 0.26, d - 0.12, velvet, s * (w / 2 - 0.065), 0.53, 0.04));
    const r = new Mesh(new CylinderGeometry(0.075, 0.075, d - 0.12, 16), velvet);
    r.rotation.x = Math.PI / 2;
    r.position.set(s * (w / 2 - 0.05), 0.68, 0.04);
    g.add(r);
  }
  return shadowed(g, 'furniture');
}

// ---------------------------------------------------------------------------
// Tables and lamps.

/** A low walnut coffee table, with a gilt edge and a stack of books on it. */
export function coffeeTable(m: Materials) {
  const g = new Group();
  g.add(box(1.3, 0.05, 0.7, m.walnut, 0, 0.43, 0));
  g.add(box(1.31, 0.012, 0.71, m.gold, 0, 0.405, 0));
  g.add(box(1.16, 0.03, 0.56, m.walnut, 0, 0.12, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.05, 0.42, 0.05, m.walnut, sx * 0.6, 0.21, sz * 0.3));
  const colours = ['#7a2e2e', '#2e4a7a', '#2f6f6f', '#c49a2c'];
  let y = 0.455;
  colours.forEach((c, i) => {
    const t = 0.035 + (i % 2) * 0.012;
    const b = box(0.26 - i * 0.015, t, 0.19 - i * 0.01, new MeshStandardMaterial({ color: c, roughness: 0.7 }), -0.3, y + t / 2, 0.05);
    b.rotation.y = (i - 1.5) * 0.12;
    g.add(b);
    y += t;
  });
  // A brass bowl, and a candle in a holder.
  const bowl = new Mesh(new SphereGeometry(0.09, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m.brass);
  bowl.position.set(0.3, 0.545, 0);
  g.add(bowl);
  return shadowed(g, 'furniture');
}

/** A table lamp: a brass column and a pleated cream shade, lit. */
export function tableLamp(m: Materials, light = true) {
  const g = new Group();
  g.add(cyl(0.07, 0.08, 0.025, m.brass, 0, 0.0125, 0));
  g.add(cyl(0.015, 0.015, 0.34, m.brass, 0, 0.19, 0));
  g.add(cyl(0.04, 0.05, 0.05, m.brass, 0, 0.09, 0));
  const shade = new Mesh(
    new CylinderGeometry(0.1, 0.17, 0.2, 24, 1, true),
    new MeshStandardMaterial({ color: '#f1dfb8', emissive: '#ffbe70', emissiveIntensity: 0.9, roughness: 0.9, side: DoubleSide }),
  );
  shade.position.y = 0.4;
  g.add(shade);
  if (light) {
    const p = new PointLight('#ffc27a', 2.2, 4.5, 2);
    p.position.y = 0.36;
    g.add(p);
  }
  return shadowed(g, 'furniture');
}

/** A brass floor lamp with a drum shade. */
export function floorLamp(m: Materials) {
  const g = new Group();
  g.add(cyl(0.16, 0.18, 0.03, m.brass, 0, 0.015, 0));
  g.add(cyl(0.012, 0.014, 1.5, m.brass, 0, 0.78, 0));
  g.add(cyl(0.03, 0.03, 0.06, m.brass, 0, 0.7, 0));
  const shade = new Mesh(
    new CylinderGeometry(0.2, 0.24, 0.3, 28, 1, true),
    new MeshStandardMaterial({ color: '#efe0c0', emissive: '#ffb860', emissiveIntensity: 0.85, roughness: 0.9, side: DoubleSide }),
  );
  shade.position.y = 1.55;
  g.add(shade);
  const p = new PointLight('#ffc27a', 4, 6, 2);
  p.position.y = 1.5;
  g.add(p);
  return shadowed(g, 'furniture');
}

/** A round walnut side table on a pedestal, with a lamp on it. */
export function sideTable(m: Materials, lamp = true) {
  const g = new Group();
  g.add(cyl(0.28, 0.28, 0.035, m.walnut, 0, 0.6, 0, 32));
  g.add(cyl(0.04, 0.06, 0.56, m.walnut, 0, 0.3, 0, 12));
  g.add(cyl(0.2, 0.22, 0.04, m.walnut, 0, 0.02, 0, 24));
  if (lamp) {
    const l = tableLamp(m);
    l.position.y = 0.618;
    g.add(l);
  }
  return shadowed(g, 'furniture');
}

// ---------------------------------------------------------------------------
// The drinks sideboard.

function glassMat(tint: string, opacity = 0.35) {
  return new MeshPhysicalMaterial({
    color: tint,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.02,
    ior: 1.5,
    transparent: true,
    opacity,
    clearcoat: 1,
  });
}

/** A lathe shape from (radius, height) pairs. */
const lathe = (pts: [number, number][], seg = 28) => new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg);

/** A crystal decanter, part full of something amber, with a ball stopper. */
function decanter(liquid: string, shape: 'square' | 'round' | 'ship') {
  const g = new Group();
  const crystal = glassMat('#ffffff', 0.3);
  const profile: [number, number][] =
    shape === 'round'
      ? [[0, 0], [0.06, 0], [0.085, 0.05], [0.09, 0.11], [0.07, 0.17], [0.025, 0.21], [0.022, 0.25], [0.028, 0.26]]
      : shape === 'ship'
        ? [[0, 0], [0.11, 0], [0.11, 0.02], [0.06, 0.1], [0.025, 0.2], [0.022, 0.24], [0.028, 0.25]]
        : [[0, 0], [0.07, 0], [0.072, 0.15], [0.05, 0.19], [0.025, 0.21], [0.022, 0.25], [0.028, 0.26]];
  const body = new Mesh(lathe(profile, shape === 'square' ? 4 : 28), crystal);
  if (shape === 'square') body.rotation.y = Math.PI / 4;
  g.add(body);
  const fill = profile.filter(([, h]) => h <= 0.11).map(([r, h]) => [Math.max(r - 0.006, 0), h] as [number, number]);
  fill.push([0, 0.105]);
  const drink = new Mesh(lathe(fill, shape === 'square' ? 4 : 28), new MeshPhysicalMaterial({ color: liquid, roughness: 0.1, transmission: 0.5, transparent: true, opacity: 0.85 }));
  if (shape === 'square') drink.rotation.y = Math.PI / 4;
  g.add(drink);
  const stopper = new Mesh(new SphereGeometry(0.032, 16, 12), crystal);
  stopper.position.y = 0.29;
  g.add(stopper);
  return g;
}

/** A glass bottle, with a paper label. */
function bottle(tint: string, label: string, tall = 0.3) {
  const g = new Group();
  const neck = tall * 0.32;
  const body = new Mesh(
    lathe([[0, 0], [0.038, 0], [0.04, 0.01], [0.04, tall - neck], [0.014, tall - neck * 0.5], [0.013, tall], [0.016, tall + 0.008]]),
    glassMat(tint, 0.75),
  );
  g.add(body);
  const lbl = new Mesh(new CylinderGeometry(0.041, 0.041, tall * 0.28, 24, 1, true), new MeshStandardMaterial({ color: label, roughness: 0.8 }));
  lbl.position.y = tall * 0.38;
  g.add(lbl);
  const cap = cyl(0.016, 0.016, 0.02, new MeshStandardMaterial({ color: '#3a2a1a', roughness: 0.6 }), 0, tall + 0.015, 0, 10);
  g.add(cap);
  return g;
}

function tumbler() {
  return new Mesh(lathe([[0, 0], [0.036, 0], [0.04, 0.09], [0.038, 0.09], [0.034, 0.006], [0, 0.006]]), glassMat('#ffffff', 0.35));
}

/** A walnut sideboard with brass handles, set with decanters, bottles, glasses and a silver tray. */
export function drinksSideboard(m: Materials) {
  const g = new Group();
  const W = 2.0;
  const H = 0.92;
  const D = 0.5;
  g.add(box(W, H - 0.1, D, m.walnut, 0, 0.1 + (H - 0.1) / 2, 0));
  g.add(box(W + 0.04, 0.03, D + 0.04, m.walnut, 0, H + 0.015, 0));
  g.add(box(W + 0.045, 0.01, D + 0.045, m.gold, 0, H - 0.002, 0));
  feet(g, m.walnut, W, D);
  // Four doors, each with a gilt panel line and a brass pull.
  for (let i = 0; i < 4; i++) {
    const x = -W / 2 + W / 8 + (i * W) / 4;
    // A darker inset panel in each door, edged in gilt.
    g.add(box(W / 4 - 0.05, H - 0.23, 0.004, m.gold, x, 0.1 + (H - 0.1) / 2, -D / 2 - 0.001));
    g.add(box(W / 4 - 0.07, H - 0.25, 0.006, new MeshStandardMaterial({ color: '#2f1c10', roughness: 0.5 }), x, 0.1 + (H - 0.1) / 2, -D / 2 - 0.003));
    const pull = new Mesh(new TorusGeometry(0.018, 0.004, 6, 16), m.brass);
    pull.position.set(x + (i % 2 ? -1 : 1) * 0.16, 0.55, -D / 2 - 0.012);
    g.add(pull);
  }
  const top = H + 0.03;
  // A silver tray with three decanters on it.
  const tray = cyl(0.3, 0.3, 0.012, new MeshStandardMaterial({ color: '#d8d8d4', metalness: 1, roughness: 0.2 }), -0.45, top + 0.006, 0, 40);
  g.add(tray);
  (
    [
      ['#a5561a', 'square', -0.62, -0.05],
      ['#7a2c10', 'round', -0.42, 0.1],
      ['#c88a2a', 'ship', -0.28, -0.08],
    ] as [string, 'square' | 'round' | 'ship', number, number][]
  ).forEach(([c, s, x, z]) => {
    const dct = decanter(c, s);
    dct.position.set(x, top + 0.012, z);
    g.add(dct);
  });
  // Tumblers by the tray.
  for (const [x, z] of [[-0.05, -0.12], [0.04, -0.06], [-0.02, 0.06]]) {
    const t = tumbler();
    t.position.set(x, top, z);
    g.add(t);
  }
  // A row of bottles.
  (
    [
      ['#3d6b2e', '#efe2c4', 0.33],
      ['#6b3a12', '#1b1b1b', 0.3],
      ['#e8eef0', '#7a1218', 0.34],
      ['#2a4a5a', '#d9b45f', 0.28],
      ['#5a2a10', '#efe2c4', 0.31],
    ] as [string, string, number][]
  ).forEach(([tint, label, h], i) => {
    const b = bottle(tint, label, h);
    b.position.set(0.25 + i * 0.13, top, 0.1 - (i % 2) * 0.08);
    g.add(b);
  });
  // An ice bucket.
  const bucket = new Mesh(lathe([[0, 0], [0.07, 0], [0.085, 0.14], [0.08, 0.14], [0.065, 0.006], [0, 0.006]]), new MeshStandardMaterial({ color: '#d8d8d4', metalness: 1, roughness: 0.25 }));
  bucket.position.set(0.88, top, -0.05);
  g.add(bucket);
  // A lamp at the end, so the glass catches the light.
  const lamp = tableLamp(m);
  lamp.position.set(-0.85, top, 0.1);
  g.add(lamp);
  return shadowed(g, 'furniture');
}

// ---------------------------------------------------------------------------
// A chess table, mid-game.

export function chessTable(m: Materials) {
  const g = new Group();
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d')!;
  x.fillStyle = '#2a1a0e';
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      x.fillStyle = (i + j) % 2 ? '#3b2412' : '#d8c08a';
      x.fillRect(32 + i * 56, 32 + j * 56, 56, 56);
    }
  x.strokeStyle = '#c9a24a';
  x.lineWidth = 4;
  x.strokeRect(30, 30, 452, 452);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const topMat = new MeshStandardMaterial({ map: tex, roughness: 0.35 });
  g.add(new Mesh(new BoxGeometry(0.62, 0.03, 0.62), [m.walnut, m.walnut, topMat, m.walnut, m.walnut, m.walnut]));
  g.children[0].position.y = 0.72;
  g.add(cyl(0.05, 0.07, 0.68, m.walnut, 0, 0.36, 0, 14));
  g.add(cyl(0.22, 0.24, 0.04, m.walnut, 0, 0.02, 0, 24));
  // A few pieces where a game was left.
  const ivory = new MeshStandardMaterial({ color: '#efe4c8', roughness: 0.3 });
  const ebony = new MeshStandardMaterial({ color: '#1a1410', roughness: 0.3 });
  const sq = 0.0612;
  const at = (i: number, j: number) => [-0.245 + sq * (i + 0.5), -0.245 + sq * (j + 0.5)] as const;
  const piece = (mat: Material, h: number, i: number, j: number, crown = false) => {
    const [px, pz] = at(i, j);
    const p = new Mesh(lathe([[0, 0], [0.018, 0], [0.018, 0.006], [0.01, 0.012], [0.007, h * 0.7], [0.012, h * 0.78], [0.004, h]], 16), mat);
    p.position.set(px, 0.735, pz);
    g.add(p);
    if (crown) {
      const k = new Mesh(new SphereGeometry(0.008, 10, 8), mat);
      k.position.set(px, 0.735 + h + 0.004, pz);
      g.add(k);
    }
  };
  for (const [i, j] of [[0, 1], [1, 1], [2, 2], [5, 1], [6, 1], [7, 2]]) piece(ivory, 0.035, i, j);
  for (const [i, j] of [[0, 6], [2, 5], [3, 4], [6, 6], [7, 6]]) piece(ebony, 0.035, i, j);
  piece(ivory, 0.075, 4, 0, true);
  piece(ivory, 0.065, 3, 0, true);
  piece(ebony, 0.075, 4, 7, true);
  piece(ebony, 0.065, 2, 6, true);
  piece(ivory, 0.05, 5, 3);
  piece(ebony, 0.05, 5, 5);
  return shadowed(g, 'furniture');
}

/** A valve wireless set: a walnut case, a cloth grille, a lit tuning dial and two knobs. */
export function wireless(m: Materials) {
  const g = new Group();
  const W = 0.42;
  const H = 0.3;
  const D = 0.2;
  g.add(box(W, H, D, m.walnut, 0, H / 2, 0));
  const arch = new Mesh(new CylinderGeometry(W / 2, W / 2, D, 32, 1, false, -Math.PI / 2, Math.PI), m.walnut);
  arch.rotation.x = Math.PI / 2;
  arch.position.set(0, H, 0);
  arch.scale.set(1, 1, 0.45);
  g.add(arch);
  const grille = document.createElement('canvas');
  grille.width = grille.height = 128;
  const x = grille.getContext('2d')!;
  x.fillStyle = '#b89a6a';
  x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 4) {
    x.fillStyle = 'rgba(60,40,20,0.35)';
    x.fillRect(i, 0, 1, 128);
    x.fillRect(0, i, 128, 1);
  }
  const t = new CanvasTexture(grille);
  t.colorSpace = SRGBColorSpace;
  const cloth = new Mesh(new PlaneGeometry(W * 0.7, H * 0.55), new MeshStandardMaterial({ map: t, roughness: 0.95 }));
  cloth.position.set(0, H * 0.62, -D / 2 - 0.002);
  cloth.rotation.y = Math.PI;
  g.add(cloth);
  const dial = new Mesh(
    new PlaneGeometry(W * 0.5, 0.045),
    new MeshStandardMaterial({ color: '#f2d79a', emissive: '#ffb84a', emissiveIntensity: 0.9 }),
  );
  dial.position.set(0, H * 0.2, -D / 2 - 0.002);
  dial.rotation.y = Math.PI;
  g.add(dial);
  for (const s of [-1, 1]) {
    const k = cyl(0.022, 0.022, 0.025, m.brass, s * W * 0.33, H * 0.2, -D / 2 - 0.012, 16);
    k.rotation.x = Math.PI / 2;
    g.add(k);
  }
  return shadowed(g, 'furniture');
}
