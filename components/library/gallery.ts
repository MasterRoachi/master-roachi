import {
  BoxGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three';
import type { Picture } from '@/lib/library';
import { canvasTexture } from './textures';
import { signTexture, type Materials } from './style';

// The gallery behind the projector screen: framed pictures on the wall in the
// screen's bay, which the screen hides as it rolls down and shows again as it
// rolls up. The middle picture is the portrait, larger, with a brass plaque.
//
// Each picture is data/library.json's `gallery`: a title, an optional plaque
// line, and `src`, an image under public/. A picture whose file is missing,
// or that has no `src` yet, shows a placeholder until one lands; nothing else
// has to change. Only images we are free to show go here (see lib/library.ts).

/** Where the gallery hangs, in the screen's bay: inside the screen's own rectangle. */
export interface GallerySpec {
  /** The screen's width and the top and bottom of its cloth when down. */
  width: number;
  top: number;
  bottom: number;
}

/** What hangs where while there is no picture yet: a dark oil ground, a gold oval, its title. */
function placeholder(title: string, portrait: boolean) {
  return canvasTexture(512, portrait ? 680 : 600, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h / 2, h * 0.7);
    grd.addColorStop(0, '#4a3422');
    grd.addColorStop(1, '#1a1009');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(217,180,95,0.55)';
    g.lineWidth = 6;
    g.beginPath();
    g.ellipse(w / 2, h * 0.43, w * 0.3, h * 0.3, 0, 0, Math.PI * 2);
    g.stroke();
    if (portrait) {
      // A head and shoulders, in shadow.
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.beginPath();
      g.ellipse(w / 2, h * 0.36, w * 0.11, h * 0.1, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(w / 2, h * 0.62, w * 0.22, h * 0.13, 0, Math.PI, 0);
      g.fill();
    }
    g.fillStyle = 'rgba(241,230,204,0.75)';
    g.textAlign = 'center';
    g.font = `400 ${Math.round(w * 0.05)}px 'Palatino Linotype', Palatino, Georgia, serif`;
    g.fillText(title, w / 2, h * 0.86, w * 0.85);
    g.font = `400 ${Math.round(w * 0.035)}px 'Palatino Linotype', Palatino, Georgia, serif`;
    g.fillStyle = 'rgba(217,180,95,0.6)';
    g.fillText('Picture to come', w / 2, h * 0.92);
  });
}

/** A gilt frame round a picture, w × h being the picture. Built facing +z. */
function framed(m: Materials, w: number, h: number, picture: Texture, moulding = 0.09) {
  const g = new Group();
  const canvasMat = new MeshLambertMaterial({ map: picture });
  const pic = new Mesh(new PlaneGeometry(w, h), canvasMat);
  pic.position.z = 0.03;
  g.add(pic);
  const t = moulding;
  const gold = m.gold;
  const dark = new MeshStandardMaterial({ color: '#5a3f12', metalness: 0.8, roughness: 0.5 });
  for (const [x, y, sw, sh] of [
    [0, h / 2 + t / 2, w + t * 2, t],
    [0, -h / 2 - t / 2, w + t * 2, t],
    [-w / 2 - t / 2, 0, t, h],
    [w / 2 + t / 2, 0, t, h],
  ]) {
    const bar = new Mesh(new BoxGeometry(sw, sh, 0.06), gold);
    bar.position.set(x, y, 0.03);
    g.add(bar);
    // A darker inner lip.
    const lip = new Mesh(new BoxGeometry(sw === t ? t * 0.3 : sw - t * 1.4, sh === t ? t * 0.3 : sh - t * 1.4, 0.065), dark);
    lip.position.set(x === 0 ? 0 : x - Math.sign(x) * t * 0.35, y === 0 ? 0 : y - Math.sign(y) * t * 0.35, 0.031);
    g.add(lip);
  }
  g.traverse((o) => {
    o.userData.part = 'picture';
    if ((o as Mesh).isMesh) o.receiveShadow = true;
  });
  return { group: g, material: canvasMat };
}

/** Loads a picture's file into its frame, or keeps the placeholder if there is none. */
function load(src: string | undefined, material: MeshLambertMaterial, fallback: Texture) {
  if (!src) return;
  new TextureLoader().load(
    src,
    (t) => {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
      material.map = t;
      material.needsUpdate = true;
      fallback.dispose();
    },
    undefined,
    () => {},
  );
}

/**
 * Hangs the gallery: the portrait in the middle, and the others two either
 * side, one above the other. Returns a group in the wall's frame, centred on
 * the screen, its back against the wall.
 */
export function buildGallery(m: Materials, pictures: Picture[], spec: GallerySpec) {
  const g = new Group();
  const [portrait, ...rest] = pictures;
  const mid = (spec.top + spec.bottom) / 2;
  const span = spec.top - spec.bottom;
  if (portrait) {
    const h = span * 0.72;
    const w = h * 0.75;
    const ph = placeholder(portrait.title, true);
    const f = framed(m, w, h, ph, 0.11);
    f.group.position.y = mid + span * 0.06;
    g.add(f.group);
    load(portrait.src, f.material, ph);
    // The brass plaque under it.
    const lines = [portrait.title, portrait.caption].filter(Boolean).join('  ·  ');
    const tex = signTexture(lines, 1536, 160, { ground: '#c39b48', ink: '#2a1a0c', border: '#6d5220', size: 64 });
    const plaqueW = Math.max(w * 1.25, 1.5);
    const plaque = new Mesh(new BoxGeometry(plaqueW, plaqueW * (160 / 1536), 0.015), new MeshStandardMaterial({ map: tex, metalness: 0.5, roughness: 0.45 }));
    plaque.position.set(0, f.group.position.y - h / 2 - 0.11 - 0.12, 0.04);
    g.add(plaque);
  }
  const side = (spec.width / 2 + span * 0.72 * 0.375 + 0.15) / 2;
  const sw = Math.min(spec.width / 2 - span * 0.72 * 0.375 - 0.4, 1.0);
  const sh = (span - 0.55) / 2;
  rest.slice(0, 4).forEach((p, i) => {
    const ph = placeholder(p.title, false);
    const f = framed(m, sw, sh, ph, 0.07);
    f.group.position.set((i % 2 ? 1 : -1) * side, i < 2 ? mid + sh / 2 + 0.14 : mid - sh / 2 - 0.14, 0);
    g.add(f.group);
    load(p.src, f.material, ph);
  });
  return g;
}
