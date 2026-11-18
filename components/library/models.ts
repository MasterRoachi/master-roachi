import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  PlaneGeometry,
  RingGeometry,
  Shape,
  type Material,
  type Texture,
} from 'three';
import type { Book, Cd, Dvd } from '@/lib/library';
import { makeLeaf, pageBack, pageFront, restLeaf, type Leaf } from './bend';
import {
  type CaseFace,
  boxFront,
  boxSpine,
  bookBack,
  bookCover,
  cdBack,
  cdCover,
  discLabel,
  dvdBack,
  dvdCover,
  canvasTexture,
  lcd,
  pageEdges,
  shade,
  spine,
} from './textures';

// The things in the library, at their real sizes in metres: a jewel case is
// 142 × 125 × 10 mm, a DVD keep case 135 × 190 × 14 mm, a disc 120 mm across.
//
// Every item is built the same way round: centred on its own origin, cover
// towards +z, spine towards -x, so one rotation stands any of them spine-out
// in a compartment. Each has a hinge (the lid, the case's front, the book's
// cover) that opens to the left, and tags its meshes with userData.part so a
// click knows what it landed on.

const plastic = (colour: string, roughness = 0.45) => new MeshStandardMaterial({ color: colour, roughness, metalness: 0 });
// Print is matte: the hall's bright reflections, added to a shiny surface,
// turned black ink grey. Lambert has no reflection to add.
const printed = (map: Texture, _roughness = 0.6) => new MeshLambertMaterial({ map });

function tag(o: Object3D, part: string) {
  o.traverse((m) => {
    m.userData.part = part;
    if ((m as Mesh).isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return o;
}

export type Kind = 'cd' | 'vinyl' | 'dvd' | 'book';

export interface Turnable {
  /** Origin at the spine; the pages lie towards +x. What carries it about. */
  group: Group;
  /** Slid sideways inside `group` while reading, so what is open sits centred. */
  inner: Group;
  leaves: Leaf[];
  /** How many leaves are turned over to the left. */
  turned: number;
  /** z of leaf i lying on the right, and turned over on the left. */
  restZ: (i: number) => number;
  turnedZ: (i: number) => number;
  printed: boolean;
}

export interface Model {
  kind: Kind;
  root: Group;
  /** Slid sideways when open, so the open spread sits centred. */
  shift: Group;
  hinge: Group;
  openAngle: number;
  width: number;
  /** The CD and DVD's disc, and where it sits in the case. */
  disc?: Group;
  discHome?: Object3D;
  /** The CD's booklet, and where it sits in the lid. */
  booklet?: Turnable;
  bookletHome?: Object3D;
  /** The book's turning pages. */
  pages?: Turnable;
  /**
   * The book's ribbon: it lies down the gutter of the page you are on and
   * hangs out at the foot, so a closed book shows where it was left.
   */
  ribbon?: Mesh;
  dispose(): void;
}

function disposer(root: Object3D) {
  return () =>
    root.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        for (const v of Object.values(mat)) if ((v as Texture)?.isTexture) (v as Texture).dispose();
        mat.dispose();
      }
    });
}

// ---------------------------------------------------------------------------
// The disc.

export const DISC_R = 0.06;
const DISC_HOLE = 0.0075;
const DISC_T = 0.0012;

/** A disc lying in the xy plane, label towards +z. */
export function makeDisc(label: Texture) {
  const g = new Group();
  const shape = new Shape();
  shape.absarc(0, 0, DISC_R, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(0, 0, DISC_HOLE, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const body = new Mesh(
    new ExtrudeGeometry(shape, { depth: DISC_T, bevelEnabled: false, curveSegments: 64 }),
    // The data side: a mirror with the rainbow sheen a disc has.
    new MeshPhysicalMaterial({
      color: '#e9ecef',
      metalness: 1,
      roughness: 0.12,
      iridescence: 1,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [180, 620],
    }),
  );
  const face = new Mesh(new RingGeometry(DISC_HOLE * 2.2, DISC_R * 0.985, 64), printed(label, 0.5));
  face.position.z = DISC_T + 0.00005;
  g.add(body, face);
  return tag(g, 'disc') as Group;
}

// ---------------------------------------------------------------------------
// Leaves that turn: the booklet's and the book's.

function turnable(
  count: number,
  width: number,
  height: number,
  gap: number,
  restBase: number,
  turnedBase: number,
  first: Texture | null,
  paper: string,
): Turnable {
  const group = new Group();
  const inner = new Group();
  group.add(inner);
  const leaves: Leaf[] = [];
  const restZ = (i: number) => restBase + (count - 1 - i) * gap;
  const turnedZ = (i: number) => turnedBase + i * gap;
  for (let i = 0; i < count; i++) {
    const leaf = makeLeaf(width, height, pageFront(i === 0 ? first : null, paper), pageBack(null, paper));
    leaf.group.position.z = restZ(i);
    restLeaf(leaf, false);
    inner.add(leaf.group);
    leaves.push(leaf);
  }
  return { group, inner, leaves, turned: 0, restZ, turnedZ, printed: false };
}

/** Puts pictures on a turnable's pages: faces[2i] on leaf i's front, faces[2i+1] on its back. */
export function printLeaves(t: Turnable, faces: Texture[], startAt = 0) {
  t.leaves.forEach((leaf, i) => {
    if (i < startAt) return;
    const f = faces[i * 2];
    const b = faces[i * 2 + 1];
    if (f) {
      (leaf.front.material as Material).dispose();
      leaf.front.material = pageFront(f);
    }
    if (b) {
      (leaf.back.material as Material).dispose();
      leaf.back.material = pageBack(b);
    }
  });
  t.printed = true;
}

// ---------------------------------------------------------------------------
// The jewel case.

export const CASE_W = 0.142;
export const CASE_H = 0.125;
/** The booklet fills the lid, as a real one does: the lid's width less its hinge, and its height. */
export const BOOKLET_W = 0.134;
export const BOOKLET_H = 0.121;
const BASE_T = 0.006;
const HINGE_Z = 0.0078;

export function makeCdCase(cd: Cd): Model {
  const root = new Group();
  const shift = new Group();
  const content = new Group();
  content.position.z = -0.005;
  root.add(shift);
  shift.add(content);

  const dark = plastic('#17181a', 0.35);
  const base = new Mesh(new BoxGeometry(CASE_W, CASE_H, BASE_T), [
    dark,
    printed(spine(shade(cd.colour, 0.82), `${cd.artist} — ${cd.title}`, 32, 560)),
    dark,
    dark,
    plastic('#101112', 0.5),
    printed(cdBack(cd)),
  ]);
  base.position.z = BASE_T / 2;
  const hub = new Mesh(new CylinderGeometry(0.0072, 0.0072, 0.002, 24), plastic('#202124', 0.4));
  hub.rotation.x = Math.PI / 2;
  hub.position.z = BASE_T + 0.0008;
  content.add(tag(base, 'case'), tag(hub, 'case'));

  const hinge = new Group();
  hinge.position.set(-CASE_W / 2, 0, HINGE_Z);
  const clear = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.05,
    transparent: true,
    opacity: 0.16,
    clearcoat: 1,
    depthWrite: false,
  });
  const lid = new Mesh(new BoxGeometry(CASE_W, CASE_H, 0.0022), clear);
  lid.position.set(CASE_W / 2, 0, 0.0032);
  lid.renderOrder = 2;
  tag(lid, 'lid');
  lid.castShadow = false;
  hinge.add(lid);
  content.add(hinge);

  const paper = shade(cd.colour, 0.9);
  const booklet = turnable(4, BOOKLET_W, BOOKLET_H, 0.00035, 0, 0, cdCover(cd), paper);
  tag(booklet.group, 'booklet');
  const bookletHome = new Object3D();
  bookletHome.position.set((CASE_W - BOOKLET_W) / 2, 0, 0.0004);
  hinge.add(bookletHome);
  bookletHome.add(booklet.group);

  const disc = makeDisc(discLabel(cd.title, cd.artist, cd.colour, false, cd.cover));
  const discHome = new Object3D();
  discHome.position.z = BASE_T + 0.0002;
  discHome.add(disc);
  content.add(discHome);

  return {
    kind: 'cd',
    root,
    shift,
    hinge,
    openAngle: -2.55,
    width: CASE_W,
    disc,
    discHome,
    booklet,
    bookletHome,
    dispose: disposer(root),
  };
}

// ---------------------------------------------------------------------------
// The DVD keep case: opens like a book, the disc on the right half's hub.

export const DVD_W = 0.135;
export const DVD_H = 0.19;
/** A slim case, as a box set holds them. */
export const SLIM_T = 0.0092;

export function makeDvdCase(dvd: CaseFace, t = 0.014): Model {
  const w = DVD_W;
  const h = DVD_H;
  const root = new Group();
  const shift = new Group();
  const content = new Group();
  content.position.set(-w / 2, 0, -t / 2);
  root.add(shift);
  shift.add(content);

  const shell = plastic('#121418', 0.55);
  const inside = plastic('#191b20', 0.5);
  const back = new Mesh(new BoxGeometry(w, h, t / 2), [shell, shell, shell, shell, inside, printed(dvdBack({ colour: dvd.colour, title: dvd.title, subtitle: dvd.subtitle }), 0.4)]);
  back.position.set(w / 2, 0, t / 4);
  const spineMesh = new Mesh(new BoxGeometry(0.0016, h, t), [shell, printed(spine(dvd.colour, dvd.title, 48, 680)), shell, shell, shell, shell]);
  spineMesh.position.set(-0.0008, 0, t / 2);
  const hub = new Mesh(new CylinderGeometry(0.008, 0.008, 0.003, 24), plastic('#25272c', 0.4));
  hub.rotation.x = Math.PI / 2;
  hub.position.set(w / 2 + 0.003, 0, t / 2 + 0.0015);
  content.add(tag(back, 'case'), tag(spineMesh, 'case'), tag(hub, 'case'));

  const hinge = new Group();
  hinge.position.set(0, 0, t / 2);
  const front = new Mesh(new BoxGeometry(w, h, t / 2), [shell, shell, shell, shell, printed(dvdCover(dvd), 0.4), inside]);
  front.position.set(w / 2, 0, t / 4);
  hinge.add(tag(front, 'case'));
  content.add(hinge);

  const disc = makeDisc(discLabel(dvd.title, '', dvd.colour, true, dvd.cover));
  const discHome = new Object3D();
  discHome.position.set(w / 2 + 0.003, 0, t / 2 + 0.0004);
  discHome.add(disc);
  content.add(discHome);

  return { kind: 'dvd', root, shift, hinge, openAngle: -Math.PI, width: w, disc, discHome, dispose: disposer(root) };
}

// ---------------------------------------------------------------------------
// A DVD box set: a slipcase, open along one long edge (+x), holding a slim
// case per disc. Built like everything else: centred, front cover towards
// +z, the closed spine towards -x.

export interface BoxSet {
  model: Model;
  /** The cases, in order; each sits at `homes[i]` inside the box. */
  cases: Model[];
  homes: Object3D[];
  thickness: number;
  /** How thin a case is kept while in the box: a CD's jewel case goes in as a slim case. */
  caseScale: number;
  format: 'dvd' | 'cd';
}

const BOX_WALL = 0.002;
/** A slim CD case, as a box set holds them. */
export const SLIM_CD = 0.0054;
const BOX_DIMS = { dvd: { w: 0.146, h: 0.198, per: SLIM_T }, cd: { w: 0.148, h: 0.128, per: SLIM_CD } };

export const boxThickness = (discs: number, format: 'dvd' | 'cd' = 'dvd') => discs * BOX_DIMS[format].per + 0.006;

/** A disc of a CD box set, as an album: what its case, booklet and player need. */
export function boxDiscAsCd(box: Dvd, i: number): Cd {
  const d = box.discs[i];
  return {
    id: `${box.id}-${i}`,
    title: d.title,
    artist: box.by ?? box.title,
    colour: box.colour,
    cover: d.cover ?? box.cover,
    tracks: d.tracks ?? [],
    booklet: [`${box.title}, disc ${i + 1} of ${box.discs.length}.`],
  };
}

/**
 * A collector's box set: a lacquered slipcase, open along one long edge,
 * foiled in gold (boxFront, boxSpine), holding a case per disc: slim DVD
 * keep cases for a lecture series, jewel cases for a podcast's episodes.
 */
export function makeBoxSet(box: Dvd): BoxSet {
  const format = box.format ?? 'dvd';
  const dims = BOX_DIMS[format];
  const n = Math.max(box.discs.length, 1);
  const T = boxThickness(n, format);
  const root = new Group();
  const shift = new Group();
  root.add(shift);
  const spec = {
    title: box.title,
    subtitle: box.subtitle ?? `${n} ${n === 1 ? 'disc' : 'discs'}`,
    by: box.by ?? '',
    colour: box.colour,
    cover: box.cover,
    format,
  };
  // The foil is polished metal; the lacquer and the printed art are matte.
  const foiled = (t: { colour: Texture; foil: Texture; rough: Texture }) =>
    new MeshStandardMaterial({ map: t.colour, metalnessMap: t.foil, metalness: 1, roughnessMap: t.rough, roughness: 1 });
  const lacquer = new MeshStandardMaterial({ color: shade(box.colour, -0.55), roughness: 0.35, metalness: 0.1 });
  const gilt = new MeshStandardMaterial({ color: '#c9a24a', metalness: 1, roughness: 0.3 });
  const front = new Mesh(new BoxGeometry(dims.w, dims.h, BOX_WALL), [lacquer, lacquer, lacquer, lacquer, foiled(boxFront(spec)), lacquer]);
  front.position.z = T / 2 - BOX_WALL / 2;
  const back = new Mesh(new BoxGeometry(dims.w, dims.h, BOX_WALL), [
    lacquer,
    lacquer,
    lacquer,
    lacquer,
    lacquer,
    printed(dvdBack({ colour: box.colour, title: box.title, subtitle: box.discs.map((d, i) => `${i + 1}. ${d.title}`).join('   ') }), 0.5),
  ]);
  back.position.z = -T / 2 + BOX_WALL / 2;
  const spineMesh = new Mesh(new BoxGeometry(BOX_WALL, dims.h, T), [lacquer, foiled(boxSpine(spec, Math.round(T * 4000))), lacquer, lacquer, lacquer, lacquer]);
  spineMesh.position.x = -dims.w / 2 + BOX_WALL / 2;
  const top = new Mesh(new BoxGeometry(dims.w, BOX_WALL, T), lacquer);
  top.position.y = dims.h / 2 - BOX_WALL / 2;
  const bottom = top.clone();
  bottom.position.y = -dims.h / 2 + BOX_WALL / 2;
  // Gilt edging along the open side, where the cases show.
  const lip = new Mesh(new BoxGeometry(0.003, dims.h, 0.003), gilt);
  const lipFront = lip.clone();
  lipFront.position.set(dims.w / 2, 0, T / 2);
  const lipBack = lip.clone();
  lipBack.position.set(dims.w / 2, 0, -T / 2);
  shift.add(tag(front, 'box'), tag(back, 'box'), tag(spineMesh, 'box'), tag(top, 'box'), tag(bottom, 'box'), tag(lipFront, 'box'), tag(lipBack, 'box'));

  const cases: Model[] = [];
  const homes: Object3D[] = [];
  const caseScale = format === 'cd' ? SLIM_CD / 0.0105 : 1;
  box.discs.forEach((d, i) => {
    const c =
      format === 'cd'
        ? makeCdCase(boxDiscAsCd(box, i))
        : makeDvdCase({ id: `${box.id}-${i}`, title: d.title, subtitle: box.title, colour: box.colour, cover: d.cover ?? box.cover, number: i + 1 }, SLIM_T - 0.0006);
    c.root.scale.z = caseScale;
    c.root.traverse((o) => (o.userData.caseIndex = i));
    const home = new Object3D();
    home.position.set(0.0008, 0, -T / 2 + 0.003 + dims.per * (i + 0.5));
    shift.add(home);
    home.add(c.root);
    cases.push(c);
    homes.push(home);
  });
  const model: Model = { kind: 'dvd', root, shift, hinge: new Group(), openAngle: 0, width: dims.w, dispose: disposer(root) };
  return { model, cases, homes, thickness: T, caseScale, format };
}

/** A box set's spine as it stands on the shelf: the same foiled spine. */
export function boxShelfBlock(box: Dvd, thickness: number, height: number, depth: number) {
  const format = box.format ?? 'dvd';
  const n = Math.max(box.discs.length, 1);
  const spec = { title: box.title, subtitle: box.subtitle ?? `${n} discs`, by: box.by ?? '', colour: box.colour, cover: box.cover, format };
  const s = boxSpine(spec, Math.round(thickness * 4000));
  const lacquer = new MeshStandardMaterial({ color: shade(box.colour, -0.55), roughness: 0.35, metalness: 0.1 });
  const face = new MeshStandardMaterial({ map: s.colour, metalnessMap: s.foil, metalness: 1, roughnessMap: s.rough, roughness: 1 });
  return new Mesh(new BoxGeometry(thickness, height, depth), [lacquer, lacquer, lacquer, lacquer, face, lacquer]);
}

// ---------------------------------------------------------------------------
// The book: boards, a page block, and a few leaves on top that turn.

export const BOOK_W = 0.15;
const BOARD_T = 0.0025;

export function makeBook(book: Book, thickness: number, height: number): Model {
  const w = BOOK_W;
  const h = height;
  const t = thickness;
  const root = new Group();
  const shift = new Group();
  const content = new Group();
  content.position.set(-w / 2, 0, -t / 2);
  root.add(shift);
  shift.add(content);

  const board = plastic(shade(book.colour, -0.1), 0.7);
  const endpaper = plastic(shade(book.colour, 0.75), 0.9);
  const edges = printed(pageEdges(), 0.9);

  const backBoard = new Mesh(new BoxGeometry(w, h, BOARD_T), [board, board, board, board, endpaper, printed(bookBack(book), 0.7)]);
  backBoard.position.set(w / 2, 0, BOARD_T / 2);
  const spineMesh = new Mesh(new BoxGeometry(BOARD_T, h, t), [board, printed(spine(book.colour, `${book.title}  ·  ${book.author}`, 64, 900), 0.7), board, board, board, board]);
  spineMesh.position.set(-BOARD_T / 2, 0, t / 2);
  const block = new Mesh(new BoxGeometry(w - 0.006, h - 0.008, Math.max(t - BOARD_T * 2 - 0.002, 0.002)), edges);
  block.position.set((w - 0.006) / 2 + 0.001, 0, t / 2 - 0.001);
  content.add(tag(backBoard, 'book'), tag(spineMesh, 'book'), tag(block, 'book'));

  const hinge = new Group();
  hinge.position.set(0, 0, t);
  const cover = new Mesh(new BoxGeometry(w, h, BOARD_T), [board, board, board, board, printed(bookCover(book), 0.7), endpaper]);
  cover.position.set(w / 2, 0, BOARD_T / 2);
  hinge.add(tag(cover, 'book'));
  content.add(hinge);

  // Leaves under the cover; once turned they lie on the open cover's inside.
  const pages = turnable(6, w - 0.008, h - 0.01, 0.0003, t - BOARD_T + 0.0001 - 6 * 0.0003, t + 0.0004, null, '#f7f3ea');
  tag(pages.group, 'book');
  content.add(pages.group);

  // The ribbon lies on the right-hand page by the gutter, above the third leaf:
  // the page you are on once two leaves are turned (scene.ts keeps a book open
  // that way), and inside the book, its tail out at the foot, once shut.
  const TAIL = 0.035;
  const ribbon = new Mesh(
    new PlaneGeometry(0.007, h - 0.006 + TAIL),
    new MeshLambertMaterial({ color: '#a8862c', side: DoubleSide }),
  );
  ribbon.position.set(0.0075, -TAIL / 2 - 0.003, pages.restZ(2) + 0.00015);
  tag(ribbon, 'book');
  pages.group.add(ribbon);

  return { kind: 'book', root, shift, hinge, openAngle: -Math.PI, width: w, pages, ribbon, dispose: disposer(root) };
}

/** What stands in a compartment until it is taken down: a plain block with its spine. */
export function makeShelfBlock(kind: Kind, data: Cd | Dvd | Book, thickness: number, height: number, depth: number) {
  const tex =
    kind === 'vinyl'
      ? spine(shade(data.colour, 0.7), `${(data as Cd).artist} — ${data.title}`, 24, 640)
      : kind === 'cd'
      ? spine(shade(data.colour, 0.82), `${(data as Cd).artist} — ${data.title}`, 32, 560)
      : kind === 'dvd'
        ? spine(shade(data.colour, -0.3), `${data.title}  ·  ${(data as Dvd).discs.length} DVD`, 64, 900)
        : spine(data.colour, `${data.title}  ·  ${(data as Book).author}`, 64, 900);
  const side = plastic(
    kind === 'book' ? shade(data.colour, -0.1) : kind === 'vinyl' ? shade(data.colour, 0.6) : kind === 'dvd' ? shade(data.colour, -0.5) : '#17181a',
    0.5,
  );
  const m = new Mesh(new BoxGeometry(thickness, height, depth), [side, side, side, side, printed(tex, 0.55), side]);
  return m;
}

// ---------------------------------------------------------------------------
// The players.

export interface Player {
  root: Group;
  tray: Group;
  /** The disc's seat on the tray, lying flat, label up. */
  seat: Object3D;
  trayIn: number;
  trayOut: number;
  display: ReturnType<typeof lcd>;
  /** Clickable buttons; each mesh's userData.action names what it does. */
  buttons: Mesh[];
}

export function makePlayer(opts: { width: number; height: number; depth: number; body: string; display: string }): Player {
  const { width: W, height: H, depth: D } = opts;
  const root = new Group();
  const shell = plastic(opts.body, 0.35);
  const body = new Mesh(new BoxGeometry(W, H, D), [
    shell,
    shell,
    new MeshStandardMaterial({ color: shade(opts.body, 0.08), roughness: 0.25, metalness: 0.6 }),
    shell,
    new MeshStandardMaterial({ color: shade(opts.body, 0.12), roughness: 0.3, metalness: 0.7 }),
    shell,
  ]);
  body.position.y = H / 2;
  root.add(tag(body, 'player'));

  const trayX = -W * 0.2;
  const slot = new Mesh(new BoxGeometry(0.15, 0.012, 0.002), plastic('#08090a', 0.8));
  slot.position.set(trayX, H * 0.62, D / 2 + 0.001);
  root.add(tag(slot, 'player'));
  const tray = new Group();
  const trayIn = D / 2 - 0.085;
  const trayOut = D / 2 + 0.07;
  tray.position.set(trayX, H * 0.62, trayIn);
  const trayMesh = new Mesh(new BoxGeometry(0.148, 0.008, 0.17), plastic('#111214', 0.55));
  const well = new Mesh(new CylinderGeometry(DISC_R + 0.002, DISC_R + 0.002, 0.001, 48), plastic('#0a0a0b', 0.7));
  well.position.y = 0.004;
  tray.add(trayMesh, well);
  tag(tray, 'player');
  const seat = new Object3D();
  seat.position.y = 0.0048;
  seat.rotation.x = -Math.PI / 2;
  tray.add(seat);
  root.add(tray);

  const display = lcd(opts.display);
  const screen = new Mesh(
    new PlaneGeometry(0.12, 0.03),
    new MeshStandardMaterial({ map: display.texture, emissive: '#ffffff', emissiveMap: display.texture, emissiveIntensity: 0.9 }),
  );
  screen.position.set(W * 0.23, H * 0.62, D / 2 + 0.0011);
  root.add(tag(screen, 'player'));

  const buttons: Mesh[] = [];
  const glyph = plastic('#c9c9c4', 0.4);
  (['prev', 'play', 'next', 'stop', 'eject'] as const).forEach((action, i) => {
    const b = new Mesh(new CylinderGeometry(0.0065, 0.0065, 0.004, 20), glyph);
    b.rotation.x = Math.PI / 2;
    b.position.set(W * 0.13 + i * 0.022, H * 0.24, D / 2 + 0.002);
    tag(b, 'player');
    b.userData.action = action;
    root.add(b);
    buttons.push(b);
  });
  return { root, tray, seat, trayIn, trayOut, display, buttons };
}

// ---------------------------------------------------------------------------
// The television, and furniture.

export interface Tv {
  root: Group;
  screen: Mesh;
  idle: Material;
}

export function makeTv(width: number, height: number): Tv {
  const root = new Group();
  const bezel = new Mesh(new BoxGeometry(width + 0.06, height + 0.06, 0.05), plastic('#111214', 0.4));
  bezel.position.z = 0.025;
  const idle = new MeshStandardMaterial({ color: '#08090b', roughness: 0.15, metalness: 0.3 });
  const screen = new Mesh(new PlaneGeometry(width, height), idle);
  screen.position.z = 0.0505;
  root.add(tag(bezel, 'tv'), tag(screen, 'tv'));
  return { root, screen, idle };
}

export function videoMaterial(map: Texture) {
  return new MeshBasicMaterial({ map, toneMapped: false });
}

export function makeTable() {
  const g = new Group();
  const top = new Mesh(new BoxGeometry(1.1, 0.04, 0.65), plastic('#fbfbf9', 0.6));
  top.position.y = 0.73;
  const leg = plastic('#e9e9e5', 0.5);
  for (const [x, z] of [[-0.5, -0.27], [0.5, -0.27], [-0.5, 0.27], [0.5, 0.27]]) {
    const l = new Mesh(new BoxGeometry(0.035, 0.71, 0.035), leg);
    l.position.set(x, 0.355, z);
    g.add(l);
  }
  g.add(top);
  return tag(g, 'table');
}

export const TABLE_TOP = 0.75;

export function makeConsole(width: number, height: number, depth: number) {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(width, height, depth), plastic('#f6f6f3', 0.6));
  body.position.y = height / 2;
  g.add(body);
  return tag(g, 'console');
}

// ---------------------------------------------------------------------------
// The LP: a sleeve, and the record inside it. Built like the others: centred,
// cover towards +z, spine towards -x. The open edge is +x, and "opening" an LP
// slides the record half out of it.

/** Records are 7-inch singles (Master Roachi, 18 Nov 2026): a 180 mm sleeve, a 175 mm disc. */
export const LP = 0.18;
export const RECORD_R = 0.0875;

export function makeRecord(label: Texture) {
  const g = new Group();
  const grooves = canvasTexture(512, 512, (c, w) => {
    const r = w / 2;
    c.fillStyle = '#0b0b0c';
    c.fillRect(0, 0, w, w);
    for (let k = r * 0.36; k < r * 0.98; k += 2.2) {
      c.strokeStyle = (k * 7) % 9 < 1 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.035)';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(r, r, k, 0, Math.PI * 2);
      c.stroke();
    }
  });
  const vinyl = new MeshStandardMaterial({ map: grooves, roughness: 0.25, metalness: 0.2 });
  const body = new Mesh(new CylinderGeometry(RECORD_R, RECORD_R, 0.0018, 64), [vinyl, vinyl, vinyl]);
  body.rotation.x = Math.PI / 2;
  // The cylinder's caps take the texture: lay the grooves on both faces.
  const cap = new Mesh(new CircleGeometry(RECORD_R, 64), vinyl);
  cap.position.z = 0.00091;
  const capBack = cap.clone();
  capBack.rotation.y = Math.PI;
  capBack.position.z = -0.00091;
  const face = new Mesh(new CircleGeometry(0.046, 48), new MeshLambertMaterial({ map: label }));
  face.position.z = 0.00095;
  const hole = new Mesh(new CircleGeometry(0.0036, 16), new MeshBasicMaterial({ color: '#000' }));
  hole.position.z = 0.001;
  g.add(body, cap, capBack, face, hole);
  return tag(g, 'disc') as Group;
}

export function makeLp(cd: Cd): Model {
  const root = new Group();
  const shift = new Group();
  root.add(shift);
  const t = 0.0045;
  const card = new MeshLambertMaterial({ color: shade(cd.colour, 0.6) });
  const sleeve = new Mesh(new BoxGeometry(LP, LP, t), [
    card,
    new MeshLambertMaterial({ map: spine(shade(cd.colour, 0.7), `${cd.artist} — ${cd.title}`, 24, 640) }),
    card,
    card,
    new MeshLambertMaterial({ map: cdCover(cd) }),
    new MeshLambertMaterial({ map: cdBack(cd) }),
  ]);
  shift.add(tag(sleeve, 'case'));
  // The hinge is unused for an LP; it is where the record slides.
  const hinge = new Group();
  shift.add(hinge);
  const record = makeRecord(discLabel(cd.title, cd.artist, cd.colour, false, cd.cover));
  const discHome = new Object3D();
  hinge.add(discHome);
  discHome.add(record);
  return { kind: 'vinyl', root, shift, hinge, openAngle: 0, width: LP, disc: record, discHome, dispose: disposer(root) };
}

// ---------------------------------------------------------------------------
// The record player: a walnut plinth, a platter that turns, and a tonearm.

export interface Turntable {
  root: Group;
  platter: Group;
  /** Where a record sits on the platter, lying flat, label up. */
  seat: Object3D;
  /** The tonearm's pivot. Rotation y: 0 at rest, ARM_PLAY over the record. */
  arm: Group;
  /** The start/stop button; userData.action is 'play'. */
  buttons: Mesh[];
}

/**
 * How far the tonearm turns to play: negative, towards the platter. The arm
 * stands to the platter's right and points forward, so its head swings in
 * over the record, landing about 0.07 m from the spindle: inside a 7-inch
 * single's grooves.
 */
export const ARM_PLAY = -0.8;

export function makeTurntable(m: { walnut: Material; brass: Material }): Turntable {
  const root = new Group();
  const W = 0.46;
  const H = 0.1;
  const D = 0.36;
  const plinth = new Mesh(new BoxGeometry(W, H, D), m.walnut);
  plinth.position.y = H / 2;
  root.add(tag(plinth, 'turntable'));
  const platter = new Group();
  platter.position.set(-0.05, H, 0);
  const mat = new Mesh(new CylinderGeometry(0.152, 0.152, 0.016, 64), [
    new MeshStandardMaterial({ color: '#b9b9b6', metalness: 0.9, roughness: 0.3 }),
    new MeshStandardMaterial({ color: '#141414', roughness: 0.9 }),
    new MeshStandardMaterial({ color: '#141414', roughness: 0.9 }),
  ]);
  mat.position.y = 0.008;
  const spindle = new Mesh(new CylinderGeometry(0.0035, 0.0035, 0.02, 10), m.brass);
  spindle.position.y = 0.022;
  platter.add(tag(mat, 'turntable'), spindle);
  const seat = new Object3D();
  seat.position.y = 0.0175;
  seat.rotation.x = -Math.PI / 2;
  platter.add(seat);
  root.add(platter);

  const arm = new Group();
  arm.position.set(0.17, H, -0.12);
  const post = new Mesh(new CylinderGeometry(0.014, 0.018, 0.05, 16), m.brass);
  post.position.y = 0.025;
  const tube = new Mesh(new CylinderGeometry(0.004, 0.004, 0.23, 8), m.brass);
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0.045, 0.115);
  const head = new Mesh(new BoxGeometry(0.018, 0.008, 0.03), new MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4 }));
  head.position.set(0, 0.04, 0.235);
  const weight = new Mesh(new CylinderGeometry(0.014, 0.014, 0.025, 16), m.brass);
  weight.rotation.x = Math.PI / 2;
  weight.position.set(0, 0.045, -0.03);
  arm.add(post, tube, head, weight);
  tag(arm, 'turntable');
  root.add(arm);

  const button = new Mesh(new CylinderGeometry(0.012, 0.012, 0.006, 20), new MeshStandardMaterial({ color: '#c9c9c4', roughness: 0.4 }));
  button.position.set(-0.19, H + 0.003, 0.15);
  tag(button, 'turntable');
  button.userData.action = 'play';
  root.add(button);
  return { root, platter, seat, arm, buttons: [button] };
}
