import { POLL_ID, pollCandidates } from '../lib/poll';

/** The one hostname the site answers on; www redirects here. */
const APEX = 'masterroachi.com';

// The only server-side code on the site.
//
// Everything else is a static export served straight from out/. This Worker
// exists for one reason: a poll is shared mutable state — every visitor sees
// the same tally and can change it — and a static file cannot hold that. Only
// /api/vote reaches this code; every other request is served by the asset
// binding before the Worker is invoked at all.
//
// Turning it on needs a KV namespace bound as VOTES. Until one is, the API
// answers `configured: false` and the vote UI hides itself, so the site
// deploys and works exactly as before. See wrangler.jsonc.

// Types are declared here rather than by adding @cloudflare/workers-types,
// which installs globals that collide with the DOM lib this repo compiles
// against everywhere else. Only the handful of members actually used.
interface KVListResult {
  keys: { name: string }[];
  list_complete: boolean;
  cursor?: string;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<KVListResult>;
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  VOTES?: KVNamespace;
  /**
   * Where an order's delivery details go.
   *
   * PayFast's shareable links take money without asking where to send
   * anything, and the amount does not identify the size — R500 covers XS to
   * XL. So the address is collected here first, and the customer only reaches
   * PayFast once there is something to post to.
   */
  ORDERS?: KVNamespace;
  /**
   * Guards the order list. Without it /api/orders answers 404 rather than
   * handing anyone the customers' addresses — a missing secret must fail
   * closed, not open.
   */
  ORDERS_KEY?: string;
  /**
   * Salts the voter hash. Without it the hash of a given IP is guessable, so
   * someone could test whether a particular address had voted. Optional
   * because a missing salt should degrade rather than break; set it as a
   * Worker secret.
   */
  VOTE_SALT?: string;
}

/** Votes lapse after six months, so an abandoned poll empties itself. */
const VOTE_TTL = 60 * 60 * 24 * 180;

/**
 * How long a delivery address is kept.
 *
 * Six months: long enough to cover the order, a slow delivery and a return
 * inside the fault window, and short enough that this is not a permanent
 * archive of where customers live. Stated on /policies/ under Privacy, which
 * has to stay true.
 */
const ORDER_TTL = 60 * 60 * 24 * 180;

/** Caps on what an order may contain, so the store cannot be filled with junk. */
const FIELD_MAX = 200;
const ORDER_MAX_BYTES = 4096;

/**
 * A short, human-quotable reference.
 *
 * Read out over email between a customer and one person, so it avoids
 * characters that are argued about out loud: no 0/O, no 1/I.
 */
function reference(): string {
  const alphabet = 'ACDEFGHJKLMNPQRTUVWXY2346789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** Trimmed, length-capped, and never trusted to be a string in the first place. */
function field(value: unknown, max = FIELD_MAX): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // A tally cached at the edge would show a stale count to the person who
      // just changed it.
      'cache-control': 'no-store',
    },
  });
}

/**
 * A pseudonymous key for one voter.
 *
 * Derived from the address and user agent, salted and hashed. The raw address
 * is never stored — only this digest — so the KV namespace holds no personal
 * data, and there is nothing to leak if it is ever dumped. It is not
 * authentication: it stops casual double-voting, not someone determined to
 * change networks. That trade is deliberate, because the alternative is making
 * people create an account to answer a question about video games.
 */
async function voterKey(request: Request, salt: string): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const ua = request.headers.get('User-Agent') ?? '';
  const bytes = new TextEncoder().encode(`${salt}:${ip}:${ua}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** `v:<poll>:<candidate>:<voter>` */
function voteKey(candidate: string, voter: string): string {
  return `v:${POLL_ID}:${candidate}:${voter}`;
}

/**
 * The tally.
 *
 * Counted from key names alone — the candidate is part of the key, so no
 * values are read and one vote is one key. That also means the count cannot
 * drift the way a single incremented counter would: KV has no atomic
 * increment, so two simultaneous voters doing read-modify-write on one number
 * would lose a vote.
 *
 * `list` lags a write by roughly 10-20 seconds in production, measured on the
 * live namespace — much longer than `get`, which reflects a write straight
 * away. That gap is invisible to the person voting, because `yours` comes from
 * `get` and the client applies its own change on top; it only means another
 * visitor sees a new vote within about half a minute. Worth knowing before
 * trusting these counts for anything that has to be immediate.
 *
 * Note that wrangler's local KV is strongly consistent, so this lag does not
 * appear in `wrangler dev` at all — it was only visible against the real
 * namespace after deploying.
 */
async function tally(kv: KVNamespace): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const candidate of pollCandidates) counts[candidate.id] = 0;

  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: `v:${POLL_ID}:`, cursor, limit: 1000 });
    for (const key of page.keys) {
      const id = key.name.split(':')[2];
      // Ignores votes for options since removed from the queue.
      if (id !== undefined && id in counts) counts[id] += 1;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return counts;
}

/** What this voter has already chosen, if anything. */
async function currentChoice(
  kv: KVNamespace,
  voter: string,
): Promise<string | null> {
  for (const candidate of pollCandidates) {
    if ((await kv.get(voteKey(candidate.id, voter))) !== null) {
      return candidate.id;
    }
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // One address for the site.
    //
    // www.masterroachi.com is a custom domain on this same Worker (see
    // wrangler.jsonc) and was serving every page at 200 alongside the apex,
    // so the whole site existed twice as far as a crawler is concerned. 301
    // rather than 302: this is permanent, and only a permanent redirect
    // consolidates ranking signals onto the surviving URL.
    //
    // The path and query are carried across, so a shared www link lands on the
    // page it named rather than the homepage.
    // One scheme, too.
    //
    // Cloudflare's "Always Use HTTPS" is the usual home for this, and it is
    // switched on — but the apex still answered plain HTTP with a 200, and a
    // dashboard setting that does not visibly take is not something to hang
    // the canonical URL on. Doing it here works regardless: if the edge
    // redirects first the Worker never sees the request, and if it does not,
    // this catches it. Cloudflare reports the visitor's original scheme in
    // CF-Visitor, since by the time it reaches the Worker the URL says https
    // either way.
    const scheme = request.headers.get('cf-visitor');
    const overHttp = scheme ? scheme.includes('"scheme":"http"') : false;

    if (url.hostname === `www.${APEX}` || overHttp) {
      url.hostname = url.hostname === `www.${APEX}` ? APEX : url.hostname;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // Static assets are matched before the Worker runs, so in practice only
    // unmatched paths arrive here. Anything that is not the API is handed
    // back to the asset binding, which serves the 404 page.
    //
    // Both /api/vote and /api/vote/ are accepted. next.config.mjs sets
    // trailingSlash: true, which is why every page on this site is served at a
    // slashed path — and the dev server normalises fetches the same way, so
    // the client's request arrives slashed there. Cloudflare's asset layer
    // happens not to redirect this path today, so matching only the bare form
    // works in production by luck rather than design: the moment anything
    // added the slash, voting would fail silently and the page would fall back
    // to a plain list with no error to explain it.
    const route = url.pathname.replace(/\/+$/, '');

    // --- an order's delivery details ---------------------------------------
    //
    // Written before the customer is sent to PayFast, because a shareable
    // payment link collects no address and its amount does not identify the
    // size. Nothing about money happens here: the sum is recorded as the
    // customer saw it, and PayFast decides what is actually charged.
    if (route === '/api/order') {
      if (request.method !== 'POST') return json({ error: 'POST only.' }, 405);

      const orders = env.ORDERS;
      // The buy flow treats this as non-fatal and sends the customer on to
      // PayFast regardless — the thank-you page then asks for the address by
      // email, which is where this started. Losing the convenience is better
      // than blocking a sale.
      if (!orders) return json({ stored: false, reason: 'not-configured' }, 200);

      const raw = await request.text();
      if (raw.length > ORDER_MAX_BYTES) {
        return json({ error: 'Too large.' }, 413);
      }

      let body: Record<string, unknown>;
      try {
        body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return json({ error: 'Expected a JSON body.' }, 400);
      }

      const order = {
        product: field(body.product),
        productId: field(body.productId, 32),
        size: field(body.size, 16),
        // What the page showed. Informational only — the payment link is a
        // fixed sum and this cannot change it.
        price: field(body.price, 32),
        name: field(body.name),
        email: field(body.email),
        phone: field(body.phone, 40),
        address: field(body.address, 600),
        note: field(body.note, 600),
      };

      if (!order.name || !order.email || !order.address || !order.size) {
        return json({ error: 'Name, email, address and size are required.' }, 400);
      }

      const ref = reference();
      await orders.put(
        `order:${new Date().toISOString()}:${ref}`,
        JSON.stringify({ ...order, ref, at: new Date().toISOString() }),
        { expirationTtl: ORDER_TTL },
      );

      return json({ stored: true, ref }, 200);
    }

    // --- reading them back --------------------------------------------------
    //
    // There is no admin page; this is the whole of it. Guarded by a secret
    // compared in full rather than by a prefix, and answering 404 rather than
    // 401 when it is wrong, so probing cannot tell the difference between a
    // bad key and no endpoint.
    if (route === '/api/orders') {
      const key = url.searchParams.get('key') ?? '';
      const expected = env.ORDERS_KEY ?? '';
      if (!expected || key !== expected) {
        return env.ASSETS.fetch(request);
      }

      const orders = env.ORDERS;
      if (!orders) return json({ configured: false, orders: [] }, 200);

      const page = await orders.list({ prefix: 'order:', limit: 200 });
      const rows = [];
      for (const entry of page.keys) {
        const value = await orders.get(entry.name);
        if (value) rows.push(JSON.parse(value));
      }
      // Newest first: the key carries an ISO timestamp, so this sorts by time.
      rows.reverse();
      return json({ configured: true, count: rows.length, orders: rows }, 200);
    }

    if (route !== '/api/vote') return env.ASSETS.fetch(request);

    const kv = env.VOTES;
    if (!kv) {
      return json(
        { configured: false, counts: {}, yours: null },
        // 200, not an error: the site is working exactly as intended, the
        // poll simply has no store yet. The page hides the UI and moves on.
        200,
      );
    }

    const voter = await voterKey(request, env.VOTE_SALT ?? 'master-roachi');

    if (request.method === 'GET') {
      return json({
        configured: true,
        counts: await tally(kv),
        yours: await currentChoice(kv, voter),
      });
    }

    if (request.method === 'POST') {
      let choice: unknown;
      try {
        choice = ((await request.json()) as { choice?: unknown })?.choice;
      } catch {
        return json({ error: 'Expected a JSON body.' }, 400);
      }

      // Validated against the queue rather than trusted, so a crafted request
      // cannot write arbitrary keys into the namespace.
      const picked = pollCandidates.find((c) => c.id === choice);
      if (!picked) return json({ error: 'Not one of the options.' }, 400);

      const prior = await currentChoice(kv, voter);
      let yours: string | null;

      if (prior === picked.id) {
        // Clicking a choice again takes the vote back.
        await kv.delete(voteKey(picked.id, voter));
        yours = null;
      } else {
        if (prior) await kv.delete(voteKey(prior, voter));
        await kv.put(voteKey(picked.id, voter), '1', {
          expirationTtl: VOTE_TTL,
        });
        yours = picked.id;
      }

      // KV is eventually consistent, so this tally may not yet include the
      // write above. The client applies its own change on top rather than
      // waiting for it to settle, which is why `yours` is authoritative here
      // and the counts are only a baseline.
      return json({ configured: true, counts: await tally(kv), yours });
    }

    return json({ error: 'Method not allowed.' }, 405);
  },
};
