import fs from 'node:fs';
import path from 'node:path';
import { site } from './site';

// Reads the Printful catalogue written by scripts/printful.mjs at build time.
// Nothing here runs at request time — the site is a static export, so the
// products are baked into the HTML and refresh on the next deploy.

export interface StoreProduct {
  id: number;
  externalId: string | null;
  name: string;
  thumbnail: string | null;
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
  /** An invented item, shown to judge the layout. Never buyable. */
  placeholder?: boolean;
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

export function formatPrice(from: StoreProduct['from']): string | null {
  if (!from) return null;
  const locale = CURRENCY_LOCALE[from.currency] ?? 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: from.currency,
      maximumFractionDigits: 2,
    }).format(from.amount);
  } catch {
    return `${from.currency} ${from.amount.toFixed(2)}`;
  }
}
