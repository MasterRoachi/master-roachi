// The artist's cut of one order, from what the order row holds.
//
// Its own module with no imports, so the /work/shop orders page can use it
// without pulling content/store/copy.json into its bundle the way
// lib/artist-share.ts (which the Worker uses) would. See that file for the
// ruling: half the profit, the item's price less Printful's cost.

/**
 * The artist's cut of one order, in rand, or null when it cannot be worked out
 * yet (no cost from Printful, or no item price). A loss owes nothing.
 */
export function artistCut(order: {
  item_amount: number | null;
  item_cost: number | null;
  artist_share: number | null;
}): number | null {
  if (order.artist_share === null || order.item_amount === null || order.item_cost === null) return null;
  const profit = order.item_amount - order.item_cost;
  return Math.round(Math.max(0, profit) * order.artist_share * 100) / 100;
}
