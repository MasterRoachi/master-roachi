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
 * Checkout is deliberately not on this site: a static export cannot take a
 * payment, and hosting one would mean owning refunds, tax by jurisdiction and
 * card data. The storefront handles all of that.
 */
export function buyUrl(product: StoreProduct): string | null {
  const base = site.store.storefrontUrl;
  if (!base) return null;
  const root = base.replace(/\/$/, '');

  const pattern = site.store.productUrlPattern;
  if (!pattern || !product.externalId) return root;

  // Every platform addresses products differently — Big Cartel uses
  // /product/<permalink>, Shopify /products/<handle>, Etsy /listing/<id>. An
  // earlier version hard-coded one shape, which would have produced confident
  // links straight to 404s. The pattern is set once the real URL shape is
  // known; until then every product links to the shop front, which is always
  // correct even when it is not deep.
  return root + pattern.replace('{id}', encodeURIComponent(product.externalId));
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
