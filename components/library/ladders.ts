import { BoxGeometry, CylinderGeometry, Group, Mesh, type Material } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Rolling library ladders: one in each bay of shelving, hooked to a brass
// rail at the top of the shelves and leaning out to the floor, so it slides
// along the bay. Click one to climb on; W and S climb, A and D roll it along.
//
// Built in the wall's own frame (x along the wall, y up, z out into the room).

export const LADDER_BASE = 1.0;
const WIDTH = 0.48;
const RUNG = 0.3;

export interface Ladder {
  mesh: Mesh;
  /** The bay it rolls in, along the wall. */
  min: number;
  max: number;
  /** The rail it hangs from. */
  topY: number;
  /** Where the shelf fronts are. */
  front: number;
}

export function ladderGeometry(topY: number) {
  const length = Math.hypot(topY, LADDER_BASE);
  const parts = [];
  for (const x of [-WIDTH / 2, WIDTH / 2]) {
    const rail = new BoxGeometry(0.05, length, 0.06);
    rail.translate(x, length / 2, 0);
    parts.push(rail);
  }
  for (let y = RUNG; y < length - 0.1; y += RUNG) {
    const rung = new CylinderGeometry(0.018, 0.018, WIDTH, 8);
    rung.rotateZ(Math.PI / 2);
    rung.translate(0, y, 0);
    parts.push(rung);
  }
  // The hooks over the rail, and the wheels at the foot.
  for (const x of [-WIDTH / 2, WIDTH / 2]) {
    const hook = new BoxGeometry(0.05, 0.12, 0.12);
    hook.translate(x, length + 0.04, -0.04);
    parts.push(hook);
    const wheel = new CylinderGeometry(0.04, 0.04, 0.03, 12);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(x, 0.04, 0);
    parts.push(wheel);
  }
  return mergeGeometries(parts);
}

/** The ladder's lean: it hooks to the rail at the shelf fronts and stands out at the foot. */
export const leanAngle = (topY: number) => Math.atan2(LADDER_BASE, topY);

export function makeLadder(geometry: ReturnType<typeof ladderGeometry>, material: Material, topY: number, front: number, min: number, max: number): Ladder {
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -leanAngle(topY);
  mesh.position.set((min + max) / 2, 0, front + LADDER_BASE);
  mesh.castShadow = true;
  mesh.userData.part = 'ladder';
  return { mesh, min, max, topY, front };
}

/** How far out from the shelf fronts the ladder is at a height. */
export const ladderOut = (l: Ladder, y: number) => LADDER_BASE * (1 - Math.min(Math.max(y / l.topY, 0), 1));

/** The brass rail a bay's ladder hangs from. */
export function rail(material: Material, from: number, to: number, y: number, z: number) {
  const r = new Mesh(new CylinderGeometry(0.02, 0.02, to - from, 10), material);
  r.rotation.z = Math.PI / 2;
  r.position.set((from + to) / 2, y, z);
  return r;
}

export function railGroup() {
  return new Group();
}
