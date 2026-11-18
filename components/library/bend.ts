import {
  BackSide,
  FrontSide,
  Group,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  RepeatWrapping,
  type Material,
  type Texture,
} from 'three';

// A page that bends as it turns.
//
// A leaf is a strip of thin columns hinged at the spine (x = 0), lying flat
// towards +x. Turning it, each column is given its own angle from the spine,
// and the inner columns turn ahead of the outer ones, so the page lifts from
// the spine and the free edge trails behind in a curve, the way paper does.
// Laying the columns end to end at those angles gives the page's shape; at the
// end every column has turned through half a circle and the page lies flat to
// the left, its back face up.
//
// The front and the back are two meshes sharing one geometry, so the bend is
// worked out once. The back's picture is mirrored, so it reads the right way
// round once the page has turned over.

const SEGMENTS = 28;
/** How far the free edge lags the spine, as a share of the turn. */
const LAG = 0.75;

export interface Leaf {
  group: Group;
  geometry: PlaneGeometry;
  front: Mesh;
  back: Mesh;
  width: number;
  turned: boolean;
}

export function makeLeaf(width: number, height: number, front: Material, back: Material): Leaf {
  const geometry = new PlaneGeometry(width, height, SEGMENTS, 1);
  geometry.translate(width / 2, 0, 0);
  const group = new Group();
  const f = new Mesh(geometry, front);
  const b = new Mesh(geometry, back);
  f.castShadow = b.castShadow = true;
  group.add(f, b);
  return { group, geometry, front: f, back: b, width, turned: false };
}

/** Paper, front face. */
export function pageFront(map: Texture | null, colour = '#f7f3ea') {
  return new MeshLambertMaterial({ map, color: map ? '#ffffff' : colour, side: FrontSide });
}

/** Paper, back face: the texture mirrored so it reads once the page is over. */
export function pageBack(map: Texture | null, colour = '#f7f3ea') {
  if (map) {
    map.wrapS = RepeatWrapping;
    map.repeat.x = -1;
    map.offset.x = 1;
  }
  return new MeshLambertMaterial({ map, color: map ? '#ffffff' : colour, side: BackSide });
}

const smooth = (a: number) => a * a * (3 - 2 * a);

/**
 * Shapes the leaf part-way through a turn. `t` runs 0 to 1; `forward` is a
 * turn from right to left. `lift` raises the page off the stack mid-turn.
 */
export function bendLeaf(leaf: Leaf, t: number, forward: boolean, lift = 0.01) {
  const w = leaf.width;
  const pos = leaf.geometry.attributes.position;
  const cols = SEGMENTS + 1;
  const ds = w / SEGMENTS;
  let x = 0;
  let z = 0;
  let prev = 0;
  const angle = (s: number) => {
    const a = Math.min(1, Math.max(0, t * (1 + LAG) - LAG * s));
    return Math.PI * (forward ? smooth(a) : 1 - smooth(a));
  };
  const rise = Math.sin(Math.PI * t) * lift;
  for (let ix = 0; ix < cols; ix++) {
    const s = ix / SEGMENTS;
    const th = angle(s);
    if (ix > 0) {
      const mid = (prev + th) / 2;
      x += Math.cos(mid) * ds;
      z += Math.sin(mid) * ds;
    }
    prev = th;
    // Two rows of vertices: top, then bottom.
    pos.setX(ix, x);
    pos.setZ(ix, z + rise * s);
    pos.setX(ix + cols, x);
    pos.setZ(ix + cols, z + rise * s);
  }
  pos.needsUpdate = true;
  leaf.geometry.computeVertexNormals();
  leaf.geometry.computeBoundingSphere();
}

/** Lays the leaf flat: on the right, or turned over to the left. */
export function restLeaf(leaf: Leaf, turned: boolean) {
  bendLeaf(leaf, 1, turned, 0);
  if (!turned) bendLeaf(leaf, 0, true, 0);
  leaf.turned = turned;
}
