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
    // only becomes chest from 0.33 down.
    printBand: { top: 0.33, bottom: 1 },
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
