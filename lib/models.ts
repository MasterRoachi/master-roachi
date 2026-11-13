import type { StoreProduct } from './store';
// Written by the product script beside Timon's art (tools/goods.py there),
// one entry per Printful product that has a built 3D shape. See goodsFor().
import goodsData from '../data/goods.json';

/**
 * The 3D garments the store can show, and who they belong to.
 *
 * The viewer used to hardcode /store/tshirt.glb and both pages carried the
 * Tabbuso credit as hand-written JSX, so a second garment meant editing four
 * places and remembering the attribution in two of them — which is exactly the
 * sort of thing that gets missed, and the one thing a CC BY licence does not
 * forgive.
 *
 * Adding a garment is now: put the .glb in public/store/, add an entry here,
 * and drop the licence text beside the file. Nothing else changes.
 */
export interface GarmentModel {
  /** The .glb, served from public/. */
  src: string;
  /**
   * Tested against Printful's own name for the blank — "Unisex Staple
   * T-Shirt", "Heavy Blend Hoodie". Printful's description is used rather than
   * the product's name, which is ours to get wrong.
   */
  match: RegExp;
  /**
   * Where this model's printable front actually is, as fractions of its own
   * height from the top.
   *
   * The print's position comes from the Printful mockup as a fraction of that
   * photograph's silhouette, and carries across only when the model is shaped
   * like the mockup. The tee is, so it needs nothing. The hoodie model has its
   * hood UP and a mockup does not: rays fired at the top third pass through
   * the hood opening and strike the inside of the back, which is where the
   * chest print landed — measured at z = -49.9, well behind the garment.
   *
   * Omit for a model whose silhouette matches its mockup.
   */
  printBand?: { top: number; bottom: number };
  /** Attribution. Required by the licence, so it is not optional here. */
  credit: {
    title: string;
    modelUrl: string;
    author: string;
    authorUrl: string;
    license: string;
    licenseUrl: string;
  };
}

export const GARMENT_MODELS: GarmentModel[] = [
  {
    src: '/store/tshirt.glb',
    match: /t-?\s?shirt|\btee\b/i,
    credit: {
      title: 'Tshirt',
      modelUrl:
        'https://sketchfab.com/3d-models/tshirt-5a21282b2e454d1696547148f617d3d0',
      author: 'Tabbuso',
      authorUrl: 'https://sketchfab.com/Tabbuso',
      license: 'CC BY 4.0',
      licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
    },
  },
  {
    src: '/store/hoodie.glb',
    // Measured by casting rays down the centre line: the front-most surface
    // is behind the mid-plane until 0.30 — that is the hood opening — and
    // only becomes chest from 0.33 down. The band started there, which put a
    // small chest print right and a large one down on the pocket: the
    // mockup's silhouette starts at the shoulders with the hood down, so its
    // top is this model's 0.22, not its chest. Raised on 12 Nov 2026 for
    // Grumpy Television; the print's centre still lands below the opening.
    printBand: { top: 0.22, bottom: 1 },
    // Printful calls the Gildan blank a "Heavy Blend Hoodie"; crewnecks and
    // sweatshirts are near enough the same silhouette to borrow it.
    match: /hoodie|sweatshirt|crewneck/i,
    credit: {
      title: 'HOODIE',
      modelUrl:
        'https://sketchfab.com/3d-models/hoodie-ab78848ab3404a2e877929d5f8774c54',
      author: 'Obridje',
      authorUrl: 'https://sketchfab.com/Obridje',
      license: 'CC BY 4.0',
      licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
    },
  },
];

/**
 * The model that actually stands for this product, or null.
 *
 * Null is the normal answer for a poster, a mug, or any garment there is no
 * model for. Built with one product in the catalogue, the t-shirt was drawn
 * for everything — a giclée print rendered as a rotating tee and carried the
 * shirt model's credit on a page that was not using it.
 */
export function modelFor(product: StoreProduct): GarmentModel | null {
  // No print placement means nothing to put on the garment, and an untextured
  // blank is not this product.
  if (!product.print) return null;
  const title = product.garment?.title ?? '';
  if (!title) return null;
  return GARMENT_MODELS.find((m) => m.match.test(title)) ?? null;
}

/**
 * The flat goods the store builds in three.js rather than loading a model for
 * (components/goods.ts). Named by the same keys as the art tools' products.
 */
export type GoodsKind =
  | 'poster'
  | 'framed-poster'
  | 'canvas'
  | 'metal-print'
  | 'jigsaw-puzzle'
  | 'die-cut-sticker'
  | 'holographic-sticker'
  | 'pin-buttons'
  | 'mouse-pad'
  | 'desk-mat'
  | 'laptop-sleeve'
  | 'postcard'
  | 'greeting-card'
  | 'hardcover-journal'
  | 'spiral-notebook'
  | 'wall-tapestry'
  | 'phone-case'
  // Built rather than downloaded since 13 Nov 2026: no CC0 or CC BY model of
  // a mug, a dad cap, a tote or a shaped pillow was to be had (Poly Haven has
  // none; Sketchfab's need an account to download), and these are simple
  // enough to make at Printful's own proportions. components/goods.ts.
  | 'black-mug'
  | 'white-mug'
  | 'eco-tote'
  | 'shaped-pillow'
  | 'dad-cap';

/** One built good: what shape, what goes on it, and how big it is. */
export interface FlatGood {
  kind: GoodsKind;
  /** The print file, web-sized, served from public/. */
  texture: string;
  /** The printed area in inches, wrap and bleed included. */
  width: number;
  height: number;
  /** Wrap or bleed per side in inches, not seen from the front. */
  edge?: [number, number];
  /** A shaped pillow's outline, in inches, centred on 0,0, y up, open (last is not first). */
  outline?: [number, number][];
  /** The blank's colour, as Printful names it ("Black"), for a tote or a cap. */
  color?: string;
}

const GOODS = goodsData as unknown as Record<string, FlatGood | string>;

/**
 * The built shape for this product, or null.
 *
 * Keyed by Printful product id, and written when the product is made, because
 * that is the moment the print file, its size and its wrap are all known: the
 * texture is the print file itself, so the canvas's sides show what is really
 * printed round them. A product with no entry turns nothing and shows its
 * pictures, which is the right answer for anything not yet built.
 */
export function goodsFor(product: StoreProduct): FlatGood | null {
  const entry = GOODS[String(product.id)];
  return entry && typeof entry === 'object' ? entry : null;
}
