// pay's word that a store order was paid.
//
// pay has already believed PayFast: signature, source, validate, merchant and
// amount against its own record of what was asked. This is the second check,
// on this side, against the order as this Worker stored it. A total that
// differs is refused outright, not retried: no retry would make it right, so
// it is a task for him.
//
// Kept apart from worker/index.ts so it can be tested without the
// `cloudflare:workers` import that the entrypoint class needs.

import type { D1Database } from './db';
import { ORDER_REF, type PaidNotice, type PaidResult } from './till-rpc';

export async function markOrderPaid(db: D1Database | undefined, notice: PaidNotice): Promise<PaidResult> {
  // No database is this Worker's fault, and passes: retry.
  if (!db) return { ok: false, retry: true, error: 'No database bound.' };

  const ref = typeof notice?.ref === 'string' ? notice.ref : '';
  const pfPaymentId = typeof notice?.pfPaymentId === 'string' ? notice.pfPaymentId.slice(0, 64) : '';
  if (!ORDER_REF.test(ref) || !pfPaymentId || !Number.isInteger(notice.grossCents)) {
    return { ok: false, retry: false, error: 'Malformed notice.' };
  }

  // A D1 failure throws from here, and pay answers PayFast 5xx so it retries.
  const order = await db
    .prepare('select ref, total, pf_payment_id from orders where ref = ?1')
    .bind(ref)
    .first<{ ref: string; total: number | null; pf_payment_id: string | null }>();
  if (!order || order.total === null) return { ok: false, retry: false, error: 'No such order.' };
  if (Math.round(order.total * 100) !== notice.grossCents) {
    return { ok: false, retry: false, error: 'Amount does not match the order total.' };
  }
  // Paid once already under another PayFast payment: two payments for one
  // order is his to sort out, never something to overwrite.
  if (order.pf_payment_id && order.pf_payment_id !== pfPaymentId) {
    return { ok: false, retry: false, error: 'Order already paid by another payment.' };
  }

  // The same statement the site's own notify endpoint runs: only Received
  // becomes Paid, so a repeated notice never moves a fulfilled order back.
  const paidAt = typeof notice.paidAt === 'string' && notice.paidAt ? notice.paidAt : new Date().toISOString();
  await db
    .prepare(
      `update orders set pf_payment_id = ?2,
              status = case when status = 'received' then 'paid' else status end,
              paid_at = coalesce(paid_at, ?3)
        where ref = ?1`,
    )
    .bind(order.ref, pfPaymentId, paidAt)
    .run();
  return { ok: true };
}
