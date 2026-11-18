// The rules of the two games the chess table plays, chess and checkers, and a
// computer to play them against (his ask, 18 Nov 2026). Pure: no three.js, so
// boardgame.ts draws it and scripts can test it on its own.
//
// The board is 64 squares, index = rank * 8 + file. Rank 0 is the near side,
// where you sit; you play the ivory pieces ('w') and move first in both games.
// A square is dark when (file + rank) is even, as a1 is, and checkers is
// played on the dark squares.

export type Side = 'w' | 'b';
export type GameKind = 'chess' | 'checkers';
export type Level = 0 | 1 | 2;

/** Chess: p n b r q k. Checkers: m (a man) and k (a king). */
export interface Piece {
  side: Side;
  type: string;
}

export interface Move {
  from: number;
  to: number;
  /** The squares whose pieces this move takes. */
  takes: number[];
  /** For a checkers jump: every square it lands on, in order, the last being `to`. */
  path?: number[];
  /** Chess: the piece it becomes (always a queen here). Checkers: crowned. */
  promote?: string;
  /** Chess: the rook's move, when this is castling. */
  rook?: [number, number];
}

export interface Position {
  kind: GameKind;
  board: (Piece | null)[];
  turn: Side;
  /** Chess: castling still allowed, as 'KQkq' letters. */
  castle: string;
  /** Chess: the square a pawn could be taken on en passant, or -1. */
  ep: number;
  /** Half-moves since a capture or a pawn or man moved. */
  quiet: number;
}

export type Outcome = { over: false; check?: boolean } | { over: true; winner: Side | null; reason: string };

const sq = (f: number, r: number) => r * 8 + f;
const fileOf = (s: number) => s & 7;
const rankOf = (s: number) => s >> 3;
const on = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;
const other = (s: Side): Side => (s === 'w' ? 'b' : 'w');

export function start(kind: GameKind): Position {
  const board: (Piece | null)[] = new Array(64).fill(null);
  if (kind === 'chess') {
    const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let f = 0; f < 8; f++) {
      board[sq(f, 0)] = { side: 'w', type: back[f] };
      board[sq(f, 1)] = { side: 'w', type: 'p' };
      board[sq(f, 6)] = { side: 'b', type: 'p' };
      board[sq(f, 7)] = { side: 'b', type: back[f] };
    }
  } else {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        if ((f + r) % 2) continue;
        if (r < 3) board[sq(f, r)] = { side: 'w', type: 'm' };
        if (r > 4) board[sq(f, r)] = { side: 'b', type: 'm' };
      }
  }
  return { kind, board, turn: 'w', castle: kind === 'chess' ? 'KQkq' : '', ep: -1, quiet: 0 };
}

export function play(p: Position, m: Move): Position {
  const board = p.board.slice();
  const piece = board[m.from]!;
  for (const t of m.takes) board[t] = null;
  board[m.from] = null;
  board[m.to] = m.promote ? { side: piece.side, type: m.promote } : piece;
  let castle = p.castle;
  let ep = -1;
  if (p.kind === 'chess') {
    if (m.rook) {
      board[m.rook[1]] = board[m.rook[0]];
      board[m.rook[0]] = null;
    }
    if (piece.type === 'p' && Math.abs(m.to - m.from) === 16) ep = (m.to + m.from) / 2;
    // Moving a king or a rook, or taking a rook at home, ends that castling.
    const lose = (s: number, letters: string) => {
      if (m.from === s || m.to === s) for (const l of letters) castle = castle.replace(l, '');
    };
    lose(sq(4, 0), 'KQ');
    lose(sq(4, 7), 'kq');
    lose(sq(0, 0), 'Q');
    lose(sq(7, 0), 'K');
    lose(sq(0, 7), 'q');
    lose(sq(7, 7), 'k');
  }
  const reset = m.takes.length > 0 || piece.type === 'p' || piece.type === 'm';
  return { kind: p.kind, board, turn: other(p.turn), castle, ep, quiet: reset ? 0 : p.quiet + 1 };
}

// ---------------------------------------------------------------------------
// Chess.

const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Whether `by` attacks square s. */
function attacked(board: (Piece | null)[], s: number, by: Side): boolean {
  const f = fileOf(s);
  const r = rankOf(s);
  const is = (ff: number, rr: number, types: string) => {
    if (!on(ff, rr)) return false;
    const x = board[sq(ff, rr)];
    return !!x && x.side === by && types.includes(x.type);
  };
  const dir = by === 'w' ? -1 : 1;
  if (is(f - 1, r + dir, 'p') || is(f + 1, r + dir, 'p')) return true;
  for (const [df, dr] of KNIGHT) if (is(f + df, r + dr, 'n')) return true;
  for (const [df, dr] of KING) if (is(f + df, r + dr, 'k')) return true;
  const slide = (dirs: number[][], types: string) => {
    for (const [df, dr] of dirs) {
      let ff = f + df;
      let rr = r + dr;
      while (on(ff, rr)) {
        const x = board[sq(ff, rr)];
        if (x) {
          if (x.side === by && types.includes(x.type)) return true;
          break;
        }
        ff += df;
        rr += dr;
      }
    }
    return false;
  };
  return slide(ROOK, 'rq') || slide(BISHOP, 'bq');
}

function kingSquare(board: (Piece | null)[], side: Side) {
  return board.findIndex((x) => x?.side === side && x.type === 'k');
}

export function inCheck(p: Position, side = p.turn) {
  const k = kingSquare(p.board, side);
  return k >= 0 && attacked(p.board, k, other(side));
}

function chessPseudo(p: Position): Move[] {
  const out: Move[] = [];
  const { board, turn } = p;
  const enemy = other(turn);
  for (let s = 0; s < 64; s++) {
    const x = board[s];
    if (!x || x.side !== turn) continue;
    const f = fileOf(s);
    const r = rankOf(s);
    const add = (to: number, takes: number[] = []) => out.push({ from: s, to, takes });
    if (x.type === 'p') {
      const dir = turn === 'w' ? 1 : -1;
      const last = turn === 'w' ? 7 : 0;
      const home = turn === 'w' ? 1 : 6;
      const push = (to: number, takes: number[] = []) =>
        rankOf(to) === last ? out.push({ from: s, to, takes, promote: 'q' }) : add(to, takes);
      if (on(f, r + dir) && !board[sq(f, r + dir)]) {
        push(sq(f, r + dir));
        if (r === home && !board[sq(f, r + 2 * dir)]) add(sq(f, r + 2 * dir));
      }
      for (const df of [-1, 1]) {
        if (!on(f + df, r + dir)) continue;
        const t = sq(f + df, r + dir);
        if (board[t]?.side === enemy) push(t, [t]);
        else if (t === p.ep) add(t, [sq(f + df, r)]);
      }
      continue;
    }
    const steps = (dirs: number[][], slide: boolean) => {
      for (const [df, dr] of dirs) {
        let ff = f + df;
        let rr = r + dr;
        while (on(ff, rr)) {
          const t = sq(ff, rr);
          const y = board[t];
          if (y) {
            if (y.side === enemy) add(t, [t]);
            break;
          }
          add(t);
          if (!slide) break;
          ff += df;
          rr += dr;
        }
      }
    };
    if (x.type === 'n') steps(KNIGHT, false);
    else if (x.type === 'b') steps(BISHOP, true);
    else if (x.type === 'r') steps(ROOK, true);
    else if (x.type === 'q') steps([...ROOK, ...BISHOP], true);
    else if (x.type === 'k') {
      steps(KING, false);
      const rank = turn === 'w' ? 0 : 7;
      const [K, Q] = turn === 'w' ? ['K', 'Q'] : ['k', 'q'];
      if (s === sq(4, rank) && !attacked(board, s, enemy)) {
        if (p.castle.includes(K) && !board[sq(5, rank)] && !board[sq(6, rank)] && !attacked(board, sq(5, rank), enemy))
          out.push({ from: s, to: sq(6, rank), takes: [], rook: [sq(7, rank), sq(5, rank)] });
        if (p.castle.includes(Q) && !board[sq(3, rank)] && !board[sq(2, rank)] && !board[sq(1, rank)] && !attacked(board, sq(3, rank), enemy))
          out.push({ from: s, to: sq(2, rank), takes: [], rook: [sq(0, rank), sq(3, rank)] });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Checkers (English draughts): men move one square diagonally forward, kings
// either way; a capture must be taken when there is one, and a jump goes on
// for as long as it can. A man reaching the far side is crowned, and that ends
// its move.

function checkersMoves(p: Position): Move[] {
  const { board, turn } = p;
  const jumps: Move[] = [];
  const slides: Move[] = [];
  const fwd = turn === 'w' ? 1 : -1;
  const crownRank = turn === 'w' ? 7 : 0;
  for (let s = 0; s < 64; s++) {
    const x = board[s];
    if (!x || x.side !== turn) continue;
    const dirs = x.type === 'k' ? [[1, 1], [-1, 1], [1, -1], [-1, -1]] : [[1, fwd], [-1, fwd]];
    // Every jump sequence from here, depth first. The piece has left its square.
    const walk = (at: number, taken: number[], path: number[]) => {
      let further = false;
      for (const [df, dr] of dirs) {
        const mf = fileOf(at) + df;
        const mr = rankOf(at) + dr;
        const lf = mf + df;
        const lr = mr + dr;
        if (!on(lf, lr)) continue;
        const mid = sq(mf, mr);
        const land = sq(lf, lr);
        const y = board[mid];
        if (!y || y.side === turn || taken.includes(mid)) continue;
        if (board[land] && land !== s) continue;
        further = true;
        const crowned = x.type === 'm' && lr === crownRank;
        if (crowned) jumps.push({ from: s, to: land, takes: [...taken, mid], path: [...path, land], promote: 'k' });
        else walk(land, [...taken, mid], [...path, land]);
      }
      if (!further && taken.length) jumps.push({ from: s, to: at, takes: taken, path });
    };
    walk(s, [], []);
    for (const [df, dr] of dirs) {
      const f = fileOf(s) + df;
      const r = rankOf(s) + dr;
      if (!on(f, r) || board[sq(f, r)]) continue;
      slides.push({ from: s, to: sq(f, r), takes: [], promote: x.type === 'm' && r === crownRank ? 'k' : undefined });
    }
  }
  return jumps.length ? jumps : slides;
}

// ---------------------------------------------------------------------------
// Either game.

export function legalMoves(p: Position): Move[] {
  if (p.kind === 'checkers') return checkersMoves(p);
  return chessPseudo(p).filter((m) => !inCheck(play(p, m), p.turn));
}

export function outcome(p: Position, moves = legalMoves(p)): Outcome {
  if (p.kind === 'chess') {
    const check = inCheck(p);
    if (!moves.length) return check ? { over: true, winner: other(p.turn), reason: 'Checkmate' } : { over: true, winner: null, reason: 'Stalemate' };
    if (p.quiet >= 100) return { over: true, winner: null, reason: 'Fifty moves without a capture' };
    const left = p.board.filter(Boolean) as Piece[];
    if (left.length <= 3 && left.every((x) => 'knb'.includes(x.type))) return { over: true, winner: null, reason: 'Not enough pieces to mate' };
    return { over: false, check };
  }
  if (!moves.length) return { over: true, winner: other(p.turn), reason: p.board.some((x) => x?.side === p.turn) ? 'No moves left' : 'Every piece taken' };
  if (p.quiet >= 80) return { over: true, winner: null, reason: 'Forty moves each without a capture' };
  return { over: false };
}

// ---------------------------------------------------------------------------
// The computer: a negamax search with alpha-beta, as deep as the level asks,
// on material and where the pieces stand. Easy also plays a weaker move now
// and then, so it can be beaten.

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0, m: 100 };
// From ivory's side, rank 0 first; black reads it mirrored.
const PAWN_PST = [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0, -10, -5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5, 10, 25, 25, 10, 5, 5, 10, 10, 20, 30, 30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0];
const KNIGHT_PST = [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30, 5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30, -40, -20, 0, 0, 0, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50];
const CENTRE = (s: number) => {
  const f = fileOf(s);
  const r = rankOf(s);
  return 14 - (Math.abs(3.5 - f) + Math.abs(3.5 - r)) * 2;
};

function evaluate(p: Position): number {
  let score = 0;
  for (let s = 0; s < 64; s++) {
    const x = p.board[s];
    if (!x) continue;
    const mirror = x.side === 'w' ? s : sq(fileOf(s), 7 - rankOf(s));
    let v: number;
    if (p.kind === 'chess') {
      v = VALUE[x.type];
      if (x.type === 'p') v += PAWN_PST[mirror];
      else if (x.type === 'n') v += KNIGHT_PST[mirror];
      else if (x.type === 'b' || x.type === 'q') v += CENTRE(s) / 2;
      else if (x.type === 'k') v += rankOf(mirror) === 0 && fileOf(s) !== 4 && fileOf(s) !== 3 ? 20 : 0;
    } else {
      // A king is worth more than a man; a man is worth more the nearer it is
      // to being crowned, and its own back row is worth keeping.
      v = x.type === 'k' ? 160 : 100 + rankOf(mirror) * 5 + (rankOf(mirror) === 0 ? 8 : 0);
      v += Math.round(CENTRE(s) / 3);
    }
    score += x.side === p.turn ? v : -v;
  }
  return score;
}

const MATE = 100000;

function order(moves: Move[]) {
  return moves.sort((a, b) => b.takes.length - a.takes.length || (b.promote ? 1 : 0) - (a.promote ? 1 : 0));
}

function negamax(p: Position, depth: number, alpha: number, beta: number, ply: number, budget: { nodes: number }): number {
  budget.nodes--;
  const moves = legalMoves(p);
  const end = outcome(p, moves);
  if (end.over) return end.winner === null ? 0 : -MATE + ply;
  if (depth <= 0 || budget.nodes <= 0) return evaluate(p);
  let best = -Infinity;
  for (const m of order(moves)) {
    const v = -negamax(play(p, m), depth - 1, -beta, -alpha, ply + 1, budget);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

/** The computer's move for the side to move, or null when it has none. */
export function think(p: Position, level: Level, random = Math.random): Move | null {
  const moves = order(legalMoves(p));
  if (!moves.length) return null;
  const depth = p.kind === 'chess' ? [1, 2, 3][level] : [2, 4, 6][level];
  const budget = { nodes: p.kind === 'chess' ? 60000 : 120000 };
  const scored = moves.map((m) => ({ m, v: -negamax(play(p, m), depth - 1, -Infinity, Infinity, 1, budget) + random() * 6 }));
  scored.sort((a, b) => b.v - a.v);
  // Easy plays its second- or third-best move a third of the time.
  if (level === 0 && scored.length > 1 && random() < 0.35) return scored[Math.min(scored.length - 1, 1 + Math.floor(random() * 2))].m;
  return scored[0].m;
}

export const squareName = (s: number) => 'abcdefgh'[fileOf(s)] + (rankOf(s) + 1);
export { fileOf, rankOf, sq };
