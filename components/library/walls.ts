import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Ray,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { fillerBookSize, PALETTE } from './placeholders';
import { hash } from './textures';

// The shelving. Each wall is a run of bays between wooden pilasters, shelved
// floor to cornice. CDs and DVDs stand spine-out in compartments, one each;
// LPs stand in deep low rows under the CDs; books stand on plain shelves.
//
// There are tens of thousands of compartments, so nothing here is a mesh per
// thing: the boards, the dividers and the spines of the fillers are instanced,
// and finding what the pointer is over is arithmetic on the grid rather than
// a test against every spine.
//
// A wall's own frame: x along the wall, y up, z out of the wall into the room.

export type Kind = 'cd' | 'vinyl' | 'dvd' | 'book';

export const SIZES: Record<Kind, { rowPitch: number; pitch: number; itemH: number; itemT: number; itemDepth: number; depth: number }> = {
  cd: { rowPitch: 0.148, pitch: 0.0125, itemH: 0.125, itemT: 0.01, itemDepth: 0.142, depth: 0.16 },
  // 7-inch singles in their sleeves.
  vinyl: { rowPitch: 0.215, pitch: 0.0055, itemH: 0.18, itemT: 0.004, itemDepth: 0.18, depth: 0.2 },
  dvd: { rowPitch: 0.215, pitch: 0.0165, itemH: 0.19, itemT: 0.014, itemDepth: 0.135, depth: 0.16 },
  book: { rowPitch: 0.32, pitch: 0, itemH: 0.26, itemT: 0, itemDepth: 0.15, depth: 0.2 },
};

export interface Row {
  kind: Kind;
  /** The top of the shelf the row stands on. */
  y: number;
  /** How far this row's shelf stands out from the wall. */
  depth: number;
  starts: Float32Array;
  widths: Float32Array;
  heights: Float32Array;
  /** Which bay each compartment is in. */
  bays: Uint8Array;
  /** The global index of the row's first compartment. */
  base: number;
}

export interface Wall {
  /** What the wall mostly holds; its rows each say what they hold. */
  kind: Kind;
  group: Group;
  rows: Row[];
  count: number;
  /** The bays, along the wall: [x0, x1]. */
  bays: [number, number][];
  /** Where the shelving's top is, and how far its upper shelves stand out. */
  top: number;
  depth: number;
  fills: Partial<Record<Kind, InstancedMesh>>;
  /** Which instance of its kind's filler mesh each compartment is. */
  fillIndex: Int32Array;
}

export interface WallSpec {
  kind: Kind;
  length: number;
  height: number;
  position: Vector3;
  rotationY: number;
  /** Where the pilasters stand; the bays are between them. */
  pilasters: number[];
  /** A bay left without shelving below a height: [bay index, up to y]. */
  opening?: [number, number];
  /** The kinds of the lowest rows, from the floor up; the rest are `kind`. */
  lowRows?: Kind[];
  fill: boolean;
  boardMat: Material;
  dividerMat: Material;
  fillTex: Partial<Record<Kind, Texture>>;
  /** How far the shelving stops short of each end; a full pilaster (0.4) by default. The games room's door leaves use less. */
  inset?: number;
}

/** Half the width of a pilaster, which no shelving crosses. */
export const PILASTER = 0.2;
const BOARD = 0.018;
const DIVIDER = 0.0016;

export function buildWall(spec: WallSpec): Wall {
  const group = new Group();
  group.position.copy(spec.position);
  group.rotation.y = spec.rotationY;

  const edges = [0, ...spec.pilasters, spec.length];
  const bays: [number, number][] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    // The walls' ends carry a pilaster too, a full one in from the corner.
    const end = spec.inset ?? PILASTER * 2;
    bays.push([edges[i] + (i === 0 ? end : PILASTER), edges[i + 1] - (i === edges.length - 2 ? end : PILASTER)]);
  }

  // --- Rows, bottom up, and the compartments along each. ---
  const rows: Row[] = [];
  let count = 0;
  let y = 0.12;
  const low = spec.lowRows ?? [];
  for (let r = 0; ; r++) {
    const kind = low[r] ?? spec.kind;
    const s = SIZES[kind];
    if (y + s.rowPitch > spec.height) break;
    const starts: number[] = [];
    const widths: number[] = [];
    const heights: number[] = [];
    const inBay: number[] = [];
    bays.forEach(([a, b], bi) => {
      if (spec.opening && spec.opening[0] === bi && y < spec.opening[1]) return;
      let x = a + 0.01;
      for (let n = 0; ; n++) {
        let w = s.pitch;
        let h = s.itemH;
        if (kind === 'book') {
          const size = fillerBookSize(count + starts.length);
          w = size.thickness + 0.002;
          h = size.height;
        }
        if (x + w > b - 0.01) break;
        starts.push(x);
        widths.push(w);
        heights.push(h);
        inBay.push(bi);
        x += w;
      }
    });
    rows.push({
      kind,
      y,
      depth: s.depth,
      starts: Float32Array.from(starts),
      widths: Float32Array.from(widths),
      heights: Float32Array.from(heights),
      bays: Uint8Array.from(inBay),
      base: count,
    });
    count += starts.length;
    y += s.rowPitch;
  }
  const top = y;
  const depth = SIZES[spec.kind].depth;

  // --- Boards: one under every row in every bay, a top, and the back. ---
  const boards: Matrix4[] = [];
  const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) =>
    boards.push(new Matrix4().compose(new Vector3(cx, cy, cz), new Quaternion(), new Vector3(sx, sy, sz)));
  const shelfYs = [...rows.map((r) => [r.y, r.depth] as const), [top, depth] as const];
  bays.forEach(([a, b], bi) => {
    for (const [sy, sd] of shelfYs) {
      if (spec.opening && spec.opening[0] === bi && sy < spec.opening[1] - 0.01) continue;
      box((a + b) / 2, sy - BOARD / 2, sd / 2, b - a, BOARD, sd);
    }
  });
  // Where the low rows stand out further, a plinth fills the step.
  const lowTop = rows.filter((r) => r.depth > depth).at(-1);
  if (lowTop) {
    bays.forEach(([a, b], bi) => {
      if (spec.opening && spec.opening[0] === bi) return;
      box((a + b) / 2, lowTop.y + SIZES[lowTop.kind].rowPitch - BOARD / 2, lowTop.depth / 2, b - a, BOARD, lowTop.depth);
    });
  }
  const boardMesh = new InstancedMesh(new BoxGeometry(1, 1, 1), spec.boardMat, boards.length);
  boards.forEach((m, i) => boardMesh.setMatrixAt(i, m));
  boardMesh.receiveShadow = true;
  boardMesh.computeBoundingSphere();
  group.add(boardMesh);

  // --- Dividers: the compartments' walls, for CDs, LPs and DVDs. Every
  // compartment has them while the walls are filled; otherwise only the
  // compartments that hold something do (addDividers), so an empty shelf
  // reads as a plain shelf rather than a comb.
  if (spec.fill) addDividers({ group, rows, bays } as Wall, null, spec.dividerMat);

  // --- Fillers: a spine in every compartment, one instanced mesh per kind. ---
  const fills: Partial<Record<Kind, InstancedMesh>> = {};
  const fillIndex = new Int32Array(count).fill(-1);
  const wall: Wall = { kind: spec.kind, group, rows, count, bays, top, depth, fills, fillIndex };
  if (spec.fill && count) {
    const per: Partial<Record<Kind, number>> = {};
    for (const r of rows) {
      for (let k = 0; k < r.starts.length; k++) {
        fillIndex[r.base + k] = per[r.kind] ?? 0;
        per[r.kind] = (per[r.kind] ?? 0) + 1;
      }
    }
    const c = new Color();
    for (const kind of Object.keys(per) as Kind[]) {
      const geo = kind === 'book' ? new BoxGeometry(1, 1, 1) : new PlaneGeometry(1, 1);
      const mesh = new InstancedMesh(geo, new MeshStandardMaterial({ map: spec.fillTex[kind] ?? null, roughness: 0.55 }), per[kind]!);
      fills[kind] = mesh;
      group.add(mesh);
    }
    for (const r of rows) {
      for (let k = 0; k < r.starts.length; k++) {
        const i = r.base + k;
        fills[r.kind]!.setColorAt(fillIndex[i], c.set(PALETTE[hash(`${r.kind}${i}`) % PALETTE.length]));
        setFiller(wall, i, true, 0);
      }
    }
    for (const mesh of Object.values(fills)) mesh.computeBoundingSphere();
  }
  return wall;
}

/**
 * Draws compartment dividers: round every compartment (`only` null), or only
 * round the runs of compartments in `only`, with a wall at each end of a run.
 */
export function addDividers(wall: Pick<Wall, 'group' | 'rows' | 'bays'>, only: Set<number> | null, mat: Material) {
  const want = (i: number) => !only || only.has(i);
  let n = 0;
  for (const r of wall.rows) if (r.kind !== 'book') for (let k = 0; k < r.starts.length; k++) if (want(r.base + k)) n += 2;
  if (!n) return;
  mat.side = DoubleSide;
  const div = new InstancedMesh(new PlaneGeometry(1, 1), mat, n);
  const m = new Matrix4();
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
  const p = new Vector3();
  const sc = new Vector3();
  let i = 0;
  for (const r of wall.rows) {
    if (r.kind === 'book') continue;
    const inner = SIZES[r.kind].rowPitch - BOARD;
    sc.set(r.depth, inner, 1);
    for (let k = 0; k < r.starts.length; k++) {
      if (!want(r.base + k)) continue;
      div.setMatrixAt(i++, m.compose(p.set(r.starts[k], r.y + inner / 2, r.depth / 2), q, sc));
      const endOfRun = k === r.starts.length - 1 || r.bays[k + 1] !== r.bays[k] || !want(r.base + k + 1);
      if (endOfRun) div.setMatrixAt(i++, m.compose(p.set(r.starts[k] + r.widths[k], r.y + inner / 2, r.depth / 2), q, sc));
    }
  }
  div.count = i;
  div.computeBoundingSphere();
  wall.group.add(div);
}

/** The centre of `span` compartments side by side from `i`, as slotCentre gives for one. */
export function spanCentre(wall: Wall, i: number, span: number, out = 0) {
  const c = slotCentre(wall, i, out);
  if (span <= 1) return c;
  const a = locate(wall, i);
  const b = locate(wall, i + span - 1);
  c.position.x = (a.x + b.x + b.width) / 2;
  c.thickness = b.x + b.width - a.x - 0.003;
  return c;
}

/** Which row and position a compartment is. */
export function locate(wall: Wall, i: number) {
  let lo = 0;
  let hi = wall.rows.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (wall.rows[mid].base <= i) lo = mid;
    else hi = mid - 1;
  }
  const row = wall.rows[lo];
  const k = i - row.base;
  return { row, k, x: row.starts[k], width: row.widths[k], height: row.heights[k], bay: row.bays[k] };
}

/** What a compartment holds. */
export const kindAt = (wall: Wall, i: number) => locate(wall, i).row.kind;

/** The item's centre in its compartment, in the wall's frame. `out` pulls it towards the room. */
export function slotCentre(wall: Wall, i: number, out = 0) {
  const { row, x, width, height } = locate(wall, i);
  const s = SIZES[row.kind];
  const t = row.kind === 'book' ? width - 0.002 : s.itemT;
  return {
    position: new Vector3(x + width / 2, row.y + height / 2 + 0.001, row.depth - s.itemDepth / 2 - 0.004 + out),
    thickness: t,
    height,
    depth: s.itemDepth,
  };
}

const tmpM = new Matrix4();
const tmpQ = new Quaternion();

/** Shows, hides or nudges out one filler's spine. */
export function setFiller(wall: Wall, i: number, visible: boolean, out = 0) {
  const { row, width } = locate(wall, i);
  const mesh = wall.fills[row.kind];
  const n = wall.fillIndex[i];
  if (!mesh || n < 0) return;
  if (!visible) {
    mesh.setMatrixAt(n, tmpM.makeScale(0, 0, 0));
  } else {
    const c = slotCentre(wall, i, out);
    if (row.kind === 'book') {
      tmpM.compose(c.position, tmpQ, new Vector3(c.thickness, c.height, c.depth));
    } else {
      const p = c.position.clone();
      p.z += c.depth / 2 + 0.0006;
      tmpM.compose(p, tmpQ, new Vector3(width - DIVIDER * 1.5, c.height, 1));
    }
    mesh.setMatrixAt(n, tmpM);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * The compartment a ray points at, if any, and how far along the ray. Each
 * row is tested on the plane of its own front, since the low rows stand out
 * further than the rest.
 */
export function pickWall(wall: Wall, ray: Ray): { index: number; distance: number } | null {
  wall.group.updateWorldMatrix(true, false);
  const inv = tmpM.copy(wall.group.matrixWorld).invert();
  const local = ray.clone().applyMatrix4(inv);
  if (local.direction.z >= 0) return null;
  let best: { index: number; distance: number } | null = null;
  for (const front of new Set(wall.rows.map((r) => r.depth))) {
    const t = (front - local.origin.z) / local.direction.z;
    if (t <= 0 || (best && t >= best.distance)) continue;
    const x = local.origin.x + local.direction.x * t;
    const y = local.origin.y + local.direction.y * t;
    const row = wall.rows.find((r) => r.depth === front && y >= r.y && y <= r.y + SIZES[r.kind].rowPitch - BOARD);
    if (!row || !row.starts.length || x < row.starts[0]) continue;
    let lo = 0;
    let hi = row.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (row.starts[mid] <= x) lo = mid;
      else hi = mid - 1;
    }
    if (x > row.starts[lo] + row.widths[lo]) continue;
    if (row.kind === 'book' && y > row.y + row.heights[lo]) continue;
    best = { index: row.base + lo, distance: t };
  }
  return best;
}

/**
 * Where a wall's items go, in reading order: bay by bay from the left, each
 * bay's shelves from eye level down and then up, in the rows of the item's kind. A section
 * starts a fresh bay; a group starts a fresh shelf. Returns each item's
 * compartment, and where every section and group begins.
 */
export interface Placement {
  /** Each item's first compartment; it takes `spans[i]` side by side from there. */
  slots: number[];
  spans: number[];
  /**
   * A section takes bays of its own while there are bays to give; after that
   * (`inline`) it starts on the next fresh shelf, and `first` is where.
   */
  sections: { title: string; bays: number[]; inline?: boolean; first?: number }[];
  groups: { section: string; title: string; first: number }[];
}

export function placeItems(
  wall: Wall,
  items: { section?: string; group?: string; format?: string }[],
  kindOf: (it: { format?: string }) => Kind,
  skipBays: number[] = [],
  /** How many compartments side by side an item takes: a box set takes several. */
  spanOf: (index: number) => number = () => 1,
): Placement {
  const out: Placement = { slots: [], spans: [], sections: [], groups: [] };
  // Each bay's compartments of each kind, as shelves, from the top down.
  // Shelves are read from eye level down to the floor, then on up above eye
  // level: what is listed first is what you see first, without a ladder.
  const EYE_SHELF = 1.75;
  const order = (r: Row) => (r.y <= EYE_SHELF ? EYE_SHELF - r.y : 100 + r.y);
  const shelves = (bay: number, kind: Kind) =>
    [...wall.rows]
      .filter((r) => r.kind === kind)
      .sort((a, b) => order(a) - order(b))
      .map((r) => {
        const list: number[] = [];
        for (let k = 0; k < r.starts.length; k++) if (r.bays[k] === bay) list.push(r.base + k);
        return list;
      })
      .filter((l) => l.length);

  // A cursor per kind: which bay, which shelf, which place on it.
  const cursor = new Map<Kind, { bay: number; shelf: number; pos: number }>();
  let bay = -1;
  const nextBay = (from: number) => {
    let b = from + 1;
    while (skipBays.includes(b)) b++;
    return b;
  };
  let section: string | undefined = '\u0000';
  let group: string | undefined = '\u0000';
  for (const [n, it] of items.entries()) {
    const kind = kindOf(it);
    const span = Math.max(1, spanOf(n));
    if (it.section !== section) {
      // A section starts on the next fresh shelf, under a label of its own:
      // it takes only as much shelf as it fills (Master Roachi, 18 Nov 2026:
      // ten discs do not get a plaque over a whole bay).
      const used = Math.max(bay, ...[...cursor.values()].map((c) => c.bay));
      if (bay < 0) {
        bay = nextBay(-1);
        out.sections.push({ title: it.section ?? '', bays: [], inline: true });
      } else {
        for (const c of cursor.values()) {
          if (c.pos > 0) {
            c.shelf++;
            c.pos = 0;
          }
        }
        bay = used;
        out.sections.push({ title: it.section ?? '', bays: [], inline: true });
      }
      section = it.section;
      group = '\u0000';
    }
    let c = cursor.get(kind);
    if (!c) {
      c = { bay, shelf: 0, pos: 0 };
      cursor.set(kind, c);
    }
    const newGroup = it.group !== group;
    if (newGroup && c.pos > 0) {
      c.shelf++;
      c.pos = 0;
    }
    let list = shelves(c.bay, kind);
    while (c.bay < wall.bays.length && (c.shelf >= list.length || c.pos + span > list[c.shelf].length)) {
      if (c.shelf < list.length && c.pos + span > list[c.shelf].length) {
        c.shelf++;
        c.pos = 0;
        continue;
      }
      c.bay = nextBay(c.bay);
      c.shelf = 0;
      c.pos = 0;
      list = shelves(c.bay, kind);
      const sec = out.sections.at(-1)!;
      if (!sec.inline && !sec.bays.includes(c.bay)) sec.bays.push(c.bay);
    }
    if (c.bay >= wall.bays.length) break;
    const slot = list[c.shelf][c.pos];
    c.pos += span;
    out.slots.push(slot);
    out.spans.push(span);
    const sec = out.sections.at(-1)!;
    sec.first ??= slot;
    if (newGroup) {
      group = it.group;
      if (it.group) out.groups.push({ section: it.section ?? '', title: it.group, first: slot });
    }
  }
  return out;
}
