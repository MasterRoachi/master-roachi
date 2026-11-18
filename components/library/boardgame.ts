import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  Shape,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Material,
  type Ray,
} from 'three';
import { mergeGeometries as mergeAll } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Merges parts that may or may not be indexed (an extrusion is not, a lathe is). */
const mergeGeometries = (parts: BufferGeometry[]) => mergeAll(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
import { fileOf, legalMoves, outcome, play, rankOf, sq, start, think, type GameKind, type Level, type Move, type Piece, type Position } from './boardrules';
import type { Materials } from './style';
import { ease, type Tweens } from './tween';

// The games table, where the chess table was: a walnut pedestal table with an
// inlaid board, set for chess or for checkers, played against the computer
// (his ask, 18 Nov 2026). Sit down by clicking it. boardrules.ts keeps the
// rules; this draws them and takes the clicks.
//
// In the table's own frame the board is centred on the origin, its top at
// TOP, and you sit at +z: rank 0 is nearest you, file 0 on your left.

const TOP = 0.735;
const TABLE = 0.66;
const SQ = 0.068;
const HALF = SQ * 4;

export interface GameState {
  kind: GameKind;
  level: Level;
  /** One line: whose move it is, or how it ended. */
  status: string;
  over: boolean;
  thinking: boolean;
}

export interface GameTable {
  root: Group;
  /** Where you sit to play, in world space, once the table is placed. */
  seat(): { eye: Vector3; target: Vector3 };
  state(): GameState;
  /** A click while seated. False when it was off the board, which stands you up. */
  click(ray: Ray): boolean;
  /** A click on a square by its number, rank * 8 + file: for tests. */
  clickSquare(s: number): void;
  /** Whether the pointer is over something a click would do something with. */
  over(ray: Ray): boolean;
  newGame(kind?: GameKind): void;
  setLevel(level: Level): void;
}

/** The centre of a square on the table's top, in the table's frame. */
const centre = (s: number, y = TOP) => new Vector3(-HALF + SQ * (fileOf(s) + 0.5), y, HALF - SQ * (rankOf(s) + 0.5));

// ---------------------------------------------------------------------------
// The pieces: turned on a lathe, the knight with a carved head. Sizes follow a
// Staunton set scaled to the squares: the king a little over the square's width tall.

const lathe = (pts: [number, number][], seg = 28) => new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), seg);

const BASE: [number, number][] = [[0, 0], [0.024, 0], [0.025, 0.004], [0.022, 0.008], [0.019, 0.01]];

function knightHead(): BufferGeometry {
  const s = new Shape();
  // The horse's head in profile, facing +x, from the collar up.
  s.moveTo(-0.012, 0);
  s.lineTo(0.014, 0);
  s.quadraticCurveTo(0.012, 0.012, 0.018, 0.022);
  s.lineTo(0.022, 0.03);
  s.quadraticCurveTo(0.02, 0.036, 0.012, 0.035);
  s.lineTo(0.004, 0.037);
  s.quadraticCurveTo(0.004, 0.046, -0.002, 0.05);
  s.lineTo(-0.006, 0.044);
  s.quadraticCurveTo(-0.016, 0.04, -0.016, 0.022);
  s.quadraticCurveTo(-0.016, 0.008, -0.012, 0);
  const g = new ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.002, bevelSegments: 3, curveSegments: 10 });
  g.translate(0, 0, -0.006);
  return g;
}

function pieceGeometries(): Record<string, BufferGeometry> {
  const crossBar = new BoxGeometry(0.012, 0.004, 0.004);
  crossBar.translate(0, 0.093, 0);
  const crossUp = new BoxGeometry(0.004, 0.014, 0.004);
  crossUp.translate(0, 0.093, 0);
  const king = mergeGeometries([
    lathe([...BASE, [0.012, 0.03], [0.009, 0.06], [0.016, 0.064], [0.012, 0.068], [0.015, 0.078], [0.009, 0.084], [0.006, 0.086], [0, 0.087]]),
    crossBar,
    crossUp,
  ]);
  const queenBall = lathe([[0, 0.074], [0.005, 0.075], [0.006, 0.079], [0.004, 0.083], [0, 0.084]], 16);
  const queen = mergeGeometries([lathe([...BASE, [0.011, 0.03], [0.008, 0.056], [0.015, 0.06], [0.011, 0.064], [0.016, 0.072], [0.01, 0.074], [0, 0.074]]), queenBall]);
  const rook = lathe([...BASE, [0.014, 0.016], [0.012, 0.038], [0.016, 0.04], [0.016, 0.052], [0.012, 0.052], [0.012, 0.047], [0, 0.047]]);
  const bishop = lathe([...BASE, [0.011, 0.024], [0.007, 0.046], [0.012, 0.049], [0.008, 0.052], [0.011, 0.062], [0.007, 0.07], [0.003, 0.073], [0.004, 0.076], [0, 0.078]]);
  const pawn = lathe([...BASE, [0.011, 0.016], [0.007, 0.028], [0.011, 0.03], [0.006, 0.032], [0.01, 0.038], [0.008, 0.045], [0, 0.047]]);
  const head = knightHead();
  head.translate(0, 0.022, 0);
  const knight = mergeGeometries([lathe([...BASE, [0.015, 0.016], [0.013, 0.022], [0, 0.022]]), head]);
  // Checkers: a turned disc with a groove, and a king is two of them.
  const man = lathe([[0, 0], [0.027, 0], [0.028, 0.002], [0.028, 0.007], [0.026, 0.0085], [0.02, 0.0085], [0.019, 0.0075], [0, 0.0075]], 36);
  const top = man.clone();
  top.translate(0, 0.0085, 0);
  const crowned = mergeGeometries([man.clone(), top]);
  return { k: king, q: queen, r: rook, b: bishop, p: pawn, n: knight, m: man, K: crowned };
}

// ---------------------------------------------------------------------------
// The table.

function boardTexture(kind: GameKind) {
  const px = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const x = c.getContext('2d')!;
  const scale = px / TABLE;
  const m = (TABLE / 2 - HALF) * scale;
  const s = SQ * scale;
  x.fillStyle = '#2a1a0e';
  x.fillRect(0, 0, px, px);
  for (let f = 0; f < 8; f++)
    for (let r = 0; r < 8; r++) {
      // Canvas rows run from the far side (-z) to the near (+z): rank 7 first.
      const dark = (f + r) % 2 === 0;
      x.fillStyle = dark ? (kind === 'checkers' ? '#3a2a14' : '#4a2c16') : kind === 'checkers' ? '#c9a46a' : '#dcc596';
      x.fillRect(m + f * s, m + (7 - r) * s, s, s);
    }
  x.strokeStyle = '#c9a24a';
  x.lineWidth = 5;
  x.strokeRect(m - 6, m - 6, s * 8 + 12, s * 8 + 12);
  x.lineWidth = 1.5;
  x.strokeRect(m - 14, m - 14, s * 8 + 28, s * 8 + 28);
  if (kind === 'chess') {
    x.fillStyle = '#c9a24a';
    x.font = `600 ${Math.round(m * 0.42)}px Georgia, serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) {
      x.fillText('abcdefgh'[i], m + (i + 0.5) * s, px - m / 2 + 4);
      x.fillText(String(i + 1), m / 2 - 4, m + (7 - i + 0.5) * s);
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function makeGameTable(m: Materials, tweens: Tweens, onChange: () => void): GameTable {
  const root = new Group();
  const topMat = new MeshPhysicalMaterial({ map: boardTexture('chess'), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const top = new Mesh(new BoxGeometry(TABLE, 0.03, TABLE), [m.walnut, m.walnut, topMat, m.walnut, m.walnut, m.walnut]);
  top.position.y = TOP - 0.015;
  top.userData.part = 'gameboard';
  root.add(top);
  // A moulded apron under the top, a turned column and a tripod of feet.
  const apron = new Mesh(new BoxGeometry(TABLE - 0.05, 0.06, TABLE - 0.05), m.walnut);
  apron.position.y = TOP - 0.06;
  root.add(apron);
  const column = new Mesh(lathe([[0, 0.08], [0.05, 0.08], [0.04, 0.14], [0.055, 0.2], [0.032, 0.32], [0.028, 0.5], [0.05, 0.6], [0.06, 0.66], [0, 0.66]], 24), m.walnut);
  root.add(column);
  for (let i = 0; i < 3; i++) {
    const foot = new Mesh(new BoxGeometry(0.05, 0.05, 0.32), m.walnut);
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    foot.rotation.y = a;
    foot.position.set(Math.sin(a) * 0.14, 0.05, Math.cos(a) * 0.14);
    foot.rotation.x = -0.12;
    root.add(foot);
  }
  // A brass gallery round the top's edge.
  const rim = new Mesh(new BoxGeometry(TABLE + 0.012, 0.012, TABLE + 0.012), m.brass);
  rim.position.y = TOP - 0.03;
  root.add(rim);
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.part ??= 'gametable';
    }
  });

  const geos = pieceGeometries();
  const ivory = new MeshPhysicalMaterial({ color: '#efe3c4', roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const ebony = new MeshPhysicalMaterial({ color: '#1c1410', roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18 });
  const redMan = new MeshPhysicalMaterial({ color: '#7a1218', roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2 });

  // Marks on the board: the square you picked, where it can go, the last move.
  const markMat = (colour: string, opacity: number) => new MeshStandardMaterial({ color: colour, transparent: true, opacity, depthWrite: false, roughness: 0.6 });
  const pickedMat = markMat('#e8c45a', 0.55);
  const lastMat = markMat('#c9a24a', 0.28);
  const dotMat = markMat('#2f7a4a', 0.7);
  const ringMat = markMat('#b8332a', 0.75);
  const flat = (g: BufferGeometry) => {
    g.rotateX(-Math.PI / 2);
    return g;
  };
  const squareGeo = flat(new PlaneGeometry(SQ, SQ));
  const dotGeo = flat(new CircleGeometry(SQ * 0.16, 24));
  const ringGeo = flat(new RingGeometry(SQ * 0.36, SQ * 0.46, 32));
  const marks = new Group();
  root.add(marks);

  const pieces = new Group();
  root.add(pieces);

  let pos: Position = start('chess');
  let level: Level = 1;
  let selected = -1;
  let targets: Move[] = [];
  let last: Move | null = null;
  let thinking = false;
  let animating = false;
  /** Bumped on every new game, so a move still being thought about is dropped. */
  let game = 0;
  const bySquare = new Map<number, Mesh>();

  const meshFor = (p: Piece) => {
    const checkers = pos.kind === 'checkers';
    const g = checkers ? (p.type === 'k' ? geos.K : geos.m) : geos[p.type];
    const mat = p.side === 'w' ? ivory : checkers ? redMan : ebony;
    const mesh = new Mesh(g, mat);
    mesh.castShadow = true;
    mesh.userData.part = 'gamepiece';
    // Knights look across the board at each other.
    if (p.type === 'n') mesh.rotation.y = p.side === 'w' ? Math.PI / 2 : -Math.PI / 2;
    return mesh;
  };

  const lay = () => {
    pieces.clear();
    bySquare.clear();
    pos.board.forEach((p, s) => {
      if (!p) return;
      const mesh = meshFor(p);
      mesh.position.copy(centre(s));
      pieces.add(mesh);
      bySquare.set(s, mesh);
    });
    mark();
  };

  const mark = () => {
    marks.clear();
    const put = (geo: BufferGeometry, mat: Material, s: number, lift: number) => {
      const mk = new Mesh(geo, mat);
      mk.position.copy(centre(s, TOP + lift));
      mk.renderOrder = 2;
      marks.add(mk);
    };
    if (last) for (const s of [last.from, last.to]) put(squareGeo, lastMat, s, 0.0004);
    if (selected >= 0) put(squareGeo, pickedMat, selected, 0.0006);
    for (const t of targets) put(t.takes.length ? ringGeo : dotGeo, t.takes.length ? ringMat : dotMat, t.to, 0.0008);
  };

  const squareUnder = (ray: Ray): number => {
    root.updateWorldMatrix(true, false);
    const inv = root.matrixWorld.clone().invert();
    const local = ray.clone().applyMatrix4(inv);
    if (Math.abs(local.direction.y) < 1e-6) return -1;
    const t = (TOP - local.origin.y) / local.direction.y;
    if (t < 0) return -1;
    const p = local.origin.clone().addScaledVector(local.direction, t);
    const f = Math.floor((p.x + HALF) / SQ);
    const r = Math.floor((HALF - p.z) / SQ);
    if (f < 0 || f > 7 || r < 0 || r > 7) return Math.abs(p.x) < TABLE / 2 && Math.abs(p.z) < TABLE / 2 ? -2 : -1;
    return sq(f, r);
  };

  /** Slides (or for a knight or a jump, hops) a piece along its path, and takes what it takes. */
  const animate = async (mv: Move) => {
    const mesh = bySquare.get(mv.from);
    if (!mesh) return;
    const hops = mv.path?.length ? [mv.from, ...mv.path] : [mv.from, mv.to];
    const lift = pos.kind === 'checkers' || pos.board[mv.from]?.type === 'n' ? 0.04 : 0.012;
    for (let i = 1; i < hops.length; i++) {
      const a = centre(hops[i - 1]);
      const b = centre(hops[i]);
      await tweens.run(0.32, (t) => {
        mesh.position.lerpVectors(a, b, t);
        mesh.position.y = TOP + Math.sin(Math.PI * t) * lift;
      });
      // A checkers jump takes each piece as it passes over it.
      const over = pos.kind === 'checkers' ? mv.takes[i - 1] : undefined;
      if (over !== undefined) void vanish(bySquare.get(over));
    }
    if (pos.kind === 'chess') for (const s of mv.takes) void vanish(bySquare.get(s));
    if (mv.rook) {
      const rook = bySquare.get(mv.rook[0]);
      const a = centre(mv.rook[0]);
      const b = centre(mv.rook[1]);
      if (rook) await tweens.run(0.3, (t) => rook.position.lerpVectors(a, b, t));
    }
  };
  const vanish = (mesh: Mesh | undefined) =>
    mesh
      ? tweens.run(
          0.25,
          (t) => {
            mesh.scale.setScalar(1 - t);
            mesh.position.y = TOP + t * 0.03;
          },
          ease.in,
        )
      : Promise.resolve();

  const status = (): string => {
    const end = outcome(pos);
    if (end.over) return end.winner === 'w' ? `${end.reason}: you win` : end.winner === 'b' ? `${end.reason}: the computer wins` : `${end.reason}: a draw`;
    if (thinking) return 'The computer is thinking…';
    if (pos.turn === 'w') {
      const forced = pos.kind === 'checkers' && legalMoves(pos).some((x) => x.takes.length);
      return end.check ? 'Check: your move' : forced ? 'Your move: you must jump' : 'Your move';
    }
    return 'The computer’s move';
  };

  const commit = async (mv: Move) => {
    animating = true;
    selected = -1;
    targets = [];
    mark();
    const g = game;
    await animate(mv);
    if (g !== game) return;
    pos = play(pos, mv);
    last = mv;
    animating = false;
    lay();
    onChange();
    if (pos.turn === 'b' && !outcome(pos).over) reply();
  };

  const reply = () => {
    thinking = true;
    onChange();
    const g = game;
    // Let the page draw "thinking" before the search holds the thread.
    setTimeout(() => {
      if (g !== game) return;
      const mv = think(pos, level);
      thinking = false;
      if (mv) void commit(mv);
      else onChange();
    }, 120);
  };

  const newGame = (kind: GameKind = pos.kind) => {
    game++;
    pos = start(kind);
    selected = -1;
    targets = [];
    last = null;
    thinking = false;
    animating = false;
    topMat.map?.dispose();
    topMat.map = boardTexture(kind);
    topMat.needsUpdate = true;
    lay();
    onChange();
  };


  const clickSquare = (s: number) => {
    if (thinking || animating || pos.turn !== 'w' || outcome(pos).over) return;
    const to = targets.filter((t) => t.to === s).sort((a, b) => b.takes.length - a.takes.length)[0];
    if (to) return void commit(to);
    const mine = legalMoves(pos).filter((x) => x.from === s);
    if (mine.length && s !== selected) {
      selected = s;
      targets = mine;
    } else {
      selected = -1;
      targets = [];
    }
    mark();
  };

  lay();

  return {
    root,
    seat() {
      root.updateWorldMatrix(true, false);
      return { eye: root.localToWorld(new Vector3(0, 1.2, 0.6)), target: root.localToWorld(new Vector3(0, TOP, 0.03)) };
    },
    state: () => ({ kind: pos.kind, level, status: status(), over: outcome(pos).over, thinking }),
    click(ray) {
      const s = squareUnder(ray);
      if (s === -1) return false;
      if (s >= 0) clickSquare(s);
      return true;
    },
    clickSquare,
    over(ray) {
      const s = squareUnder(ray);
      if (s < 0 || thinking || animating || pos.turn !== 'w') return false;
      return targets.some((t) => t.to === s) || legalMoves(pos).some((x) => x.from === s);
    },
    newGame,
    setLevel(l) {
      level = l;
      onChange();
    },
  };
}
