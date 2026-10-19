// Printful's Orders API: the half of Printful that lib/printful.ts never had.
//
// Three calls, for Shop step 3. Find the variant an order is for, create the
// order in Printful as a DRAFT, and read back its status and tracking. A draft
// is what his ruling asks for (2026-10-19): Printful charges nothing until he
// presses Confirm in Printful's dashboard, where he also sees their cost.
//
// Separate from lib/printful.ts because that module is the catalogue and runs
// in the build as well as the Worker; this runs only in the Worker, and only
// when he presses a button.

export interface PrintfulAuth {
  token: string;
  /** Only needed for account-level tokens. */
  storeId?: string | null;
}

/** Where Printful posts it. country_code is ISO 3166-1 alpha-2. */
export interface Recipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  /** Required by Printful for US, CA and AU only. */
  state_code?: string;
  country_code: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface PrintfulOrderState {
  id: number;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

/** Printful's own message where it sent one, so a refusal says why. */
export class PrintfulError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(auth: PrintfulAuth, pathname: string, init?: { method: string; body: unknown }): Promise<T> {
  const response = await fetch(`https://api.printful.com${pathname}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      ...(auth.storeId ? { 'X-PF-Store-Id': auth.storeId } : {}),
      ...(init ? { 'content-type': 'application/json' } : {}),
    },
    body: init ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const data = (await response.json().catch(() => null)) as { result?: unknown; error?: { message?: string } } | null;
  if (!response.ok) {
    const reason = data?.error?.message ?? (typeof data?.result === 'string' ? data.result : '');
    throw new PrintfulError(`Printful ${pathname} returned ${response.status}${reason ? `: ${reason}` : ''}`, response.status);
  }
  return data as T;
}

/**
 * The sync variant an order is for.
 *
 * The order records the product and the size and NOT the colour, because the
 * buy form never asks: every product so far comes in one colour. So a size
 * that matches more than one colour is refused rather than guessed at — the
 * day a second colour is synced, this says so instead of printing the wrong
 * shirt.
 */
export async function findSyncVariant(
  auth: PrintfulAuth,
  productId: string,
  size: string,
): Promise<{ id: number; variantId: number | null }> {
  const data = await call<{
    result?: { sync_variants?: { id: number; variant_id?: number | null; size?: string | null; color?: string | null }[] };
  }>(
    auth,
    `/store/products/${encodeURIComponent(productId)}`,
  );
  const wanted = size.trim().toLowerCase();
  const matches = (data.result?.sync_variants ?? []).filter((v) => (v.size ?? '').trim().toLowerCase() === wanted);
  if (matches.length === 0) throw new PrintfulError(`No ${size} variant of product ${productId} in Printful.`, 404);
  if (new Set(matches.map((v) => v.color)).size > 1) {
    throw new PrintfulError(
      `Product ${productId} has ${size} in more than one colour, and the order does not say which. Create it in Printful by hand.`,
      409,
    );
  }
  // `id` is the sync variant, which an order names; `variantId` is the
  // catalogue variant, which a shipping quote needs.
  return { id: matches[0].id, variantId: matches[0].variant_id ?? null };
}

/** One way Printful can send it, priced. */
export interface ShippingRate {
  id: string;
  name: string;
  /** In `currency`, as a number. Printful sends it as a string. */
  rate: number;
  currency: string;
  minDays: number | null;
  maxDays: number | null;
}

/**
 * What delivery to this address costs, cheapest first.
 *
 * In USD, asked for explicitly: the store converts to rand itself, at the
 * rate in lib/pricing.json, the same way it converts the product price.
 */
export async function shippingRates(
  auth: PrintfulAuth,
  recipient: Pick<Recipient, 'address1' | 'city' | 'country_code' | 'state_code' | 'zip'>,
  variantId: number,
): Promise<ShippingRate[]> {
  const data = await call<{
    result?: {
      id: string;
      name: string;
      rate: string;
      currency: string;
      minDeliveryDays?: number;
      maxDeliveryDays?: number;
    }[];
  }>(auth, '/shipping/rates', {
    method: 'POST',
    body: { recipient, items: [{ variant_id: variantId, quantity: 1 }], currency: 'USD' },
  });
  return (data.result ?? [])
    .map((r) => ({
      id: r.id,
      name: r.name,
      rate: Number.parseFloat(r.rate),
      currency: r.currency,
      minDays: r.minDeliveryDays ?? null,
      maxDays: r.maxDeliveryDays ?? null,
    }))
    .filter((r) => Number.isFinite(r.rate) && r.currency === 'USD')
    .sort((a, b) => a.rate - b.rate);
}

function stateOf(result: {
  id: number;
  status?: string;
  shipments?: { carrier?: string | null; tracking_number?: string | null; tracking_url?: string | null }[];
}): PrintfulOrderState {
  const shipment = (result.shipments ?? []).find((s) => s.tracking_number) ?? null;
  return {
    id: result.id,
    status: result.status ?? 'unknown',
    carrier: shipment?.carrier ?? null,
    trackingNumber: shipment?.tracking_number ?? null,
    trackingUrl: shipment?.tracking_url ?? null,
  };
}

/**
 * Create the order as a draft. `external_id` is our reference, so the order
 * is findable in Printful's dashboard by the code the customer was given.
 */
export async function createDraftOrder(
  auth: PrintfulAuth,
  order: { ref: string; recipient: Recipient; syncVariantId: number; shipping?: string | null },
): Promise<PrintfulOrderState> {
  // No `confirm` parameter: Printful's default is a draft. `shipping` is the
  // method the customer was quoted and paid for, where there was a quote.
  const data = await call<{ result: Parameters<typeof stateOf>[0] }>(auth, '/orders', {
    method: 'POST',
    body: {
      external_id: order.ref,
      recipient: order.recipient,
      items: [{ sync_variant_id: order.syncVariantId, quantity: 1 }],
      ...(order.shipping ? { shipping: order.shipping } : {}),
    },
  });
  return stateOf(data.result);
}

export async function readPrintfulOrder(auth: PrintfulAuth, printfulId: number): Promise<PrintfulOrderState> {
  const data = await call<{ result: Parameters<typeof stateOf>[0] }>(auth, `/orders/${printfulId}`);
  return stateOf(data.result);
}

/** Printful's statuses after which nothing more will change. */
export function isSettled(status: string | null): boolean {
  return status === 'fulfilled' || status === 'canceled';
}
