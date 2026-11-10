// The Worker's entry, as wrangler.jsonc names it.
//
// The site itself is worker/index.ts, re-exported unchanged as the default.
// This file adds the one thing index.ts cannot hold: a named RPC entrypoint,
// which has to extend WorkerEntrypoint from `cloudflare:workers` — an import
// that only exists inside the Workers runtime, so it would stop the worker
// tests (scripts/worker-test.mjs) from loading index.ts under Node.

import { WorkerEntrypoint } from 'cloudflare:workers';
import type { D1Database } from './db';
import { markOrderPaid } from './orders';
import type { OrdersRpc, PaidNotice, PaidResult } from './till-rpc';

export { default } from './index';

/**
 * Reached only by pay.masterroachi.com, through its ORDERS_STORE Service
 * Binding: an entrypoint has no URL, so nothing on the internet can call it.
 */
export class Orders extends WorkerEntrypoint<{ DB?: D1Database }> implements OrdersRpc {
  async markPaid(notice: PaidNotice): Promise<PaidResult> {
    return markOrderPaid(this.env.DB, notice);
  }
}
