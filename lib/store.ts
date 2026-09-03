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

export interface StoreSnapshot {
  fetchedAt: string | null;
  products: StoreProduct[];
}

const EMPTY: StoreSnapshot = { fetchedAt: null, products: [] };

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
  // Most platforms address a product by the external id Printful records.
  return product.externalId
    ? `${base.replace(/\/$/, '')}/products/${product.externalId}`
    : base;
}

export function formatPrice(from: StoreProduct['from']): string | null {
  if (!from) return null;
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: from.currency,
      maximumFractionDigits: 2,
    }).format(from.amount);
  } catch {
    return `${from.currency} ${from.amount.toFixed(2)}`;
  }
}
