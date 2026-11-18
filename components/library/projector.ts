import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
  type Material,
} from 'three';

// The cinema end of the hall: a roll-down screen in the gap in the DVD wall,
// and a projector hung from the vault that throws a beam of light onto it.
// The screen unrolls when a disc goes in and rolls up when it comes out.

export interface Screen {
  root: Group;
  cloth: Mesh;
  /** The weighted bar along the screen's foot. */
  bar: Mesh;
  idle: Material;
  width: number;
  height: number;
  /** 0 rolled up, 1 down. */
  setUnroll(t: number): void;
}

export function makeScreen(width: number, height: number): Screen {
  const root = new Group();
  const housing = new Mesh(new CylinderGeometry(0.09, 0.09, width + 0.3, 24), new MeshStandardMaterial({ color: '#1a1714', roughness: 0.4, metalness: 0.4 }));
  housing.rotation.z = Math.PI / 2;
  const caps = new MeshStandardMaterial({ color: '#b8923e', roughness: 0.35, metalness: 1 });
  for (const s of [-1, 1]) {
    const cap = new Mesh(new CylinderGeometry(0.1, 0.1, 0.04, 24), caps);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = s * (width / 2 + 0.17);
    root.add(cap);
  }
  // The cloth hangs from the roller: its top edge stays put, its foot comes down.
  const geo = new PlaneGeometry(width, height);
  geo.translate(0, -height / 2, 0);
  const idle = new MeshLambertMaterial({ color: '#f4f1ea', side: DoubleSide });
  const cloth = new Mesh(geo, idle);
  cloth.position.set(0, -0.06, 0.02);
  cloth.userData.part = 'screen';
  const bar = new Mesh(new BoxGeometry(width + 0.04, 0.035, 0.035), caps);
  bar.position.z = 0.02;
  root.add(housing, cloth, bar);
  const setUnroll = (t: number) => {
    const k = Math.max(t, 0.001);
    cloth.scale.y = k;
    cloth.visible = t > 0.002;
    bar.position.y = -0.06 - height * t;
  };
  setUnroll(0);
  return { root, cloth, bar, idle, width, height, setUnroll };
}

export interface Projector {
  root: Group;
  lens: Mesh;
  beam: Mesh;
  /** Points the beam from the lens at the screen's four corners, in world space. */
  aim(corners: Vector3[]): void;
  on(lit: boolean): void;
}

export function makeProjector(rod: number): Projector {
  const root = new Group();
  const body = new Mesh(new BoxGeometry(0.42, 0.16, 0.4), new MeshStandardMaterial({ color: '#2a2622', roughness: 0.45, metalness: 0.3 }));
  const trim = new Mesh(new BoxGeometry(0.43, 0.02, 0.41), new MeshStandardMaterial({ color: '#b8923e', roughness: 0.35, metalness: 1 }));
  trim.position.y = -0.07;
  const mount = new Mesh(new CylinderGeometry(0.02, 0.02, rod, 8), new MeshStandardMaterial({ color: '#8a6430', roughness: 0.45, metalness: 0.9 }));
  mount.position.y = 0.08 + rod / 2;
  const lensMat = new MeshStandardMaterial({ color: '#111', emissive: '#fff4dc', emissiveIntensity: 0, roughness: 0.1 });
  const lens = new Mesh(new CylinderGeometry(0.05, 0.055, 0.08, 24), lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0.08, -0.01, -0.22);
  root.add(body, trim, mount, lens);

  // The beam: four faces from the lens to the screen's corners, brighter at
  // the lens and fading out, added onto whatever is behind them.
  const beamGeo = new BufferGeometry();
  beamGeo.setAttribute('position', new BufferAttribute(new Float32Array(12 * 3), 3));
  const colours = new Float32Array(12 * 3);
  for (let f = 0; f < 4; f++) {
    for (let v = 0; v < 3; v++) {
      const near = v === 0 ? 0.045 : 0.006;
      colours.set([near, near * 0.95, near * 0.85], (f * 3 + v) * 3);
    }
  }
  beamGeo.setAttribute('color', new BufferAttribute(colours, 3));
  const beam = new Mesh(
    beamGeo,
    new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }),
  );
  beam.frustumCulled = false;
  beam.visible = false;

  const aim = (corners: Vector3[]) => {
    const origin = new Vector3();
    lens.getWorldPosition(origin);
    const pos = beamGeo.attributes.position as BufferAttribute;
    for (let f = 0; f < 4; f++) {
      const a = corners[f];
      const b = corners[(f + 1) % 4];
      pos.setXYZ(f * 3, origin.x, origin.y, origin.z);
      pos.setXYZ(f * 3 + 1, a.x, a.y, a.z);
      pos.setXYZ(f * 3 + 2, b.x, b.y, b.z);
    }
    pos.needsUpdate = true;
  };
  const on = (lit: boolean) => {
    beam.visible = lit;
    lensMat.emissiveIntensity = lit ? 3 : 0;
  };
  return { root, lens, beam, aim, on };
}
