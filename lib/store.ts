import fs from 'node:fs';
import path from 'node:path';
import { site } from './site';
// Authored product copy, keyed by Printful id. In content/ rather than in this
// file so that a form can edit it without rewriting TypeScript.
import storeCopy from '../content/store/copy.json';
import {
  inOrder,
  readCategories,
  readCopy,
  readOrder,
  readPieces,
  readTags,
  type Piece,
  type ProductCopy,
  type ProductTags,
  type Shelf,
} from './product-copy';
import { CURRENCY, itemPrice } from './price';

// Reads the Printful catalogue written by scripts/printful.mjs at build time.
// Nothing here runs at request time — the site is a static export, so the
// products are baked into the HTML and refresh on the next deploy.

/** The blank a design is printed on, from Printful's catalogue. */
export interface Garment {
  brand: string | null;
  model: string | null;
  title: string | null;
  /** Fibre, weight, construction — the bullets, without the sales pitch. */
  spec?: string[];
  /** Printful's own warning about the blank, kept rather than buried. */
  disclaimer?: string | null;
}

/** One measured dimension across every size, in the guide's unit. */
export interface Measurement {
  label: string;
  values: {
    size: string;
    value: number | null;
    min: number | null;
    max: number | null;
  }[];
}

export interface SizeGuide {
  unit: string;
  measurements: Measurement[];
}

export interface ProductColor {
  name: string;
  /** Printful's own swatch, when the catalogue had one. */
  hex: string | null;
}

export interface ProductVariant {
  size: string | null;
  color: string | null;
  amount: number;
  currency: string;
  available: boolean;
}

export interface StoreProduct {
  id: number;
  externalId: string | null;
  /** This product's path segment on the site: /store/<slug>/. */
  slug?: string;
  name: string;
  thumbnail: string | null;
  /** What it is printed on. Null when the catalogue lookup failed. */
  garment?: Garment | null;
  /** Garment measurements per size, laid flat. */
  sizeGuide?: SizeGuide | null;
  /** Distinct colourways, in the order they were synced. */
  colors?: ProductColor[];
  /** Every variant actually for sale. */
  variants?: ProductVariant[];
  /**
   * A local cut-out of the mockup, written by scripts/store-art.mjs with the
   * white sheet removed. Absent when the cut failed or the mockup was never
   * on white, in which case the remote thumbnail still serves.
   */
  art?: string | null;
  /**
   * Art uploaded by hand from /work/shop, which beats everything above it.
   *
   * A separate field and a separate filename on purpose: store-art.mjs
   * rewrites `art` from Printful's mockup on every build, so an upload stored
   * there would survive until the next deploy and then vanish with nothing to
   * explain why. Nothing generated ever writes this one.
   */
  artwork?: string | null;
  /**
   * The printed design on its own, lifted off the mockup by the same script,
   * with where on the garment it sits. This is what the 3D viewer needs: the
   * shirt it draws is modelled, so the only thing it wants from the photograph
   * is the artwork.
   */
  print?: {
    src: string;
    /** Centre, as a fraction across and down the garment silhouette. */
    x: number;
    y: number;
    /** Width, as a fraction of the silhouette width. */
    width: number;
  } | null;
  /** The garment colour, averaged off the mockup. */
  fabric?: string | null;
  category?: string;
  variantCount: number;
  from: { amount: number; currency: string } | null;
}

export interface StoreInfo {
  /** Printful store type: manual, etsy, shopify, woocommerce and so on. */
  type: string | null;
  name: string | null;
  /** The connected shop front, when the platform reports one. */
  website: string | null;
}

export interface StoreSnapshot {
  fetchedAt: string | null;
  store?: StoreInfo | null;
  products: StoreProduct[];
}

const EMPTY: StoreSnapshot = { fetchedAt: null, store: null, products: [] };

const copyFile = storeCopy as Record<string, unknown>;

/**
 * The shelves, in his order, from $categories in content/store/copy.json.
 *
 * site.store.categories is the floor for a file that names none, so a store
 * with no shelves set still has somewhere to put things.
 */
export function storeCategories(): Shelf[] {
  const set = readCategories(copyFile);
  if (set.length) return set;
  return site.store.categories.map((name) => ({ id: name.toLowerCase(), name }));
}

/** The artwork collections, in his order, from $pieces. */
export function storePieces(): Piece[] {
  return readPieces(copyFile);
}

/** The shelving keys of one product. Empty for anything not yet tagged. */
export function tagsOf(product: StoreProduct): ProductTags {
  return readTags(copyFile[String(product.id)]);
}

/**
 * A guess at the shelf from the product name, for anything not yet tagged.
 *
 * This was the whole of categoryOf() while the store had one product. It is
 * now only the fallback: a product synced a minute ago has no tags until he
 * opens it on /work/shop, and it should land somewhere sensible rather than
 * nowhere. Each guess is used only if that shelf exists.
 */
const GUESSES: [RegExp, string][] = [
  [/hoodie|sweat|crewneck/, 'hoodies'],
  [/t-?\s?shirt|\btee\b/, 'tees'],
  [/poster|canvas|metal|print|tapestry/, 'wall-art'],
  [/desk mat|mouse ?pad|journal|notebook/, 'desk'],
  [/sticker|pin|button|ornament|postcard|card/, 'stickers'],
  [/mug|pillow|puzzle/, 'home'],
  [/tote|case|sleeve|cap|hat/, 'carry'],
];

/** Which shelf a product belongs on, as a shelf id. */
export function categoryOf(product: StoreProduct): string {
  const shelves = storeCategories();
  const known = (id: string) => shelves.some((s) => s.id === id);
  const tagged = tagsOf(product).category || product.category?.toLowerCase();
  if (tagged && known(tagged)) return tagged;
  const n = product.name.toLowerCase();
  const guess = GUESSES.find(([pattern, id]) => pattern.test(n) && known(id));
  return guess?.[1] ?? shelves[0]?.id ?? '';
}

/** The collection a product belongs to, if it is tagged with one that exists. */
export function pieceOf(product: StoreProduct): Piece | null {
  const id = tagsOf(product).piece;
  return (id && storePieces().find((p) => p.id === id)) || null;
}

/** Who drew it: the product's own tag, else its collection's. Empty for his own work. */
export function artistOf(product: StoreProduct): string {
  return tagsOf(product).artist || pieceOf(product)?.artist || '';
}

/** Every product in one collection, in store order. */
export function productsInPiece(id: string): StoreProduct[] {
  return getStore().products.filter((p) => tagsOf(p).piece === id);
}

/**
 * The picture a collection leads with: the drawing itself where one has been
 * made for it (public/store/pieces/<id>.webp), else its first product's.
 */
export function pieceImage(piece: Piece): string | null {
  const own = path.join(process.cwd(), 'public', 'store', 'pieces', `${piece.id}.webp`);
  if (fs.existsSync(own)) return `/store/pieces/${piece.id}.webp`;
  const first = productsInPiece(piece.id)[0];
  return first ? productImage(first) : null;
}

/** A collection's page on this site. */
export function piecePath(piece: Piece): string {
  return `/store/artwork/${piece.id}/`;
}

export function getStore(): StoreSnapshot {
  try {
    const file = path.join(process.cwd(), 'data', 'store.json');
    if (!fs.existsSync(file)) return EMPTY;
    const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as StoreSnapshot;
    // In his order where he has set one (`$order` in content/store/copy.json),
    // and Printful's for anything he has not placed.
    return {
      ...snapshot,
      products: inOrder(
        snapshot.products,
        (product) => String(product.id),
        readOrder(copyFile),
      ),
    };
  } catch {
    // A malformed snapshot should not take the build down.
    return EMPTY;
  }
}

/**
 * Whether any size of this can be bought: priced and in stock, by the same
 * rule the buy panel uses. Until 2026-11-10 the store page asked for an old
 * payment link instead, and told everyone a shirt on sale was "Not on sale
 * yet".
 */
export function isBuyable(product: StoreProduct): boolean {
  return buyOptions(product).some((o) => o.available && o.amount > 0);
}

/** One row of the buy panel: a size, its price, and whether it can be had. */
export interface BuyOption {
  size: string;
  amount: number;
  currency: string;
  label: string;
  available: boolean;
}

/**
 * Every size a customer can choose, priced.
 *
 * Built on the server so the client component holds no pricing logic. The
 * Worker prices the checkout again itself; the browser never sets an amount.
 */
export function buyOptions(product: StoreProduct): BuyOption[] {
  return sizesOf(product).map((size) => {
    const price = sellingPrice(product, size);
    const variant = (product.variants ?? []).find((v) => v.size === size);
    return {
      size,
      amount: price?.amount ?? 0,
      currency: price?.currency ?? 'ZAR',
      label: price ? money(price.amount, price.currency) : '',
      available: variant?.available ?? true,
    };
  });
}

/**
 * Prices are formatted for the currency they are in, not for where the site
 * was written. Formatting USD with the en-ZA locale gives a "US$" prefix and a
 * comma decimal separator — correct for rand, wrong for dollars.
 */
const CURRENCY_LOCALE: Record<string, string> = {
  USD: 'en-US',
  ZAR: 'en-ZA',
  GBP: 'en-GB',
  EUR: 'de-DE',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

export function money(amount: number, currency: string): string {
  const locale = CURRENCY_LOCALE[currency] ?? 'en-US';
  // Prices here round to whole rands, and "R 500,00" reads as an accounting
  // entry rather than a price tag. Cents are shown only when there are any.
  const whole = Number.isInteger(amount);
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amount);
    // en-ZA puts a space between the symbol and the number — correct by the
    // standard, and not how any South African shop writes a price. Only that
    // one space goes: the thousands separator is also a space, and R1 250 is
    // right where R1250 is not. Split at the first digit rather than matching
    // the separator, which is a non-breaking space in some locales and a
    // narrow one in others.
    const firstDigit = formatted.search(/[0-9]/);
    if (firstDigit <= 0) return formatted;
    return formatted.slice(0, firstDigit).trimEnd() + formatted.slice(firstDigit);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * What one size actually sells for, in the currency the store can charge.
 *
 * Printful's own retail price is a supplier figure in dollars. PayFast settles
 * only in rand, so showing the dollar figure meant the page and the payment
 * link disagreed about both the number and the currency. This converts, or
 * takes a deliberate price where one is set.
 *
 * Null while no rate and no override exist — the honest state for a store that
 * cannot yet charge anything, and the reason nothing shows a price until
 * lib/pricing.json is filled in.
 */
export function sellingPrice(
  product: StoreProduct,
  size: string,
): { amount: number; currency: string } | null {
  // lib/price.ts, which the Worker's checkout uses too, so a page and a
  // charge cannot disagree.
  const variant = (product.variants ?? []).find((v) => v.size === size);
  const amount = itemPrice(product.id, size, variant?.amount);
  return amount === null ? null : { amount, currency: CURRENCY };
}

/**
 * Sizes in the order a human expects them.
 *
 * Printful returns variants in sync order, which is usually right and is not
 * guaranteed to be — and a size list that runs S, XS, M is worse than no size
 * list. Anything unrecognised (waist measurements, one-size, kids' ages) keeps
 * its relative position after the known run rather than being dropped.
 */
const SIZE_ORDER = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL',
];

function sizeRank(size: string): number {
  const i = SIZE_ORDER.indexOf(size.toUpperCase());
  return i === -1 ? SIZE_ORDER.length : i;
}

/**
 * How big a measured size is, in square inches: "8″×12″", "21×30 cm", or a
 * single figure like a button's "1.25″". Null for anything else.
 *
 * Added 2026-11-12, when the store grew canvases and stickers: their sizes
 * are dimensions, which SIZE_ORDER knows nothing of, so a canvas ran 11×14,
 * 12×18, 8×12, 9×12 in sync order. Smallest first, by area.
 */
function sizeArea(size: string): number | null {
  const cm = /cm/i.test(size);
  // "A2 (42×59.4 cm)": the paper's name is not a measurement, the brackets are.
  const measured = size.match(/\(([^)]*)\)/)?.[1] ?? size;
  const figures = (measured.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (figures.length === 0 || figures.length > 2) return null;
  const [w, h = w] = figures.map((n) => (cm ? n / 2.54 : n));
  return w * h;
}

export function sizesOf(product: StoreProduct): string[] {
  const seen: string[] = [];
  for (const v of product.variants ?? []) {
    if (v.size && !seen.includes(v.size)) seen.push(v.size);
  }
  return seen.sort((a, b) => {
    const byRun = sizeRank(a) - sizeRank(b);
    if (byRun !== 0) return byRun;
    // Both outside the known run: by area where both are measurements, and
    // otherwise left as they arrived (sort is stable).
    const [x, y] = [sizeArea(a), sizeArea(b)];
    return x !== null && y !== null ? x - y : 0;
  });
}

/** Clothing, sized S to 5XL, as opposed to a print or a sticker sized in inches. */
export function isApparel(product: StoreProduct): boolean {
  return sizesOf(product).some((size) => SIZE_ORDER.includes(size.toUpperCase()));
}

/**
 * Sizes grouped by what they cost.
 *
 * A single "from $16.00" is true and misleading in the same breath: this shirt
 * runs to $26.00 by 5XL, and someone who wears a 5XL should not find that out
 * at checkout. Grouping keeps it short — five sizes at one price is one row,
 * not five.
 */
export interface PriceBand {
  sizes: string[];
  amount: number;
  currency: string;
}

export function priceLadder(product: StoreProduct): PriceBand[] {
  const bands: PriceBand[] = [];
  for (const size of sizesOf(product)) {
    const price = sellingPrice(product, size);
    if (!price) continue;
    const last = bands[bands.length - 1];
    if (last && last.amount === price.amount && last.currency === price.currency) {
      last.sizes.push(size);
    } else {
      bands.push({
        sizes: [size],
        amount: price.amount,
        currency: price.currency,
      });
    }
  }
  return bands;
}

/**
 * The price line: a range when sizes cost different amounts, one figure when
 * they do not, and nothing at all when the store has no price to charge.
 *
 * Lived twice, once on the store index and once on the product page, and each
 * copy fell back to Printful's dollar figure when there was no ladder — which
 * is precisely the bug this file exists to remove.
 */
export function priceSummary(product: StoreProduct): string | null {
  const bands = priceLadder(product);
  if (bands.length === 0) return null;
  // The cheapest and the dearest, not the first and last band: sizes run in
  // size order, and a bigger canvas is not always the dearer one (it read
  // "R620 – R580" when this took the ends).
  const low = bands.reduce((a, b) => (b.amount < a.amount ? b : a));
  const high = bands.reduce((a, b) => (b.amount > a.amount ? b : a));
  return low.amount === high.amount
    ? money(low.amount, low.currency)
    : `${money(low.amount, low.currency)} – ${money(high.amount, high.currency)}`;
}

/** Whether anything here can be priced at all. */
export function isPriced(product: StoreProduct): boolean {
  return priceLadder(product).length > 0;
}

/** "XS–XL" for a run, "XS, 3XL" for two, the single size for one. */
export function sizeRun(sizes: string[]): string {
  if (sizes.length === 0) return '';
  if (sizes.length === 1) return sizes[0];
  if (sizes.length === 2) return sizes.join(', ');
  return `${sizes[0]}–${sizes[sizes.length - 1]}`;
}

/**
 * What the design is, in his own words — the one part of a product page that
 * does not come out of an API. Empty is the normal state for a new product.
 */
export function copyOf(product: StoreProduct): ProductCopy {
  // An id with no entry is the normal state for a freshly synced product, and
  // comes back as empty copy rather than as something the page tries to
  // render. See lib/product-copy.ts for the shape.
  return readCopy(copyFile[String(product.id)]);
}

/** The description paragraphs alone. */
export function blurbOf(product: StoreProduct): string[] {
  return copyOf(product).description;
}

/** Something to show in the stage, turnable or not. */
export function hasArtwork(product: StoreProduct): boolean {
  return Boolean(product.artwork || product.art || product.thumbnail);
}

/**
 * The image a product leads with.
 *
 * Uploaded art first, because it was chosen deliberately; then the generated
 * cut-out; then Printful's own mockup, which is the one with the white sheet
 * still on it and so the last resort.
 */
export function productImage(product: StoreProduct): string | null {
  return product.artwork ?? product.art ?? product.thumbnail ?? null;
}

/** Nothing left in stock, as opposed to nothing ever synced. */
export function isSoldOut(product: StoreProduct): boolean {
  const variants = product.variants ?? [];
  return variants.length > 0 && variants.every((v) => !v.available);
}

/**
 * A product's page on this site.
 *
 * Falls back to the Printful id for anything synced before slugs existed, so
 * a stale data/store.json still routes rather than sending every product to
 * /store/undefined/.
 */
export function productPath(product: StoreProduct): string {
  return `/store/${product.slug ?? product.id}/`;
}

/** Every product that should have a page built for it. */
export function getStoreProducts(): StoreProduct[] {
  return getStore().products;
}

export function findProduct(slug: string): StoreProduct | null {
  return (
    getStoreProducts().find((p) => (p.slug ?? String(p.id)) === slug) ?? null
  );
}

/** "Bella + Canvas 3001 · Unisex Staple T-Shirt", skipping whatever is absent. */
export function garmentLabel(product: StoreProduct): string | null {
  const g = product.garment;
  if (!g) return null;
  // Printful's unit suffix is its catalogue's bookkeeping, not a name.
  const title = g.title?.replace(/\s*\((?:in|cm)\)\s*$/i, '').trim() || null;
  // A brand and model mean something on a blank garment ("Bella + Canvas
  // 3001"). On a canvas or a mouse pad there is no brand, and the "model" is
  // the title again or a pipe-joined variant string, so it came out as
  // "Canvas (in) · Canvas (in)". No brand, no model.
  const make = g.brand ? [g.brand, g.model].filter(Boolean).join(' ') : '';
  return [make, title].filter(Boolean).join(' · ') || null;
}
