import type { StoreProduct } from './store';

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
  // A hoodie goes here once the .glb is in public/store/. Its `match` wants to
  // be /hoodie|sweatshirt|crewneck/i — Printful calls the Gildan blank a
  // "Heavy Blend Hoodie" — and its credit block must be filled in from the
  // model's own licence file before it is switched on.
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
