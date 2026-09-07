import fs from 'node:fs';
import path from 'node:path';
import { site } from './site';

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

/**
 * Which shelf a product belongs on.
 *
 * Printful does not tell us, so it is read off the product name. Crude, and
 * good enough while the catalogue is small — a real category field on the
 * product is the fix once there are enough of them for this to be wrong.
 */
export function categoryOf(product: StoreProduct): string {
  if (product.category) return product.category;
  const n = product.name.toLowerCase();
  if (/hoodie|sweat|crewneck/.test(n)) return 'Hoodies';
  if (/print|poster|canvas|sticker/.test(n)) return 'Prints';
  return site.store.categories[0];
}

export function getStore(): StoreSnapshot {
  try {
    const file = path.join(process.cwd(), 'data', 'store.json');
    if (!fs.existsSync(file)) return EMPTY;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as StoreSnapshot;
  } catch {
    // A malformed snapshot should not take the build down.
    return EMPTY;
  }
}

/**
 * Where a product's Buy button points.
 *
 * A payment link, set by hand per product in lib/site.ts. Checkout is
 * deliberately not on this site: a static export cannot take a payment, and
 * hosting one would mean owning refunds, tax by jurisdiction and card data.
 *
 * Null is the normal state for a product with no link yet, and the page shows
 * no button rather than one that goes nowhere.
 */
export function buyUrl(product: StoreProduct): string | null {
  return site.store.paymentLinks[String(product.id)] ?? null;
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
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatPrice(from: StoreProduct['from']): string | null {
  if (!from) return null;
  return money(from.amount, from.currency);
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

export function sizesOf(product: StoreProduct): string[] {
  const seen: string[] = [];
  for (const v of product.variants ?? []) {
    if (v.size && !seen.includes(v.size)) seen.push(v.size);
  }
  return seen.sort((a, b) => sizeRank(a) - sizeRank(b));
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
    const v = (product.variants ?? []).find((x) => x.size === size);
    if (!v || !Number.isFinite(v.amount)) continue;
    const last = bands[bands.length - 1];
    if (last && last.amount === v.amount && last.currency === v.currency) {
      last.sizes.push(size);
    } else {
      bands.push({ sizes: [size], amount: v.amount, currency: v.currency });
    }
  }
  return bands;
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
export function blurbOf(product: StoreProduct): string[] {
  return site.store.blurbs[String(product.id)] ?? [];
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
  const make = [g.brand, g.model].filter(Boolean).join(' ');
  return [make, g.title].filter(Boolean).join(' · ') || null;
}
