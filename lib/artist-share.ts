// Who drew what an order is for, and what they are owed from it.
//
// Timon sells his art here on a 50/50 split of the PROFIT, Master Roachi's
// ruling of 12 Nov 2026: the item's price less what Printful charged to make
// it. Delivery is not profit and is left out on both sides.
//
// The artist and the share are copied onto the order when it is placed, not
// looked up when the order is read: a share changed in /work/shop next month
// must not rewrite what was owed on a sale made this month. The cost is
// copied on from Printful when the order is sent there, which is the first
// moment Printful says what it will charge.
//
// Pure and free of the filesystem, so the Worker can import it: it reads
// content/store/copy.json as a module, the way lib/price.ts reads pricing.json.

import storeCopy from '../content/store/copy.json';
import pricing from './pricing.json';
import { readPieces, readTags } from './product-copy';

export interface ArtistTerms {
  artist: string;
  /** A fraction of the profit, 0–1. */
  share: number;
}

/** The artist and share for a Printful product id, or null for his own work. */
export function artistTerms(productId: string | number): ArtistTerms | null {
  const file = storeCopy as Record<string, unknown>;
  const tags = readTags(file[String(productId)]);
  const piece = tags.piece ? readPieces(file).find((p) => p.id === tags.piece) : undefined;
  const artist = tags.artist || piece?.artist || '';
  if (!artist) return null;
  // An artist with no share set is owed nothing by this arithmetic, which is
  // never what was meant. The editor fills 50% when an artist is chosen; this
  // is the same default for an entry written by hand.
  return { artist, share: tags.artistShare ?? 0.5 };
}

/** Printful's `costs` on an order, as much of it as is used here. */
export interface PrintfulCosts {
  currency?: string;
  total?: string | number | null;
  shipping?: string | number | null;
}

const num = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : Number.NaN;
};

/**
 * What Printful charges to make the item, in rand: its total less delivery.
 *
 * The total carries the item, any embroidery digitisation, fees and the tax on
 * them, which is all cost of making the thing. Converted at the store's own
 * rate (lib/pricing.json), the one the selling price was converted at, so
 * profit is not a currency movement. Null when Printful has not costed it yet.
 */
export function itemCostRand(costs: PrintfulCosts | null | undefined): number | null {
  if (!costs) return null;
  const total = num(costs.total);
  const shipping = num(costs.shipping) || 0;
  if (!Number.isFinite(total) || total <= 0) return null;
  const item = total - shipping;
  if (costs.currency === 'ZAR') return Math.round(item * 100) / 100;
  if (costs.currency && costs.currency !== 'USD') return null;
  const rate = pricing.usdToZar;
  if (!rate) return null;
  return Math.round(item * rate * 100) / 100;
}
