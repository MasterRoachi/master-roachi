// The contract between this Worker and pay.masterroachi.com, the one till for
// every project (his ruling, 2026-11-10). Written on pay's side and copied
// here unchanged; it carries no data, only shapes.
//
// This Worker calls pay's `Till` entrypoint for a signed PayFast form, and pay
// calls this Worker's `Orders` entrypoint (worker/entry.ts) once PayFast says
// a payment went through. Both ride Service Bindings, so neither is reachable
// from the internet and no secret is shared.

export const PROJECT_ID = /^[a-z][a-z0-9]{1,15}$/;
export const ORDER_REF = /^[A-Za-z0-9_-]{1,64}$/;

export interface PaymentRequest {
  project: string;            // "store"
  ref: string;                // your order id, matching ORDER_REF
  amountCents: number;        // integer, 1..10_000_000, worked out by you
  itemName: string;           // 1-100 chars, shown on PayFast's page
  itemDescription?: string;   // <= 255
  returnUrl: string;          // https
  cancelUrl: string;          // https
  email?: string;             // passed into PayFast's form, never stored by pay
  nameFirst?: string;
  nameLast?: string;
}
export type PaymentResult =
  | { ok: true; action: string; fields: [string, string][] }   // POST these fields, in order, to action
  | { ok: false; error: string };
export interface TillRpc {
  // Same (project, ref) again while unpaid and for the same amount gives a fresh form for the same payment.
  // A different amount, or an order already paid, is refused: use a new ref.
  createPayment(req: PaymentRequest): Promise<PaymentResult>;
}

export interface PaidNotice {
  ref: string;
  pfPaymentId: string;        // the same on every retry
  grossCents: number;
  feeCents: number | null;    // positive
  paidAt: string;             // ISO
}
export type PaidResult =
  | { ok: true }                                     // recorded, or recorded already (idempotent)
  | { ok: false; retry: boolean; error: string };    // retry true -> pay answers PayFast 5xx; false -> a task for him
export interface OrdersRpc {
  markPaid(notice: PaidNotice): Promise<PaidResult>; // refuse (retry: false) if grossCents isn't the order's total
}
