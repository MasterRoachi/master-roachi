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
