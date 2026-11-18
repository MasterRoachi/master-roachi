import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  TorusGeometry,
  type Material,
} from 'three';
import { signTexture, type Materials } from './style';

// The hall: a long library room. Herringbone parquet with a red carpet down
// its length, set with the double-headed eagle; walnut bookcases between
// pilasters on all four walls, each wall named in red on a gold mosaic frieze
// above its cornice, each section under a brass plaque; a coffered ceiling
// with long skylights; brass chandeliers and green reading lamps. Byzantine
// in its gold, its eagle and its marble, but a library, not a church: no
// dome, no arcades of columns, no hanging lamp rings.

export interface HallSpec {
  W: number;
  D: number;
  H: number;
  /** The height the shelving reaches; the cornice and the frieze are above. */
  shelfTop: number;
  /** A doorway through the +z wall (the Books wall's): world x from x0 to x1, up to h. */
  door?: { x0: number; x1: number; h: number };
}

export function buildShell(m: Materials, s: HallSpec) {
  const g = new Group();
  const { W, D, H } = s;
  const plane = (w: number, h: number, mat: Material, pos: [number, number, number], rot: [number, number, number]) => {
    const p = new Mesh(new PlaneGeometry(w, h), mat);
    p.position.set(...pos);
    p.rotation.set(...rot);
    p.receiveShadow = true;
    g.add(p);
    return p;
  };
  plane(W, D, m.floor(W, D), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  plane(W, H, m.wall(W, H), [0, H / 2, -D / 2], [0, 0, 0]);
  if (s.door) {
    // The +z wall in three pieces round the games room's door.
    const { x0, x1, h } = s.door;
    const left = x0 + W / 2;
    const right = W / 2 - x1;
    plane(left, H, m.wall(left, H), [-W / 2 + left / 2, H / 2, D / 2], [0, Math.PI, 0]);
    plane(right, H, m.wall(right, H), [W / 2 - right / 2, H / 2, D / 2], [0, Math.PI, 0]);
    plane(x1 - x0, H - h, m.wall(x1 - x0, H - h), [(x0 + x1) / 2, (H + h) / 2, D / 2], [0, Math.PI, 0]);
  } else plane(W, H, m.wall(W, H), [0, H / 2, D / 2], [0, Math.PI, 0]);
  plane(D, H, m.wall(D, H), [-W / 2, H / 2, 0], [0, Math.PI / 2, 0]);
  plane(D, H, m.wall(D, H), [W / 2, H / 2, 0], [0, -Math.PI / 2, 0]);

  // The great rug in the middle of the floor, with the eagle on it.
  const rugW = 13;
  const rugD = 8.4;
  plane(rugW, rugD, m.rug(rugW, rugD), [0, 0.005, 0], [-Math.PI / 2, 0, 0]);

  // The gold mosaic frieze above the cornice, all the way round.
  const fh = H - s.shelfTop - 0.6;
  const fy = s.shelfTop + 0.6 + fh / 2;
  const e = 0.012;
  plane(W, fh, m.mosaic(W, fh), [0, fy, -D / 2 + e], [0, 0, 0]);
  plane(W, fh, m.mosaic(W, fh), [0, fy, D / 2 - e], [0, Math.PI, 0]);
  plane(D, fh, m.mosaic(D, fh), [-W / 2 + e, fy, 0], [0, Math.PI / 2, 0]);
  plane(D, fh, m.mosaic(D, fh), [W / 2 - e, fy, 0], [0, -Math.PI / 2, 0]);

  // The coffered ceiling, with skylights down the middle.
  const ceiling = new Mesh(new PlaneGeometry(W, D), m.coffer(W, D));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  g.add(ceiling);
  const glass = new MeshBasicMaterial({ color: '#fff4dc' });
  for (const x of [-W / 4, 0, W / 4]) {
    const pane = new Mesh(new PlaneGeometry(3.8, 1.8), glass);
    pane.rotation.x = Math.PI / 2;
    pane.position.set(x, H - 0.01, 0);
    const frame = new Mesh(new BoxGeometry(4.0, 0.08, 2.0), m.gold);
    frame.position.set(x, H - 0.03, 0);
    const mullion = new Mesh(new BoxGeometry(0.05, 0.06, 1.8), m.walnut);
    mullion.position.set(x, H - 0.05, 0);
    g.add(frame, pane, mullion);
    frame.renderOrder = -1;
  }

  // A gilt moulding where the walls meet the ceiling.
  for (const [len, pos, rot] of [
    [W, [0, H - 0.1, -D / 2 + 0.07], 0],
    [W, [0, H - 0.1, D / 2 - 0.07], 0],
    [D, [-W / 2 + 0.07, H - 0.1, 0], Math.PI / 2],
    [D, [W / 2 - 0.07, H - 0.1, 0], Math.PI / 2],
  ] as [number, [number, number, number], number][]) {
    const c = new Mesh(new BoxGeometry(len, 0.2, 0.14), m.gold);
    c.position.set(...pos);
    c.rotation.y = rot;
    g.add(c);
  }
  return g;
}

/** A wall's name, in red on its gold frieze. In the wall's frame, centred at x. */
export function wallHeading(text: string, width: number, x: number, y: number) {
  const tex = signTexture(text.toUpperCase(), 2048, 256, { ground: 'rgba(0,0,0,0)', ink: '#7a1218', size: 170, spacing: 2 });
  const sign = new Mesh(new PlaneGeometry(width, width / 8), new MeshBasicMaterial({ map: tex, transparent: true }));
  sign.position.set(x, y, 0.03);
  return sign;
}

/** A pilaster between bays: walnut, on a plinth, with a gilt capital. In the wall's frame. */
export function pilaster(m: Materials, height: number, depth: number) {
  const g = new Group();
  const shaft = new Mesh(new BoxGeometry(0.36, height, depth + 0.06), m.walnut);
  shaft.position.set(0, height / 2, (depth + 0.06) / 2);
  const plinth = new Mesh(new BoxGeometry(0.44, 0.24, depth + 0.12), m.walnut);
  plinth.position.set(0, 0.12, (depth + 0.12) / 2);
  const capital = new Mesh(new BoxGeometry(0.44, 0.12, depth + 0.12), m.gold);
  capital.position.set(0, height - 0.06, (depth + 0.12) / 2);
  const flute = new Mesh(new BoxGeometry(0.06, height - 0.6, 0.01), m.gold);
  flute.position.set(0, height / 2, depth + 0.065);
  g.add(shaft, plinth, capital, flute);
  g.traverse((o) => ((o as Mesh).isMesh ? (o.receiveShadow = true) : null));
  return g;
}

/** The cornice across the top of a wall's shelving. In the wall's frame. */
export function cornice(m: Materials, length: number, y: number, depth: number) {
  const g = new Group();
  const band = new Mesh(new BoxGeometry(length, 0.5, 0.08), m.walnut);
  band.position.set(length / 2, y + 0.25, depth + 0.04);
  const crown = new Mesh(new BoxGeometry(length, 0.1, depth + 0.24), m.walnut);
  crown.position.set(length / 2, y + 0.55, (depth + 0.24) / 2);
  const bead = new Mesh(new BoxGeometry(length, 0.035, 0.03), m.gold);
  bead.position.set(length / 2, y + 0.04, depth + 0.09);
  const bead2 = bead.clone();
  bead2.position.y = y + 0.49;
  g.add(band, crown, bead, bead2);
  return g;
}

const plate = () => new MeshStandardMaterial({ color: '#8a6a2c', metalness: 1, roughness: 0.4 });

/** A section's brass plaque on the cornice, over its bays. In the wall's frame. */
export function plaque(text: string, x: number, y: number, z: number, width: number) {
  const w = Math.min(width, 3.0);
  const tex = signTexture(text, 1024, 160, { ground: '#c39b48', ink: '#2a1a0c', border: '#6d5220', size: 92 });
  const mesh = new Mesh(new BoxGeometry(w, w * (160 / 1024), 0.02), [
    plate(),
    plate(),
    plate(),
    plate(),
    new MeshStandardMaterial({ map: tex, metalness: 0.5, roughness: 0.45 }),
    plate(),
  ]);
  mesh.position.set(x, y, z);
  return mesh;
}

/**
 * A label on the edge of the shelf where a group starts: paper in a brass
 * holder, or, where a whole section starts, a brass plate with its name.
 * In the wall's frame; it grows with its text.
 */
export function shelfLabel(text: string, x: number, y: number, z: number, section = false) {
  const h = section ? 0.07 : 0.05;
  const pxH = 96;
  const pxW = Math.min(2048, Math.max(384, Math.round(text.length * (section ? 40 : 34) + 80)));
  const tex = section
    ? signTexture(text, pxW, pxH, { ground: '#c39b48', ink: '#2a1a0c', border: '#6d5220', size: 54 })
    : signTexture(text, pxW, pxH, { ground: '#efe4c6', ink: '#3a2412', border: '#9a7a3a', size: 52 });
  const w = (h * pxW) / pxH;
  const mat = section ? new MeshStandardMaterial({ map: tex, metalness: 0.55, roughness: 0.4 }) : new MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const mesh = new Mesh(new PlaneGeometry(w, h), mat);
  mesh.position.set(x + w / 2, y - (section ? 0.01 : 0), z);
  return mesh;
}

/** A brass chandelier: a ring of candle bulbs round a central column, on a rod. */
export function chandelier(m: Materials, radius: number, hang: number, light = true) {
  const g = new Group();
  const ring = new Mesh(new TorusGeometry(radius, 0.03, 8, 48), m.brass);
  ring.rotation.x = Math.PI / 2;
  const column = new Mesh(new CylinderGeometry(0.05, 0.09, 0.5, 16), m.brass);
  column.position.y = 0.05;
  const ball = new Mesh(new SphereGeometry(0.1, 16, 12), m.brass);
  ball.position.y = -0.25;
  const rod = new Mesh(new CylinderGeometry(0.012, 0.012, hang, 6), m.brass);
  rod.position.y = hang / 2 + 0.3;
  g.add(ring, column, ball, rod);
  const glow = new MeshStandardMaterial({ color: '#fff1d0', emissive: '#ffcf86', emissiveIntensity: 2.4 });
  const n = Math.round(radius * 16);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cup = new Mesh(new CylinderGeometry(0.035, 0.025, 0.04, 10), m.brass);
    cup.position.set(Math.cos(a) * radius, 0.03, Math.sin(a) * radius);
    const bulb = new Mesh(new SphereGeometry(0.032, 10, 8), glow);
    bulb.scale.y = 1.6;
    bulb.position.set(Math.cos(a) * radius, 0.1, Math.sin(a) * radius);
    g.add(cup, bulb);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const arm = new Mesh(new CylinderGeometry(0.01, 0.01, radius * 2, 6), m.brass);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = a;
    g.add(arm);
  }
  if (light) {
    const p = new PointLight('#ffc98a', 30, 18, 1.5);
    p.position.y = 0.1;
    g.add(p);
  }
  return g;
}

/** A banker's lamp: a brass stand and a green glass shade. */
export function bankersLamp(m: Materials) {
  const g = new Group();
  const base = new Mesh(new CylinderGeometry(0.07, 0.08, 0.02, 20), m.brass);
  base.position.y = 0.01;
  const stem = new Mesh(new CylinderGeometry(0.008, 0.008, 0.3, 8), m.brass);
  stem.position.y = 0.16;
  const shade = new Mesh(
    new CylinderGeometry(0.05, 0.05, 0.3, 20, 1, true, 0, Math.PI),
    new MeshStandardMaterial({ color: '#1f6b3a', emissive: '#0d3a1c', emissiveIntensity: 0.6, roughness: 0.2, side: DoubleSide }),
  );
  shade.rotation.z = Math.PI / 2;
  shade.position.y = 0.32;
  const bulb = new Mesh(new CylinderGeometry(0.012, 0.012, 0.24, 8), new MeshStandardMaterial({ color: '#fff1d0', emissive: '#ffd79a', emissiveIntensity: 2 }));
  bulb.rotation.z = Math.PI / 2;
  bulb.position.y = 0.3;
  const p = new PointLight('#ffd79a', 0.8, 2.5, 2);
  p.position.y = 0.26;
  g.add(base, stem, shade, bulb, p);
  return g;
}

/** A walnut cabinet with a green leather top, for players to stand on. */
export function cabinet(m: Materials, width: number, height: number, depth: number) {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(width, height - 0.03, depth), m.walnut);
  body.position.y = (height - 0.03) / 2;
  const top = new Mesh(new BoxGeometry(width + 0.04, 0.03, depth + 0.04), m.leather);
  top.position.y = height - 0.015;
  const edge = new Mesh(new BoxGeometry(width + 0.05, 0.012, depth + 0.05), m.gold);
  edge.position.y = height - 0.034;
  g.add(body, top, edge);
  g.traverse((o) => {
    o.userData.part = 'console';
    if ((o as Mesh).isMesh) o.receiveShadow = true;
  });
  return g;
}

/** The reading table: walnut, green leather, a banker's lamp at each end. */
export function readingTable(m: Materials, length = 2.4) {
  const g = new Group();
  const top = new Mesh(new BoxGeometry(length, 0.05, 1.0), m.walnut);
  top.position.y = 0.725;
  const leather = new Mesh(new BoxGeometry(length - 0.16, 0.004, 0.84), m.leather);
  leather.position.y = 0.752;
  const edge = new Mesh(new BoxGeometry(length + 0.01, 0.012, 1.01), m.gold);
  edge.position.y = 0.7;
  g.add(top, leather, edge);
  for (const [x, z] of [
    [-length / 2 + 0.08, -0.42],
    [length / 2 - 0.08, -0.42],
    [-length / 2 + 0.08, 0.42],
    [length / 2 - 0.08, 0.42],
  ]) {
    const l = new Mesh(new CylinderGeometry(0.035, 0.045, 0.7, 12), m.walnut);
    l.position.set(x, 0.35, z);
    g.add(l);
  }
  for (const x of [-length / 2 + 0.35, length / 2 - 0.35]) {
    const lamp = bankersLamp(m);
    lamp.position.set(x, 0.755, -0.25);
    g.add(lamp);
  }
  g.traverse((o) => {
    o.userData.part = 'table';
    if ((o as Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}
