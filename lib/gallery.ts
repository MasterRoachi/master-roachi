import fs from 'node:fs';
import path from 'node:path';

// The 2D pictures of a product: Printful's clean mockups first, then a few
// styled scenes. His ruling, 12 Nov 2026: "product pages should have 2d
// mockups as well, not only the 3d".
//
// data/gallery.json is written by the goods side (Bjorn's scripts), keyed by
// Printful product id, each list in the order it should appear: clean mockups
// first (black then white for clothing, then back, left and right where
// Printful made them), scenes after. The images are in public/store/gallery/.
// Read at build time like data/store.json; a missing or malformed file means
// no gallery, never a failed build.

export interface GalleryImage {
  src: string;
  alt: string;
  kind: 'mockup' | 'scene';
  w: number;
  h: number;
}

// Read fresh each call, not cached in the module: a dev server would keep the
// empty answer from before the file existed. At build it is a few dozen small
// reads, once per product page.
function load(): Record<string, GalleryImage[]> {
  let cache: Record<string, GalleryImage[]>;
  try {
    const file = path.join(process.cwd(), 'data', 'gallery.json');
    const raw = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as unknown) : {};
    cache = raw && typeof raw === 'object' ? (raw as Record<string, GalleryImage[]>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

/** One product's pictures, in order. Only well-formed entries, and only local files. */
export function galleryOf(productId: string | number): GalleryImage[] {
  const list = load()[String(productId)];
  if (!Array.isArray(list)) return [];
  return list.filter(
    (image): image is GalleryImage =>
      Boolean(image) &&
      typeof image.src === 'string' &&
      image.src.startsWith('/store/gallery/') &&
      Number.isFinite(image.w) &&
      Number.isFinite(image.h),
  ).map((image) => ({
    ...image,
    alt: typeof image.alt === 'string' ? image.alt : '',
    kind: image.kind === 'scene' ? 'scene' : 'mockup',
  }));
}
