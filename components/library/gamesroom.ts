import {
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Material,
  type Raycaster,
  type Texture,
} from 'three';
import { makeConsole, type ConsoleId, type ConsoleModel } from './consoles';
import { chandelier } from './hall';
import { prop } from './props';
import { sfx } from './sfx';
import { signTexture, type Materials } from './style';
import { hash, spine } from './textures';
import { ease, type Tweens } from './tween';
import { buildWall, locate, setFiller, slotCentre, type Wall } from './walls';

// The games room, behind the Books wall (his ask, 18 Nov 2026). One bay of the
// Books wall is a pair of bookcase doors, shelved with real books like the
// wall round them; one book on them is a lever. Pull it and the doors swing
// back into a smaller room shelved all round with game cases, a bay to each
// console. The home consoles stand on two benches either side of an old
// television, and the handhelds on a stand by the sofa: put a game in one and
// it plays, on the television or on the handheld's own screen (emulator.ts).
//
// The cases on the shelves are empty until a game is listed in
// data/wyggzantium-games.json; its file lives in the private store (/roms/),
// which only Master Roachi can read. Everything here is built in world space:
// the room stands outside the hall, behind its +z wall.

/** One game: which console, its name, and its file in the private store (a key under /roms/). */
export interface Game {
  console: ConsoleId;
  title: string;
  rom: string;
  /** A cover picture, under /wyggzantium/games/ (optional: one is drawn otherwise). */
  cover?: string;
}

export interface Console {
  id: ConsoleId;
  name: string;
  /** The case, in metres: spine thickness, height, depth. */
  t: number;
  h: number;
  d: number;
  /** Spine colours: one for plastic cases all alike, several for printed boxes. */
  spines: string[];
  /** The band at the spine's top: its colour and the console's mark in it. */
  band: string;
  ink: string;
  mark: string;
}

/**
 * How each console plays in a browser: its EmulatorJS core, or why it cannot.
 * PSP runs on threads, so it needs the page cross-origin isolated, which only
 * Chromium-based browsers get (worker/library.ts).
 */
export const PLAY: Record<ConsoleId, { core: string; threads?: boolean } | { why: string }> = {
  nes: { core: 'nes' },
  snes: { core: 'snes' },
  n64: { core: 'n64' },
  gb: { core: 'gb' },
  gba: { core: 'gba' },
  nds: { core: 'nds' },
  ps1: { core: 'psx' },
  md: { core: 'segaMD' },
  saturn: { core: 'segaSaturn' },
  psp: { core: 'psp', threads: true },
  ps2: { why: 'PlayStation 2 games are not playable in the browser yet. A browser port of PCSX2 exists; it is not wired in.' },
  dc: { why: 'Dreamcast games are not playable in the browser yet. A browser build of Flycast exists; it is not wired in.' },
  ps3: { why: 'There is no PlayStation 3 emulator that runs in a browser.' },
  vita: { why: 'There is no PS Vita emulator that runs in a browser.' },
  xbox: { why: 'There is no Xbox emulator that runs in a browser.' },
  x360: { why: 'There is no Xbox 360 emulator that runs in a browser.' },
  gc: { why: 'There is no GameCube emulator that runs in a browser.' },
  wii: { why: 'There is no Wii emulator that runs in a browser.' },
};

const KEEP = { t: 0.014, h: 0.19, d: 0.135 };
const JEWEL = { t: 0.0104, h: 0.125, d: 0.142 };
const CART = { t: 0.036, h: 0.178, d: 0.128 };
const SMALL = { t: 0.03, h: 0.14, d: 0.1 };
// Printed cardboard boxes, faded the way old boxes on a shelf are.
const BOXES = ['#8a3a30', '#3a5580', '#b89a50', '#4a6a48', '#5a4468', '#a0603a', '#3a6470', '#a8a090', '#2a2a2a', '#c8c0aa'];

/** The consoles, wall by wall: the far wall, the left, the right, then either side of the door. */
export const CONSOLES: Console[][] = [
  [
    { id: 'ps1', name: 'PlayStation', ...JEWEL, spines: ['#141414'], band: '#e8e8e8', ink: '#141414', mark: 'PS' },
    { id: 'ps2', name: 'PlayStation 2', ...KEEP, spines: ['#10131c'], band: '#1d3f8f', ink: '#ffffff', mark: 'PS2' },
    { id: 'ps3', name: 'PlayStation 3', t: 0.0115, h: 0.17, d: 0.135, spines: ['#0e0e12'], band: '#d8d8d8', ink: '#111111', mark: 'PS3' },
    { id: 'psp', name: 'PSP', t: 0.014, h: 0.18, d: 0.104, spines: ['#141414'], band: '#f0f0f0', ink: '#141414', mark: 'PSP' },
    { id: 'xbox', name: 'Xbox', ...KEEP, spines: ['#121212'], band: '#3a8a2a', ink: '#ffffff', mark: 'XBOX' },
    { id: 'x360', name: 'Xbox 360', ...KEEP, spines: ['#2f7a2a'], band: '#e8e8e8', ink: '#2f7a2a', mark: '360' },
  ],
  [
    { id: 'nes', name: 'NES', ...CART, spines: BOXES, band: '#141414', ink: '#e8e8e8', mark: 'NES' },
    { id: 'snes', name: 'Super Nintendo', ...CART, spines: BOXES, band: '#d8d8d8', ink: '#5a3a8a', mark: 'SNES' },
    { id: 'n64', name: 'Nintendo 64', ...CART, spines: BOXES, band: '#141414', ink: '#e0b030', mark: 'N64' },
    { id: 'gc', name: 'GameCube', ...KEEP, spines: ['#121212'], band: '#5a4aa0', ink: '#ffffff', mark: 'GCN' },
  ],
  [
    { id: 'wii', name: 'Wii', ...KEEP, spines: ['#f2f2f2'], band: '#d8d8d8', ink: '#2a9ad8', mark: 'Wii' },
    { id: 'gb', name: 'Game Boy', ...SMALL, spines: BOXES, band: '#e8e8e8', ink: '#2a2a8a', mark: 'GB' },
    { id: 'gba', name: 'Game Boy Advance', ...SMALL, spines: BOXES, band: '#3a2a8a', ink: '#ffffff', mark: 'GBA' },
    { id: 'nds', name: 'Nintendo DS', t: 0.015, h: 0.125, d: 0.14, spines: ['#f0f0f0'], band: '#c8c8c8', ink: '#222222', mark: 'DS' },
  ],
  [
    { id: 'md', name: 'Mega Drive', t: 0.028, h: 0.21, d: 0.15, spines: ['#141414'], band: '#c02a2a', ink: '#ffffff', mark: 'SEGA' },
    { id: 'saturn', name: 'Saturn', t: 0.024, h: 0.2, d: 0.145, spines: ['#141414'], band: '#1f3f9a', ink: '#ffffff', mark: 'SATURN' },
  ],
  [
    { id: 'dc', name: 'Dreamcast', ...JEWEL, spines: ['#e8e8e8'], band: '#d8401a', ink: '#ffffff', mark: 'DC' },
    { id: 'vita', name: 'PS Vita', t: 0.011, h: 0.135, d: 0.105, spines: ['#1a3a8a'], band: '#e8e8e8', ink: '#1a3a8a', mark: 'VITA' },
  ],
];
export const CONSOLE_BY_ID = new Map(CONSOLES.flat().map((c) => [c.id, c]));

const HANDHELDS: ConsoleId[] = ['gb', 'gba', 'nds', 'psp', 'vita'];
/** The home consoles on the benches, left then right of the television as you face it. */
const BENCH_LEFT: ConsoleId[] = ['ps1', 'ps2', 'ps3', 'xbox', 'x360', 'saturn', 'dc'];
const BENCH_RIGHT: ConsoleId[] = ['nes', 'snes', 'n64', 'md', 'gc', 'wii'];

/** The room: interior size and the shelving's height. */
const RW = 12;
const RD = 9;
const RH = 4.2;
const SHELF_H = 2.5;
const SHELF_D = 0.2;
/** The hall's wall, which the door goes through. */
const WALL_T = 0.3;
const BENCH_H = 0.42;

export interface DoorSpec {
  /** The hall's +z wall: where it stands. */
  z: number;
  /** The doorway, in world x, and its height. */
  x0: number;
  x1: number;
  h: number;
  /** How far the bookcase stands out from the hall wall into the hall. */
  depth: number;
  /** The Books wall's own shelving, so the leaves match it. */
  shelf: { boardMat: Material; dividerMat: Material; fill: boolean; bookTex: Texture };
}

/** A game case on a shelf: the game, its mesh, and where it lives. */
export interface GameCase {
  game: Game;
  console: Console;
  mesh: Mesh;
  /** Its place on the shelf, in its run's frame, to put it back. */
  home: { parent: Object3D; position: Vector3; quaternion: Quaternion };
}

/** A screen something plays on: the television's, or a handheld's. */
export interface Screen {
  /** At the screen's centre, facing out of it (+z). */
  anchor: Object3D;
  w: number;
  h: number;
}

export interface GamesRoom {
  root: Group;
  /** The lever book and the door leaves, for picking. */
  lever: Mesh;
  leaves: Group[];
  /** The doors' shelving, as walls the hall's books go on; the lever's compartment is `leverSlot` on the first. */
  doorWalls: Wall[];
  leverSlot: number;
  isOpen(): boolean;
  /** Pulls the lever: opens the doors, or shuts them. */
  toggle(): Promise<void>;
  /** Where you may walk inside the room and the doorway, as [x0, x1, z0, z1]; empty while the door is shut. */
  regions(): [number, number, number, number][];
  /** Things to walk round in the room: [cx, cz, half x, half z]. */
  solids(): [number, number, number, number][];
  /** Whether a point is past the hall's wall: in the doorway or the room. */
  inside(p: Vector3): boolean;
  /** What the ray meets first among the cases: a real game, or the console a shelf of empty cases is for. */
  caseAt(ray: Raycaster): { game: GameCase } | { console: Console } | null;
  /** The console models, by id. */
  consoles: Map<ConsoleId, ConsoleModel>;
  /** Every real game's case, in the order listed. */
  cases: GameCase[];
  handhelds: ConsoleId[];
  /** Where a handheld goes back to on its stand. */
  handheldHome: Map<ConsoleId, { position: Vector3; quaternion: Quaternion }>;
  television: Screen;
  /** Where you sit to play the television: eye and what it looks at. */
  playSeat: { eye: Vector3; target: Vector3 };
  /** Every pickable thing of the room's furniture that should stop a click reaching the shelves behind it. */
  blockers: Object3D[];
}

function spineTexture(c: Console) {
  const w = 64;
  const h = 512;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const x = cv.getContext('2d')!;
  // White under a tint, so printed boxes can each take their own colour.
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, w, h);
  const band = h * 0.16;
  x.fillStyle = c.band;
  x.fillRect(0, 0, w, band);
  x.save();
  x.translate(w / 2, band / 2);
  x.rotate(Math.PI / 2);
  x.fillStyle = c.ink;
  x.font = `700 ${Math.min(30, (band * 1.5) / Math.max(c.mark.length, 2))}px Arial, sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(c.mark, 0, 0);
  x.restore();
  // A title's worth of print, and a publisher's mark at the foot.
  x.fillStyle = 'rgba(128,128,128,0.55)';
  for (let y = h * 0.24; y < h * 0.7; y += h * 0.05) x.fillRect(w * 0.36, y, w * 0.28, h * 0.03);
  x.fillRect(w * 0.3, h * 0.84, w * 0.4, h * 0.06);
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A drawn cover for a game without a picture: the console's band, and the title. */
function drawnCover(c: Console, title: string) {
  const cv = document.createElement('canvas');
  cv.width = 384;
  cv.height = 512;
  const x = cv.getContext('2d')!;
  x.fillStyle = c.spines[hash(title) % c.spines.length];
  x.fillRect(0, 0, 384, 512);
  x.fillStyle = c.band;
  x.fillRect(0, 0, 384, 64);
  x.fillStyle = c.ink;
  x.font = '700 34px Arial, sans-serif';
  x.textAlign = 'center';
  x.fillText(c.mark, 192, 44);
  x.fillStyle = '#f2ead6';
  x.font = '600 38px Georgia, serif';
  const words = title.split(/\s+/);
  const lines: string[] = [];
  for (const w of words) {
    const last = lines.at(-1);
    if (last && x.measureText(`${last} ${w}`).width < 330) lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  lines.slice(0, 6).forEach((l, i) => x.fillText(l, 192, 200 + i * 46));
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function makeGamesRoom(m: Materials, tweens: Tweens, door: DoorSpec, games: Game[]): GamesRoom {
  const root = new Group();
  const doorX = (door.x0 + door.x1) / 2;
  const doorW = door.x1 - door.x0;
  const z0 = door.z + WALL_T;
  const z1 = z0 + RD;
  const x0 = doorX - RW / 2;
  const x1 = doorX + RW / 2;
  const centre = new Vector3(doorX, 0, (z0 + z1) / 2);
  const solids: [number, number, number, number][] = [];
  const blockers: Object3D[] = [];

  // --- The shell: floor, ceiling, walls, the doorway's reveal. ---
  const plane = (w: number, h: number, mat: Material, pos: [number, number, number], rot: [number, number, number]) => {
    const p = new Mesh(new PlaneGeometry(w, h), mat);
    p.position.set(...pos);
    p.rotation.set(...rot);
    p.receiveShadow = true;
    root.add(p);
    return p;
  };
  plane(RW, RD, m.floor(RW, RD), [doorX, 0, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]);
  plane(RW, RD, m.coffer(RW, RD), [doorX, RH, (z0 + z1) / 2], [Math.PI / 2, 0, 0]);
  plane(RW, RH, m.wall(RW, RH), [doorX, RH / 2, z1], [0, Math.PI, 0]);
  plane(RD, RH, m.wall(RD, RH), [x0, RH / 2, (z0 + z1) / 2], [0, Math.PI / 2, 0]);
  plane(RD, RH, m.wall(RD, RH), [x1, RH / 2, (z0 + z1) / 2], [0, -Math.PI / 2, 0]);
  // The door wall, round the doorway.
  const side = (RW - doorW) / 2;
  plane(side, RH, m.wall(side, RH), [x0 + side / 2, RH / 2, z0], [0, 0, 0]);
  plane(side, RH, m.wall(side, RH), [x1 - side / 2, RH / 2, z0], [0, 0, 0]);
  plane(doorW, RH - door.h, m.wall(doorW, RH - door.h), [doorX, (RH + door.h) / 2, z0], [0, 0, 0]);
  // The reveal: the doorway's sides, head and sill, in walnut.
  for (const x of [door.x0, door.x1]) plane(WALL_T, door.h, m.walnut, [x, door.h / 2, door.z + WALL_T / 2], [0, x === door.x0 ? Math.PI / 2 : -Math.PI / 2, 0]);
  plane(doorW, WALL_T, m.walnut, [doorX, door.h, door.z + WALL_T / 2], [Math.PI / 2, 0, 0]);
  plane(doorW, WALL_T + door.depth, m.floor(doorW, WALL_T), [doorX, 0.002, door.z + WALL_T / 2 - door.depth / 2], [-Math.PI / 2, 0, 0]);
  // A rug, and the gilt moulding round the ceiling.
  plane(6, 4, m.rug(6, 4), [doorX, 0.005, (z0 + z1) / 2 + 0.6], [-Math.PI / 2, 0, 0]);
  for (const [len, pos, rot] of [
    [RW, [doorX, RH - 0.1, z0 + 0.07], 0],
    [RW, [doorX, RH - 0.1, z1 - 0.07], 0],
    [RD, [x0 + 0.07, RH - 0.1, (z0 + z1) / 2], Math.PI / 2],
    [RD, [x1 - 0.07, RH - 0.1, (z0 + z1) / 2], Math.PI / 2],
  ] as [number, [number, number, number], number][]) {
    const c = new Mesh(new BoxGeometry(len, 0.2, 0.14), m.gold);
    c.position.set(...pos);
    c.rotation.y = rot;
    root.add(c);
  }
  const light = chandelier(m, 0.6, RH - 3.2, true);
  light.position.set(doorX, 3.0, (z0 + z1) / 2);
  root.add(light);
  const fillLight = new PointLight('#ffd9a0', 14, 12, 1.6);
  fillLight.position.set(doorX, 2.4, z1 - 2);
  root.add(fillLight);

  // --- The shelving: a run along each wall, a bay to each console. ---
  // Each run is laid out in its own frame (x along the wall, z out into the
  // room) and placed with a matrix. Real games take the first places in their
  // console's bay; the rest are empty cases, instanced.
  const consoleOf = new Map<InstancedMesh, Console>();
  const shelves: InstancedMesh[] = [];
  const cases: GameCase[] = [];
  const caseMeshes: Mesh[] = [];
  const byConsole = new Map<ConsoleId, Game[]>();
  for (const g of games) {
    if (!CONSOLE_BY_ID.has(g.console)) continue;
    byConsole.set(g.console, [...(byConsole.get(g.console) ?? []), g]);
  }
  const runs: { from: Vector3; rotY: number; length: number; consoles: Console[] }[] = [
    { from: new Vector3(x1, 0, z1), rotY: Math.PI, length: RW, consoles: CONSOLES[0] },
    { from: new Vector3(x0, 0, z1), rotY: Math.PI / 2, length: RD, consoles: CONSOLES[1] },
    { from: new Vector3(x1, 0, z0), rotY: -Math.PI / 2, length: RD, consoles: CONSOLES[2] },
    { from: new Vector3(x0, 0, z0), rotY: 0, length: side - 0.35, consoles: CONSOLES[3] },
    { from: new Vector3(x1 - side + 0.35, 0, z0), rotY: 0, length: side - 0.35, consoles: CONSOLES[4] },
  ];
  const unit = new BoxGeometry(1, 1, 1);
  const mtx = new Matrix4();
  const q0 = new Quaternion();
  const v = new Vector3();
  const sc = new Vector3();
  const tint = new Color();
  const loader = new TextureLoader();
  for (const run of runs) {
    const g = new Group();
    g.position.copy(run.from);
    g.rotation.y = run.rotY;
    root.add(g);
    const bayW = run.length / run.consoles.length;
    const boards: Matrix4[] = [];
    // The back, the top and a walnut cornice over the run.
    const back = new Mesh(new PlaneGeometry(run.length, SHELF_H), m.walnut);
    back.position.set(run.length / 2, SHELF_H / 2, 0.003);
    g.add(back);
    const cornice = new Mesh(new BoxGeometry(run.length, 0.12, SHELF_D + 0.06), m.walnut);
    cornice.position.set(run.length / 2, SHELF_H + 0.06, (SHELF_D + 0.06) / 2);
    g.add(cornice);
    run.consoles.forEach((c, bi) => {
      const a = bi * bayW + 0.06;
      const b = (bi + 1) * bayW - 0.06;
      // The upright between bays, and the console's name on a brass plate above.
      const upright = new Mesh(new BoxGeometry(0.06, SHELF_H, SHELF_D + 0.02), m.walnut);
      upright.position.set(bi * bayW, SHELF_H / 2, (SHELF_D + 0.02) / 2);
      upright.castShadow = true;
      g.add(upright);
      const tex = signTexture(c.name.toUpperCase(), 1024, 128, { ground: '#c39b48', ink: '#2a1a0c', border: '#6d5220', size: 64 });
      const plateW = Math.min(bayW - 0.3, 1.6);
      const plate = new Mesh(new PlaneGeometry(plateW, plateW / 8), new MeshStandardMaterial({ map: tex, metalness: 0.5, roughness: 0.45 }));
      plate.position.set((a + b) / 2, SHELF_H + 0.3, 0.01);
      g.add(plate);
      // Rows, as many as fit; cases spine-out along each.
      const pitch = c.h + 0.04;
      const rows: number[] = [];
      for (let y = 0.1; y + pitch <= SHELF_H - 0.02; y += pitch) rows.push(y);
      const per = Math.floor((b - a - 0.02) / c.t);
      const mesh = new InstancedMesh(unit, new MeshStandardMaterial({ map: spineTexture(c), roughness: c.spines.length > 1 ? 0.75 : 0.35 }), rows.length * per);
      // Real games stand first, from the top row down (the top is at eye height).
      const real = byConsole.get(c.id) ?? [];
      let i = 0;
      rows.forEach((y, r) => {
        boards.push(new Matrix4().compose(v.set((a + b) / 2, y - 0.009, SHELF_D / 2), q0, sc.set(b - a, 0.018, SHELF_D)).clone());
        for (let k = 0; k < per; k++) {
          // Now and then a case stands a little proud of the rest.
          const proud = (hash(`${c.name}${i}`) % 9 === 0 ? 0.008 : 0) + 0.004;
          const at = new Vector3(a + 0.01 + c.t * (k + 0.5), y + c.h / 2, SHELF_D - c.d / 2 - 0.006 + proud);
          const n = (rows.length - 1 - r) * per + k;
          const game = real[n];
          if (game) {
            // Its own case: the title on the spine, its cover on the front.
            const colour = c.spines[hash(game.title) % c.spines.length];
            const plain = new MeshStandardMaterial({ color: colour, roughness: 0.4 });
            const front = new MeshStandardMaterial({ map: game.cover ? loader.load(game.cover, (t) => (t.colorSpace = SRGBColorSpace)) : drawnCover(c, game.title), roughness: 0.4 });
            const backMat = new MeshStandardMaterial({ map: drawnCover(c, game.title), roughness: 0.45 });
            const spineMat = new MeshStandardMaterial({ map: spine(colour, game.title, 48, 640), roughness: 0.4 });
            // Faces: +x is the front cover, -x the back, +z the spine (out of the shelf).
            const box = new Mesh(new BoxGeometry(c.t - 0.0006, c.h, c.d), [front, backMat, plain, plain, spineMat, plain]);
            box.position.copy(at);
            box.userData.part = 'gamecase';
            g.add(box);
            const gc: GameCase = { game, console: c, mesh: box, home: { parent: g, position: at.clone(), quaternion: new Quaternion() } };
            box.userData.gameCase = gc;
            cases.push(gc);
            caseMeshes.push(box);
            mesh.setMatrixAt(i, mtx.makeScale(0, 0, 0));
          } else {
            mesh.setMatrixAt(i, mtx.compose(at, q0, sc.set(c.t - 0.0006, c.h, c.d)));
          }
          mesh.setColorAt(i, tint.set(c.spines[hash(`${c.name}:${i}`) % c.spines.length]));
          i++;
        }
      });
      mesh.computeBoundingSphere();
      mesh.receiveShadow = true;
      g.add(mesh);
      consoleOf.set(mesh, c);
      shelves.push(mesh);
    });
    const end = new Mesh(new BoxGeometry(0.06, SHELF_H, SHELF_D + 0.02), m.walnut);
    end.position.set(run.length, SHELF_H / 2, (SHELF_D + 0.02) / 2);
    g.add(end);
    const boardMesh = new InstancedMesh(unit, m.shelf, boards.length);
    boards.forEach((bm, k) => boardMesh.setMatrixAt(k, bm));
    boardMesh.computeBoundingSphere();
    boardMesh.receiveShadow = true;
    g.add(boardMesh);
  }

  // --- The sitting place: a leather sofa facing the television on its
  // cabinet against the far shelves, an ottoman between. ---
  const farZ = z1 - SHELF_D - 0.35;
  const cabinet = prop('ClassicNightstand_01', { height: 0.75, width: 0.9, turn: Math.PI });
  cabinet.position.set(doorX, 0, farZ);
  root.add(cabinet);
  solids.push([doorX, farZ, 0.5, 0.3]);
  const TV_H = 0.8;
  const tv = prop('television_02', { height: TV_H, turn: Math.PI });
  tv.position.set(doorX, 0.75, farZ - 0.02);
  root.add(tv);
  blockers.push(cabinet, tv);
  // The picture tube's face, measured off the model: 4:3, a little left of centre.
  const tvAnchor = new Object3D();
  tvAnchor.position.set(doorX - 0.005, 0.75 + TV_H * 0.6, farZ - 0.02 - 0.36);
  tvAnchor.rotation.y = Math.PI;
  root.add(tvAnchor);
  const television: Screen = { anchor: tvAnchor, w: 0.565, h: 0.424 };
  const playSeat = { eye: new Vector3(doorX, 1.18, farZ - 1.45), target: tvAnchor.position.clone() };
  const sofa = prop('sofa_02', { width: 2.0 });
  sofa.position.set(doorX, 0, centre.z + 0.6);
  root.add(sofa);
  solids.push([doorX, centre.z + 0.6, 1.0, 0.45]);
  const cushions = prop('throw_pillows_01', { width: 1.1 });
  cushions.position.set(doorX, 0.36, centre.z + 0.75);
  root.add(cushions);
  const ottoman = prop('Ottoman_01', { width: 0.8 });
  ottoman.position.set(doorX, 0, centre.z + 2.2);
  root.add(ottoman);
  solids.push([doorX, centre.z + 2.2, 0.42, 0.33]);
  blockers.push(sofa, ottoman);

  // --- The home consoles, on two walnut benches either side of the set. ---
  const consoles = new Map<ConsoleId, ConsoleModel>();
  const benchD = 0.5;
  const benchZ = farZ;
  for (const [ids, dir] of [[BENCH_LEFT, 1], [BENCH_RIGHT, -1]] as const) {
    // Facing the screen from the sofa, +x is on your left.
    const len = 3.3;
    const cx = doorX + dir * (0.65 + len / 2);
    const bench = new Group();
    const top = new Mesh(new BoxGeometry(len, 0.04, benchD), m.walnut);
    top.position.y = BENCH_H - 0.02;
    const body = new Mesh(new BoxGeometry(len - 0.04, BENCH_H - 0.12, benchD - 0.04), m.walnut);
    body.position.y = (BENCH_H - 0.12) / 2 + 0.08;
    bench.add(top, body);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const foot = new Mesh(new BoxGeometry(0.05, 0.08, 0.05), m.walnut);
        foot.position.set(sx * (len / 2 - 0.05), 0.04, sz * (benchD / 2 - 0.05));
        bench.add(foot);
      }
    bench.position.set(cx, 0, benchZ);
    bench.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = o.receiveShadow = true;
      }
    });
    root.add(bench);
    blockers.push(bench);
    solids.push([cx, benchZ, len / 2, benchD / 2]);
    ids.forEach((id, k) => {
      const model = makeConsole(id, m);
      // In the order you read them from the sofa: left to right.
      const along = -len / 2 + (len / ids.length) * (k + 0.5);
      model.root.position.set(cx - along, BENCH_H, benchZ + 0.02);
      model.root.rotation.y = Math.PI;
      root.add(model.root);
      consoles.set(id, model);
      blockers.push(model.root);
    });
  }

  // --- The handhelds, on a walnut stand by the sofa's right arm. ---
  const handheldHome = new Map<ConsoleId, { position: Vector3; quaternion: Quaternion }>();
  {
    const standX = doorX - 2.1;
    const standZ = centre.z + 0.6;
    const stand = new Group();
    const sw = 1.3;
    for (const y of [0.3, 0.75, 1.2]) {
      const shelf = new Mesh(new BoxGeometry(sw, 0.03, 0.36), m.walnut);
      shelf.position.y = y;
      stand.add(shelf);
    }
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const post = new Mesh(new BoxGeometry(0.035, 1.24, 0.035), m.walnut);
        post.position.set(sx * (sw / 2 - 0.02), 0.62, sz * 0.16);
        stand.add(post);
      }
    const rail = new Mesh(new BoxGeometry(sw, 0.012, 0.012), m.brass);
    rail.position.set(0, 0.8, 0.17);
    stand.add(rail);
    stand.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = o.receiveShadow = true;
    });
    stand.position.set(standX, 0, standZ);
    // It faces the sofa's end and the doorway: turned a quarter towards the sofa.
    stand.rotation.y = Math.PI + 0.35;
    root.add(stand);
    blockers.push(stand);
    solids.push([standX, standZ, 0.7, 0.3]);
    HANDHELDS.forEach((id, k) => {
      const model = makeConsole(id, m);
      const local = new Vector3(-sw / 2 + (sw / HANDHELDS.length) * (k + 0.5), 0.765, 0.02);
      stand.updateMatrixWorld(true);
      model.root.position.copy(local.applyMatrix4(stand.matrixWorld));
      model.root.quaternion.copy(stand.quaternion);
      // Leaning back a little against the rail, as on a stand.
      model.root.rotateX(-0.18);
      root.add(model.root);
      consoles.set(id, model);
      handheldHome.set(id, { position: model.root.position.clone(), quaternion: model.root.quaternion.clone() });
      blockers.push(model.root);
    });
  }

  // --- The doors: two bookcase leaves in the hall's Books wall, hinged at
  // the jambs on the wall's line, swinging back into the room. Each is shelved
  // as a wall of its own (walls.ts), so the hall's books stand on it. ---
  const leafW = doorW / 2 - 0.005;
  const leafH = door.h - 0.012;
  const leaves: Group[] = [];
  const doorWalls: Wall[] = [];
  let lever: Mesh | null = null;
  let leverSlot = -1;
  for (const s of [1, -1] as const) {
    // s = 1 hinges at x1 (where the Books wall's run starts), -1 at x0.
    const hinge = new Group();
    hinge.position.set(s > 0 ? door.x1 : door.x0, 0, door.z);
    root.add(hinge);
    leaves.push(hinge);
    // In the hinge's frame, the leaf runs along x away from the jamb and
    // stands out into the hall (-z). The wall's own frame runs the other way
    // along world x, as the Books wall's does (rotated half round).
    const dir = s > 0 ? -1 : 1;
    const lx = (x: number) => dir * x;
    const back = new Mesh(new BoxGeometry(leafW, leafH, 0.02), m.walnut);
    back.position.set(lx(leafW / 2), leafH / 2, -0.01);
    hinge.add(back);
    for (const e of [0.02, leafW - 0.02]) {
      const stile = new Mesh(new BoxGeometry(0.04, leafH, door.depth), m.walnut);
      stile.position.set(lx(e), leafH / 2, -door.depth / 2);
      hinge.add(stile);
    }
    const wall = buildWall({
      kind: 'book',
      length: leafW,
      height: leafH - 0.02,
      position: new Vector3(s > 0 ? 0 : leafW, 0, 0),
      rotationY: Math.PI,
      pilasters: [],
      inset: 0.045,
      fill: door.shelf.fill,
      boardMat: door.shelf.boardMat,
      dividerMat: door.shelf.dividerMat,
      fillTex: { book: door.shelf.bookTex },
    });
    hinge.add(wall.group);
    doorWalls.push(wall);
    if (s > 0) {
      // The lever: the fifth shelf, a third of the way along.
      const row = wall.rows[Math.min(4, wall.rows.length - 1)];
      leverSlot = row.base + Math.floor(row.starts.length / 3);
      setFiller(wall, leverSlot, false);
      const c = slotCentre(wall, leverSlot);
      const { width } = locate(wall, leverSlot);
      const t = width - 0.002;
      const h = 0.25;
      const tex = signTexture('', 64, 512, { ground: '#5a0f14', ink: '#c9a24a', border: '#c9a24a' });
      const plain = new MeshStandardMaterial({ color: '#4a0c10', roughness: 0.5 });
      const book = new Mesh(new BoxGeometry(t, h, 0.15), [plain, plain, plain, plain, new MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.2 }), plain]);
      // Pivot on its front edge at the foot, so it tips out top first. The
      // wall's +z is out into the hall.
      const pivot = new Group();
      pivot.position.set(c.position.x, row.y, row.depth - 0.004);
      book.position.set(0, h / 2, -0.075);
      pivot.add(book);
      wall.group.add(pivot);
      book.userData.part = 'lever';
      lever = book;
    }
    hinge.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.part ??= 'door';
      }
    });
  }

  let open = false;
  let moving = false;
  const toggle = async () => {
    if (moving || !lever) return;
    moving = true;
    const pivot = lever.parent!;
    // The wall's +z is the hall: the book's top tips that way.
    const tip = 0.42;
    sfx.lever();
    await tweens.run(0.35, (t) => (pivot.rotation.x = (open ? 1 - t : t) * tip), ease.out);
    sfx.hiddenDoor(2.2);
    const from = open ? 1 : 0;
    const to = open ? 0 : 1;
    await tweens.run(2.2, (t) => {
      const k = from + (to - from) * t;
      leaves[0].rotation.y = k * (Math.PI / 2) * 0.96;
      leaves[1].rotation.y = -k * (Math.PI / 2) * 0.96;
    });
    open = !open;
    // The book settles back once the doors are home.
    if (!open) await tweens.run(0.25, (t) => (pivot.rotation.x = tip * (1 - t)));
    moving = false;
  };

  const margin = 0.75;
  return {
    root,
    lever: lever!,
    leaves,
    doorWalls,
    leverSlot,
    isOpen: () => open,
    toggle,
    regions: () =>
      open
        ? [
            [doorX - doorW / 2 + 0.45, doorX + doorW / 2 - 0.45, door.z - 2, z0 + 1.2],
            [x0 + margin, x1 - margin, z0 + 0.4, z1 - margin],
          ]
        : [],
    solids: () =>
      open
        ? [
            ...solids,
            [door.x0 + 0.1, door.z + leafW / 2, 0.25, leafW / 2],
            [door.x1 - 0.1, door.z + leafW / 2, 0.25, leafW / 2],
          ]
        : solids,
    inside: (p) => p.z > door.z,
    caseAt(ray) {
      const h = ray.intersectObjects([...caseMeshes, ...shelves, ...blockers], true)[0];
      if (!h) return null;
      const gc = h.object.userData.gameCase as GameCase | undefined;
      if (gc) return { game: gc };
      const c = consoleOf.get(h.object as InstancedMesh);
      return c ? { console: c } : null;
    },
    consoles,
    cases,
    handhelds: HANDHELDS,
    handheldHome,
    television,
    playSeat,
    blockers,
  };
}
