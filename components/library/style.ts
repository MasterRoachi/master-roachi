import {
  CanvasTexture,
  MeshLambertMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';

// The library's Byzantine dress: marble revetment and an opus sectile floor,
// gold mosaic in the arches and the dome, a lapis vault with gold stars,
// walnut shelving and gilt. Every surface is drawn on a canvas here, so there
// are no image files to source or license.

function canvas(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  return c;
}

function texture(c: HTMLCanvasElement, repeatX = 1, repeatY = 1, colour = true): Texture {
  const t = new CanvasTexture(c);
  if (colour) t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
}

/** A seeded random, so the patterns come out the same every visit. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Marble: a ground with soft clouds and a few long veins. */
function marble(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, vein: string, seed: number) {
  const r = rng(seed);
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = base;
  g.fillRect(x, y, w, h);
  g.globalAlpha = 0.06;
  for (let i = 0; i < 40; i++) {
    g.fillStyle = r() > 0.5 ? '#ffffff' : vein;
    g.beginPath();
    g.ellipse(x + r() * w, y + r() * h, (0.1 + r() * 0.3) * w, (0.05 + r() * 0.2) * h, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = vein;
  for (let i = 0; i < 9; i++) {
    g.globalAlpha = 0.15 + r() * 0.25;
    g.lineWidth = 0.6 + r() * 1.8;
    g.beginPath();
    let px = x + r() * w;
    let py = y;
    g.moveTo(px, py);
    while (py < y + h) {
      px += (r() - 0.5) * w * 0.12;
      py += h * (0.04 + r() * 0.06);
      g.lineTo(px, py);
    }
    g.stroke();
  }
  g.restore();
}

const PORPHYRY = '#6a1f28';
const VERDE = '#2e5240';
const CREAM = '#e8dcc4';
const GOLD = '#c9a24a';

/** Opus sectile: one 4 m square of the floor, with a porphyry roundel ringed in verde. */
export function floorTexture(repeatX: number, repeatY: number) {
  const c = canvas(1024, 1024, (g, w, h) => {
    marble(g, 0, 0, w, h, CREAM, '#9b8f7a', 1);
    // A border of porphyry and verde bands.
    const band = w * 0.06;
    g.fillStyle = PORPHYRY;
    g.fillRect(0, 0, w, band);
    g.fillRect(0, h - band, w, band);
    g.fillRect(0, 0, band, h);
    g.fillRect(w - band, 0, band, h);
    marble(g, band, band, w - band * 2, band * 0.5, VERDE, '#173024', 2);
    marble(g, band, h - band * 1.5, w - band * 2, band * 0.5, VERDE, '#173024', 3);
    marble(g, band, band, band * 0.5, h - band * 2, VERDE, '#173024', 4);
    marble(g, w - band * 1.5, band, band * 0.5, h - band * 2, VERDE, '#173024', 5);
    // The roundel, and a lozenge in each corner.
    g.save();
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
    g.clip();
    marble(g, 0, 0, w, h, VERDE, '#173024', 6);
    g.restore();
    g.save();
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.24, 0, Math.PI * 2);
    g.clip();
    marble(g, 0, 0, w, h, PORPHYRY, '#3b0f15', 7);
    g.restore();
    for (const [cx, cy] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) {
      g.save();
      g.translate(cx * w, cy * h);
      g.rotate(Math.PI / 4);
      g.beginPath();
      g.rect(-w * 0.05, -w * 0.05, w * 0.1, w * 0.1);
      g.clip();
      marble(g, -w * 0.1, -w * 0.1, w * 0.2, w * 0.2, PORPHYRY, '#3b0f15', 8 + cx * 10 + cy);
      g.restore();
    }
    // The inlay's dark joints.
    g.strokeStyle = 'rgba(30,20,10,0.55)';
    g.lineWidth = 3;
    g.strokeRect(band, band, w - band * 2, h - band * 2);
    for (const r of [0.24, 0.3]) {
      g.beginPath();
      g.arc(w / 2, h / 2, w * r, 0, Math.PI * 2);
      g.stroke();
    }
  });
  return texture(c, repeatX, repeatY);
}

/** Marble revetment for the walls: book-matched panels in a gilt frame. */
export function wallTexture(repeatX: number, repeatY: number) {
  const c = canvas(512, 512, (g, w, h) => {
    marble(g, 0, 0, w / 2, h, '#d9ccb2', '#8d7f66', 11);
    g.save();
    g.translate(w, 0);
    g.scale(-1, 1);
    marble(g, 0, 0, w / 2, h, '#d9ccb2', '#8d7f66', 11);
    g.restore();
    g.strokeStyle = GOLD;
    g.lineWidth = 6;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.strokeStyle = 'rgba(60,40,20,0.4)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w / 2, 0);
    g.lineTo(w / 2, h);
    g.stroke();
  });
  return texture(c, repeatX, repeatY);
}

/** Gold mosaic: tesserae of slightly different golds, set at slight angles. */
export function goldMosaic(repeatX: number, repeatY: number) {
  const c = canvas(512, 512, (g, w, h) => {
    const r = rng(21);
    g.fillStyle = '#3a2a12';
    g.fillRect(0, 0, w, h);
    const s = 9;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        const l = 48 + r() * 22;
        g.fillStyle = `hsl(${40 + r() * 8}, ${60 + r() * 20}%, ${l}%)`;
        g.save();
        g.translate(x + s / 2, y + s / 2);
        g.rotate((r() - 0.5) * 0.2);
        g.fillRect(-s / 2 + 0.8, -s / 2 + 0.8, s - 1.6, s - 1.6);
        g.restore();
      }
    }
  });
  return texture(c, repeatX, repeatY);
}

/** A lapis vault scattered with gold stars, as at Ravenna. */
export function starVault(repeatX: number, repeatY: number) {
  const c = canvas(512, 512, (g, w, h) => {
    const r = rng(31);
    g.fillStyle = '#16245a';
    g.fillRect(0, 0, w, h);
    const s = 8;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        g.fillStyle = `hsl(${222 + r() * 10}, ${55 + r() * 15}%, ${18 + r() * 10}%)`;
        g.fillRect(x + 0.7, y + 0.7, s - 1.4, s - 1.4);
      }
    }
    const star = (cx: number, cy: number, rad: number) => {
      g.fillStyle = '#e8c56a';
      g.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rr = i % 2 ? rad * 0.38 : rad;
        g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.fill();
    };
    for (let i = 0; i < 18; i++) star(r() * w, r() * h, 6 + r() * 7);
  });
  return texture(c, repeatX, repeatY);
}

/** The drum under the dome: gold, with arched windows. Returns the picture and the windows' glow. */
export function drumTextures(windows: number) {
  const draw = (glow: boolean) =>
    canvas(2048, 256, (g, w, h) => {
      if (!glow) {
        const r = rng(41);
        g.fillStyle = '#3a2a12';
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 9) {
          for (let x = 0; x < w; x += 9) {
            g.fillStyle = `hsl(${40 + r() * 8}, ${65 + r() * 15}%, ${48 + r() * 20}%)`;
            g.fillRect(x + 0.8, y + 0.8, 7.4, 7.4);
          }
        }
      } else {
        g.fillStyle = '#000';
        g.fillRect(0, 0, w, h);
      }
      const ww = w / windows;
      for (let i = 0; i < windows; i++) {
        const cx = (i + 0.5) * ww;
        const wide = ww * 0.32;
        g.fillStyle = glow ? '#fff3d6' : '#f6ecd2';
        g.beginPath();
        g.moveTo(cx - wide / 2, h * 0.85);
        g.lineTo(cx - wide / 2, h * 0.35);
        g.arc(cx, h * 0.35, wide / 2, Math.PI, 0);
        g.lineTo(cx + wide / 2, h * 0.85);
        g.closePath();
        g.fill();
      }
    });
  return { map: texture(draw(false)), glow: texture(draw(true)) };
}

/** Walnut, for the shelving and the table. */
export function woodTexture(repeatX: number, repeatY: number) {
  const c = canvas(256, 256, (g, w, h) => {
    const r = rng(51);
    g.fillStyle = '#3d2618';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = r() > 0.5 ? 'rgba(20,10,4,0.35)' : 'rgba(120,80,45,0.2)';
      g.lineWidth = 0.5 + r() * 2;
      g.beginPath();
      const y = r() * h;
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 12, w * 0.7, y + (r() - 0.5) * 12, w, y + (r() - 0.5) * 6);
      g.stroke();
    }
  });
  return texture(c, repeatX, repeatY);
}

/** Herringbone parquet in oak, one 1.2 m square. */
export function parquetTexture(repeatX: number, repeatY: number) {
  const c = canvas(1024, 1024, (g, w, h) => {
    const r = rng(61);
    g.fillStyle = '#5a3a20';
    g.fillRect(0, 0, w, h);
    const L = 160;
    const T = 40;
    for (let row = -2; row < 16; row++) {
      for (let col = -2; col < 16; col++) {
        for (const flip of [0, 1]) {
          g.save();
          const x = col * T * 2 + (flip ? T : 0);
          const y = row * L * 0.5 + col * T * 0.0 + (flip ? T : 0);
          g.translate(x, y);
          g.rotate(flip ? -Math.PI / 4 : Math.PI / 4);
          const l = 24 + r() * 10;
          g.fillStyle = `hsl(${24 + r() * 6}, ${38 + r() * 14}%, ${l}%)`;
          g.fillRect(0, 0, L, T);
          g.strokeStyle = 'rgba(40,22,10,0.55)';
          g.lineWidth = 2;
          g.strokeRect(0, 0, L, T);
          g.globalAlpha = 0.15;
          g.strokeStyle = '#2a170a';
          for (let k = 0; k < 4; k++) {
            g.beginPath();
            const yy = 6 + r() * (T - 12);
            g.moveTo(0, yy);
            g.bezierCurveTo(L * 0.3, yy + (r() - 0.5) * 6, L * 0.7, yy + (r() - 0.5) * 6, L, yy);
            g.stroke();
          }
          g.restore();
        }
      }
    }
  });
  return texture(c, repeatX, repeatY);
}

/**
 * The double-headed eagle: the Palaiologan eagle, public domain, cut out of
 * its red ground as a white shape (public/wyggzantium/eagle-licence.txt says
 * whose it is). Loaded once and tinted wherever it is drawn.
 */
let eagle: Promise<HTMLImageElement> | null = null;
function eagleImage() {
  eagle ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = '/wyggzantium/eagle.png';
  });
  return eagle;
}

/** Draws the eagle in a colour, centred at (x, y), `w` wide. */
function drawEagle(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, colour: string) {
  const h = (w * img.height) / img.width;
  const tint = document.createElement('canvas');
  tint.width = Math.ceil(w);
  tint.height = Math.ceil(h);
  const t = tint.getContext('2d')!;
  t.drawImage(img, 0, 0, w, h);
  t.globalCompositeOperation = 'source-in';
  t.fillStyle = colour;
  t.fillRect(0, 0, w, h);
  g.drawImage(tint, x - w / 2, y - h / 2);
}

/**
 * The great rug in the middle of the floor: a deep red field, a gold and
 * dark-red border with a running band of lozenges, corner medallions, and the
 * double-headed eagle filling the centre. Drawn as one picture, `w` × `d` m,
 * upright to someone facing the screen.
 */
export function rugTexture(w: number, d: number) {
  const gold = '#d7ac4f';
  const deep = '#5c0d12';
  const px = 2048;
  const py = Math.round((px * d) / w);
  const c = canvas(px, py, (g, W, H) => {
    const r = rng(91);
    g.fillStyle = deep;
    g.fillRect(0, 0, W, H);
    // The pile.
    for (let i = 0; i < 60000; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.05)';
      g.fillRect(r() * W, r() * H, 3, 3);
    }
    const b = W * 0.06;
    // The border: gold rules either side of a dark band set with lozenges.
    const rule = (inset: number, width: number, colour: string) => {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    };
    g.fillStyle = '#3a0709';
    g.fillRect(b * 0.35, b * 0.35, W - b * 0.7, b * 0.75);
    g.fillRect(b * 0.35, H - b * 1.1, W - b * 0.7, b * 0.75);
    g.fillRect(b * 0.35, b * 0.35, b * 0.75, H - b * 0.7);
    g.fillRect(W - b * 1.1, b * 0.35, b * 0.75, H - b * 0.7);
    rule(b * 0.3, 10, gold);
    rule(b * 1.15, 10, gold);
    rule(b * 1.35, 3, gold);
    const loz = (x: number, y: number, s: number) => {
      g.save();
      g.translate(x, y);
      g.rotate(Math.PI / 4);
      g.fillStyle = gold;
      g.fillRect(-s / 2, -s / 2, s, s);
      g.fillStyle = '#3a0709';
      g.fillRect(-s / 4, -s / 4, s / 2, s / 2);
      g.restore();
    };
    const mid = b * 0.725;
    const step = b * 0.9;
    for (let x = b * 1.5; x < W - b * 1.2; x += step) {
      loz(x, mid, b * 0.32);
      loz(x, H - mid, b * 0.32);
    }
    for (let y = b * 1.5; y < H - b * 1.2; y += step) {
      loz(mid, y, b * 0.32);
      loz(W - mid, y, b * 0.32);
    }
    // Corner medallions inside the border.
    for (const [x, y] of [[b * 2.6, b * 2.6], [W - b * 2.6, b * 2.6], [b * 2.6, H - b * 2.6], [W - b * 2.6, H - b * 2.6]]) {
      g.strokeStyle = gold;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(x, y, b * 0.8, 0, Math.PI * 2);
      g.stroke();
      loz(x, y, b * 0.5);
    }
    // A great roundel for the eagle, ringed twice.
    g.strokeStyle = gold;
    g.lineWidth = 12;
    g.beginPath();
    g.arc(W / 2, H / 2, H * 0.37, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 4;
    g.beginPath();
    g.arc(W / 2, H / 2, H * 0.35, 0, Math.PI * 2);
    g.stroke();
  });
  const t = texture(c);
  t.wrapS = t.wrapT = 1001; // ClampToEdge
  // The eagle lands when its picture has loaded.
  void eagleImage().then((img) => {
    const g = c.getContext('2d')!;
    drawEagle(g, img, c.width / 2, c.height / 2 + c.height * 0.01, c.height * 0.62, gold);
    t.needsUpdate = true;
  });
  return t;
}

/** The ceiling: walnut coffers between deep beams, plain wood, no ornament. */
export function cofferTexture(repeatX: number, repeatY: number) {
  const c = canvas(512, 512, (g, w, h) => {
    const r = rng(81);
    const grain = (x: number, y: number, ww: number, hh: number, base: string, vertical: boolean) => {
      g.save();
      g.beginPath();
      g.rect(x, y, ww, hh);
      g.clip();
      g.fillStyle = base;
      g.fillRect(x, y, ww, hh);
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = r() > 0.5 ? 'rgba(20,10,4,0.3)' : 'rgba(150,100,60,0.12)';
        g.lineWidth = 0.6 + r() * 1.6;
        g.beginPath();
        if (vertical) {
          const xx = x + r() * ww;
          g.moveTo(xx, y);
          g.bezierCurveTo(xx + (r() - 0.5) * 10, y + hh * 0.3, xx + (r() - 0.5) * 10, y + hh * 0.7, xx, y + hh);
        } else {
          const yy = y + r() * hh;
          g.moveTo(x, yy);
          g.bezierCurveTo(x + ww * 0.3, yy + (r() - 0.5) * 10, x + ww * 0.7, yy + (r() - 0.5) * 10, x + ww, yy);
        }
        g.stroke();
      }
      g.restore();
    };
    const beam = w * 0.12;
    // The coffer's recessed panel.
    grain(beam, beam, w - beam * 2, h - beam * 2, '#4a2e1b', false);
    // The beams round it, lit on one side and in shade on the other.
    grain(0, 0, w, beam, '#3a2414', false);
    grain(0, h - beam, w, beam, '#3a2414', false);
    grain(0, 0, beam, h, '#3a2414', true);
    grain(w - beam, 0, beam, h, '#3a2414', true);
    // The mouldings stepping down into the coffer.
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.lineWidth = 8;
    g.strokeRect(beam + 4, beam + 4, w - beam * 2 - 8, h - beam * 2 - 8);
    g.strokeStyle = 'rgba(255,220,170,0.12)';
    g.lineWidth = 3;
    g.strokeRect(beam - 2, beam - 2, w - beam * 2 + 4, h - beam * 2 + 4);
  });
  return texture(c, repeatX, repeatY);
}

/** A sign drawn on a canvas: gilt letters on a ground. Width and height in pixels. */
export function signTexture(text: string, w: number, h: number, opts: { ground: string; ink: string; border?: string; size?: number; font?: string; spacing?: number }) {
  const c = canvas(w, h, (g) => {
    g.fillStyle = opts.ground;
    g.fillRect(0, 0, w, h);
    if (opts.border) {
      g.strokeStyle = opts.border;
      g.lineWidth = Math.max(2, h * 0.05);
      g.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
    }
    g.fillStyle = opts.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const size = opts.size ?? h * 0.5;
    g.font = `${opts.font ?? '600'} ${size}px 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif`;
    const spaced = opts.spacing ? text.split('').join('\u200a'.repeat(opts.spacing)) : text;
    g.fillText(spaced, w / 2, h * 0.54, w * 0.9);
  });
  const t = texture(c);
  t.wrapS = t.wrapT = 1001; // ClampToEdge
  return t;
}

// ---------------------------------------------------------------------------
// Materials.

export const materials = () => {
  const wood = woodTexture(4, 1);
  return {
    floor: (w: number, d: number) => new MeshStandardMaterial({ map: parquetTexture(w / 2.4, d / 2.4), roughness: 0.45, metalness: 0 }),
    rug: (w: number, d: number) => new MeshLambertMaterial({ map: rugTexture(w, d) }),
    wall: (w: number, h: number) => new MeshLambertMaterial({ map: wallTexture(w / 2.4, h / 2.4) }),
    gold: new MeshStandardMaterial({ color: '#c9a24a', metalness: 1, roughness: 0.32 }),
    brass: new MeshStandardMaterial({ color: '#b8923e', metalness: 1, roughness: 0.4 }),
    mosaic: (w: number, h: number) =>
      new MeshStandardMaterial({ map: goldMosaic(w / 1.5, h / 1.5), metalness: 0.55, roughness: 0.38, emissive: '#3a2a0c', emissiveIntensity: 0.6 }),
    coffer: (w: number, d: number) => new MeshLambertMaterial({ map: cofferTexture(w / 2, d / 2) }),
    shelf: new MeshStandardMaterial({ map: wood, color: '#ffffff', roughness: 0.55 }),
    walnut: new MeshStandardMaterial({ map: woodTexture(1, 3), color: '#d8c8b8', roughness: 0.5 }),
    divider: new MeshStandardMaterial({ color: '#2a1a10', roughness: 0.6 }),
    marble: new MeshStandardMaterial({ map: wallTexture(1, 2), roughness: 0.3 }),
    verde: new MeshStandardMaterial({ color: '#2e5240', roughness: 0.25 }),
    leather: new MeshStandardMaterial({ color: '#244232', roughness: 0.7 }),
    porphyry: new MeshStandardMaterial({ color: '#6a1f28', roughness: 0.28 }),
    bronze: new MeshStandardMaterial({ color: '#8a6430', metalness: 0.9, roughness: 0.45 }),
  };
};

export type Materials = ReturnType<typeof materials>;
