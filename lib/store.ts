import fs from 'node:fs';
import path from 'node:path';
import { site } from './site';
import pricing from './pricing.json';

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
export function buyUrl(product: StoreProduct, size: string): string | null {
  const price = sellingPrice(product, size);
  if (!price) return null;
  const forProduct = site.store.paymentLinks[String(product.id)];
  return forProduct?.[String(price.amount)] ?? null;
}

/** Whether any size of this can actually be paid for. */
export function isBuyable(product: StoreProduct): boolean {
  return sizesOf(product).some((size) => buyUrl(product, size) !== null);
}

/** One row of the buy panel: a size, its price, and where paying for it goes. */
export interface BuyOption {
  size: string;
  amount: number;
  currency: string;
  label: string;
  href: string | null;
  available: boolean;
}

/**
 * Every size a customer can choose, priced, with its payment link.
 *
 * Built on the server so the client component holds no pricing logic — it
 * selects a row and follows a link, which is all a fixed-amount payment link
 * can support until there is a real cart.
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
      href: buyUrl(product, size),
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
  const currency = pricing.currency;

  const override = (pricing.overrides as Record<string, Record<string, number>>)[
    String(product.id)
  ]?.[size];
  if (Number.isFinite(override)) return { amount: override, currency };

  const rate = pricing.usdToZar;
  if (!rate) return null;

  const variant = (product.variants ?? []).find((v) => v.size === size);
  if (!variant || !Number.isFinite(variant.amount)) return null;

  // Delivery is added before conversion rather than to Printful retail prices,
  // so Printful stays a supplier figure and the markup lives in one place.
  const cost = variant.amount + (pricing.deliveryUsd || 0);

  // Rounded up, never down: rounding a converted price down quietly sells at a
  // loss on every order of that size.
  const step = pricing.roundUpTo || 1;
  const amount = Math.ceil((cost * rate) / step) * step;
  return { amount, currency };
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
  const low = bands[0];
  const high = bands[bands.length - 1];
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
export function blurbOf(product: StoreProduct): string[] {
  return site.store.blurbs[String(product.id)] ?? [];
}

/** Something to show in the stage, turnable or not. */
export function hasArtwork(product: StoreProduct): boolean {
  return Boolean(product.art || product.thumbnail);
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
