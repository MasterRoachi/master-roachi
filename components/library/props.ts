import { Box3, Group, Vector3, type Mesh, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Furniture modelled by hand rather than built from boxes: CC0 models from
// Poly Haven, in public/wyggzantium/models/ (LICENCE.txt there credits each).
// Swapped in for the blocky pieces on 18 Nov 2026 (his ask: "so it's not so
// blocky as if made by AI").
//
// Each prop starts as the old procedural piece, so the room is furnished from
// the first frame; the model replaces it once it has loaded, and if it never
// loads (offline, a bad file) the old piece simply stays.

export type PropName =
  | 'Chandelier_03'
  | 'ClassicNightstand_01'
  | 'gaming_console'
  | 'gothic_coffee_table'
  | 'GreenChair_01'
  | 'marble_bust_01'
  | 'Ottoman_01'
  | 'sofa_02'
  | 'sofa_03'
  | 'television_02'
  | 'throw_pillows_01'
  | 'vintage_grandfather_clock_01';

export interface Fit {
  /** Scale it to this height, width (x) or depth (z), in metres; by default its own size. Height and width together stretch it. */
  height?: number;
  width?: number;
  depth?: number;
  /** Turn it about y first: Poly Haven's models face +z, the hall's pieces face -z. */
  turn?: number;
}

const loader = new GLTFLoader();
const cache = new Map<PropName, Promise<Group>>();

const load = (name: PropName) => {
  let p = cache.get(name);
  if (!p) {
    p = loader.loadAsync(`/wyggzantium/models/${name}.glb`).then((g) => {
      g.scene.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      return g.scene;
    });
    cache.set(name, p);
  }
  return p;
};

/**
 * A prop: a group holding `stand_in` now and the model once it arrives,
 * stood on the floor (its lowest point at y 0) and centred on the origin.
 * Every mesh in it is tagged with `part`, for the scene's picking.
 */
export function prop(name: PropName, fit: Fit = {}, standIn?: Object3D, part = 'furniture'): Group {
  const g = new Group();
  if (standIn) g.add(standIn);
  load(name)
    .then((source) => {
      const model = source.clone(true);
      const turn = new Group();
      turn.rotation.y = fit.turn ?? 0;
      turn.add(model);
      const box = new Box3().setFromObject(turn);
      const size = box.getSize(new Vector3());
      const s = fit.height ? fit.height / size.y : fit.width ? fit.width / size.x : fit.depth ? fit.depth / size.z : 1;
      const holder = new Group();
      holder.add(turn);
      // Given both a height and a width, it is stretched to both (a cabinet made wider).
      if (fit.height && fit.width) holder.scale.set(fit.width / size.x, fit.height / size.y, fit.width / size.x);
      else holder.scale.setScalar(s);
      const c = box.getCenter(new Vector3());
      turn.position.set(-c.x, -box.min.y, -c.z);
      holder.traverse((o) => (o.userData.part = part));
      if (standIn) g.remove(standIn);
      g.add(holder);
    })
    .catch(() => {
      // Keep the stand-in.
    });
  return g;
}

/** Starts fetching models before they are placed, so they arrive sooner. */
export const preload = (...names: PropName[]) => names.forEach((n) => void load(n).catch(() => undefined));
