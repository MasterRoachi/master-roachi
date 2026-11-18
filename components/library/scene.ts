import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CylinderGeometry,
  Group,
  PointLight,
  Color,
  DirectionalLight,
  Euler,
  Fog,
  HemisphereLight,
  Matrix4,
  Mesh,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  VideoTexture,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Book, Cd, Collection, Credit, Disc, Dvd } from '@/lib/library';
import { bendLeaf, pageBack, pageFront, restLeaf, type Leaf } from './bend';
import { loadVolume, ribbonAt, setRibbon, type Volume } from './reader';
import {
  boxDiscAsCd,
  boxShelfBlock,
  boxThickness,
  makeBoxSet,
  type BoxSet,
  BOOKLET_W,
  makeBook,
  makeCdCase,
  makePlayer,
  makeShelfBlock,
  makeLp,
  makeTurntable,
  ARM_PLAY,
  printLeaves,
  videoMaterial,
  type Kind,
  type Model,
  type Player,
  type Turnable,
} from './models';
import { fillerBook, fillerCd, fillerDvd } from './placeholders';
import { sfx } from './sfx';
import { bookPage, bookletFaces, fillerSpine } from './textures';
import { Tweens } from './tween';
import { addDividers, buildWall, kindAt, locate, pickWall, placeItems, setFiller, SIZES, slotCentre, spanCentre, type Wall } from './walls';
import { buildShell, cabinet, chandelier, cornice, pilaster, plaque, readingTable, shelfLabel, wallHeading } from './hall';
import { ladderGeometry, ladderOut, LADDER_BASE, makeLadder, rail, type Ladder } from './ladders';
import { makeProjector, makeScreen } from './projector';
import { materials } from './style';
import { chesterfield, coffeeTable, drinksSideboard, floorLamp, sideTable, tableLamp, wingback, wireless } from './furniture';
import { buildGallery } from './gallery';
import { makeGameTable, type GameState } from './boardgame';
import { makeGamesRoom, type GameCase, type Game } from './gamesroom';
import { makeMedium, type ConsoleModel } from './consoles';
import { check, overlay, type Overlay } from './emulator';
import { preload, prop } from './props';
import { fileMedia, youtubeMedia, type Media, type YouTubeMedia } from './media';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// The Library of Wyggzantium (lib/library.ts says what it is).
//
// Everything is done by clicking the thing itself. Click a spine and the item
// slides out of its compartment and comes up to the eye; click it to open it;
// click the booklet and it slides out of the lid; click a page to turn it;
// click the disc to take it out and click a player to play it. Clicking
// anywhere else steps back one stage: the booklet slides home, the case
// closes, the case goes back on the shelf. Esc does the same.
//
// The scene owns all of that and reports what is going on through `onState`;
// the React component draws the words over it, and the players' panels.

/** The hall, in metres: long, with the screen on a long wall. */
const W = 30;
const D = 16;
const H = 8.6;
const EYE = 1.7;
/** The shelving's height; the cornice and the gold frieze are above it. */
const SHELF_TOP = 6.6;
const SCREEN_W = 5.6;
const SCREEN_H = 3.15;
/** The screen's roller. */
const SCREEN_TOP = 5.3;
/**
 * The games room's door: the Books wall's second bay, below its first shelf
 * above the opening. The Books wall runs from x = W/2 back to -W/2, so its
 * bay between the pilasters at 3.75 and 7.5 is world x 7.7 to 11.05.
 */
const DOOR_BAY = 1;
const DOOR = { x0: W / 2 - (7.5 - 0.2), x1: W / 2 - (3.75 + 0.2), h: 2.97 };

export type Mode = 'walk' | 'held' | 'open' | 'booklet' | 'disc' | 'listen' | 'watch' | 'game' | 'play';

export interface MediaState {
  title?: string;
  by?: string;
  tracks: string[];
  track: number;
  playing: boolean;
  time: number;
  duration: number;
  credit?: Credit;
  /** Playing through a YouTube embed, which the panel has to show. */
  embedded?: boolean;
}

export interface LibraryState {
  mode: Mode;
  busy: boolean;
  item?: { kind: Kind; title: string; subtitle: string };
  hint: string;
  /** What the pointer is over on a shelf, while walking. */
  hover?: { kind: string; title: string; subtitle: string; place: string };
  page?: string;
  cd: MediaState | null;
  dvd: MediaState | null;
  /** At the games table: the game, and how it stands. */
  game?: GameState;
  /** In the games room, playing: the game, its console, and what the screen is doing. */
  arcade?: { title: string; console: string; status: string; handheld: boolean };
}

export interface Library {
  act(id: string): void;
  /** The Index: every wall, section and group. `target` is passed to act('goto:<target>'). */
  index: IndexWall[];
  /** The element the CD's YouTube player goes in: the Now playing panel's slot. */
  setCdHost(el: HTMLElement | null): void;
  dispose(): void;
}

interface Slot {
  wall: Wall;
  index: number;
}

/** Something off its shelf: its model exists while it is held, resting or its disc is playing. */
interface Out {
  slot: Slot;
  kind: Kind;
  data: Cd | Dvd | Book;
  model: Model;
  station: 'music' | 'podcasts' | 'tv' | 'here';
  /** For a book, which opens where you are: where you were. */
  here?: { position: Vector3; quaternion: Quaternion };
  /**
   * For a DVD box set: the box and its cases. `model` is the box until a case
   * is taken out of it, then that case; `index` is which. `fanned` while the
   * cases are spread out to choose from.
   */
  box?: BoxSet & { index: number; fanned: boolean };
  /** The disc chosen from a box set: what its case shows, and what plays. */
  disc?: Disc;
  /** Which case of a box set the playing disc came from, and which disc it is. */
  playingIndex?: number;
  playingDisc?: Disc;
  /** A book being read: its text once loaded, the spread it is open at, its printed pages. */
  read?: BookRead;
}

interface BookRead {
  vol?: Volume;
  /** The spread open: pages 2k on the left and 2k + 1 on the right. */
  spread: number;
  /** Printed pages by number, kept while the book is out. */
  faces: Map<number, Texture>;
  /** Laid open at its spread: false while the cover moves or the book is shut. */
  settled: boolean;
  /** A page is mid-turn. */
  turning: boolean;
}

/** One wall's entry in the Index: its sections and their groups. */
export interface IndexWall {
  wall: string;
  sections: { title: string; target: number; groups: { title: string; target: number }[] }[];
}

/** Whether a shelf item is a box set: it holds discs. */
const isBox = (it: unknown): it is Dvd => !!it && typeof it === 'object' && 'discs' in it;

const key = (s: Slot) => `${s.wall.kind}:${s.wall.group.uuid}:${s.index}`;

export function createLibrary(
  canvas: HTMLCanvasElement,
  collection: Collection,
  onState: (s: LibraryState) => void,
  gameList: Game[] = [],
): Library {
  // -------------------------------------------------------------------------
  // Renderer, scene, light: warm, from the dome and the lamps.

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const dusk = new Color('#24190f');
  scene.background = dusk;
  scene.fog = new Fog(dusk, 30, 90);
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  // Enough for the gilt to shine, not so much that the print washes out.
  scene.environmentIntensity = 0.35;

  const camera = new PerspectiveCamera(60, 1, 0.02, 200);

  scene.add(new HemisphereLight('#ffe9c4', '#3a2a1a', 0.75));
  // Daylight through the dome's windows, falling on the table beneath it.
  const sun = new DirectionalLight('#fff1d6', 1.3);
  sun.position.set(2, 20, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -W / 2, right: W / 2, top: D / 2, bottom: -D / 2, near: 5, far: 30 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // -------------------------------------------------------------------------
  // The hall.

  const mats = materials();
  scene.add(buildShell(mats, { W, D, H, shelfTop: SHELF_TOP, door: DOOR }));

  // -------------------------------------------------------------------------
  // The shelving: videos on the long wall round the screen, books on the long
  // wall opposite, music at the left end (CDs, LPs in the low rows, and the
  // cabinet with the CD player and the record player), podcasts at the right.

  const fill = collection.fill !== false;
  const longPilasters = [3.75, 7.5, 11.25, 18.75, 22.5, 26.25];
  // Three bays at each end, so the middle one sits at the middle of the wall.
  const endPilasters = [5.5, 10.5];
  const SCREEN_BAY = 3;
  const MUSIC_BAY = 1;
  const POD_BAY = 1;
  const CAB_TOP = 0.8;
  const common = { height: SHELF_TOP, fill, boardMat: mats.shelf, dividerMat: mats.divider };
  const cdTex = fillerSpine('cd');
  const walls: Wall[] = [
    buildWall({ ...common, kind: 'dvd', length: W, position: new Vector3(-W / 2, 0, -D / 2), rotationY: 0, pilasters: longPilasters, opening: [SCREEN_BAY, SCREEN_TOP + 0.3], fillTex: { dvd: fillerSpine('dvd') } }),
    buildWall({ ...common, kind: 'book', length: W, position: new Vector3(W / 2, 0, D / 2), rotationY: Math.PI, pilasters: [3.75, 7.5, 11.25, 15, 18.75, 22.5, 26.25], opening: [DOOR_BAY, 2.7], fillTex: { book: fillerSpine('book') } }),
    buildWall({ ...common, kind: 'cd', length: D, position: new Vector3(-W / 2, 0, D / 2), rotationY: Math.PI / 2, pilasters: endPilasters, opening: [MUSIC_BAY, 1.45], lowRows: ['vinyl', 'vinyl'], fillTex: { cd: cdTex, vinyl: cdTex } }),
    buildWall({ ...common, kind: 'cd', length: D, position: new Vector3(W / 2, 0, -D / 2), rotationY: -Math.PI / 2, pilasters: endPilasters, opening: [POD_BAY, 1.45], fillTex: { cd: cdTex } }),
  ];
  const [videoWall, bookWall, musicWall, podcastWall] = walls;
  const WALL_NAMES = ['Videos', 'Books', 'Music', 'Podcasts'];
  walls.forEach((w) => {
    scene.add(w.group);
    w.group.updateMatrixWorld(true);
  });

  // Each wall's furniture: a walnut back, pilasters, a cornice, its name on the
  // frieze, and in every bay with shelves to the floor, a ladder on a brass rail.
  const ladderGeo = ladderGeometry(SHELF_TOP - 0.05);
  const ladders: { ladder: Ladder; wall: Wall }[] = [];
  const solids: [number, number, number, number][] = [];
  const fh = H - SHELF_TOP - 0.6;
  walls.forEach((wall, wi) => {
    const length = wi < 2 ? W : D;
    const deep = Math.max(...wall.rows.map((r) => r.depth));
    if (wi === 1) {
      // The Books wall's back, round the games room's door.
      const [a, b] = wall.bays[DOOR_BAY];
      for (const [x0, x1, y0] of [[0, a, 0], [b, length, 0], [a, b, DOOR.h]]) {
        const piece = new Mesh(new PlaneGeometry(x1 - x0, SHELF_TOP - y0), mats.walnut);
        piece.position.set((x0 + x1) / 2, (SHELF_TOP + y0) / 2, 0.004);
        wall.group.add(piece);
      }
    } else {
      const back = new Mesh(new PlaneGeometry(length, SHELF_TOP), mats.walnut);
      back.position.set(length / 2, SHELF_TOP / 2, 0.004);
      wall.group.add(back);
    }
    const piers = wi === 0 ? longPilasters : wi === 1 ? [3.75, 7.5, 11.25, 15, 18.75, 22.5, 26.25] : endPilasters;
    for (const x of [0.2, ...piers, length - 0.2]) {
      const p = pilaster(mats, SHELF_TOP, deep);
      p.position.x = x;
      wall.group.add(p);
    }
    wall.group.add(cornice(mats, length, SHELF_TOP, deep));
    wall.group.add(wallHeading(WALL_NAMES[wi], Math.min(length * 0.6, 9), length / 2, SHELF_TOP + 0.6 + fh / 2));
    wall.bays.forEach(([a, b], bi) => {
      if ((wi === 0 && bi === SCREEN_BAY) || (wi === 1 && bi === DOOR_BAY) || (wi === 2 && bi === MUSIC_BAY) || (wi === 3 && bi === POD_BAY)) return;
      const ladder = makeLadder(ladderGeo, mats.shelf, SHELF_TOP - 0.05, wall.depth, a + 0.32, b - 0.32);
      wall.group.add(ladder.mesh);
      wall.group.add(rail(mats.brass, a + 0.02, b - 0.02, SHELF_TOP - 0.03, wall.depth + 0.03));
      ladders.push({ ladder, wall });
    });
  });

  // The furniture's models start loading now, while the shelves are built.
  preload('sofa_03', 'GreenChair_01', 'gothic_coffee_table', 'Chandelier_03', 'vintage_grandfather_clock_01', 'marble_bust_01');

  // Chandeliers down the room: a brass candle chandelier on a long rod, with
  // the light it gives. Until the model loads, the old brass ring stands in.
  for (const x of [-11.25, -3.75, 3.75, 11.25]) {
    const c = new Group();
    c.position.set(x, 5.6, 0);
    const lamp = prop('Chandelier_03', { height: 2.2 }, chandelier(mats, 0.75, H - 5.6 - 0.3, false), 'chandelier');
    lamp.position.y = -0.9;
    const rod = new Mesh(new CylinderGeometry(0.014, 0.014, H - 5.6 - 0.9, 8), mats.brass);
    rod.position.y = 0.9 + (H - 5.6 - 0.9) / 2;
    const glow = new PointLight('#ffc98a', 30, 18, 1.5);
    glow.position.y = 0.1;
    c.add(lamp, rod, glow);
    scene.add(c);
  }

  // The furniture. On the rug, a sitting room facing the screen: the
  // chesterfield, two wingbacks turned in, a coffee table, side tables with
  // lamps and floor lamps. Off it: the reading tables either side, the drinks
  // sideboard behind the sofa, and a chess table.
  const furniture: Object3D[] = [];
  const place = (o: Object3D, x: number, z: number, rotY = 0, solid?: [number, number]) => {
    o.position.set(x, 0, z);
    o.rotation.y = rotY;
    scene.add(o);
    furniture.push(o);
    if (solid) solids.push([x, z, solid[0] + 0.35, solid[1] + 0.35]);
    return o;
  };
  // Modelled pieces (props.ts) where they exist, each standing in for the
  // built one until it loads; Poly Haven's face +z, so they turn half round.
  const sofa = () => prop('sofa_03', { width: 2.4, turn: Math.PI }, chesterfield(mats));
  const armchair = (scale = 1) => prop('GreenChair_01', { height: 1.15 * scale, turn: Math.PI }, wingback(mats));
  place(sofa(), 0, 1.9, 0, [1.15, 0.48]);
  place(armchair(), -2.6, 0.7, -0.55, [0.45, 0.45]);
  place(armchair(), 2.6, 0.7, 0.55, [0.45, 0.45]);
  place(prop('gothic_coffee_table', { width: 1.15 }, coffeeTable(mats)), 0, 0.15, 0, [0.6, 0.6]);
  place(sideTable(mats), -1.6, 2.0, 0, [0.28, 0.28]);
  place(sideTable(mats), 1.6, 2.0, 0, [0.28, 0.28]);
  place(floorLamp(mats), -3.4, 1.6, 0, [0.2, 0.2]);
  place(floorLamp(mats), 3.4, 1.6, 0, [0.2, 0.2]);
  place(drinksSideboard(mats), 0, 5.4, 0, [1.0, 0.25]);
  place(floorLamp(mats), -1.45, 5.75, 0, [0.2, 0.2]);
  // Either side of the sideboard: a longcase clock, and a marble bust on a plinth.
  place(prop('vintage_grandfather_clock_01', { height: 2.2, turn: Math.PI }), -3.3, 6.2, 0, [0.45, 0.35]);
  const plinth = new Group();
  const block = new Mesh(new BoxGeometry(0.42, 1.1, 0.42), mats.marble);
  block.position.y = 0.55;
  block.castShadow = block.receiveShadow = true;
  const bust = prop('marble_bust_01', { height: 0.55, turn: Math.PI });
  bust.position.y = 1.1;
  plinth.add(block, bust);
  place(plinth, 3.3, 6.2, 0, [0.21, 0.21]);
  // The games table and its two chairs, facing each other across the board;
  // you take the one at its +z side. The table itself goes in once the tweens
  // exist, below.
  const GAME = { x: 5.4, z: 4.6, rot: 0.3 };
  for (const side of [1, -1]) {
    const d = 1.0 * side;
    place(armchair(), GAME.x + Math.sin(GAME.rot) * d, GAME.z + Math.cos(GAME.rot) * d, GAME.rot + (side < 0 ? Math.PI : 0), [0.45, 0.45]);
  }
  // The reading tables stand nearer the video wall, clear of the cabinets.
  for (const x of [-9.5, 9.5]) place(readingTable(mats), x, -3.4, 0, [1.2, 0.5]);
  for (const x of [-9.5, 9.5]) {
    for (const z of [-4.05, -2.75]) {
      // Chairs at the reading tables.
      place(armchair(0.9), x, z, z < -3.4 ? Math.PI : 0);
    }
  }

  // The collection, section by section, from the left of each wall; then the
  // plaques over its sections and the labels where its groups begin.
  const real = new Map<string, { data: Cd | Dvd | Book; block: Mesh }>();
  /** The compartments a wide item covers, beyond its first, point back to it. */
  const alias = new Map<string, number>();
  const spans = new Map<string, number>();
  /** The compartment an item really starts in, for any compartment it covers. */
  const first = (slot: Slot): Slot => {
    const a = alias.get(key(slot));
    return a === undefined ? slot : { wall: slot.wall, index: a };
  };
  /** Where an item stands, centred across all the compartments it covers. */
  const centreOf = (slot: Slot, out = 0) => spanCentre(slot.wall, slot.index, spans.get(key(slot)) ?? 1, out);
  const index: IndexWall[] = [];
  /** Every Index entry's compartment, by target number. */
  const targets: Slot[] = [];
  const shelve = (wall: Wall, wi: number, items: (Cd | Dvd | Book)[], skip: number[] = []) => {
    const kindOf = (it: { format?: string }): Kind => (wall.kind === 'cd' ? (it.format === 'vinyl' ? 'vinyl' : 'cd') : wall.kind);
    // A box set stands as wide as its cases, across as many compartments as that takes.
    const spanOf = (n: number) =>
      isBox(items[n]) ? Math.ceil((boxThickness((items[n] as Dvd).discs.length, (items[n] as Dvd).format ?? 'dvd') + 0.003) / SIZES[wall.kind].pitch) : 1;
    const placed = placeItems(wall, items as { section?: string; group?: string; format?: string }[], kindOf, skip, spanOf);
    // placeItems stops at the end of the wall; what is left over is on no shelf.
    if (placed.slots.length < items.length)
      console.warn(`Library: the ${WALL_NAMES[wi]} wall holds ${placed.slots.length} of ${items.length} items; the rest are on no shelf.`);
    placed.slots.forEach((index, n) => {
      const slot = { wall, index };
      const span = placed.spans[n];
      const c = spanCentre(wall, index, span);
      const block = isBox(items[n])
        ? boxShelfBlock(items[n] as Dvd, c.thickness, c.height, c.depth)
        : makeShelfBlock(kindAt(wall, index), items[n], c.thickness, c.height, c.depth);
      block.position.copy(c.position);
      wall.group.add(block);
      for (let k = 0; k < span; k++) {
        setFiller(wall, index + k, false);
        if (k) alias.set(key({ wall, index: index + k }), index);
      }
      if (span > 1) spans.set(key(slot), span);
      real.set(key(slot), { data: items[n], block });
    });
    // Dividers only round the compartments in use: a box set's span is one compartment wide.
    if (!fill && wall.kind !== 'book') {
      const singles = placed.slots.filter((_, n) => !isBox(items[n]));
      if (singles.length) addDividers(wall, new Set(singles), mats.divider);
    }
    // A section with bays of its own gets a brass plaque over them; one that
    // starts part-way along a bay gets its name on the shelf label instead.
    const inlineAt = new Map<number, string>();
    for (const sec of placed.sections) {
      if (sec.inline || !sec.bays.length) {
        if (sec.first !== undefined) inlineAt.set(sec.first, sec.title);
        continue;
      }
      const a = wall.bays[sec.bays[0]][0];
      const b = wall.bays[sec.bays.at(-1)!][1];
      wall.group.add(plaque(sec.title, (a + b) / 2, SHELF_TOP + 0.25, Math.max(...wall.rows.map((r) => r.depth)) + 0.095, b - a - 0.3));
    }
    for (const g of placed.groups) {
      const { row, x } = locate(wall, g.first);
      const lead = inlineAt.get(g.first);
      wall.group.add(shelfLabel(lead && lead !== g.title ? `${lead} · ${g.title}` : g.title, x, row.y - 0.009, row.depth + 0.002, !!lead));
    }
    const entry: IndexWall = { wall: WALL_NAMES[wi], sections: [] };
    for (const g of placed.groups) {
      let sec = entry.sections.find((x) => x.title === g.section);
      if (!sec) {
        sec = { title: g.section, target: targets.length, groups: [] };
        targets.push({ wall, index: g.first });
        entry.sections.push(sec);
      }
      sec.groups.push({ title: g.title, target: targets.length });
      targets.push({ wall, index: g.first });
    }
    index.push(entry);
  };
  shelve(videoWall, 0, collection.videos, [SCREEN_BAY]);
  shelve(bookWall, 1, collection.books);
  shelve(musicWall, 2, collection.music, [MUSIC_BAY]);
  shelve(podcastWall, 3, collection.podcasts, [POD_BAY]);

  const dataAt = (slot: Slot): { kind: Kind; data: Cd | Dvd | Book } | null => {
    const kind = kindAt(slot.wall, slot.index);
    const r = real.get(key(slot));
    if (r) return { kind, data: r.data };
    if (!fill) return null;
    const i = slot.index + walls.indexOf(slot.wall) * 100000;
    if (kind === 'cd') return { kind, data: fillerCd(i) };
    if (kind === 'vinyl') return { kind, data: { ...fillerCd(i), format: 'vinyl' } };
    if (kind === 'dvd') return { kind, data: fillerDvd(i) };
    const c = slotCentre(slot.wall, slot.index);
    return { kind, data: fillerBook(i, c.thickness, c.height) };
  };

  const showOnShelf = (slot: Slot, visible: boolean, out = 0) => {
    const r = real.get(key(slot));
    if (r) {
      r.block.visible = visible;
      r.block.position.copy(centreOf(slot, out).position);
    } else setFiller(slot.wall, slot.index, visible, out);
  };

  // -------------------------------------------------------------------------
  // The music cabinet in its bay, with the CD player and the record player on
  // it; the screen, its cabinet and the DVD player at the middle of the video
  // wall, and the projector hung from the ceiling.

  const musicX = (musicWall.bays[MUSIC_BAY][0] + musicWall.bays[MUSIC_BAY][1]) / 2;
  const cab = cabinet(mats, 2.6, CAB_TOP, 0.5);
  cab.position.set(musicX, 0, 0.3);
  musicWall.group.add(cab);
  const cdPlayer = makePlayer({ width: 0.43, height: 0.075, depth: 0.3, body: '#2a2622', display: '#ffc46b' });
  cdPlayer.root.position.set(musicX + 0.75, CAB_TOP, 0.28);
  musicWall.group.add(cdPlayer.root);
  const turntable = makeTurntable(mats);
  turntable.root.position.set(musicX - 0.75, CAB_TOP, 0.28);
  musicWall.group.add(turntable.root);
  // The podcast stand opposite: the same cabinet, with its own CD player and a wireless set.
  const podX = (podcastWall.bays[POD_BAY][0] + podcastWall.bays[POD_BAY][1]) / 2;
  const podCab = cabinet(mats, 2.6, CAB_TOP, 0.5);
  podCab.position.set(podX, 0, 0.3);
  podcastWall.group.add(podCab);
  const podPlayer = makePlayer({ width: 0.43, height: 0.075, depth: 0.3, body: '#2a2622', display: '#ffc46b' });
  podPlayer.root.position.set(podX + 0.6, CAB_TOP, 0.28);
  podcastWall.group.add(podPlayer.root);
  const radio = wireless(mats);
  radio.position.set(podX - 0.7, CAB_TOP, 0.3);
  // Built facing -z; the room is +z in the wall's frame.
  radio.rotation.y = Math.PI;
  podcastWall.group.add(radio);
  const podLamp = tableLamp(mats);
  podLamp.position.set(podX - 1.15, CAB_TOP, 0.32);
  podcastWall.group.add(podLamp);
  const musicLamp = tableLamp(mats);
  musicLamp.position.set(musicX + 1.15, CAB_TOP, 0.32);
  musicWall.group.add(musicLamp);
  {
    const p = podcastWall.group.localToWorld(new Vector3(podX, 0, 0.3));
    solids.push([p.x, p.z, 0.3 + 0.45, 1.3 + 0.45]);
    const w = musicWall.group.localToWorld(new Vector3(musicX, 0, 0.3));
    solids.push([w.x, w.z, 0.3 + 0.45, 1.3 + 0.45]);
  }

  // The gallery behind the screen: in the screen's bay, inside the cloth's
  // rectangle, so the screen hides it coming down and shows it going up.
  if (collection.gallery?.length) {
    const gal = buildGallery(mats, collection.gallery, { width: SCREEN_W - 0.3, top: SCREEN_TOP - 0.25, bottom: SCREEN_TOP - SCREEN_H + 0.1 });
    gal.position.set(0, 0, -D / 2 + 0.02);
    scene.add(gal);
  }
  const screen = makeScreen(SCREEN_W, SCREEN_H);
  screen.root.position.set(0, SCREEN_TOP, -D / 2 + 0.24);
  scene.add(screen.root);
  const consoleZ = -D / 2 + 0.45;
  const CONSOLE_TOP = 0.6;
  const tvConsole = cabinet(mats, 2.4, CONSOLE_TOP, 0.55);
  tvConsole.position.set(0, 0, consoleZ);
  scene.add(tvConsole);
  solids.push([0, consoleZ, 1.2 + 0.45, 0.28 + 0.45]);
  const dvdPlayer = makePlayer({ width: 0.43, height: 0.06, depth: 0.28, body: '#1f1b18', display: '#9fd2ff' });
  dvdPlayer.root.position.set(0.3, CONSOLE_TOP, consoleZ);
  scene.add(dvdPlayer.root);
  const projector = makeProjector(H - 6.9 - 0.08);
  projector.root.position.set(0, 6.9, -D / 2 + 7.2);
  scene.add(projector.root, projector.beam);
  /** The screen's corners when it is down, for the beam to land on. */
  const screenCorners = () => {
    const z = screen.root.position.z + 0.02;
    const top = SCREEN_TOP - 0.06;
    const bottom = top - SCREEN_H;
    const x = SCREEN_W / 2;
    return [new Vector3(-x, top, z), new Vector3(x, top, z), new Vector3(x, bottom, z), new Vector3(-x, bottom, z)];
  };

  // -------------------------------------------------------------------------
  // Camera poses.

  const poseFrom = (eye: Vector3, target: Vector3) => ({
    position: eye.clone(),
    quaternion: new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(eye, target, new Vector3(0, 1, 0))),
  });
  type Pose = ReturnType<typeof poseFrom>;
  const ahead = (pose: Pose, fwd: number, right = 0, up = 0): Pose => ({
    position: pose.position
      .clone()
      .add(new Vector3(right, up, -fwd).applyQuaternion(pose.quaternion)),
    quaternion: pose.quaternion.clone(),
  });
  /** Lying flat, face up, its top towards the wall: how a case rests on a cabinet. */
  const flatFacing = (yawTo: number) =>
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawTo).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
  const inMusic = (x: number, y: number, z: number) => musicWall.group.localToWorld(new Vector3(x, y, z));

  interface Station {
    focus: Pose;
    listen: Pose;
    rest: Pose;
    player: Player | null;
  }
  const inPod = (x: number, y: number, z: number) => podcastWall.group.localToWorld(new Vector3(x, y, z));
  const STATION: Record<'music' | 'podcasts' | 'tv', Station> = {
    podcasts: {
      focus: poseFrom(inPod(podX, 1.3, 1.55), inPod(podX, 0.88, 0.3)),
      listen: poseFrom(inPod(podX, 1.6, 2.1), inPod(podX, 0.82, 0.3)),
      rest: { position: inPod(podX, CAB_TOP + 0.001, 0.42), quaternion: flatFacing(podcastWall.group.rotation.y) },
      player: podPlayer,
    },
    music: {
      focus: poseFrom(inMusic(musicX, 1.3, 1.55), inMusic(musicX, 0.88, 0.3)),
      listen: poseFrom(inMusic(musicX, 1.6, 2.1), inMusic(musicX, 0.82, 0.3)),
      rest: { position: inMusic(musicX, CAB_TOP + 0.001, 0.42), quaternion: flatFacing(musicWall.group.rotation.y) },
      player: cdPlayer,
    },
    tv: {
      focus: poseFrom(new Vector3(0, 1.28, consoleZ + 1.0), new Vector3(0, 0.82, consoleZ)),
      listen: poseFrom(new Vector3(0, 2.2, -D / 2 + 9.5), new Vector3(0, 3.4, -D / 2)),
      rest: { position: new Vector3(-0.55, CONSOLE_TOP + 0.001, consoleZ + 0.05), quaternion: flatFacing(0) },
      player: dvdPlayer,
    },
  };
  /** Where a thing is looked at: its station's, or, for a book, wherever you were. */
  const focusOf = (o: Out): Pose => (o.station === 'here' ? o.here! : STATION[o.station].focus);
  const holdFor = (o: Out) =>
    o.kind === 'book' ? ahead(focusOf(o), 0.33, 0, -0.02) : ahead(focusOf(o), o.kind === 'vinyl' ? 0.48 : 0.36, -0.02, 0.03);
  const readFor = (o: Out) => ahead(focusOf(o), 0.26, 0, 0.025);
  const discFor = (o: Out) => ahead(focusOf(o), o.kind === 'vinyl' ? 0.34 : 0.28, 0.03, 0.03);

  // -------------------------------------------------------------------------
  // State.

  const tweens = new Tweens();
  const gameTable = makeGameTable(mats, tweens, () => emit());
  place(gameTable.root, GAME.x, GAME.z, GAME.rot, [0.33, 0.33]);
  // In development the games room has a test cartridge of our own making
  // (public/wyggzantium/roms-local/, never committed) to prove the TV works.
  const allGames = process.env.NODE_ENV !== 'production' ? [...gameList, { console: 'nes' as const, title: 'Test pattern', rom: 'nes/test-blue.nes' }] : gameList;
  const games = makeGamesRoom(
    mats,
    tweens,
    {
      z: D / 2,
      x0: DOOR.x0,
      x1: DOOR.x1,
      h: DOOR.h,
      depth: bookWall.depth,
      shelf: { boardMat: mats.shelf, dividerMat: mats.divider, fill, bookTex: fillerSpine('book') },
    },
    allGames,
  );
  scene.add(games.root);
  /** The door's two leaves are shelves for the hall's books too (Bjorn's Books pass fills them). */
  const doorWalls = games.doorWalls;
  /** What the pointer is over in the games room: a game, or the console a shelf of empty cases is for. */
  let caseHover: ReturnType<typeof games.caseAt> = null;
  /** The game playing in the games room, if any. */
  let playing: { gc: GameCase; model: ConsoleModel; medium: Object3D; screen: Overlay; status: string } | null = null;
  let mode: Mode = 'walk';
  let busy = false;
  let focused: Out | null = null;
  const outs = new Map<string, Out>();
  // Behind the sofa, between it and the drinks sideboard, looking down the rug to the screen.
  let walkPose = { position: new Vector3(0, EYE, 3.9), yaw: 0, pitch: -0.02 };
  let yaw = walkPose.yaw;
  let pitch = walkPose.pitch;
  camera.position.copy(walkPose.position);

  /** What is in each player. */
  let cdIn: Out | null = null;
  let dvdIn: Out | null = null;
  let track = 0;
  const audio = new Audio();
  audio.preload = 'metadata';
  const video = document.createElement('video');
  video.playsInline = true;
  video.preload = 'metadata';
  let videoTex: VideoTexture | null = null;
  /** What each player is playing through: a file, or a YouTube embed. */
  let cdMedia: Media | null = null;
  let dvdMedia: Media | null = null;
  /** Where the CD's embed goes: the Now playing panel, when it is showing. */
  let cdHost: HTMLElement | null = null;
  /** The DVD's embed, laid over the projector screen. */
  let dvdOverlay: CSS3DObject | null = null;
  let screenUnroll = 0;
  /** The ladder you are standing on, if any: where along its bay, and how high. */
  let climbing: { ladder: Ladder; wall: Wall; s: number; eye: number } | null = null;

  // -------------------------------------------------------------------------
  // Moving things.

  const worldPose = (o: Object3D) => {
    o.updateWorldMatrix(true, false);
    const p = new Vector3();
    const q = new Quaternion();
    o.matrixWorld.decompose(p, q, new Vector3());
    return { position: p, quaternion: q };
  };

  /** Moves an object (re-parented to the scene) to a world pose. */
  const fly = (o: Object3D, to: Pose, seconds = 0.7, lift = 0) => {
    scene.attach(o);
    const p0 = o.position.clone();
    const q0 = o.quaternion.clone();
    return tweens.run(seconds, (t) => {
      o.position.lerpVectors(p0, to.position, t);
      o.position.y += Math.sin(Math.PI * t) * lift;
      o.quaternion.slerpQuaternions(q0, to.quaternion, t);
    });
  };

  /** The world pose of a local pose inside a parent. */
  const poseIn = (parent: Object3D, position = new Vector3(), quaternion = new Quaternion()): Pose => {
    const probe = new Object3D();
    parent.add(probe);
    probe.position.copy(position);
    probe.quaternion.copy(quaternion);
    const p = worldPose(probe);
    parent.remove(probe);
    return p;
  };

  /** Flies an object into a parent, at a local pose, and leaves it there. */
  const flyHome = async (o: Object3D, parent: Object3D, position = new Vector3(), quaternion = new Quaternion(), seconds = 0.7, lift = 0) => {
    await fly(o, poseIn(parent, position, quaternion), seconds, lift);
    parent.add(o);
    o.position.copy(position);
    o.quaternion.copy(quaternion);
  };

  const moveCamera = (to: Pose, seconds = 0.9) => {
    const p0 = camera.position.clone();
    const q0 = camera.quaternion.clone();
    return tweens.run(seconds, (t) => {
      camera.position.lerpVectors(p0, to.position, t);
      camera.quaternion.slerpQuaternions(q0, to.quaternion, t);
    });
  };

  const turnHinge = (m: Model, to: number, seconds = 0.6) => {
    const from = m.hinge.rotation.y;
    const s0 = m.shift.position.x;
    // An open book or DVD shifts so the spread sits centred; a CD's lid swings clear.
    const s1 = to !== 0 && m.kind !== 'cd' ? m.width / 2 : 0;
    return tweens.run(seconds, (t) => {
      m.hinge.rotation.y = from + (to - from) * t;
      m.shift.position.x = s0 + (s1 - s0) * t;
    });
  };

  const moveTray = (p: Player, to: number, seconds = 0.55) => {
    const from = p.tray.position.z;
    sfx.tray();
    return tweens.run(seconds, (t) => (p.tray.position.z = from + (to - from) * t));
  };

  /** Where a slot is, as a world pose for the item standing in it. `out` pulls it into the room. */
  const slotPose = (slot: Slot, out = 0): Pose => {
    const c = centreOf(slot, out);
    return poseIn(slot.wall.group, c.position, new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2));
  };

  /** Runs a sequence with clicks ignored, then reports the new state. */
  const sequence = async (steps: () => Promise<void>) => {
    if (busy) return;
    busy = true;
    emit();
    try {
      await steps();
    } finally {
      busy = false;
      emit();
    }
  };

  // -------------------------------------------------------------------------
  // Pages.

  const turnPage = (t: Turnable, forward: boolean) => {
    const i = forward ? t.turned : t.turned - 1;
    if (i < 0 || i >= t.leaves.length) return Promise.resolve();
    const leaf = t.leaves[i];
    const z0 = leaf.group.position.z;
    const z1 = forward ? t.turnedZ(i) : t.restZ(i);
    t.turned += forward ? 1 : -1;
    sfx.page();
    return tweens
      .run(0.75, (k) => {
        bendLeaf(leaf, k, forward, 0.02);
        leaf.group.position.z = z0 + (z1 - z0) * k;
      }, (k) => k)
      .then(() => restLeaf(leaf, forward));
  };

  /** Keeps whatever is open centred: the booklet's cover alone, a spread, or its back. */
  const bookletShift = (b: Turnable) =>
    b.turned === 0 ? -BOOKLET_W / 2 : b.turned === b.leaves.length ? BOOKLET_W / 2 : 0;

  const turnBooklet = async (o: Out, forward: boolean) => {
    const b = o.model.booklet!;
    const x0 = b.inner.position.x;
    const p = turnPage(b, forward);
    const x1 = bookletShift(b);
    await Promise.all([p, tweens.run(0.6, (k) => (b.inner.position.x = x0 + (x1 - x0) * k))]);
  };

  const shutAll = async (t: Turnable, quick = true) => {
    while (t.turned > 0) {
      const leaf = t.leaves[t.turned - 1];
      if (quick) {
        t.turned--;
        restLeaf(leaf, false);
        leaf.group.position.z = t.restZ(t.turned);
      } else await turnPage(t, false);
    }
  };

  /**
   * The album a CD out of the shelf is: its own data, or, for a CD from a box
   * set, that disc made an album (the chosen one, or the one playing).
   */
  const cdOf = (o: Out, disc?: Disc): Cd => {
    if (!o.box) return o.data as Cd;
    const box = o.data as Dvd;
    const d = disc ?? o.disc;
    const i = d ? box.discs.indexOf(d) : o.box.index;
    return boxDiscAsCd(box, Math.max(i, 0));
  };

  const printBooklet = (o: Out) => {
    const b = o.model.booklet!;
    if (!b.printed) printLeaves(b, bookletFaces(cdOf(o), b.leaves.length), 0);
  };
  // ---- reading a book --------------------------------------------------------
  // A book has six real leaves however long it is. Open, it is always held
  // with two of them turned: the left page is leaf 1's back, the right page
  // leaf 2's front, and the pages either side are printed ready -- leaf 0's
  // back and leaf 1's front behind, leaf 2's back and leaf 3's front ahead. A
  // turn is a real turn of one leaf; once it lands the leaves are laid back to
  // that shape and printed one spread on, so it looks the same and a volume of
  // two thousand pages reads on six leaves. Even pages are only ever backs and
  // odd ones fronts, so a printed page is never mirrored for both.

  /** How many pages a book has: its text's, or a few blank-lined ones without. */
  const pageCount = (o: Out) => {
    const r = o.read!;
    return r.vol ? r.vol.count : (o.data as Book).text ? 2 : 24;
  };
  const lastSpread = (o: Out) => Math.max(0, Math.floor((pageCount(o) - 1) / 2));

  const bookFace = (o: Out, n: number): Texture => {
    const r = o.read!;
    let t = r.faces.get(n);
    if (!t) {
      const book = o.data as Book;
      // Past either end of the book, plain paper.
      const blank = n < 0 || (r.vol ? n >= r.vol.count : !book.text && n >= 24);
      t = blank ? bookPage(book, 0) : bookPage(book, n, r.vol?.page(n));
      r.faces.set(n, t);
    }
    return t;
  };

  const setFace = (leaf: Leaf, back: boolean, tex: Texture | null) => {
    const mesh = back ? leaf.back : leaf.front;
    const old = mesh.material as Material & { map?: Texture | null };
    if (old.map === tex) return;
    old.dispose();
    mesh.material = back ? pageBack(tex) : pageFront(tex);
  };

  /** Drops the printed pages more than a spread away, or all of them. */
  const releaseFaces = (o: Out, all = false) => {
    const r = o.read!;
    const k = r.spread;
    for (const [n, t] of r.faces) {
      if (all || n < 2 * k - 4 || n > 2 * k + 5) {
        t.dispose();
        r.faces.delete(n);
      }
    }
  };

  /** Lays the leaves open at the spread: two turned, and the pages round it printed. */
  const settleBook = (o: Out) => {
    const p = o.model.pages!;
    const k = o.read!.spread;
    p.leaves.forEach((leaf, i) => {
      restLeaf(leaf, i < 2);
      leaf.group.position.z = i < 2 ? p.turnedZ(i) : p.restZ(i);
    });
    p.turned = 2;
    setFace(p.leaves[0], true, bookFace(o, 2 * k - 2));
    setFace(p.leaves[1], false, bookFace(o, 2 * k - 1));
    setFace(p.leaves[1], true, bookFace(o, 2 * k));
    setFace(p.leaves[2], false, bookFace(o, 2 * k + 1));
    setFace(p.leaves[2], true, bookFace(o, 2 * k + 2));
    setFace(p.leaves[3], false, bookFace(o, 2 * k + 3));
    if (o.model.ribbon) o.model.ribbon.visible = true;
    o.read!.settled = true;
    releaseFaces(o);
  };

  /** Before the cover opens: the page the ribbon marks on top, and the text on its way. */
  const printBook = (o: Out) => {
    const book = o.data as Book;
    o.read ??= { spread: ribbonAt(book.id), faces: new Map(), settled: false, turning: false };
    const r = o.read;
    // Until the text is in, the book's length is unknown: keep the ribbon's spread.
    if (r.vol || !book.text) r.spread = Math.min(r.spread, lastSpread(o));
    setFace(o.model.pages!.leaves[0], false, bookFace(o, 2 * r.spread + 1));
    if (!book.text || r.vol) return;
    loadVolume(book.text).then(
      (vol) => {
        if (o.read !== r) return;
        r.vol = vol;
        r.spread = Math.min(r.spread, lastSpread(o));
        // The pages printed while it loaded were only their heads: print again.
        releaseFaces(o, true);
        if (r.settled && !r.turning) settleBook(o);
        else if (!r.settled) setFace(o.model.pages!.leaves[0], false, bookFace(o, 2 * r.spread + 1));
        emit();
      },
      (err) => console.warn(`Library: could not load the text of ${book.title}`, err),
    );
  };

  const turnBook = async (o: Out, forward: boolean) => {
    const r = o.read;
    const p = o.model.pages;
    if (!r || !p || !r.settled) return;
    if (forward ? r.spread >= lastSpread(o) : r.spread <= 0) return;
    r.turning = true;
    // The ribbon stays with the page you are on, so it is lifted for the turn.
    if (o.model.ribbon) o.model.ribbon.visible = false;
    await turnPage(p, forward);
    r.spread += forward ? 1 : -1;
    r.turning = false;
    settleBook(o);
    setRibbon((o.data as Book).id, r.spread);
    emit();
  };

  /** Before the cover shuts: the leaves back flat, the ribbon kept at the page. */
  const shutBook = (o: Out) => {
    const r = o.read;
    const p = o.model.pages!;
    p.leaves.forEach((leaf, i) => {
      restLeaf(leaf, false);
      leaf.group.position.z = p.restZ(i);
    });
    p.turned = 0;
    if (!r) return;
    r.settled = false;
    setRibbon((o.data as Book).id, r.spread);
    setFace(p.leaves[0], false, bookFace(o, 2 * r.spread + 1));
    for (let i = 0; i < p.leaves.length; i++) {
      if (i) setFace(p.leaves[i], false, null);
      setFace(p.leaves[i], true, null);
    }
    if (o.model.ribbon) o.model.ribbon.visible = true;
  };

  // -------------------------------------------------------------------------
  // Playing.

  const asCd = () => (cdIn ? cdOf(cdIn, cdIn.playingDisc) : null);

  /** Emits when what the panel shows has moved: the second, or playing or paused. */
  let shown = '';
  const tick = () => {
    const now = `${Math.floor(cdMedia?.time ?? 0)}:${cdMedia?.paused}:${Math.floor(dvdMedia?.duration ?? 0)}:${Math.floor(dvdMedia?.time ?? 0)}:${dvdMedia?.paused}:${Math.floor(cdMedia?.duration ?? 0)}`;
    if (now !== shown) {
      shown = now;
      emit();
    }
  };

  const loadTrack = (n: number, play: boolean) => {
    const disc = asCd();
    if (!disc || !disc.tracks.length) return;
    track = (n + disc.tracks.length) % disc.tracks.length;
    const t = disc.tracks[track];
    cdMedia?.dispose();
    if (play) dvdMedia?.pause();
    if (t.youtube) {
      const yt = youtubeMedia(t.youtube, play, `${disc.title}: ${t.title}`, t.start ?? 0, t.end);
      if (cdHost) cdHost.appendChild(yt.iframe);
      cdMedia = yt;
    } else if (t.src) {
      cdMedia = fileMedia(audio, t.src, play);
    } else cdMedia = null;
    if (cdMedia) {
      cdMedia.onChange = tick;
      cdMedia.onEnded = () => {
        const cd = asCd();
        if (cd && track < cd.tracks.length - 1) loadTrack(track + 1, true);
        else emit();
      };
    }
    emit();
  };

  /** Takes the panel's slot for the CD's embed, and puts the embed in it. */
  const setCdHost = (el: HTMLElement | null) => {
    cdHost = el;
    const iframe = (cdMedia as YouTubeMedia | null)?.iframe;
    if (el && iframe && iframe.parentElement !== el) el.appendChild(iframe);
  };

  // The embed is laid over the screen in the page, not drawn on it: a frame
  // from another site cannot become a texture. It is drawn at this many
  // pixels and scaled to the screen.
  const OVERLAY_PX = 1280;
  const css = new CSS3DRenderer();
  css.domElement.style.position = 'absolute';
  css.domElement.style.inset = '0';
  css.domElement.style.pointerEvents = 'none';
  canvas.after(css.domElement);

  /** The disc a DVD out of the box is: the one chosen, or a box's only disc. */
  const discOf = (o: Out | null): Disc | undefined => (o ? (o.playingDisc ?? o.disc ?? (o.data as Dvd).discs?.[0]) : undefined);

  const startVideo = () => {
    const dvd = discOf(dvdIn);
    if (!dvd?.video) return;
    cdMedia?.pause();
    dvdMedia?.dispose();
    if (dvd.video.youtube) {
      const yt = youtubeMedia(dvd.video.youtube, true, dvd.title);
      const h = Math.round((OVERLAY_PX * SCREEN_H) / SCREEN_W);
      yt.iframe.width = String(OVERLAY_PX);
      yt.iframe.height = String(h);
      Object.assign(yt.iframe.style, { width: `${OVERLAY_PX}px`, height: `${h}px`, background: '#000', pointerEvents: 'none' });
      dvdOverlay = new CSS3DObject(yt.iframe);
      dvdOverlay.scale.setScalar(SCREEN_W / OVERLAY_PX);
      dvdOverlay.position.set(0, SCREEN_TOP - 0.06 - SCREEN_H / 2, screen.root.position.z + 0.03);
      scene.add(dvdOverlay);
      dvdMedia = yt;
    } else if (dvd.video.src) {
      dvdMedia = fileMedia(video, dvd.video.src, true);
      videoTex?.dispose();
      videoTex = new VideoTexture(video);
      videoTex.colorSpace = SRGBColorSpace;
      screen.cloth.material = videoMaterial(videoTex);
    }
    if (dvdMedia) {
      dvdMedia.onChange = tick;
      dvdMedia.onEnded = () => emit();
    }
  };

  /** The screen comes down, the projector lights, and the film starts. */
  const screenDown = async () => {
    const from = screenUnroll;
    sfx.screen(2.2 * (1 - from));
    await tweens.run(2.2 * (1 - from), (t) => screen.setUnroll((screenUnroll = from + (1 - from) * t)));
    projector.aim(screenCorners());
    projector.on(true);
  };
  const screenUp = async () => {
    projector.on(false);
    const from = screenUnroll;
    if (from <= 0) return;
    sfx.screen(2.2 * from);
    await tweens.run(2.2 * from, (t) => screen.setUnroll((screenUnroll = from * (1 - t))));
  };

  const stopVideo = () => {
    dvdMedia?.dispose();
    dvdMedia = null;
    if (dvdOverlay) {
      scene.remove(dvdOverlay);
      dvdOverlay = null;
    }
    if (screen.cloth.material !== screen.idle) (screen.cloth.material as Material).dispose();
    screen.cloth.material = screen.idle;
    videoTex?.dispose();
    videoTex = null;
  };

  /** Puts a model back in its compartment and lets it go, unless its disc is still playing. */
  const release = (o: Out) => {
    if (o === cdIn || o === dvdIn || o === focused) return;
    if (o.model.root.parent !== o.slot.wall.group) return;
    o.model.root.removeFromParent();
    o.model.dispose();
    outs.delete(key(o.slot));
    showOnShelf(o.slot, true);
  };

  /** Ejects a player's disc back into its case, wherever the case is. */
  const eject = async (kind: 'cd' | 'dvd') => {
    const o = kind === 'cd' ? cdIn : dvdIn;
    if (!o) return;
    const p = kind === 'cd' ? (o.station === 'podcasts' ? podPlayer : cdPlayer) : dvdPlayer;
    if (kind === 'cd') {
      cdMedia?.dispose();
      cdMedia = null;
      cdIn = null;
    } else {
      stopVideo();
      dvdIn = null;
      void screenUp();
    }
    emit();
    const closedOnShelf = o.model.root.parent === o.slot.wall.group;
    // The disc goes back into its own case: a box set's, wherever the box is.
    const m = caseOf(o);
    o.playingIndex = undefined;
    o.playingDisc = undefined;
    if (o.kind === 'vinyl') {
      // The arm lifts back to its rest, the platter stops, the record goes home.
      const a0 = turntable.arm.rotation.y;
      await tweens.run(0.8, (t) => (turntable.arm.rotation.y = a0 * (1 - t)));
      await flyHome(m.disc!, m.discHome!, new Vector3(), new Quaternion(), 0.9, closedOnShelf ? 0.3 : 0.15);
    } else {
      await moveTray(p, p.trayOut);
      await flyHome(m.disc!, m.discHome!, new Vector3(), new Quaternion(), 0.8, closedOnShelf ? 0.3 : 0.12);
      await moveTray(p, p.trayIn);
    }
    release(o);
  };

  // -------------------------------------------------------------------------
  // Taking down, putting back.

  const pull = 0.06;

  const takeDown = (clicked: Slot) =>
    sequence(async () => {
      const slot = first(clicked);
      const k = key(slot);
      if (focused) await putBack(focused, false);
      let o = outs.get(k);
      if (!o) {
        const found = dataAt(slot);
        if (!found) return;
        const c = centreOf(slot);
        const box = isBox(found.data) ? makeBoxSet(found.data as Dvd) : null;
        const model = box
          ? box.model
          : found.kind === 'cd'
            ? makeCdCase(found.data as Cd)
            : found.kind === 'vinyl'
              ? makeLp(found.data as Cd)
              : makeBook(found.data as Book, c.thickness, c.height);
        o = { slot, kind: found.kind, data: found.data, model, station: found.kind === 'dvd' ? 'tv' : found.kind === 'book' ? 'here' : slot.wall === podcastWall ? 'podcasts' : 'music' };
        if (box) o.box = { ...box, index: -1, fanned: false };
        outs.set(k, o);
        slot.wall.group.add(model.root);
        model.root.position.copy(c.position);
        model.root.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
        showOnShelf(slot, false);
      }
      if (mode === 'walk') walkPose = { position: camera.position.clone(), yaw, pitch };
      // A book opens where you are: in front of you, on the floor or up a ladder.
      if (o.station === 'here') o.here = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
      focused = o;
      mode = 'held';
      sfx.slide();
      await fly(o.model.root, slotPose(slot, centreOf(slot).depth + pull), 0.45, 0);
      await Promise.all([moveCamera(focusOf(o), 1.0), fly(o.model.root, holdFor(o), 1.0, o.station === 'here' ? 0.05 : 0.15)]);
    });

  /** Closes everything on it, flies it home and slides it in. */
  const putBack = async (o: Out, toWalk: boolean) => {
    // A box set's chosen case goes back into the box first, and the box with it.
    if (o.box && o.model !== o.box.model) await caseIntoBox(o);
    if (o.box?.fanned) await gather(o);
    const m = o.model;
    if (mode === 'booklet' && m.booklet) await bookletIn(o);
    if (mode === 'disc' && m.disc) await flyHome(m.disc, m.discHome!, new Vector3(), new Quaternion(), 0.5);
    if (m.pages) await shutAll(m.pages, true);
    if (isOpen(m)) await closeIt(o);
    const flight = fly(m.root, slotPose(o.slot, centreOf(o.slot).depth + pull), 1.0, o.station === 'here' ? 0.05 : 0.15);
    if (toWalk) await Promise.all([flight, backToWalk()]);
    else await flight;
    sfx.slide();
    const c = centreOf(o.slot);
    await flyHome(m.root, o.slot.wall.group, c.position, new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2), 0.4);
    focused = null;
    release(o);
  };

  // -------------------------------------------------------------------------
  // Box sets.

  /** Where a box set lies while its case is out: on the console, beside the case's place. */
  const boxRest = (o: Out): Pose => {
    const r = STATION[o.station as 'music' | 'podcasts' | 'tv'].rest;
    // To the left of where its case lies, along the cabinet, lying flat.
    const along = new Vector3(-0.42, 0, 0).applyQuaternion(r.quaternion);
    return { position: r.position.clone().add(along).add(new Vector3(0, (o.box?.thickness ?? 0) / 2, 0)), quaternion: r.quaternion.clone() };
  };

  /** The cases spread out in a fan in front of you, overlapping like cards, the box set down below. */
  const fan = async (o: Out) => {
    const b = o.box!;
    const n = b.cases.length;
    const focus = focusOf(o);
    const step = Math.min(0.05, 0.36 / Math.max(n, 1));
    sfx.slide();
    // Each case slides out of the box's open edge first.
    await Promise.all(b.cases.map((c, i) => tweens.run(0.35 + i * 0.03, (t) => (c.root.position.x = t * 0.08))));
    await Promise.all([
      fly(b.model.root, ahead(focus, 0.62, 0, -0.24), 0.6, 0),
      ...b.cases.map((c, i) => fly(c.root, ahead(focus, 0.44 - i * 0.004, (i - (n - 1) / 2) * step, 0.02), 0.6 + i * 0.04, 0.03)),
    ]);
    b.fanned = true;
  };

  /** The fanned cases back into the box, and the box back in hand. */
  const gather = async (o: Out) => {
    const b = o.box!;
    await Promise.all(b.cases.map((c, i) => flyHome(c.root, b.homes[i], new Vector3(), new Quaternion(), 0.5, 0.02)));
    sfx.slide();
    b.fanned = false;
    await fly(b.model.root, holdFor(o), 0.4, 0);
  };

  /** One case taken from the fan: the rest go home, the box goes down on the console, the case comes up. */
  const choose = async (o: Out, i: number) => {
    const b = o.box!;
    b.index = i;
    o.disc = (o.data as Dvd).discs[i];
    const chosen = b.cases[i];
    await Promise.all(b.cases.map((c, k) => (k === i ? Promise.resolve() : flyHome(c.root, b.homes[k], new Vector3(), new Quaternion(), 0.5, 0.02))));
    b.fanned = false;
    // A CD's slim case comes out to its full depth.
    const z0 = chosen.root.scale.z;
    await Promise.all([
      fly(b.model.root, boxRest(o), 0.8, 0.05),
      fly(chosen.root, holdFor(o), 0.6, 0.02),
      tweens.run(0.6, (t) => (chosen.root.scale.z = z0 + (1 - z0) * t)),
    ]);
    o.model = chosen;
  };

  /** The chosen case shut and slid back into its box, wherever the box is. */
  const caseIntoBox = async (o: Out) => {
    const b = o.box!;
    const m = o.model;
    if (mode === 'disc' && m.disc) await flyHome(m.disc, m.discHome!, new Vector3(), new Quaternion(), 0.5);
    if (isOpen(m)) await closeIt(o);
    const z0 = m.root.scale.z;
    await Promise.all([
      flyHome(m.root, b.homes[b.index], new Vector3(), new Quaternion(), 0.7, 0.05),
      tweens.run(0.7, (t) => (m.root.scale.z = z0 + (b.caseScale - z0) * t)),
    ]);
    sfx.slide();
    o.model = b.model;
    o.disc = undefined;
    // In hand again, to go back on the shelf from there.
    await fly(b.model.root, holdFor(o), 0.6, 0.05);
  };

  /** The case whose disc is playing, or would play. */
  const caseOf = (o: Out) => (o.box ? o.box.cases[o.playingIndex ?? o.box.index] : o.model);

  const backToWalk = async () => {
    const q = new Quaternion().setFromEuler(new Euler(walkPose.pitch, walkPose.yaw, 0, 'YXZ'));
    await moveCamera({ position: walkPose.position, quaternion: q }, 1.0);
    yaw = walkPose.yaw;
    pitch = walkPose.pitch;
    mode = 'walk';
  };

  /** Whether it is open: a lid or cover turned back, or an LP's record slid out. */
  const isOpen = (m: Model) => (m.kind === 'vinyl' ? m.hinge.position.x > 0.001 : m.hinge.rotation.y !== 0);
  const LP_OUT = 0.1;

  const openIt = async (o: Out) => {
    if (o.kind === 'vinyl') {
      sfx.slide();
      const x0 = o.model.hinge.position.x;
      await tweens.run(0.6, (t) => (o.model.hinge.position.x = x0 + (LP_OUT - x0) * t));
      return;
    }
    if (o.kind === 'cd') {
      printBooklet(o);
      sfx.cdOpen();
    }
    else if (o.kind === 'dvd') sfx.dvdOpen();
    else {
      printBook(o);
      sfx.bookOpen();
    }
    await turnHinge(o.model, o.model.openAngle, o.kind === 'cd' ? 0.5 : 0.75);
    if (o.kind === 'book' && o.read) settleBook(o);
  };

  const closeIt = async (o: Out) => {
    if (o.kind === 'vinyl') {
      sfx.slide();
      const x0 = o.model.hinge.position.x;
      await tweens.run(0.5, (t) => (o.model.hinge.position.x = x0 * (1 - t)));
      return;
    }
    if (o.kind === 'book') shutBook(o);
    else if (o.model.pages) await shutAll(o.model.pages, false);
    const p = turnHinge(o.model, 0, o.kind === 'cd' ? 0.45 : 0.65);
    // The sound lands as it shuts, not as it starts to move.
    setTimeout(() => (o.kind === 'cd' ? sfx.cdClose() : o.kind === 'dvd' ? sfx.dvdClose() : sfx.bookClose()), o.kind === 'cd' ? 380 : 560);
    await p;
  };

  /** The booklet slides out from under the lid's tabs, then comes up to read. */
  const bookletOut = async (o: Out) => {
    const m = o.model;
    const b = m.booklet!;
    printBooklet(o);
    sfx.slide();
    await tweens.run(0.55, (t) => (b.group.position.x = t * (BOOKLET_W + 0.012)));
    await fly(b.group, readFor(o), 0.7, 0.01);
    const x1 = bookletShift(b);
    await tweens.run(0.3, (t) => (b.inner.position.x = x1 * t));
  };

  /** Pages shut, back down to the lid, and slid in under the tabs. */
  const bookletIn = async (o: Out) => {
    const m = o.model;
    const b = m.booklet!;
    await shutAll(b, false);
    const x0 = b.inner.position.x;
    await tweens.run(0.25, (t) => (b.inner.position.x = x0 * (1 - t)));
    await flyHome(b.group, m.bookletHome!, new Vector3(BOOKLET_W + 0.012, 0, 0), new Quaternion(), 0.65, 0.01);
    sfx.slide();
    await tweens.run(0.5, (t) => (b.group.position.x = (1 - t) * (BOOKLET_W + 0.012)));
  };

  const insert = async (o: Out) => {
    // CDs and LPs share one set of speakers: one plays at a time.
    const kind = o.kind === 'dvd' ? 'dvd' : 'cd';
    const st = STATION[o.station as 'music' | 'podcasts' | 'tv'];
    const playing = kind === 'cd' ? cdIn : dvdIn;
    // Another disc in the player, or another disc from this same box set: out it comes first.
    if (playing && (playing !== o || (o.box && o.playingIndex !== o.box.index))) await eject(kind);
    if (o.box) {
      o.playingIndex = o.box.index;
      o.playingDisc = o.disc;
    }
    if (o.kind === 'vinyl') {
      await moveCamera(st.listen, 1.0);
      await flyHome(o.model.disc!, turntable.seat, new Vector3(), new Quaternion(), 1.0, 0.12);
      await Promise.all([
        tweens.run(1.0, (t) => (turntable.arm.rotation.y = ARM_PLAY * t)),
        fly(o.model.root, st.rest, 0.8, 0.05),
      ]);
      // The needle drops.
      sfx.button();
    } else {
      const p = st.player!;
      await Promise.all([moveCamera(st.listen, 1.0), moveTray(p, p.trayOut)]);
      await flyHome(o.model.disc!, p.seat, new Vector3(), new Quaternion(), 0.9, 0.1);
      await Promise.all([moveTray(p, p.trayIn), fly(o.model.root, st.rest, 0.8, 0.05)]);
    }
    if (kind === 'cd') {
      cdIn = o;
      mode = 'listen';
      loadTrack(0, true);
    } else {
      dvdIn = o;
      mode = 'watch';
      await screenDown();
      startVideo();
    }
  };

  /** Stand at a player: its case comes down off the shelf to lie open beside it. */
  // -------------------------------------------------------------------------
  // The games room: put a game in its console and play it.

  /** Standing in front of a console, looking down at it: its front is its +z. */
  const consoleView = (model: ConsoleModel) => {
    model.root.updateWorldMatrix(true, false);
    const up = model.handheld ? 0.3 : 0.55;
    return poseFrom(model.root.localToWorld(new Vector3(0, up, 0.85)), model.root.localToWorld(new Vector3(0, model.size.h * 0.5, 0)));
  };

  /** The handheld held up in front of you, its screen (both screens, on a DS) square to your eye. */
  const heldPose = (model: ConsoleModel, from: Pose) => {
    const a = model.screen!;
    const b = model.screen2 ?? a;
    model.root.updateWorldMatrix(true, true);
    const mid = model.root.worldToLocal(a.getWorldPosition(new Vector3()).add(b.getWorldPosition(new Vector3())).multiplyScalar(0.5));
    const quaternion = from.quaternion.clone();
    const position = ahead(from, model.screen2 ? 0.22 : 0.2).position.sub(mid.applyQuaternion(quaternion));
    return { position, quaternion };
  };

  /** Where the picture goes: the television, or the handheld's screen (a DS's two as one). */
  const screenFor = (model: ConsoleModel): { anchor: Object3D; w: number; h: number } => {
    if (!model.handheld) return { anchor: games.television.anchor, w: games.television.w, h: games.television.h };
    const a = model.screen!;
    const s = model.screenSize!;
    if (!model.screen2) return { anchor: a, w: s.w, h: s.h };
    // One picture over both screens, as the emulator draws them: top above
    // bottom, facing halfway between the two (the DS's lid leans forward).
    // The screens sit at different depths in the model, so it is worked out in world space.
    const anchor = new Object3D();
    model.root.add(anchor);
    model.root.updateWorldMatrix(true, true);
    const mid = a.getWorldPosition(new Vector3()).add(model.screen2.getWorldPosition(new Vector3())).multiplyScalar(0.5);
    anchor.position.copy(model.root.worldToLocal(mid));
    const toRoot = model.root.getWorldQuaternion(new Quaternion()).invert();
    const qa = a.getWorldQuaternion(new Quaternion());
    const qb = model.screen2.getWorldQuaternion(new Quaternion());
    anchor.quaternion.copy(toRoot.multiply(qa.slerp(qb, 0.5)));
    return { anchor, w: s.w, h: s.h + model.screen2Size!.h };
  };

  const playGame = (gc: GameCase) =>
    sequence(async () => {
      const model = games.consoles.get(gc.console.id);
      if (!model) return;
      walkPose = { position: camera.position.clone(), yaw, pitch };
      setHover(null);
      caseHover = null;
      const view = consoleView(model);
      // The case comes off its shelf to beside the console, its cover to you.
      const caseAt = ahead(view, 0.5, 0.22, -0.05);
      caseAt.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2));
      sfx.slide();
      await Promise.all([moveCamera(view, 1.0), fly(gc.mesh, caseAt, 0.9, 0.1)]);
      // Open it up and put the game in.
      sfx.tray();
      await tweens.run(0.5, (t) => model.setOpen(t));
      const medium = makeMedium(gc.console.id, gc.game.title, gc.game.cover);
      medium.position.copy(gc.mesh.position);
      scene.add(medium);
      await fly(medium, worldPose(model.approach), 0.55, 0.05);
      await flyHome(medium, model.seat, new Vector3(), new Quaternion(), 0.4);
      sfx.tray();
      await tweens.run(0.5, (t) => model.setOpen(1 - t));
      model.setPower(true);
      sfx.button();
      void flyHome(gc.mesh, gc.home.parent, gc.home.position, gc.home.quaternion, 0.8, 0.1);
      // A handheld comes up to your eye; for the rest, sit down at the set.
      if (model.handheld) await fly(model.root, heldPose(model, view), 0.9, 0.05);
      else await moveCamera(poseFrom(games.playSeat.eye, games.playSeat.target), 1.1);
      const where = screenFor(model);
      const state = await check(gc.game);
      const screenNow = overlay(where.anchor, where.w, where.h, state.src, model.handheld ? 300 : 640);
      screenNow.show(state);
      playing = { gc, model, medium, screen: screenNow, status: state.kind === 'message' ? state.text : 'Loading…' };
      mode = 'play';
      screenNow.frame?.addEventListener('load', () => screenNow.frame?.focus(), { once: true });
    });

  const stopGame = () =>
    sequence(async () => {
      const p = playing;
      if (!p) return;
      playing = null;
      p.screen.dispose();
      p.model.setPower(false);
      const q = new Quaternion().setFromEuler(new Euler(walkPose.pitch, walkPose.yaw, 0, 'YXZ'));
      const back = moveCamera({ position: walkPose.position, quaternion: q }, 1.0);
      if (p.model.handheld) {
        const home = games.handheldHome.get(p.gc.console.id)!;
        await fly(p.model.root, { position: home.position.clone(), quaternion: home.quaternion.clone() }, 0.8, 0.05);
      }
      // The game comes out and goes back in its case on the shelf.
      await tweens.run(0.4, (t) => p.model.setOpen(t));
      await fly(p.medium, worldPose(p.model.approach), 0.4, 0);
      await tweens.run(0.3, (t) => p.medium.scale.setScalar(1 - t));
      p.medium.removeFromParent();
      p.medium.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
      await tweens.run(0.4, (t) => p.model.setOpen(1 - t));
      await back;
      yaw = walkPose.yaw;
      pitch = walkPose.pitch;
      mode = 'walk';
    });

  // The TV page says when the game is running, or that it failed.
  const onTv = (e: MessageEvent) => {
    if (e.origin !== location.origin || !e.data?.tv || !playing || e.source !== playing.screen.frame?.contentWindow) return;
    if (e.data.state === 'playing') {
      playing.status = 'Playing';
      playing.screen.show({ kind: 'playing' });
    } else if (e.data.state === 'failed' || e.data.state === 'refused') {
      playing.status = 'The emulator did not start.';
      playing.screen.show({ kind: 'message', text: 'The emulator did not start. Try again in a moment.' });
    }
    emit();
  };
  window.addEventListener('message', onTv);

  /** Sits you down at the games table, looking down at the board. */
  const sitDown = () =>
    sequence(async () => {
      walkPose = { position: camera.position.clone(), yaw, pitch };
      setHover(null);
      const { eye, target } = gameTable.seat();
      await moveCamera(poseFrom(eye, target), 1.0);
      mode = 'game';
    });
  const standUp = () =>
    sequence(async () => {
      canvas.style.cursor = '';
      const q = new Quaternion().setFromEuler(new Euler(walkPose.pitch, walkPose.yaw, 0, 'YXZ'));
      await moveCamera({ position: walkPose.position, quaternion: q }, 0.9);
      yaw = walkPose.yaw;
      pitch = walkPose.pitch;
      mode = 'walk';
    });

  const goToPlayer = (kind: 'cd' | 'dvd') =>
    sequence(async () => {
      const o = kind === 'cd' ? cdIn : dvdIn;
      if (!o) return;
      if (mode === 'walk') walkPose = { position: camera.position.clone(), yaw, pitch };
      if (focused && focused !== o) await putBack(focused, false);
      focused = o;
      const st = STATION[o.station as 'music' | 'podcasts' | 'tv'];
      // A box set comes down closed, its disc's case back inside it.
      const boxed = !!o.box && o.model === o.box.model;
      await Promise.all([moveCamera(st.listen, 1.0), fly(o.model.root, boxed ? boxRest(o) : st.rest, 1.0, 0.1)]);
      if (!boxed && !isOpen(o.model)) await openIt(o);
      mode = kind === 'cd' ? 'listen' : 'watch';
    });

  // -------------------------------------------------------------------------
  // The ladders.

  /** Where your eye is on a ladder, in the world: just out from the rung you stand on. */
  const ladderEye = (c: { ladder: Ladder; wall: Wall; s: number; eye: number }) =>
    c.wall.group.localToWorld(new Vector3(c.s, c.eye, c.ladder.front + ladderOut(c.ladder, c.eye - 1.5) + 0.36));
  const facing = (wall: Wall, p = 0.05) => new Quaternion().setFromEuler(new Euler(p, wall.group.rotation.y, 0, 'YXZ'));

  const climbOn = (l: { ladder: Ladder; wall: Wall }) =>
    sequence(async () => {
      const c = { ladder: l.ladder, wall: l.wall, s: l.ladder.mesh.position.x, eye: EYE + 0.35 };
      sfx.ladder();
      await moveCamera({ position: ladderEye(c), quaternion: facing(l.wall) }, 0.8);
      climbing = c;
      yaw = l.wall.group.rotation.y;
      pitch = 0.05;
    });

  const stepOff = () =>
    sequence(async () => {
      const c = climbing;
      if (!c) return;
      climbing = null;
      const floor = c.wall.group.localToWorld(new Vector3(c.s, EYE, c.ladder.front + LADDER_BASE + 0.8));
      await moveCamera({ position: floor, quaternion: facing(c.wall, 0) }, 0.6 + (c.eye - EYE) * 0.15);
      yaw = c.wall.group.rotation.y;
      pitch = 0;
    });

  // -------------------------------------------------------------------------
  // The Index: walk to a section or group, and up its bay's ladder if its
  // shelf is out of reach.

  const goTo = (slot: Slot) =>
    sequence(async () => {
      if (focused) {
        mode = mode === 'listen' || mode === 'watch' ? 'open' : mode;
        await putBack(focused, false);
      }
      mode = 'walk';
      climbing = null;
      const { row, x: x0 } = locate(slot.wall, slot.index);
      // Stand a little along from where it begins, and never in a corner.
      const length = slot.wall === videoWall || slot.wall === bookWall ? W : D;
      const x = Math.min(Math.max(x0 + 0.4, 1.4), length - 1.4) - 0.3;
      const shelfY = row.y + 0.15;
      const ladder = ladders.find((l) => l.wall === slot.wall && x >= l.ladder.min - 0.4 && x <= l.ladder.max + 0.4);
      const sx = Math.min(Math.max(x + 0.3, ladder?.ladder.min ?? x), ladder?.ladder.max ?? x);
      if (shelfY > EYE + 0.5 && ladder) {
        // Too high to reach from the floor: roll the bay's ladder over and climb it.
        const s0 = ladder.ladder.mesh.position.x;
        sfx.roll(0.6);
        await tweens.run(0.6, (t) => (ladder.ladder.mesh.position.x = s0 + (sx - s0) * t));
        const c = { ladder: ladder.ladder, wall: ladder.wall, s: sx, eye: Math.min(shelfY, ladder.ladder.topY + 0.2) };
        const ladderPos = ladderEye(c);
        const look = slot.wall.group.localToWorld(new Vector3(sx, shelfY - 0.05, 0));
        sfx.ladder();
        await moveCamera(poseFrom(ladderPos, look), 1.6);
        climbing = c;
        yaw = slot.wall.group.rotation.y;
        pitch = new Euler().setFromQuaternion(camera.quaternion, 'YXZ').x;
      } else {
        const stand = slot.wall.group.localToWorld(new Vector3(x + 0.3, EYE, row.depth + 1.6));
        const look = slot.wall.group.localToWorld(new Vector3(x + 0.3, Math.max(shelfY - 0.1, 0.6), 0));
        await moveCamera(poseFrom(stand, look), 1.6);
        const e = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        yaw = e.y;
        pitch = e.x;
      }
      walkPose = { position: camera.position.clone(), yaw, pitch };
    });

  // -------------------------------------------------------------------------
  // Clicking.

  const ray = new Raycaster();
  const ndc = new Vector2();
  const aim = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  };
  const hit = (objects: Object3D[]) => ray.intersectObjects(objects, true)[0];
  const partOf = (o: Object3D | undefined) => (o?.userData.part as string | undefined) ?? null;

  /** The compartment under the pointer, unless something nearer is in the way. */
  const slotUnder = (): Slot | null => {
    // From the games room, the hall's shelves are behind you or through the door.
    if (games.inside(camera.position)) return null;
    let best: { slot: Slot; d: number } | null = null;
    for (const wall of [...walls, ...doorWalls]) {
      const p = pickWall(wall, ray.ray);
      if (p && (!best || p.distance < best.d)) best = { slot: { wall, index: p.index }, d: p.distance };
    }
    if (!best) return null;
    const blocker = hit([...furniture, cab, podCab, cdPlayer.root, podPlayer.root, turntable.root, screen.root, tvConsole, dvdPlayer.root, ...ladders.map((l) => l.ladder.mesh)]);
    if (blocker && blocker.distance < best.d) return null;
    return best.slot;
  };

  /** Which half of the screen a click is on: pages turn by it. */
  const rightHalf = (x: number) => {
    const r = canvas.getBoundingClientRect();
    return x - r.left > r.width / 2;
  };

  const playerAction = (p: Player, action: string) => {
    sfx.button();
    const kind = p === dvdPlayer ? 'dvd' : 'cd';
    if (action === 'eject') return void sequence(() => eject(kind));
    if (kind === 'cd') {
      if (action === 'play') act('play');
      else if (action === 'stop') act('stop');
      else if (action === 'next') act('next-track');
      else if (action === 'prev') act('prev-track');
    } else {
      if (action === 'play') act('dvd-play');
      else if (action === 'stop') act('dvd-stop');
      else if (action === 'next') dvdMedia?.seek(dvdMedia.time + 10);
      else if (action === 'prev') dvdMedia?.seek(dvdMedia.time - 10);
    }
  };

  /** A click at a point on the canvas, or (x null) on nothing at all: Esc. */
  const click = (x: number | null, y = 0) => {
    if (busy) return;
    if (x === null) {
      ray.ray.origin.set(0, -1e4, 0);
      ray.ray.direction.set(0, -1, 0);
    } else aim(x, y);
    const o = focused;

    // The players' own buttons work from anywhere they can be seen.
    const button = hit([...cdPlayer.buttons, ...podPlayer.buttons, ...dvdPlayer.buttons, ...turntable.buttons]);
    if (button && (mode === 'walk' || mode === 'listen' || mode === 'watch')) {
      if (turntable.buttons.includes(button.object as Mesh)) {
        sfx.button();
        return void (cdIn?.kind === 'vinyl' ? act('play') : undefined);
      }
      const owner = [cdPlayer, podPlayer, dvdPlayer].find((p) => p.buttons.includes(button.object as Mesh))!;
      return playerAction(owner, button.object.userData.action as string);
    }

    if (mode === 'game') {
      if (!gameTable.click(ray.ray)) void standUp();
      return;
    }
    // Playing: the screen takes its own clicks; a click anywhere else gets you up.
    if (mode === 'play') return void stopGame();

    if (mode === 'walk') {
      const near = hit([cdPlayer.root, podPlayer.root, turntable.root, dvdPlayer.root, screen.root, gameTable.root, ...ladders.map((l) => l.ladder.mesh)]);
      if (near && gameTable.root.getObjectById(near.object.id) && !climbing) return void sitDown();
      const lever = hit([games.lever, ...games.leaves]);
      if (lever && lever.object === games.lever && (!near || lever.distance < near.distance)) return void sequence(() => games.toggle());
      if (games.inside(camera.position)) {
        const found = games.caseAt(ray);
        if (found && 'game' in found) return void playGame(found.game);
      }
      if (near && partOf(near.object) === 'ladder') {
        const l = ladders.find((x) => x.ladder.mesh === near.object);
        if (l) return void (climbing?.ladder === l.ladder ? stepOff() : climbOn(l));
      }
      if (near && (cdPlayer.root.getObjectById(near.object.id) || podPlayer.root.getObjectById(near.object.id) || turntable.root.getObjectById(near.object.id)) && cdIn) return void goToPlayer('cd');
      if (near && (partOf(near.object) === 'screen' || dvdPlayer.root.getObjectById(near.object.id)) && dvdIn) return void goToPlayer('dvd');
      const slot = slotUnder();
      if (slot) {
        setHover(null);
        void takeDown(slot);
      }
      return;
    }
    if (!o) return;
    const m = o.model;
    const on = hit([m.root]);
    const part = partOf(on?.object);

    const boxed = !!o.box && m === o.box.model;
    switch (mode) {
      case 'held':
        if (on && boxed) void sequence(async () => { await fan(o); mode = 'open'; });
        else if (on) void sequence(async () => { await openIt(o); mode = 'open'; });
        else void sequence(() => putBack(o, true));
        return;
      case 'open':
        if (o.box?.fanned) {
          // Click a case to take it; anywhere else, they go back in the box.
          const c = hit(o.box.cases.map((k) => k.root));
          const i = c?.object.userData.caseIndex as number | undefined;
          if (i !== undefined) void sequence(async () => { await choose(o, i); mode = 'held'; });
          else void sequence(async () => { await gather(o); mode = 'held'; });
          return;
        }
        if (o.kind === 'book') {
          if (on) void sequence(() => turnBook(o, rightHalf(x ?? 0)));
          else void sequence(async () => { await closeIt(o); mode = 'held'; });
          return;
        }
        if (part === 'booklet' && m.booklet) {
          mode = 'booklet';
          void sequence(() => bookletOut(o));
        } else if (part === 'disc' && m.disc?.parent === m.discHome) {
          mode = 'disc';
          void sequence(() => fly(m.disc!, discFor(o), 0.7, 0.03));
        } else void sequence(async () => { await closeIt(o); mode = 'held'; });
        return;
      case 'booklet': {
        const onBooklet = hit([m.booklet!.group]);
        if (onBooklet) void sequence(() => turnBooklet(o, rightHalf(x ?? 0)));
        else void sequence(async () => { await bookletIn(o); mode = 'open'; });
        return;
      }
      case 'disc': {
        const p = o.kind === 'vinyl' ? turntable.root : STATION[o.station as 'music' | 'podcasts' | 'tv'].player?.root;
        if (p && hit([p])) void sequence(() => insert(o));
        else void sequence(async () => { await flyHome(m.disc!, m.discHome!, new Vector3(), new Quaternion(), 0.6); mode = 'open'; });
        return;
      }
      case 'listen':
      case 'watch':
        if (on) {
          void sequence(async () => {
            await Promise.all([moveCamera(focusOf(o), 0.9), fly(m.root, holdFor(o), 0.9, 0.05)]);
            mode = boxed ? 'held' : 'open';
          });
        } else {
          void sequence(async () => {
            mode = 'open';
            await putBack(o, true);
          });
        }
        return;
    }
  };

  // -------------------------------------------------------------------------
  // What the page shows.

  const hints: Record<Mode, (o: Out | null) => string> = {
    walk: () =>
      climbing
        ? 'W and S to climb · A and D to roll the ladder along · click a spine to take it down · Esc to step off'
        : `Drag to look around · WASD to walk · click anything on the shelves · click a ladder to climb it${cdIn || dvdIn ? ' · click a player to go back to it' : ''}`,
    held: (o) =>
      `${o?.kind === 'vinyl' ? 'Click it to slide the record out' : o?.box && o.model === o.box.model ? 'Click it to take the discs out' : 'Click it to open it'} · drag to turn it over · click outside to put it back`,
    open: (o) =>
      o?.box?.fanned
        ? 'Click a disc to take it out · click outside to put them back in the box'
        : o?.kind === 'book'
        ? 'Click the right page to turn forward, the left to turn back · click outside to close it'
        : o?.kind === 'cd'
          ? `Click the booklet to slide it out${o.model.disc?.parent === o.model.discHome ? ' · click the disc to take it out' : ''} · click outside to close the case`
          : o?.kind === 'vinyl'
            ? `${o.model.disc?.parent === o.model.discHome ? 'Click the record to take it out · ' : ''}click outside to slide it back in`
            : `${o?.model.disc?.parent === o?.model.discHome ? 'Click the disc to take it out · ' : ''}click outside to close the case`,
    booklet: () => 'Click the right of the booklet to turn forward, the left to turn back · click outside to slide it back in',
    disc: (o) =>
      `Click the ${o?.kind === 'dvd' ? 'DVD player' : o?.kind === 'vinyl' ? 'record player' : 'CD player'} to play it · click outside to put it back`,
    listen: () => 'Click the case to pick it up · click outside to walk on; the music keeps playing',
    watch: () => 'Click the case to pick it up · click outside to walk on',
    game: () => 'Click one of your pieces, then where it goes · click away from the board to stand up',
    play: () => 'Click the screen, then play with the keyboard or a controller · click away from it to get up',
  };

  const emit = () => {
    const o = focused;
    const d = o?.data;
    const cd = asCd();
    const dvd = dvdIn?.data as Dvd | undefined;
    const dvdDisc = discOf(dvdIn);
    const pages = o?.kind === 'book' && mode === 'open' ? o.model.pages! : mode === 'booklet' ? o?.model.booklet : undefined;
    const state: LibraryState = {
      mode,
      busy,
      hint: hints[mode](o),
      hover:
        mode === 'walk' && hovered
          ? describe(hovered)
          : mode === 'walk' && caseHover
            ? 'game' in caseHover
              ? { kind: caseHover.game.console.name, title: caseHover.game.game.title, subtitle: 'Click to play', place: 'Games room' }
              : { kind: 'Games room', title: caseHover.console.name, subtitle: 'No games on this shelf yet', place: '' }
            : undefined,
      item:
        o && d
          ? {
              kind: o.kind,
              // A box set in hand shows its own name; a case out of it, its disc's.
              title: o.box && o.model !== o.box.model && o.disc ? o.disc.title : d.title,
              subtitle: o.box
                ? o.model !== o.box.model
                  ? d.title
                  : `Box set · ${(d as Dvd).subtitle ?? `${(d as Dvd).discs.length} discs`}`
                : o.kind === 'cd' || o.kind === 'vinyl'
                  ? (d as Cd).artist
                  : (d as Book).author,
            }
          : undefined,
      page: o?.kind === 'book' && mode === 'open' && o.read
        ? o.read.spread === 0
          ? 'Title page'
          : o.read.vol
            ? `Pages ${o.read.spread * 2}–${o.read.spread * 2 + 1} of ${o.read.vol.count - 1}`
            : (o.data as Book).text
              ? 'Fetching the text…'
              : `Pages ${o.read.spread * 2}–${o.read.spread * 2 + 1}`
        : pages
        ? pages.turned === 0
          ? o?.kind === 'book' ? 'Opening page' : 'Cover'
          : pages.turned === pages.leaves.length && o?.kind === 'cd'
            ? 'Back'
            : `Pages ${pages.turned * 2}–${pages.turned * 2 + 1}`
        : undefined,
      cd: cd
        ? {
            title: cd.title,
            by: cd.artist,
            tracks: cd.tracks.map((t) => t.title),
            track,
            playing: !!cdMedia && !cdMedia.paused,
            time: cdMedia?.time ?? 0,
            duration: cdMedia?.duration ?? 0,
            credit: cd.tracks[track]?.credit,
            embedded: !!cd.tracks[track]?.youtube,
          }
        : null,
      dvd: dvd && dvdDisc
        ? {
            title: dvdDisc.title,
            by: dvd.title,
            tracks: [],
            track: 0,
            playing: !!dvdMedia && !dvdMedia.paused,
            time: dvdMedia?.time ?? 0,
            duration: dvdMedia?.duration ?? 0,
            credit: dvdDisc.video?.credit,
            embedded: !!dvdDisc.video?.youtube,
          }
        : null,
      game: mode === 'game' ? gameTable.state() : undefined,
      arcade: playing
        ? { title: playing.gc.game.title, console: playing.gc.console.name, status: playing.status, handheld: playing.model.handheld }
        : undefined,
    };
    const mmss = (s: number) => {
    // Hours once there are any: a lecture or an episode runs past sixty minutes.
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  };
    const cdPaused = !cdMedia || cdMedia.paused;
    const dvdPaused = !dvdMedia || dvdMedia.paused;
    const showOn = cdIn?.station === 'podcasts' ? podPlayer : cdPlayer;
    (showOn === podPlayer ? cdPlayer : podPlayer).display.draw('', 'NO DISC');
    if (cd && cdIn?.kind === 'cd') showOn.display.draw(`${String(track + 1).padStart(2, '0')}  ${mmss(cdMedia?.time ?? 0)}`, cdPaused ? 'PAUSED' : cd.title.toUpperCase());
    else showOn.display.draw('', 'NO DISC');
    if (dvd) dvdPlayer.display.draw(`PLAY  ${mmss(dvdMedia?.time ?? 0)}`, dvdPaused ? 'PAUSED' : (dvdDisc?.title ?? dvd.title).toUpperCase());
    else dvdPlayer.display.draw('', 'NO DISC');
    onState(state);
  };

  const act = (id: string) => {
    switch (id) {
      case 'index':
        return;
      case 'escape':
        // The same as clicking nowhere; on a ladder, it steps you off.
        if (mode !== 'walk') click(null);
        else if (climbing) void stepOff();
        return;
      case 'play':
        if (cdIn) {
          if (!cdMedia) loadTrack(track, true);
          else if (cdMedia.paused) {
            dvdMedia?.pause();
            cdMedia.play();
          } else cdMedia.pause();
        }
        return;
      case 'stop':
        cdMedia?.pause();
        cdMedia?.seek(0);
        emit();
        return;
      case 'next-track':
        loadTrack(track + 1, true);
        return;
      case 'prev-track':
        if (cdMedia && cdMedia.time > 3) cdMedia.seek(0);
        else loadTrack(track - 1, true);
        return;
      case 'dvd-play':
        if (dvdMedia) {
          if (dvdMedia.paused) {
            cdMedia?.pause();
            dvdMedia.play();
          } else dvdMedia.pause();
        }
        return;
      case 'dvd-stop':
        dvdMedia?.pause();
        dvdMedia?.seek(0);
        emit();
        return;
      case 'eject-cd':
        void sequence(() => eject('cd'));
        return;
      case 'eject-dvd':
        void sequence(() => eject('dvd'));
        return;
      case 'game-chess':
      case 'game-checkers':
        gameTable.newGame(id === 'game-chess' ? 'chess' : 'checkers');
        return;
      case 'game-new':
        gameTable.newGame();
        return;
      case 'arcade-test':
        // The last listed game (in development, the test cartridge), for driving it from a test.
        if (mode === 'walk' && games.cases.length) void playGame(games.cases[games.cases.length - 1]);
        return;
      case 'arcade-stop':
        if (mode === 'play') void stopGame();
        return;
      case 'arcade-full':
        void playing?.screen.frame?.requestFullscreen?.().catch(() => undefined);
        return;
      case 'games-door':
        // The lever book, for driving the library from a test.
        if (mode === 'walk') void sequence(() => games.toggle());
        return;
      case 'game-sit':
        if (mode === 'walk' && !climbing) void sitDown();
        return;
      case 'game-leave':
        if (mode === 'game') void standUp();
        return;
      default:
        if (id.startsWith('game-square:') && mode === 'game') gameTable.clickSquare(Number(id.slice(12)));
        else if (id.startsWith('game-level:')) gameTable.setLevel(Math.max(0, Math.min(2, Number(id.slice(11)))) as 0 | 1 | 2);
        else if (id.startsWith('track:')) loadTrack(Number(id.slice(6)), true);
        else if (id.startsWith('take:') && mode === 'walk') {
          // take:<wall>:<index>, for driving the library from a test.
          const [, w, i] = id.split(':');
          void takeDown({ wall: walls[Number(w)], index: Number(i) });
        } else if (id.startsWith('real:') && mode === 'walk') {
          // real:<n>, the collection's n-th item, wherever it stands.
          const k = [...real.keys()][Number(id.slice(5))];
          const [kind, , index] = k.split(':');
          const wall = walls.find((w) => w.kind === kind && real.has(key({ wall: w, index: Number(index) })));
          if (wall) void takeDown({ wall, index: Number(index) });
        } else if ((id === 'click-held' || id === 'click-disc' || id === 'click-player') && focused) {
          // For tests: a click on the middle of what is held, its disc, or the player it goes in.
          const p = new Vector3();
          const target =
            id === 'click-disc'
              ? focused.model.disc!
              : id === 'click-player'
                ? focused.kind === 'vinyl'
                  ? turntable.platter
                  : STATION[focused.station as 'music' | 'podcasts' | 'tv'].player!.root
                : focused.model.root;
          target.getWorldPosition(p);
          if (id === 'click-player') p.y += 0.03;
          p.project(camera);
          const r = canvas.getBoundingClientRect();
          click(r.left + ((p.x + 1) / 2) * r.width, r.top + ((1 - p.y) / 2) * r.height);
        } else if (id.startsWith('view:') && mode === 'walk') {
          // For tests: view:x,y,z,tx,ty,tz puts the eye at a point looking at another.
          const [x, y, z, tx, ty, tz] = id.slice(5).split(',').map(Number);
          const p = poseFrom(new Vector3(x, y, z), new Vector3(tx, ty, tz));
          camera.position.copy(p.position);
          const e = new Euler().setFromQuaternion(p.quaternion, 'YXZ');
          yaw = e.y;
          pitch = e.x;
        } else if (id.startsWith('goto:')) {
          const t = targets[Number(id.slice(5))];
          if (t) void goTo(t);
        } else if (id.startsWith('climb:') && mode === 'walk') {
          void climbOn(ladders[Number(id.slice(6))]);
        } else if (id.startsWith('click:')) {
          const [, cx, cy] = id.split(':').map(Number);
          const r = canvas.getBoundingClientRect();
          click(r.left + cx * r.width, r.top + cy * r.height);
        }
    }
  };


  // -------------------------------------------------------------------------
  // Input: drag to look (or turn what you hold), click, WASD to walk.

  let down: { moved: number } | null = null;
  let hovered: Slot | null = null;
  const keys = new Set<string>();

  const setHover = (at: Slot | null) => {
    // A box set covers several compartments: they all mean the box.
    const slot = at && first(at);
    // Set every time: a player, a ladder or the lever may have left it a pointer.
    canvas.style.cursor = slot ? 'pointer' : '';
    if (hovered && slot && key(hovered) === key(slot)) return;
    if (!hovered && !slot) return;
    if (hovered && !outs.has(key(hovered))) showOnShelf(hovered, true, 0);
    hovered = slot;
    if (slot && !outs.has(key(slot))) showOnShelf(slot, true, 0.03);
    canvas.style.cursor = slot ? 'pointer' : '';
    emit();
  };

  /** What a compartment holds, as the corner shows it while the pointer is over it. */
  const describe = (slot: Slot): LibraryState['hover'] => {
    const found = dataAt(slot);
    if (!found) return undefined;
    const d = found.data;
    if (isBox(d)) {
      return {
        kind: `${(d.format ?? 'dvd').toUpperCase()} box set`,
        title: d.title,
        subtitle: [d.by, d.subtitle].filter(Boolean).join(' · '),
        place: [d.section, d.group].filter((x, i, a) => x && a.indexOf(x) === i).join(' · '),
      };
    }
    const kind = found.kind === 'vinyl' ? 'Single' : found.kind === 'cd' ? 'CD' : 'Book';
    const by = found.kind === 'book' ? (d as Book).author : (d as Cd).artist;
    const n = found.kind === 'book' ? 0 : (d as Cd).tracks.length;
    return {
      kind,
      title: d.title,
      subtitle: [by, n > 1 ? `${n} tracks` : ''].filter(Boolean).join(' · '),
      place: [d.section, d.group].filter((x, i, a) => x && a.indexOf(x) === i).join(' · '),
    };
  };

  const onDown = (ev: PointerEvent) => {
    down = { moved: 0 };
    canvas.setPointerCapture(ev.pointerId);
    canvas.focus({ preventScroll: true });
  };
  const onMove = (ev: PointerEvent) => {
    if (down) {
      const dx = ev.movementX;
      const dy = ev.movementY;
      down.moved += Math.abs(dx) + Math.abs(dy);
      if (busy) return;
      if (mode === 'walk') {
        yaw -= dx * 0.004;
        pitch = Math.max(-1.3, Math.min(1.3, pitch - dy * 0.004));
      } else if ((mode === 'held' || (mode === 'open' && focused?.kind !== 'book')) && focused && focused.model.root.parent === scene) {
        const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const q = new Quaternion().setFromAxisAngle(up, dx * 0.008);
        q.multiply(new Quaternion().setFromAxisAngle(right, dy * 0.008));
        focused.model.root.quaternion.premultiply(q);
      }
      return;
    }
    if (busy) return;
    aim(ev.clientX, ev.clientY);
    if (mode === 'game') {
      canvas.style.cursor = gameTable.over(ray.ray) ? 'pointer' : '';
      return;
    }
    if (mode === 'walk') {
      const near = hit([cdPlayer.root, podPlayer.root, turntable.root, dvdPlayer.root, screen.root, gameTable.root, ...ladders.map((l) => l.ladder.mesh)]);
      if (near && gameTable.root.getObjectById(near.object.id) && !climbing) {
        setHover(null);
        canvas.style.cursor = 'pointer';
        return;
      }
      const lever = hit([games.lever, ...games.leaves]);
      if (lever && lever.object === games.lever) {
        setHover(null);
        canvas.style.cursor = 'pointer';
        return;
      }
      const onCase = games.inside(camera.position) ? games.caseAt(ray) : null;
      const tag = (c: typeof caseHover) => (!c ? '' : 'game' in c ? `g:${c.game.game.title}` : `c:${c.console.id}`);
      if (tag(onCase) !== tag(caseHover)) {
        caseHover = onCase;
        emit();
      }
      if (onCase && 'game' in onCase) {
        canvas.style.cursor = 'pointer';
        return;
      }
      const audioPart = near && (cdPlayer.root.getObjectById(near.object.id) || podPlayer.root.getObjectById(near.object.id) || turntable.root.getObjectById(near.object.id));
      const onPlayer = near && ((cdIn && audioPart) || (dvdIn && !audioPart && partOf(near.object) !== 'ladder'));
      if (near && (onPlayer || partOf(near.object) === 'ladder')) {
        setHover(null);
        canvas.style.cursor = 'pointer';
        return;
      }
      setHover(slotUnder());
    } else if (focused) {
      const st = focused.kind === 'vinyl' ? turntable.root : focused.station === 'here' ? null : STATION[focused.station].player?.root;
      const targets = [focused.model.root, ...(mode === 'disc' && st ? [st] : []), cdPlayer.root, podPlayer.root, dvdPlayer.root, turntable.root];
      canvas.style.cursor = hit(targets) ? 'pointer' : '';
    }
  };
  const onUp = (ev: PointerEvent) => {
    const wasClick = down && down.moved < 6;
    down = null;
    if (wasClick) click(ev.clientX, ev.clientY);
  };
  const onKey = (ev: KeyboardEvent) => {
    if (ev.type === 'keydown') {
      if (ev.code === 'Escape') return act('escape');
      const pages = focused && mode === 'open' && focused.kind === 'book' ? focused.model.pages : mode === 'booklet' ? focused?.model.booklet : null;
      if (pages && focused && (ev.code === 'ArrowRight' || ev.code === 'ArrowLeft')) {
        ev.preventDefault();
        const o = focused;
        void sequence(() =>
          mode === 'booklet' ? turnBooklet(o, ev.code === 'ArrowRight') : o.kind === 'book' ? turnBook(o, ev.code === 'ArrowRight') : turnPage(pages, ev.code === 'ArrowRight'),
        );
        return;
      }
      if (mode === 'walk' && /^(Key[WASD]|Arrow|Shift)/.test(ev.code)) {
        ev.preventDefault();
        keys.add(ev.code);
      }
    } else keys.delete(ev.code);
  };
  const onBlur = () => keys.clear();
  const onWheel = (ev: WheelEvent) => ev.preventDefault();

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('keyup', onKey);
  canvas.addEventListener('blur', onBlur);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // -------------------------------------------------------------------------
  // The loop. It stops when the page is hidden; the music does not.

  const fwd = new Vector3();
  const side = new Vector3();
  let last = performance.now();
  let raf = 0;
  let visible = true;
  let rolling = 0;

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    tweens.update(now / 1000);
    if (mode === 'walk' && !busy && climbing) {
      // On a ladder: W and S climb, A and D roll it along its bay.
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      const c = climbing;
      let up = 0;
      let along = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) up++;
      if (keys.has('KeyS') || keys.has('ArrowDown')) up--;
      if (keys.has('KeyD') || keys.has('ArrowRight')) along++;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) along--;
      if (up || along) {
        c.eye = Math.max(EYE + 0.2, Math.min(c.ladder.topY + 0.2, c.eye + up * 1.6 * dt));
        const s0 = c.s;
        c.s = Math.max(c.ladder.min, Math.min(c.ladder.max, c.s + along * 1.4 * dt));
        if (c.s !== s0) {
          c.ladder.mesh.position.x = c.s;
          rolling += dt;
          if (rolling > 0.22) {
            rolling = 0;
            sfx.roll();
          }
        }
        camera.position.copy(ladderEye(c));
      }
    } else if (mode === 'walk' && !busy) {
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      let f = 0;
      let s = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) f++;
      if (keys.has('KeyS') || keys.has('ArrowDown')) f--;
      if (keys.has('KeyD') || keys.has('ArrowRight')) s++;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) s--;
      if (f || s) {
        const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 8 : 4) * dt;
        fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        side.set(Math.cos(yaw), 0, -Math.sin(yaw));
        const p = camera.position;
        const was = p.clone();
        p.addScaledVector(fwd, f * speed).addScaledVector(side, s * speed);
        // The shelving and its ladders stand out from all four walls. With the
        // games room open, its doorway and its floor are walkable too; a step
        // that leaves every walkable place keeps whichever of its two moves stays in one.
        const m = 1.45;
        const areas: [number, number, number, number][] = [[-W / 2 + m, W / 2 - m, -D / 2 + m, D / 2 - m], ...games.regions()];
        const ok = (x: number, z: number) => areas.some(([x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
        if (!ok(p.x, p.z)) {
          if (ok(p.x, was.z)) p.z = was.z;
          else if (ok(was.x, p.z)) p.x = was.x;
          else if (ok(was.x, was.z)) p.copy(was);
          else {
            p.x = Math.max(-W / 2 + m, Math.min(W / 2 - m, p.x));
            p.z = Math.max(-D / 2 + m, Math.min(D / 2 - m, p.z));
          }
        }
        for (const [cx, cz, hx, hz] of [...solids, ...games.solids()]) {
          const dx = p.x - cx;
          const dz = p.z - cz;
          if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
            if (hx - Math.abs(dx) < hz - Math.abs(dz)) p.x = cx + Math.sign(dx || 1) * hx;
            else p.z = cz + Math.sign(dz || 1) * hz;
          }
        }
      }
    }
    // The platter turns at 33⅓ while a record plays.
    if (cdIn?.kind === 'vinyl' && cdMedia && !cdMedia.paused) turntable.platter.rotation.y -= 3.49 * dt;
    renderer.render(scene, camera);
    if (dvdOverlay || playing) css.render(scene, camera);
    if (visible) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const r = canvas.parentElement!.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    css.setSize(r.width, r.height);
    camera.aspect = r.width / Math.max(r.height, 1);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement!);
  resize();

  const wake = () => {
    if (visible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const onVis = () => {
    visible = document.visibilityState === 'visible';
    wake();
  };
  document.addEventListener('visibilitychange', onVis);

  emit();
  wake();

  return {
    act,
    index,
    setCdHost,
    dispose() {
      cancelAnimationFrame(raf);
      visible = false;
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('message', onTv);
      playing?.screen.dispose();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('keyup', onKey);
      canvas.removeEventListener('blur', onBlur);
      canvas.removeEventListener('wheel', onWheel);
      cdMedia?.dispose();
      cdMedia = null;
      stopVideo();
      css.domElement.remove();
      const textures = new Set<Texture>();
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
          for (const v of Object.values(mat)) if ((v as Texture)?.isTexture) textures.add(v as Texture);
          mat.dispose();
        }
      });
      textures.forEach((t) => t.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
