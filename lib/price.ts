// What a product and its delivery cost in rand, from lib/pricing.json.
//
// Pure and free of the filesystem, so the Worker can work out a checkout's
// amount itself rather than trusting the figure a browser sends. lib/store.ts
// uses the same function for what the pages show, so the two cannot differ.

import pricing from './pricing.json';

export type CheckoutMode = 'links' | 'payfast';

/** How a customer pays. See `checkout` in lib/pricing.json. */
export const CHECKOUT: CheckoutMode = pricing.checkout === 'payfast' ? 'payfast' : 'links';

export const CURRENCY = pricing.currency;

/** Rounded up to the step, never down: rounding down sells at a loss on every order. */
function toRand(usd: number): number | null {
  const rate = pricing.usdToZar;
  if (!rate || !Number.isFinite(usd)) return null;
  const step = pricing.roundUpTo || 1;
  return Math.ceil((usd * rate) / step) * step;
}

/**
 * One size of one product, in rand.
 *
 * An override in pricing.json wins. Otherwise Printful's USD retail price,
 * plus delivery while checkout is by payment link — delivery is quoted on top
 * at a PayFast checkout instead — converted and rounded up.
 */
export function itemPrice(
  productId: string | number,
  size: string,
  variantUsd: number | null | undefined,
  /** The Worker's checkout passes 'payfast' always, so it can be tested before the switch. */
  mode: CheckoutMode = CHECKOUT,
): number | null {
  const override = (pricing.overrides as Record<string, Record<string, number>>)[String(productId)]?.[size];
  if (Number.isFinite(override)) return override;
  if (variantUsd == null) return null;
  return toRand(variantUsd + (mode === 'links' ? pricing.deliveryUsd || 0 : 0));
}

/** A delivery quote in USD, as the customer pays it in rand. */
export function deliveryPrice(usd: number): number | null {
  return toRand(usd);
}
