// Which orders are waiting on him: the gold rows on the Shop page, and the
// number on the Shop door. One rule in one place, so the door and the page it
// opens never disagree.

/** The fields of an order the rule reads. */
export interface OrderState {
  status: 'received' | 'paid' | 'fulfilled' | 'dismissed';
  printful_id: number | null;
  printful_status: string | null;
}

/**
 * Whether an order is waiting on him. Received wants checking against the
 * payment; paid and unsent wants sending; a Printful draft wants confirming in
 * Printful. Everything else is either done or not his move.
 */
export function orderWaiting(order: OrderState): boolean {
  if (order.status === 'received') return true;
  if (order.status !== 'paid') return false;
  return order.printful_id === null || order.printful_status === 'draft';
}
