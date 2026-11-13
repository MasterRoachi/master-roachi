// One product's copy, as content/store/copy.json holds it.
//
// Its own module with no imports, for the same reason as lib/product-meta.ts:
// the build reads it through lib/store.ts and the /work/shop editor writes it
// in the browser, and the editor must not pull the catalogue into its bundle.
//
// THE SHAPE GREW on 2026-10-19 (Shop step 4). An entry was an array of
// paragraphs — the description — and is now an object:
//
//   "464722916": {
//     "tagline": "One line under the name.",
//     "description": ["What the design is.", "..."],
//     "story": ["Where it came from.", "..."],
//     "care": "How it fits and how to wash it.",
//     "alt": "What the art shows, for someone who cannot see it."
//   }
//
// Every field is optional and an empty one is left out of the file. An array
// is still read, as the description alone, so the file did not need converting
// and a hand edit in the old shape is not an error; the editor writes the
// object shape on its next save.
//
// `$order` is the one other top-level key besides `$comment`: the product ids
// in the order the store shows them. Ids not in it keep Printful's order,
// after the ones that are.

export interface ProductCopy {
  tagline: string;
  description: string[];
  story: string[];
  care: string;
  alt: string;
}

export const ORDER_KEY = '$order';

export function emptyCopy(): ProductCopy {
  return { tagline: '', description: [], story: [], care: '', alt: '' };
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const paragraphs = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(text).filter(Boolean) : [];

/** Whatever is in the file under one id, as a ProductCopy. Never throws. */
export function readCopy(entry: unknown): ProductCopy {
  if (Array.isArray(entry)) return { ...emptyCopy(), description: paragraphs(entry) };
  if (!entry || typeof entry !== 'object') return emptyCopy();
  const record = entry as Record<string, unknown>;
  return {
    tagline: text(record.tagline),
    description: paragraphs(record.description),
    story: paragraphs(record.story),
    care: text(record.care),
    alt: text(record.alt),
  };
}

/** What goes into the file for one product, or null when there is nothing. */
export function writeCopy(copy: ProductCopy): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  if (copy.tagline.trim()) out.tagline = copy.tagline.trim();
  const description = paragraphs(copy.description);
  if (description.length) out.description = description;
  const story = paragraphs(copy.story);
  if (story.length) out.story = story;
  if (copy.care.trim()) out.care = copy.care.trim();
  if (copy.alt.trim()) out.alt = copy.alt.trim();
  return Object.keys(out).length ? out : null;
}

export function hasCopy(copy: ProductCopy): boolean {
  return writeCopy(copy) !== null;
}

/** The ids in `$order`, ignoring anything that is not a string. */
export function readOrder(file: Record<string, unknown>): string[] {
  const order = file[ORDER_KEY];
  return Array.isArray(order) ? order.filter((id): id is string => typeof id === 'string') : [];
}

/**
 * Items in the saved order: those named in `order` first, in that order, then
 * the rest in the order they arrived. Stable, and an id in `order` that names
 * nothing is skipped rather than leaving a hole.
 */
export function inOrder<T>(items: readonly T[], idOf: (item: T) => string, order: readonly string[]): T[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  return items
    .map((item, index) => ({ item, index, rank: rank.get(idOf(item)) }))
    .sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
      if (a.rank !== undefined) return -1;
      if (b.rank !== undefined) return 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

// ── Shelving, and who drew it ──────────────────────────────────────────────
//
// ADDED 2026-11-12 for Timon's fifteen pieces, which took the store from one
// product to well over a hundred. Four more optional keys per product, beside
// the copy and in the same entry:
//
//   "category":    "wall-art"          — a shelf id from $categories
//   "piece":       "grumpy-television" — an artwork collection id from $pieces
//   "artist":      "Timon"             — who drew it; absent for his own logo
//   "artistShare": 0.5                 — the artist's fraction of the PROFIT
//
// `piece`, not `artwork`: StoreProduct.artwork is already the image uploaded
// from /work/shop, and one word meaning two things in the same object is how a
// picture ends up in a payout.
//
// The share is of profit, his ruling of 12 Nov 2026: the item's price less
// what Printful charged to make it, delivery excluded. It is a fraction rather
// than a percentage so that the arithmetic needs no /100 anywhere it is used.
//
// And two more top-level keys, the shelves and the collections themselves, in
// the order the store shows them, each [{ "id", "name" }]; a piece may also
// name its "artist". Ids are what products point at, so renaming a shelf is
// changing its name and never its id.

export interface ProductTags {
  category: string;
  piece: string;
  artist: string;
  /** A fraction, 0–1. Null where none is set. */
  artistShare: number | null;
}

export interface Shelf {
  id: string;
  name: string;
}

export interface Piece extends Shelf {
  artist?: string;
}

export const CATEGORIES_KEY = '$categories';
export const PIECES_KEY = '$pieces';

export function emptyTags(): ProductTags {
  return { category: '', piece: '', artist: '', artistShare: null };
}

function share(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

/** The shelving keys of one entry. Never throws; an array entry has none. */
export function readTags(entry: unknown): ProductTags {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return emptyTags();
  const record = entry as Record<string, unknown>;
  return {
    category: text(record.category),
    piece: text(record.piece),
    artist: text(record.artist),
    artistShare: share(record.artistShare),
  };
}

/**
 * One product's whole entry: its copy and its tags, or null when there is
 * neither. What the editor writes, so a save cannot drop the half it is not
 * showing.
 */
export function writeEntry(copy: ProductCopy, tags: ProductTags): Record<string, unknown> | null {
  const out: Record<string, unknown> = { ...(writeCopy(copy) ?? {}) };
  if (tags.category.trim()) out.category = tags.category.trim();
  if (tags.piece.trim()) out.piece = tags.piece.trim();
  if (tags.artist.trim()) out.artist = tags.artist.trim();
  if (tags.artist.trim() && tags.artistShare !== null) out.artistShare = tags.artistShare;
  return Object.keys(out).length ? out : null;
}

function shelvesIn(value: unknown): Piece[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: Piece[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const id = text(record.id);
    const name = text(record.name) || id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const artist = text(record.artist);
    out.push(artist ? { id, name, artist } : { id, name });
  }
  return out;
}

/** The shelves, in order. Empty when the file names none. */
export function readCategories(file: Record<string, unknown>): Shelf[] {
  return shelvesIn(file[CATEGORIES_KEY]).map(({ id, name }) => ({ id, name }));
}

/** The artwork collections, in order. */
export function readPieces(file: Record<string, unknown>): Piece[] {
  return shelvesIn(file[PIECES_KEY]);
}

/** A name made into an id: "Iroh's House" → "irohs-house". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
