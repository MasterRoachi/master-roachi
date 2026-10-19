// The meta description of a product page.
//
// Its own module, with no imports, for one reason: two very different callers
// need the identical string. The product page composes it at build time from
// the copy on disk, and /work/shop composes it from the textarea on every
// keystroke so the SEO panel can score what the page WILL say. Anything living
// in lib/store.ts would drag content/store/copy.json and the whole catalogue
// into the browser bundle to get at one pure function.
//
// WHY HIS WORDS COME FIRST. The description used to be built only from facts —
// "Roachi Shirt from Fabled Threads. Bella + Canvas 3001 Unisex Staple
// T-Shirt. From $16." — which is accurate, fits the snippet, and is almost
// exactly what every other listing of the same blank says, because all of it
// came from the supplier. The one genuinely unique thing on the page was the
// paragraph he wrote, and it was the one thing the description left out. So
// authored copy wins where it exists and the facts are the fallback, which
// also means editing the copy changes the page's SEO — without that, a live
// score on the editor would be grading something nothing he typed could move.

/** Roughly where a search result stops showing a description. */
const LIMIT = 160;
/** Below this, his paragraph is a fragment and the facts read better. */
const MIN_USEFUL = 50;

export interface ProductMetaInput {
  name: string;
  storeName: string;
  /** The garment label, where the catalogue knows it. */
  garment?: string | null;
  /** A rendered price summary, e.g. "From $16". */
  price?: string | null;
  /** His own paragraphs, in order. Empty for a product with no copy yet. */
  blurb?: readonly string[];
}

/**
 * Trim to the limit on a word, and never mid-word.
 *
 * No ellipsis is added: the search engine adds its own when it truncates, and
 * a description that ends in a real full stop reads as finished rather than as
 * cut off. Sentence boundaries are preferred over word boundaries for the same
 * reason — stopping at ". " gives a complete thought where stopping at a space
 * gives half of one.
 */
function clamp(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= LIMIT) return clean;

  const window = clean.slice(0, LIMIT + 1);
  const sentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '));
  if (sentence >= MIN_USEFUL) return clean.slice(0, sentence + 1);

  const space = window.lastIndexOf(' ');
  return clean.slice(0, space > 0 ? space : LIMIT).replace(/[,;:—-]$/, '').trim();
}

/** The facts, which is what a product with no copy has to say for itself. */
function fromFacts(input: ProductMetaInput): string {
  return [
    `${input.name} from ${input.storeName}.`,
    input.garment,
    input.price && `${input.price}.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function productMetaDescription(input: ProductMetaInput): string {
  const written = (input.blurb ?? [])
    .map((paragraph) => String(paragraph ?? '').trim())
    .filter(Boolean);

  if (written.length === 0) return clamp(fromFacts(input));

  /* Paragraphs are added while they fit, so a product whose copy opens with
   * "That's my face." gets the next line too rather than a four-word snippet.
   * The facts are appended if there is still room, because the garment and the
   * price are what a buyer is scanning the result for and his paragraph will
   * rarely mention either. */
  let text = '';
  for (const paragraph of written) {
    const next = text ? `${text} ${paragraph}` : paragraph;
    if (text && next.length > LIMIT) break;
    text = next;
  }

  if (text.length < MIN_USEFUL) return clamp(`${text} ${fromFacts(input)}`.trim());

  const price = input.price ? `${input.price}.` : '';
  if (price && `${text} ${price}`.length <= LIMIT) return clamp(`${text} ${price}`);

  return clamp(text);
}
