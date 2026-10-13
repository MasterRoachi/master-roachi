import { POLL_ID, pollCandidates } from '../lib/poll';
import { moveCard, readAccount, type TrelloCreds, whoAmI } from './trello';
import {
  headCommit,
  listFiles,
  readFile,
  rebuild,
  slugify,
  statFile,
  writeBytes,
  writeFile,
  writeFiles,
} from './github';
import { collectionFor, newPath, pathAllowed, setDraft } from '../lib/collections';
import { isDay, isMonth, localDay, monthDays, type D1Database } from './db';
import { outlineSize, parseOutline } from '../lib/outline';
import { validIconName } from '../lib/habit-icons';
import {
  allowance,
  freshScheduling,
  isCardKind,
  ratingFor,
  review,
  type Card,
} from '../lib/cards';
import { isEmptyNote, noteHeight, parseNote } from '../lib/card-note';
import { postFor, slugFor } from '../lib/book-post';
import type { WorkHubPayload } from '../lib/work-hub';
import { fetchCatalogue, mergeCatalogue, SYNCED_KEYS } from '../lib/printful';
import { joinFile, readScalar, setScalar, splitFile } from '../lib/frontmatter';

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

/**
 * The two members the cron handler uses, declared for the same reason as the
 * KV ones above: @cloudflare/workers-types installs globals that collide with
 * the DOM lib this repo compiles against everywhere else.
 *
 * `waitUntil` is the one that matters — a scheduled handler that returns
 * before its work finishes has its work cancelled, and the symptom would be a
 * post that publishes only sometimes.
 */
interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
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

  /**
   * Trello, personal account — Command and the three game boards.
   *
   * A key identifies the integration, a token authorises one account, and
   * together they are full access to that account. Both are Worker secrets:
   *
   *   npx wrangler secret put TRELLO_KEY
   *   npx wrangler secret put TRELLO_TOKEN
   *
   * Missing either one makes /api/work answer `configured: false`, and the
   * hub explains itself instead of looking broken.
   */
  TRELLO_KEY?: string;
  TRELLO_TOKEN?: string;

  /**
   * Printful, for the Sync button on /work/store.
   *
   * The build script reads the same token from .env.local, but the build has
   * never had it — data/store.json sat committed and a month stale while
   * every deploy politely bailed with "PRINTFUL_TOKEN not set". So the sync
   * had to be something the Worker could do on its own.
   *
   *   npx wrangler secret put PRINTFUL_TOKEN
   *   npx wrangler secret put PRINTFUL_STORE_ID   # account-level tokens only
   *
   * Read-only in practice: it lists products and prices. Missing it makes the
   * Sync button report that it is not configured rather than fail.
   */
  PRINTFUL_TOKEN?: string;
  PRINTFUL_STORE_ID?: string;

  /**
   * Commits content to the repo, which publishes it.
   *
   * The most powerful secret here by a distance: Workers Builds deploys on
   * push, so anything committed with this goes live by itself. A fine-grained
   * token, this repository only, Contents: read and write, nothing else.
   *
   *   npx wrangler secret put GITHUB_TOKEN
   *
   * Absent means the editor says it is not connected rather than breaking.
   */
  GITHUB_TOKEN?: string;

  /**
   * The backend's own data — habits now, the other trackers next.
   *
   * Not in git: a daily tick is not worth a commit, and a year of them would
   * be a year of deploys. Optional because the binding is commented out in
   * wrangler.jsonc until the database is created, and every tracker says it is
   * not set up rather than erroring.
   */
  DB?: D1Database;
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

/**
 * How big an uploaded image may be.
 *
 * The bytes cross the Worker and then the GitHub API, and land in the repo
 * forever — git keeps every version of a binary at full size, so a habit of
 * replacing an 8MB mockup is a repository nobody wants to clone. The browser
 * converts to WebP before sending, which puts a product mockup comfortably
 * under this.
 */
const UPLOAD_LIMIT = 2_000_000;

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

    // --- the work hub -------------------------------------------------------
    //
    // What is next, per project, read live from Trello on every request. See
    // lib/work-hub.ts for why none of it is cached.
    //
    // THE GATE IS CLOUDFLARE ACCESS, not this code. An Access application has
    // to cover BOTH /work* and /api/work — protecting only the page would
    // leave the JSON, which is the whole of the data, served to anyone who
    // guessed the path.
    //
    // The header check below is a second lock, not the first. Cloudflare
    // overwrites client-supplied CF-* headers at the edge, so its presence
    // means the request came through Access; its absence means it did not.
    // This deliberately does not verify the JWT's signature, which would need
    // the team's public keys fetched and cached — so treat it as a backstop
    // that catches a misconfigured Access path, and not as authentication.
    // Answering with the 404 page rather than 401 keeps the endpoint
    // indistinguishable from one that was never there.
    if (route === '/api/work') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);

      /* Moving a card, which is the hub's only write.
       *
       * On the same route as the read rather than a route of its own: it is
       * the same resource and the same credentials, and every endpoint added
       * under /work has to be covered by the Access policy, which matches on
       * the path prefix. One fewer path is one fewer thing to get wrong.
       */
      if (request.method === 'POST') {
        const creds =
          env.TRELLO_KEY && env.TRELLO_TOKEN
            ? { key: env.TRELLO_KEY, token: env.TRELLO_TOKEN }
            : null;
        if (!creds) return json({ error: 'no Trello credentials' }, 200);

        const body = (await request.json().catch(() => null)) as {
          card?: unknown;
          list?: unknown;
        } | null;
        // Trello ids are 24 hex characters. Checked rather than passed
        // through: this is a bearer credential for a whole account, and an
        // id straight off the wire into a URL is how that becomes somebody
        // else's request.
        const isId = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);
        if (!body || !isId(body.card) || !isId(body.list)) {
          return json({ error: 'needs a card and a list' }, 400);
        }

        try {
          await moveCard(body.card as string, body.list as string, creds);
          return json({ moved: true }, 200);
        } catch (error) {
          return json({ error: String(error instanceof Error ? error.message : error) }, 502);
        }
      }

      const creds: TrelloCreds | null =
        env.TRELLO_KEY && env.TRELLO_TOKEN
          ? { key: env.TRELLO_KEY, token: env.TRELLO_TOKEN }
          : null;

      if (!creds) {
        const empty: WorkHubPayload = {
          configured: false,
          account: null,
          seen: [],
          boards: [],
          unmatched: [],
          fetchedAt: new Date().toISOString(),
          errors: [],
        };
        return json(empty, 200);
      }

      // Both together: the boards, and who the token is. Asking who costs one
      // request and settles the question the boards alone cannot — whether a
      // board full of sample cards is a stale board on the right account or
      // the right board on the wrong one.
      const [{ boards, unmatched, errors, seen }, account] = await Promise.all([
        readAccount(creds),
        whoAmI(creds).catch(() => null),
      ]);

      const payload: WorkHubPayload = {
        configured: true,
        account,
        seen,
        boards,
        unmatched,
        fetchedAt: new Date().toISOString(),
        errors,
      };
      return json(payload, 200);
    }

    // --- the backend's content API -----------------------------------------
    //
    // Under /work/api/ on purpose. The Access application covers the path
    // `work` as a PREFIX, so everything the backend ever adds under here is
    // protected by the one rule he has already configured — no going back to
    // the Zero Trust dashboard per endpoint, and no endpoint that is live
    // before its policy is.
    if (route === '/work/api/content') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);

      const token = env.GITHUB_TOKEN;
      if (!token) return json({ configured: false, files: [] }, 200);

      try {
        if (request.method === 'GET') {
          const collection = collectionFor(url.searchParams.get('collection'));
          if (!collection) return json({ error: 'unknown collection' }, 400);

          const wanted = url.searchParams.get('path');

          if (wanted === null) {
            // A single-file collection has nothing to list, so it reports
            // itself as its own only entry and the page needs no special case.
            const files = collection.singleFile
              ? [{ path: collection.singleFile, sha: '' }]
              : (
                  await Promise.all(
                    collection.exts.map((ext) =>
                      // A missing directory is an empty collection, not an
                      // error: notes/ does not exist until the first note.
                      listFiles(token, collection.dir, ext).catch(() => []),
                    ),
                  )
                )
                  .flat()
                  .sort((a, b) => a.path.localeCompare(b.path));
            return json({ configured: true, files }, 200);
          }

          const path = pathAllowed(collection, wanted);
          if (!path) return json({ error: 'not a path in this collection' }, 400);

          // A binary file reports whether it is there and which version it
          // is, and never its contents: pushing a WebP through fromBase64()
          // and a TextDecoder hands back a mangled string, and the uploader
          // has no use for the bytes it just sent anyway.
          if (collection.binary) {
            const sha = await statFile(token, path);
            return json({ configured: true, file: sha ? { path, sha } : null }, 200);
          }

          return json({ configured: true, file: await readFile(token, path) }, 200);
        }

        if (request.method === 'POST') {
          const body = (await request.json().catch(() => null)) as {
            collection?: string;
            path?: string;
            title?: string;
            text?: string;
            /** base64, for a binary collection. Never both this and text. */
            content?: string;
            sha?: string;
            draft?: boolean;
          } | null;
          if (!body) return json({ error: 'malformed body' }, 400);

          const collection = collectionFor(body.collection);
          if (!collection) return json({ error: 'unknown collection' }, 400);

          /* An upload, which is a different shape of save.
           *
           * Handled before anything text-related so the two paths cannot mix:
           * a base64 string handed to writeFile() would be encoded a second
           * time and commit something that looks like a successful upload and
           * is not an image.
           *
           * The Worker does not decode or parse the bytes. It checks the path
           * against the allow-list, checks the size, and trusts the browser
           * for the rest — a corrupt image is a broken picture on one page,
           * while decoding arbitrary uploads in the Worker is a much worse
           * class of problem.
           */
          if (collection.binary) {
            const content = typeof body.content === 'string' ? body.content.replace(/\s/g, '') : '';
            if (!content) return json({ error: 'nothing to upload' }, 400);
            if (!/^[A-Za-z0-9+/]+={0,2}$/.test(content)) {
              return json({ error: 'that is not base64' }, 400);
            }
            // 4 base64 characters carry 3 bytes. Capped because the whole file
            // crosses the Worker and then the GitHub API, and because an
            // 8MB mockup helps nobody on a product page.
            const bytes = Math.floor((content.length * 3) / 4);
            if (bytes > UPLOAD_LIMIT) {
              return json(
                { error: `too big — ${(bytes / 1e6).toFixed(1)}MB, limit is ${UPLOAD_LIMIT / 1e6}MB` },
                400,
              );
            }

            const target = pathAllowed(collection, body.path);
            if (!target) return json({ error: 'not a path in this collection' }, 400);

            const name = target.split('/').pop();
            const { commit } = await writeBytes(
              token,
              target,
              content,
              body.sha ? `Replace ${name}` : `Add ${name}`,
              body.sha,
            );
            return json({ saved: true, path: target, commit, bytes }, 200);
          }

          let text = typeof body.text === 'string' ? body.text : '';
          if (!text.trim()) return json({ error: 'nothing to save' }, 400);

          const path =
            pathAllowed(collection, body.path) ??
            (collection.singleFile
              ? null
              : pathAllowed(collection, newPath(collection, slugify(String(body.title ?? '')))));
          if (!path) return json({ error: 'need a usable title' }, 400);

          // The draft flag is applied here as well as in the editor, so that
          // publishing is a property of the save rather than of whether the
          // page remembered to rewrite the text first.
          if (typeof body.draft === 'boolean' && path.endsWith('.mdx')) {
            text = setDraft(text, body.draft);
          }

          // Malformed JSON would commit cleanly and then fail the build, which
          // leaves the old site up and no obvious cause. Cheaper to refuse.
          if (path.endsWith('.json')) {
            try {
              JSON.parse(text);
            } catch {
              return json({ error: 'that is not valid JSON' }, 400);
            }
          }


          const name = path.split('/').pop();
          const message = body.sha ? `Update ${name}` : `Add ${name}`;

          const { commit } = await writeFile(token, path, text, message, body.sha);
          return json({ saved: true, path, commit }, 200);
        }

        return json({ error: 'method not allowed' }, 405);
      } catch (error) {
        const message = String(error instanceof Error ? error.message : error);
        return json({ error: message }, message.startsWith('conflict') ? 409 : 502);
      }
    }

    // --- reordering a collection --------------------------------------------
    //
    // `weight` is what orders the projects grid, and it lives in each
    // project's own frontmatter. So putting six projects in a new order
    // changes six files, and six saves would be six commits, six pushes and
    // six two-minute deploys for one decision. One commit instead.
    //
    // The EXISTING weights are redistributed into the new order rather than
    // renumbered from scratch. Renumbering would rewrite every file the first
    // time anything moved and throw away the numbers he chose; this way,
    // swapping two neighbours swaps two numbers and writes two files.
    if (route === '/work/api/reorder') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

      const token = env.GITHUB_TOKEN;
      if (!token) return json({ configured: false }, 200);

      const body = (await request.json().catch(() => null)) as {
        collection?: string;
        order?: unknown;
      } | null;
      if (!body) return json({ error: 'malformed body' }, 400);

      const collection = collectionFor(body.collection);
      if (!collection) return json({ error: 'unknown collection' }, 400);

      const order = Array.isArray(body.order) ? body.order : null;
      if (!order || order.length === 0) return json({ error: 'nothing to order' }, 400);
      // Every path through the same guard as any other write. An ordering is
      // still a list of files being rewritten.
      const paths = order.map((candidate) => pathAllowed(collection, candidate));
      if (paths.some((path) => path === null)) {
        return json({ error: 'not a path in this collection' }, 400);
      }

      try {
        const files = await Promise.all(
          (paths as string[]).map(async (path) => {
            const file = await readFile(token, path);
            const split = splitFile(file.text);
            return { path, file, split };
          }),
        );

        // A file with no frontmatter has no weight to set, and inventing one
        // would be writing a field into a file that does not use them.
        if (files.some((entry) => entry.split === null)) {
          return json({ error: 'one of those files has no frontmatter' }, 400);
        }

        const weights = files
          .map((entry) => Number(readScalar(entry.split!.frontmatter, 'weight')))
          .map((weight) => (Number.isFinite(weight) ? weight : 0))
          .sort((a, b) => b - a);

        const changed: { path: string; text: string }[] = [];
        files.forEach((entry, at) => {
          const want = String(weights[at]);
          if (readScalar(entry.split!.frontmatter, 'weight') === want) return;
          changed.push({
            path: entry.path,
            text: joinFile({
              ...entry.split!,
              frontmatter: setScalar(entry.split!.frontmatter, 'weight', want),
            }),
          });
        });

        if (changed.length === 0) return json({ reordered: true, written: 0, commit: '' }, 200);

        const { commit, written } = await writeFiles(
          token,
          changed,
          `Reorder ${collection.label.toLowerCase()}`,
        );
        return json({ reordered: true, written, commit }, 200);
      } catch (error) {
        const message = String(error instanceof Error ? error.message : error);
        return json({ error: message }, message.startsWith('conflict') ? 409 : 502);
      }
    }

    // --- syncing the store from Printful ------------------------------------
    //
    // The catalogue is baked at build time, and the build cannot refresh it:
    // scripts/printful.mjs needs PRINTFUL_TOKEN and the build has never had
    // it, so every deploy bailed with "keeping the committed data/store.json"
    // and the committed file went a month stale. This is the Sync button, and
    // it is why the shaping moved to lib/printful.ts — the same code the build
    // script runs, so the two cannot drift.
    //
    // It commits data/store.json and the push rebuilds the site, which is the
    // same route every other edit in this backend takes.
    if (route === '/work/api/store-sync') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

      const token = env.GITHUB_TOKEN;
      const printful = env.PRINTFUL_TOKEN;
      // Reported rather than failed, so the button can explain itself: a
      // missing secret is a setup step, not a breakage.
      if (!token || !printful) {
        return json(
          {
            configured: false,
            needs: [!printful && 'PRINTFUL_TOKEN', !token && 'GITHUB_TOKEN'].filter(Boolean),
          },
          200,
        );
      }

      const log: string[] = [];
      try {
        const fresh = await fetchCatalogue({
          token: printful,
          storeId: env.PRINTFUL_STORE_ID ?? null,
          log: (line) => log.push(line),
        });

        // What is committed now, both to merge onto and to compare against.
        const current = await readFile(token, 'data/store.json').catch(() => null);
        const existing = current ? (JSON.parse(current.text) as Record<string, unknown>) : null;
        const payload = mergeCatalogue(fresh, existing as any);

        /* Compared on the synced keys only, and with fetchedAt ignored.
         *
         * Otherwise every press commits — the timestamp always moves — and a
         * commit is a deploy, so a button that reported "synced" would cost
         * two minutes of build every time it was pressed out of curiosity.
         * Same reasoning as writeSnapshot() on the build side, and the same
         * key list, so the two agree about what a change is. */
        const settle = (snap: any) =>
          JSON.stringify({
            store: snap?.store ?? null,
            products: (snap?.products ?? []).map((product: any) =>
              Object.fromEntries(SYNCED_KEYS.map((k) => [k, product[k] ?? null])),
            ),
          });

        const changed = settle(existing) !== settle(payload);
        let commit = '';
        if (changed) {
          const written = await writeFile(
            token,
            'data/store.json',
            JSON.stringify(payload, null, 2) + '\n',
            `Sync the store: ${payload.products.length} products`,
            current?.sha,
          );
          commit = written.commit;
        }

        return json(
          {
            configured: true,
            synced: true,
            changed,
            commit,
            products: payload.products.length,
            fetchedAt: payload.fetchedAt,
            log,
          },
          200,
        );
      } catch (error) {
        const message = String(error instanceof Error ? error.message : error);
        return json(
          { configured: true, synced: false, error: message, log },
          message.startsWith('conflict') ? 409 : 502,
        );
      }
    }

    // --- is what he is looking at live -------------------------------------
    //
    // Answers "did the last rebuild land" without a Cloudflare credential.
    // Every build stamps its commit into /version.json, so comparing that
    // against the newest commit on main says whether the deployed site is
    // current — and catches a FAILED build as well as one still running,
    // which asking Cloudflare for the last build's status would not.
    if (route === '/work/api/version') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);

      const token = env.GITHUB_TOKEN;

      // The deployed stamp comes from the asset binding rather than over the
      // network: this Worker IS the deployment, so its own assets are the
      // truth about what is live, and a fetch to the public URL could be
      // answered by a cache.
      let live: string | null = null;
      try {
        const stamp = await env.ASSETS.fetch(
          new Request(`https://${APEX}/version.json`),
        );
        if (stamp.ok) {
          const parsed = (await stamp.json()) as { commit?: string };
          live = typeof parsed.commit === 'string' ? parsed.commit : null;
        }
      } catch {
        live = null;
      }

      let head: string | null = null;
      if (token) {
        head = await headCommit(token).catch(() => null);
      }

      return json(
        {
          live,
          head,
          // Unknown is its own answer: an older build with no stamp in it
          // must not read as out of date.
          current: live !== null && head !== null ? live === head : null,
        },
        200,
      );
    }

    // --- habits ------------------------------------------------------------
    //
    // Under /work/api/ with the rest of the backend, so the one Access policy
    // covers it.
    if (route === '/work/api/habits') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);

      const db = env.DB;
      if (!db) return json({ configured: false, habits: [], ticks: {} }, 200);

      const today = localDay();

      try {
        if (request.method === 'GET') {
          // One calendar month, because that is what the page draws: a year of
          // ticks is not worth sending to render thirty-one columns. An
          // unparseable month falls back to the current one rather than
          // erroring — the page is readable either way.
          const asked = url.searchParams.get('month');
          const month = isMonth(asked) ? asked : today.slice(0, 7);
          const days = monthDays(month);

          const habits = await db
            .prepare(
              `select id, name, cadence, target, icon from habits
               where archived = 0 order by position, id`,
            )
            .all();

          const ticks = await db
            .prepare(
              `select habit_id, day from habit_ticks
               where day >= ?1 and day <= ?2 order by day`,
            )
            .bind(days[0], days[days.length - 1])
            .all<{ habit_id: number; day: string }>();

          const byHabit: Record<string, string[]> = {};
          for (const row of ticks.results) {
            (byHabit[String(row.habit_id)] ??= []).push(row.day);
          }

          // Which years the page offers. From the earliest thing that exists —
          // a tick, or a habit that was created before its first tick — through
          // the current year, so the list grows on its own and never shows a
          // year with nothing in it.
          const earliest = await db
            .prepare(
              `select min(d) as first from (
                 select min(day) as d from habit_ticks
                 union all
                 select min(substr(created_at, 1, 10)) as d from habits
               ) where d is not null`,
            )
            .first<{ first: string | null }>();

          const firstYear = Number((earliest?.first ?? today).slice(0, 4));
          const thisYear = Number(today.slice(0, 4));
          const years: number[] = [];
          for (let year = firstYear; year <= thisYear; year += 1) years.push(year);

          return json(
            {
              configured: true,
              habits: habits.results,
              ticks: byHabit,
              month,
              days,
              today,
              years: years.length > 0 ? years : [thisYear],
            },
            200,
          );
        }

        if (request.method === 'POST') {
          const body = (await request.json().catch(() => null)) as {
            action?: string;
            id?: number;
            day?: string;
            name?: string;
            cadence?: string;
            target?: number;
            icon?: string;
          } | null;
          if (!body) return json({ error: 'malformed body' }, 400);

          if (body.action === 'toggle') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which habit' }, 400);

            const day = body.day === undefined ? today : body.day;
            if (!isDay(day)) return json({ error: 'not a date' }, 400);
            // Refused rather than clamped. Ticking tomorrow is always a
            // mistake — usually a timezone one — and silently moving it to
            // today would hide that.
            if (day > today) return json({ error: 'that day has not happened' }, 400);

            // The primary key makes this idempotent, so a toggle is a delete
            // if it was there and an insert if it was not.
            const existing = await db
              .prepare(`select 1 as hit from habit_ticks where habit_id = ?1 and day = ?2`)
              .bind(id, day)
              .first();

            if (existing) {
              await db
                .prepare(`delete from habit_ticks where habit_id = ?1 and day = ?2`)
                .bind(id, day)
                .run();
              return json({ ticked: false, id, day }, 200);
            }

            await db
              .prepare(`insert into habit_ticks (habit_id, day) values (?1, ?2)`)
              .bind(id, day)
              .run();
            return json({ ticked: true, id, day }, 200);
          }

          if (body.action === 'add') {
            const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
            if (!name) return json({ error: 'needs a name' }, 400);

            const cadence = body.cadence === 'weekly' ? 'weekly' : 'daily';
            // A target belongs to a weekly habit and nothing else, so a daily
            // one is stored with null rather than with 7 — see the migration.
            const target =
              cadence === 'weekly'
                ? Math.min(Math.max(Number(body.target) || 1, 1), 7)
                : null;

            await db
              .prepare(
                `insert into habits (name, cadence, target, icon, position, created_at)
                 values (?1, ?2, ?3, ?4, (select coalesce(max(position), 0) + 1 from habits), ?5)`,
              )
              // Checked against the set rather than stored as given: an
              // unknown name would render as a blank cell with nothing saying
              // why.
              .bind(name, cadence, target, validIconName(body.icon), new Date().toISOString())
              .run();
            return json({ added: true }, 200);
          }

          if (body.action === 'icon') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which habit' }, 400);
            await db
              .prepare(`update habits set icon = ?2 where id = ?1`)
              .bind(id, validIconName(body.icon))
              .run();
            return json({ updated: true, id }, 200);
          }

          if (body.action === 'archive') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which habit' }, 400);
            // Archived, never deleted: the ticks are history and a cascade
            // would take years of them with it.
            await db.prepare(`update habits set archived = 1 where id = ?1`).bind(id).run();
            return json({ archived: true, id }, 200);
          }

          return json({ error: 'unknown action' }, 400);
        }

        return json({ error: 'method not allowed' }, 405);
      } catch (error) {
        return json({ error: String(error instanceof Error ? error.message : error) }, 502);
      }
    }

    // --- reading -----------------------------------------------------------
    if (route === '/work/api/reading') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);

      const db = env.DB;
      if (!db) return json({ configured: false, books: [] }, 200);

      const STATUSES = ['want', 'reading', 'read', 'abandoned'];

      try {
        if (request.method === 'GET') {
          const books = await db
            .prepare(
              `select id, title, author, status, pages, page,
                      started_on, finished_on, rating, notes, post_path
               from books order by status, id desc`,
            )
            .all();
          return json({ configured: true, books: books.results, today: localDay() }, 200);
        }

        if (request.method === 'POST') {
          const body = (await request.json().catch(() => null)) as {
            action?: string;
            id?: number;
            title?: string;
            author?: string;
            status?: string;
            pages?: number | null;
            page?: number | null;
            rating?: number | null;
            notes?: string;
          } | null;
          if (!body) return json({ error: 'malformed body' }, 400);

          if (body.action === 'add') {
            const title = typeof body.title === 'string' ? body.title.trim().slice(0, 300) : '';
            if (!title) return json({ error: 'needs a title' }, 400);
            const author =
              typeof body.author === 'string' && body.author.trim()
                ? body.author.trim().slice(0, 200)
                : null;
            const status = STATUSES.includes(String(body.status)) ? String(body.status) : 'want';

            await db
              .prepare(
                `insert into books (title, author, status, started_on, created_at)
                 values (?1, ?2, ?3, ?4, ?5)`,
              )
              // Added straight to 'reading' means it was started today, which
              // is the only sensible reading of that.
              .bind(title, author, status, status === 'reading' ? localDay() : null, new Date().toISOString())
              .run();
            return json({ added: true }, 200);
          }

          if (body.action === 'update') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which book' }, 400);

            const current = await db
              .prepare(`select status, started_on, finished_on from books where id = ?1`)
              .bind(id)
              .first<{ status: string; started_on: string | null; finished_on: string | null }>();
            if (!current) return json({ error: 'no such book' }, 404);

            const status = STATUSES.includes(String(body.status))
              ? String(body.status)
              : current.status;

            // Dates are stamped on the first transition into a state and never
            // cleared automatically. Moving a book back to 'reading' to add a
            // few pages must not erase the day it was finished — that is a
            // fact, and an undo is not worth losing it over.
            const started =
              current.started_on ??
              (status === 'reading' || status === 'read' ? localDay() : null);
            const finished =
              current.finished_on ?? (status === 'read' ? localDay() : null);

            const clamp = (value: unknown, max: number): number | null => {
              const n = Number(value);
              return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), max) : null;
            };

            const rating =
              body.rating === null
                ? null
                : body.rating === undefined
                  ? undefined
                  : Math.min(Math.max(Math.floor(Number(body.rating)) || 1, 1), 5);

            await db
              .prepare(
                `update books set
                   status = ?2,
                   pages = coalesce(?3, pages),
                   page = coalesce(?4, page),
                   started_on = ?5,
                   finished_on = ?6,
                   rating = case when ?7 = 1 then ?8 else rating end,
                   notes = coalesce(?9, notes)
                 where id = ?1`,
              )
              .bind(
                id,
                status,
                clamp(body.pages, 100000),
                clamp(body.page, 100000),
                started,
                finished,
                rating === undefined ? 0 : 1,
                rating ?? null,
                typeof body.notes === 'string' ? body.notes.slice(0, 4000) : null,
              )
              .run();
            return json({ updated: true, id, status }, 200);
          }

          // A book's notes, as a draft post on the site.
          //
          // Idempotent by design: a book that already became a post opens that
          // post instead of writing a second one. Without the guard, pressing
          // twice leaves a duplicate under a second slug and the site grows a
          // post nobody asked for.
          if (body.action === 'post') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which book' }, 400);

            const token = env.GITHUB_TOKEN;
            if (!token) return json({ error: 'GITHUB_TOKEN is not set' }, 400);

            const book = await db
              .prepare(
                `select title, author, pages, rating, started_on, finished_on, notes, post_path
                 from books where id = ?1`,
              )
              .bind(id)
              .first<{
                title: string;
                author: string | null;
                pages: number | null;
                rating: number | null;
                started_on: string | null;
                finished_on: string | null;
                notes: string | null;
                post_path: string | null;
              }>();
            if (!book) return json({ error: 'no such book' }, 404);

            if (book.post_path) {
              return json({ already: true, path: book.post_path }, 200);
            }
            // Nothing to post is not an error worth a 500, but it is not a
            // post either — an empty draft would be a file to go and delete.
            if (!book.notes?.trim()) {
              return json({ error: 'write something about it first' }, 400);
            }

            const slug = slugFor(book.title);
            if (!slug) return json({ error: 'that title does not make a filename' }, 400);
            const path = `content/writing/${slug}.mdx`;

            await writeFile(
              token,
              path,
              postFor(book, localDay()),
              `Add ${slug}.mdx from the reading notes`,
            );

            await db
              .prepare(`update books set post_path = ?2 where id = ?1`)
              .bind(id, path)
              .run();

            return json({ posted: true, path }, 200);
          }

          if (body.action === 'remove') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which book' }, 400);
            // Deleted, unlike a habit. A habit's ticks are years of history;
            // a book row is one line, and a mistyped title is worth removing
            // rather than keeping forever. Giving up on a book is 'abandoned'.
            await db.prepare(`delete from books where id = ?1`).bind(id).run();
            return json({ removed: true, id }, 200);
          }

          return json({ error: 'unknown action' }, 400);
        }

        return json({ error: 'method not allowed' }, 405);
      } catch (error) {
        return json({ error: String(error instanceof Error ? error.message : error) }, 502);
      }
    }

    // --- curriculums -------------------------------------------------------
    //
    // Three levels: curriculum, module, lesson. A lesson's completion is a
    // date rather than a flag, for the reason given in the migration.
    if (route === '/work/api/curriculums') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);

      const db = env.DB;
      if (!db) return json({ configured: false, curriculums: [] }, 200);

      const text = (value: unknown, max = 300): string =>
        typeof value === 'string' ? value.trim().slice(0, max) : '';

      try {
        if (request.method === 'GET') {
          // Four flat reads assembled here, rather than a join returning one
          // row per lesson with its curriculum's name repeated on every one.
          const [curriculums, modules, lessons, cardCounts, sources] = await Promise.all([
            db
              .prepare(
                `select id, name, source, status, position from curriculums
                 order by position, id`,
              )
              .all(),
            db
              .prepare(
                `select id, curriculum_id, name, position from modules
                 order by position, id`,
              )
              .all<{ id: number; curriculum_id: number; name: string }>(),
            db
              .prepare(
                `select id, module_id, name, position, done_on, detail
                 from lessons order by position, id`,
              )
              .all<{
              id: number;
              module_id: number;
              name: string;
              done_on: string | null;
              detail: string | null;
            }>(),
            db
              .prepare(
                `select curriculum_id, count(*) as n from cards group by curriculum_id`,
              )
              .all<{ curriculum_id: number; n: number }>(),
            db
              .prepare(
                `select id, curriculum_id, lesson_id, title, url, note, position from sources
                 order by position, id`,
              )
              .all<{
              id: number;
              curriculum_id: number;
              lesson_id: number | null;
              title: string;
              url: string | null;
              note: string | null;
            }>(),
          ]);

          const cards = new Map<number, number>();
          for (const row of cardCounts.results) {
            cards.set(Number(row.curriculum_id), Number(row.n));
          }

          /* Sources at their two grains, split by whether they name a lesson.
           * Null is the curriculum's own list, shown under every lesson; set
           * belongs to that one lesson. See migration 0009. */
          const sourcesByCurriculum = new Map<number, unknown[]>();
          const sourcesByLesson = new Map<number, unknown[]>();
          for (const source of sources.results) {
            const { lesson_id, ...rest } = source;
            // `== null`, which takes undefined with it. A strict check against
            // null puts every row in the lesson bucket the moment the column
            // is missing from a read, and the symptom is a Sources card that
            // has quietly gone empty everywhere.
            if (lesson_id == null) {
              if (!sourcesByCurriculum.has(source.curriculum_id)) {
                sourcesByCurriculum.set(source.curriculum_id, []);
              }
              sourcesByCurriculum.get(source.curriculum_id)!.push(rest);
            } else {
              if (!sourcesByLesson.has(lesson_id)) sourcesByLesson.set(lesson_id, []);
              sourcesByLesson.get(lesson_id)!.push(rest);
            }
          }

          const lessonsByModule = new Map<number, unknown[]>();
          for (const lesson of lessons.results) {
            if (!lessonsByModule.has(lesson.module_id)) lessonsByModule.set(lesson.module_id, []);
            // Attached only where there are some. An empty array on every
            // lesson is a few bytes each and this payload is every lesson of
            // every curriculum — it is already the largest thing the backend
            // sends, and the curriculums are about to grow by an order.
            const own = sourcesByLesson.get(lesson.id);
            lessonsByModule.get(lesson.module_id)!.push(own ? { ...lesson, sources: own } : lesson);
          }

          const modulesByCurriculum = new Map<number, unknown[]>();
          for (const module of modules.results) {
            if (!modulesByCurriculum.has(module.curriculum_id)) {
              modulesByCurriculum.set(module.curriculum_id, []);
            }
            modulesByCurriculum
              .get(module.curriculum_id)!
              .push({ ...module, lessons: lessonsByModule.get(module.id) ?? [] });
          }

          return json(
            {
              configured: true,
              today: localDay(),
              curriculums: curriculums.results.map((c) => ({
                ...c,
                modules: modulesByCurriculum.get(Number(c.id)) ?? [],
                sources: sourcesByCurriculum.get(Number(c.id)) ?? [],
                // Omitted rather than zero where there are none: the stage fan
                // tests this to decide whether to draw the gold Cards card,
                // and `cards: 0` would have it drawing a card saying 0.
                ...(cards.get(Number(c.id))
                  ? { cards: cards.get(Number(c.id)) }
                  : {}),
              })),
            },
            200,
          );
        }

        if (request.method === 'POST') {
          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!body) return json({ error: 'malformed body' }, 400);
          const action = String(body.action ?? '');

          if (action === 'add-curriculum') {
            const name = text(body.name);
            if (!name) return json({ error: 'needs a name' }, 400);
            await db
              .prepare(
                `insert into curriculums (name, source, position, created_at)
                 values (?1, ?2, (select coalesce(max(position), 0) + 1 from curriculums), ?3)`,
              )
              .bind(name, text(body.source, 500) || null, new Date().toISOString())
              .run();
            return json({ added: true }, 200);
          }

          if (action === 'add-module') {
            const id = Number(body.curriculum_id);
            const name = text(body.name);
            if (!Number.isInteger(id) || !name) return json({ error: 'needs a curriculum and a name' }, 400);
            await db
              .prepare(
                `insert into modules (curriculum_id, name, position)
                 values (?1, ?2, (select coalesce(max(position), 0) + 1 from modules where curriculum_id = ?1))`,
              )
              .bind(id, name)
              .run();
            return json({ added: true }, 200);
          }

          if (action === 'add-lesson') {
            const id = Number(body.module_id);
            const name = text(body.name);
            if (!Number.isInteger(id) || !name) return json({ error: 'needs a module and a name' }, 400);
            await db
              .prepare(
                `insert into lessons (module_id, name, position)
                 values (?1, ?2, (select coalesce(max(position), 0) + 1 from lessons where module_id = ?1))`,
              )
              .bind(id, name)
              .run();
            return json({ added: true }, 200);
          }

          // Paste an outline, get modules and lessons. Without this, building
          // a curriculum by hand is hundreds of clicks and the dashboard is
          // finished while the content is the hard part.
          if (action === 'import') {
            const id = Number(body.curriculum_id);
            if (!Number.isInteger(id)) return json({ error: 'which curriculum' }, 400);

            const parsed = parseOutline(String(body.outline ?? ''));
            const size = outlineSize(parsed);
            if (size.modules === 0) return json({ error: 'nothing to import' }, 400);
            // A cap, so a pasted entire web page cannot write ten thousand
            // rows before anyone notices.
            if (size.modules > 200 || size.lessons > 2000) {
              return json({ error: 'that is too much at once' }, 400);
            }

            let modulePosition = Number(
              (
                await db
                  .prepare(`select coalesce(max(position), 0) as at from modules where curriculum_id = ?1`)
                  .bind(id)
                  .first<{ at: number }>()
              )?.at ?? 0,
            );

            for (const module of parsed) {
              modulePosition += 1;
              await db
                .prepare(`insert into modules (curriculum_id, name, position) values (?1, ?2, ?3)`)
                .bind(id, module.name, modulePosition)
                .run();

              const made = await db
                .prepare(`select id from modules where curriculum_id = ?1 order by id desc limit 1`)
                .bind(id)
                .first<{ id: number }>();
              if (!made) continue;

              let lessonPosition = 0;
              for (const lesson of module.lessons) {
                lessonPosition += 1;
                await db
                  .prepare(`insert into lessons (module_id, name, position) values (?1, ?2, ?3)`)
                  .bind(made.id, lesson, lessonPosition)
                  .run();
              }
            }

            return json({ imported: true, ...size }, 200);
          }

          // The order of the curriculums IS the route through all of them, so
          // reordering is how that route is decided. position existed from the
          // first migration and nothing could change it.
          if (action === 'move') {
            const id = Number(body.id);
            const direction = body.direction === 'up' ? 'up' : 'down';
            if (!Number.isInteger(id)) return json({ error: 'which one' }, 400);

            // Curriculums or modules. Both carry a position, both orders
            // decide what comes next, and modules could not be reordered at
            // all until now — the column was written on insert and never
            // touched again, so a fourteen-module course was stuck in import
            // order.
            const table = body.kind === 'module' ? 'modules' : 'curriculums';
            // A module only moves within its own curriculum. Swapping it with
            // one from another course would reorder somebody else's path.
            const scope =
              table === 'modules'
                ? `and curriculum_id = (select curriculum_id from modules where id = ?2)`
                : '';

            const mine = await db
              .prepare(`select position from ${table} where id = ?1`)
              .bind(id)
              .first<{ position: number }>();
            if (!mine) return json({ error: 'no such thing' }, 404);

            // The neighbour in that direction, whatever its position number
            // happens to be — positions can have gaps after a delete, so
            // "position ± 1" would silently do nothing.
            const neighbour = await db
              .prepare(
                direction === 'up'
                  ? `select id, position from ${table} where position < ?1 ${scope}
                     order by position desc limit 1`
                  : `select id, position from ${table} where position > ?1 ${scope}
                     order by position asc limit 1`,
              )
              .bind(mine.position, id)
              .first<{ id: number; position: number }>();

            // Already at the end. Not an error: the button is simply at its
            // limit, and saying so with a 400 would make it look broken.
            if (!neighbour) return json({ moved: false }, 200);

            await db.batch([
              db.prepare(`update ${table} set position = ?2 where id = ?1`).bind(id, neighbour.position),
              db.prepare(`update ${table} set position = ?2 where id = ?1`).bind(neighbour.id, mine.position),
            ]);
            return json({ moved: true }, 200);
          }

          if (action === 'toggle-lesson') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which lesson' }, 400);

            const lesson = await db
              .prepare(`select done_on from lessons where id = ?1`)
              .bind(id)
              .first<{ done_on: string | null }>();
            if (!lesson) return json({ error: 'no such lesson' }, 404);

            // A given day may be supplied — for catching up on something done
            // yesterday — but never one that has not happened.
            const day = body.day === undefined ? localDay() : body.day;
            if (!isDay(day)) return json({ error: 'not a date' }, 400);
            if (day > localDay()) return json({ error: 'that day has not happened' }, 400);

            const next = lesson.done_on ? null : day;
            await db.prepare(`update lessons set done_on = ?2 where id = ?1`).bind(id, next).run();

            /* Ticking a lesson UNLOCKS the cards it teaches — "auto", his
             * choice, so that finishing a lesson and forgetting its cards is
             * not possible. The cards already exist, built with the
             * curriculum; `unlocked_on` is what makes them reviewable, which
             * is how 2,136 kanji can sit in the database without 2,136 cards
             * arriving on day one.
             *
             * Unticking does NOT lock them again. A card that has been
             * answered has a review history, and hiding it because a tick was
             * clicked twice would be a worse answer than leaving it in the
             * pile. `unlocked_on is null` also means a re-tick cannot move a
             * date that is already set. */
            let unlocked = 0;
            if (next !== null) {
              const result = (await db
                .prepare(
                  `update cards set unlocked_on = ?2
                    where lesson_id = ?1 and unlocked_on is null`,
                )
                .bind(id, next)
                .run()) as { meta?: { changes?: number } };
              unlocked = Number(result?.meta?.changes ?? 0);
            }

            return json({ done: next !== null, day: next, unlocked }, 200);
          }

          /* Sources: what a curriculum, or one of its lessons, is studied
           * from.
           *
           * A list rather than the one `curriculums.source` line, because a
           * real curriculum is studied from several things at once — Greek
           * runs Pimsleur and the Basic Course in tandem. See migration 0008,
           * which also explains why that column is still there, and 0009 for
           * the lesson grain. */
          if (action === 'add-source') {
            const id = Number(body.curriculum_id);
            const title = text(body.title);
            if (!Number.isInteger(id)) return json({ error: 'which curriculum' }, 400);
            if (!title) return json({ error: 'needs a title' }, 400);

            /* Optional, and checked against the curriculum when it is given: a
             * source row carries both ids, so a lesson id from somewhere else
             * would file the row under one curriculum and display it under
             * another's lesson, which no later read could tell was wrong. */
            let lesson: number | null = null;
            if (body.lesson_id !== undefined && body.lesson_id !== null) {
              lesson = Number(body.lesson_id);
              if (!Number.isInteger(lesson)) return json({ error: 'which lesson' }, 400);
              const owns = await db
                .prepare(
                  `select 1 as ok from lessons l
                     join modules m on m.id = l.module_id
                    where l.id = ?1 and m.curriculum_id = ?2`,
                )
                .bind(lesson, id)
                .first();
              if (!owns) return json({ error: 'that lesson is not in that curriculum' }, 400);
            }

            await db
              .prepare(
                // `lesson_id is ?5` rather than `=`, which is the whole trick:
                // the same statement has to number a curriculum's list and one
                // lesson's, and `= null` matches nothing, so a curriculum
                // source would restart at 1 on every insert.
                `insert into sources (curriculum_id, lesson_id, title, url, note, position)
                 values (?1, ?5, ?2, ?3, ?4,
                   (select coalesce(max(position), 0) + 1 from sources
                     where curriculum_id = ?1 and lesson_id is ?5))`,
              )
              .bind(id, title, text(body.url, 500) || null, text(body.note, 500) || null, lesson)
              .run();
            return json({ added: true }, 200);
          }

          if (action === 'update-source') {
            const id = Number(body.id);
            const title = text(body.title);
            if (!Number.isInteger(id)) return json({ error: 'which source' }, 400);
            if (!title) return json({ error: 'needs a title' }, 400);
            await db
              .prepare(`update sources set title = ?2, url = ?3, note = ?4 where id = ?1`)
              .bind(id, title, text(body.url, 500) || null, text(body.note, 500) || null)
              .run();
            return json({ updated: true }, 200);
          }

          if (action === 'remove-source') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which source' }, 400);
            await db.prepare(`delete from sources where id = ?1`).bind(id).run();
            return json({ removed: true }, 200);
          }

          // The substance of a lesson, which the name only labels. Separate
          // from rename because a name is a line and this is a passage.
          if (action === 'set-detail') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which lesson' }, 400);
            /* 32k, up from 8k, and the cut is now reported rather than
             * silent. `detail` stopped being a note and became the material
             * itself — "the material itself should be accessible here" — so a
             * lesson can run to a few thousand words, and a paste that lost
             * its last third to a slice() while the editor said Saved is the
             * kind of loss nothing afterwards can see. A cap stays: this is an
             * unauthenticated-by-shape text field writing to a row, and
             * 'however much you send' is not a size. */
            const sent = typeof body.detail === 'string' ? body.detail : null;
            const detail = sent === null ? null : sent.slice(0, 32_000);
            const truncated = sent !== null && sent.length > detail!.length;
            const value = detail && detail.trim() ? detail : null;

            await db
              .prepare(`update lessons set detail = ?2 where id = ?1`)
              // Empty means cleared, not "leave it alone" — otherwise a note
              // could never be removed once written.
              .bind(id, value)
              .run();

            /* AND THE REPO, WHERE THE REPO OWNS IT.
             *
             * For a designed curriculum, scripts/curriculums/<name>-detail.json
             * is the source of truth: apply.mjs lets the repo win wherever it
             * has detail, so writing only D1 meant anything typed here was
             * overwritten by the next rebuild — reported, but still lost. So
             * both are written, and the two cannot disagree.
             *
             * A transcribed curriculum has no detail file and needs none:
             * apply.mjs already preserves dashboard-written detail wherever
             * the script supplies none. So a missing file is a normal outcome,
             * not a failure, and the response says which happened.
             *
             * The D1 write has already landed by this point, deliberately. If
             * the commit fails, the dashboard is still correct and the loss is
             * a future rebuild overwriting it — the same state as before this
             * existed. Failing the whole action would mean a tick-sized edit
             * being refused because GitHub was briefly unreachable.
             */
            let committed: string | null = null;
            let repoOwned = false;
            const token = env.GITHUB_TOKEN;

            if (token) {
              try {
                const owner = await db
                  .prepare(
                    `select l.name as lesson, c.source as source
                       from lessons l
                       join modules m on m.id = l.module_id
                       join curriculums c on c.id = m.curriculum_id
                      where l.id = ?1`,
                  )
                  .bind(id)
                  .first<{ lesson: string; source: string | null }>();

                const built = /^scripts\/curriculums\/([a-z0-9-]+)\.md$/.exec(owner?.source ?? '');
                if (owner && built) {
                  // Through the same guard as every other write, rather than
                  // reaching around it — lib/collections.ts is the whole
                  // write boundary and an endpoint with its own idea of what
                  // is writable is how that stops being true.
                  const collection = collectionFor('curriculum-detail');
                  const target =
                    collection && pathAllowed(collection, `scripts/curriculums/${built[1]}-detail.json`);

                  if (target) {
                    const file = await readFile(token, target).catch(() => null);
                    if (file) {
                      repoOwned = true;
                      const json_ = JSON.parse(file.text) as Record<string, unknown>;
                      if (value === null) delete json_[owner.lesson];
                      else json_[owner.lesson] = value;
                      const written = await writeFile(
                        token,
                        target,
                        JSON.stringify(json_, null, 2) + '\n',
                        `Lesson detail: ${owner.lesson.slice(0, 60)}`,
                        file.sha,
                      );
                      committed = written.commit;
                    }
                  }
                }
              } catch {
                // Reported as not committed rather than thrown. See above.
              }
            }

            return json({ updated: true, id, repoOwned, committed, truncated }, 200);
          }

          if (action === 'rename') {
            const table = { curriculum: 'curriculums', module: 'modules', lesson: 'lessons' }[
              String(body.kind)
            ];
            const id = Number(body.id);
            const name = text(body.name);
            if (!table || !Number.isInteger(id) || !name) {
              return json({ error: 'needs a kind, an id and a name' }, 400);
            }
            // The table name comes from a fixed map and never from the body,
            // so no part of a caller's input reaches the SQL text.
            await db.prepare(`update ${table} set name = ?2 where id = ?1`).bind(id, name).run();
            return json({ renamed: true }, 200);
          }

          if (action === 'set-status') {
            const id = Number(body.id);
            const status = String(body.status);
            if (!Number.isInteger(id) || !['active', 'paused', 'done'].includes(status)) {
              return json({ error: 'needs an id and a status' }, 400);
            }
            await db
              .prepare(`update curriculums set status = ?2 where id = ?1`)
              .bind(id, status)
              .run();
            return json({ updated: true }, 200);
          }

          if (action === 'remove') {
            const table = { curriculum: 'curriculums', module: 'modules', lesson: 'lessons' }[
              String(body.kind)
            ];
            const id = Number(body.id);
            if (!table || !Number.isInteger(id)) return json({ error: 'needs a kind and an id' }, 400);
            // Foreign keys are declared ON DELETE CASCADE, but SQLite only
            // enforces them when asked — and D1 does ask. Stated here anyway
            // because removing a curriculum taking its modules and lessons
            // with it is intended, not incidental.
            await db.prepare(`delete from ${table} where id = ?1`).bind(id).run();
            return json({ removed: true }, 200);
          }

          return json({ error: 'unknown action' }, 400);
        }

        return json({ error: 'method not allowed' }, 405);
      } catch (error) {
        return json({ error: String(error instanceof Error ? error.message : error) }, 502);
      }
    }

    // --- cards -------------------------------------------------------------
    //
    // A deck is a curriculum, so there is no deck to choose, create or find —
    // which was half of what was wrong with Anki. One card is served at a
    // time and answering it returns the next, so a session is one round trip
    // per card and a refresh cannot lose a place.
    if (route === '/work/api/cards') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);

      const db = env.DB;
      if (!db) return json({ configured: false, decks: [] }, 200);

      const today = localDay();
      const nowIso = new Date().toISOString();

      const CARD_COLUMNS =
        `id, curriculum_id, lesson_id, kind, front, back, reading, extra,
         due, stability, difficulty, scheduled_days, learning_steps, reps,
         lapses, state, last_review, unlocked_on`;

      /** The decks, with the four numbers the list shows. */
      const decksOf = async () =>
        (
          await db
            .prepare(
              `select c.id, c.name, c.status, c.position, c.new_per_day,
                      sum(case when k.unlocked_on is not null and k.state != 0
                                 and k.due <= ?1 then 1 else 0 end) as due,
                      sum(case when k.unlocked_on is not null and k.state = 0
                               then 1 else 0 end) as fresh,
                      sum(case when k.unlocked_on is null then 1 else 0 end) as locked,
                      count(k.id) as total
                 from curriculums c
                 join cards k on k.curriculum_id = c.id
                group by c.id
                having count(k.id) > 0
                order by c.position, c.id`,
            )
            .bind(nowIso)
            .all()
        ).results;

      /**
       * How many new cards this deck may still introduce today.
       *
       * Counted from the REVIEW LOG, on reviews where the card was new at the
       * time — not from the cards whose state is new now. A card introduced
       * this morning is in learning by lunchtime, so counting the pile would
       * let the allowance refill itself all day long.
       */
      const introducedToday = async (deck: number) =>
        Number(
          (
            await db
              .prepare(
                `select count(*) as n from card_reviews r
                   join cards k on k.id = r.card_id
                  where r.day = ?1 and r.state = 0 and k.curriculum_id = ?2`,
              )
              .bind(today, deck)
              .first<{ n: number }>()
          )?.n ?? 0,
        );

      /** A card's note, which is drawn beside it. */
      const noteFor = async (card: number) =>
        (await db
          .prepare(`select scene, height from card_notes where card_id = ?1`)
          .bind(card)
          .first<{ scene: string; height: number }>()) ?? null;

      /**
       * The next card in a deck: everything due first, oldest due first, and
       * only then something new, and only within the allowance.
       *
       * Reviews before new cards and not interleaved, because a day's reviews
       * are a debt already owed and new cards are a choice to take on more.
       */
      const nextCard = async (deck: number) => {
        const due = await db
          .prepare(
            `select ${CARD_COLUMNS} from cards
              where curriculum_id = ?1 and unlocked_on is not null
                and state != 0 and due <= ?2
              order by due, id limit 1`,
          )
          .bind(deck, nowIso)
          .first();
        if (due) return due;

        const settings = await db
          .prepare(`select new_per_day from curriculums where id = ?1`)
          .bind(deck)
          .first<{ new_per_day: number | null }>();
        if (!settings) return null;

        if (allowance(settings, await introducedToday(deck)) <= 0) return null;

        return await db
          .prepare(
            `select ${CARD_COLUMNS} from cards
              where curriculum_id = ?1 and unlocked_on is not null and state = 0
              order by id limit 1`,
          )
          .bind(deck)
          .first();
      };

      try {
        if (request.method === 'GET') {
          const asked = Number(url.searchParams.get('deck'));
          const deck = Number.isInteger(asked) && asked > 0 ? asked : null;
          const card = deck ? ((await nextCard(deck)) ?? null) : null;
          return json(
            {
              configured: true,
              today,
              decks: await decksOf(),
              card,
              // With the card rather than after it. The note panel is beside
              // the card, so fetching it separately would draw it empty and
              // then fill it in — and on a card being seen for the fifth time
              // that flash is the previous four attempts appearing late.
              note: card ? await noteFor(Number(card.id)) : null,
            },
            200,
          );
        }

        if (request.method === 'POST') {
          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!body) return json({ error: 'malformed body' }, 400);
          const action = String(body.action ?? '');

          const text = (value: unknown, max = 2000): string =>
            typeof value === 'string' ? value.trim().slice(0, max) : '';

          /* Answering a card: schedule it, log it, hand back the next one.
           *
           * The log is written even though FSRS does not need it — the card's
           * own state is enough to schedule the next review. It is kept so the
           * scheduler can be re-optimised against his own answers later, which
           * is the one thing that would make this better than Anki rather than
           * only less annoying, and a history not kept cannot be recovered. */
          if (action === 'answer') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which card' }, 400);

            const rating = ratingFor(body.button);
            if (rating === null) return json({ error: 'which button' }, 400);

            const card = await db
              .prepare(`select ${CARD_COLUMNS} from cards where id = ?1`)
              .bind(id)
              .first<Card>();
            if (!card) return json({ error: 'no such card' }, 404);
            if (card.unlocked_on === null) {
              return json({ error: 'that card is still locked' }, 400);
            }

            const now = new Date();
            const next = review(card, rating, now);

            /* THE NOTE SAVES WITH THE ANSWER, which is his rule: "the note
             * should automatically save when i say good or again". So it rides
             * on this request rather than having a save of its own — there is
             * no Save button to forget, and the write that records the review
             * is the write that records what was written.
             *
             * `height` is derived and not taken from the browser: every band
             * that has ink, plus one empty one. That is also the whole append
             * mechanism — the empty band at the bottom is where the next
             * attempt goes, so the note continues below the previous one
             * without anything deciding to add space. See lib/card-note.ts.
             *
             * A note that will not parse is DROPPED and reported, never
             * written: it would otherwise overwrite attempts already saved
             * with something that cannot be read back. */
            const writes = [];
            let noteSaved: boolean | null = null;

            if (body.note !== undefined && body.note !== null) {
              const scene = parseNote(body.note);
              if (scene === null) {
                noteSaved = false;
              } else if (!isEmptyNote(scene)) {
                noteSaved = true;
                writes.push(
                  db
                    .prepare(
                      `insert into card_notes (card_id, scene, height, updated_at)
                       values (?1, ?2, ?3, ?4)
                       on conflict(card_id) do update
                         set scene = ?2, height = ?3, updated_at = ?4`,
                    )
                    .bind(id, JSON.stringify(scene), noteHeight(scene), now.toISOString()),
                );
              }
            }

            await db.batch([
              ...writes,
              db
                .prepare(
                  `update cards set due = ?2, stability = ?3, difficulty = ?4,
                          scheduled_days = ?5, learning_steps = ?6, reps = ?7,
                          lapses = ?8, state = ?9, last_review = ?10
                    where id = ?1`,
                )
                .bind(
                  id,
                  next.due,
                  next.stability,
                  next.difficulty,
                  next.scheduled_days,
                  next.learning_steps,
                  next.reps,
                  next.lapses,
                  next.state,
                  next.last_review,
                ),
              db
                .prepare(
                  `insert into card_reviews (card_id, rating, state, reviewed_at, day)
                   values (?1, ?2, ?3, ?4, ?5)`,
                )
                // `card.state`, the state BEFORE the answer: that is what an
                // optimiser needs and the update above has already lost it.
                .bind(id, rating, card.state, now.toISOString(), today),
            ]);

            const following = (await nextCard(card.curriculum_id)) ?? null;
            return json(
              {
                answered: true,
                decks: await decksOf(),
                card: following,
                note: following ? await noteFor(Number(following.id)) : null,
                // Said out loud rather than assumed. A note that could not be
                // read is the one case where the review was recorded and the
                // writing was not, and the page has to be able to say so.
                noteSaved,
              },
              200,
            );
          }

          // The one setting there is. Null puts the deck back on the default
          // rather than storing it, so changing the default later changes
          // every deck that never had an opinion.
          if (action === 'new-per-day') {
            const id = Number(body.curriculum_id);
            if (!Number.isInteger(id)) return json({ error: 'which deck' }, 400);
            const raw = body.value;
            const value =
              raw === null || raw === '' || raw === undefined
                ? null
                : Math.min(Math.max(Math.round(Number(raw)) || 0, 0), 500);
            if (value !== null && !Number.isFinite(value)) {
              return json({ error: 'not a number' }, 400);
            }
            await db
              .prepare(`update curriculums set new_per_day = ?2 where id = ?1`)
              .bind(id, value)
              .run();
            return json({ updated: true, decks: await decksOf() }, 200);
          }

          /* A card by hand — a mined word, something a lesson missed. Unlocked
           * immediately: there is no lesson to wait for. */
          if (action === 'add') {
            const id = Number(body.curriculum_id);
            if (!Number.isInteger(id)) return json({ error: 'which deck' }, 400);
            if (!isCardKind(body.kind)) return json({ error: 'which kind' }, 400);

            const front = text(body.front, 200);
            const back = text(body.back);
            if (!front || !back) return json({ error: 'needs a front and a back' }, 400);

            const fresh = freshScheduling(new Date());
            try {
              await db
                .prepare(
                  `insert into cards (curriculum_id, lesson_id, kind, front, back, reading,
                                      extra, due, stability, difficulty, scheduled_days,
                                      learning_steps, reps, lapses, state, last_review,
                                      unlocked_on, created_at)
                   values (?1, null, ?2, ?3, ?4, ?5, ?6, ?7, 0, 0, 0, 0, 0, 0, 0, null, ?8, ?8)`,
                )
                .bind(
                  id,
                  body.kind,
                  front,
                  back,
                  text(body.reading, 200) || null,
                  text(body.extra) || null,
                  fresh.due,
                  today,
                )
                .run();
            } catch {
              // The unique index on (curriculum_id, kind, front). Reported as
              // a duplicate rather than as a server error, because asking the
              // same question twice in one deck is a mistake with an obvious
              // fix and not a failure.
              return json({ error: 'that card is already in this deck' }, 409);
            }
            return json({ added: true, decks: await decksOf() }, 200);
          }

          if (action === 'remove') {
            const id = Number(body.id);
            if (!Number.isInteger(id)) return json({ error: 'which card' }, 400);
            await db.prepare(`delete from cards where id = ?1`).bind(id).run();
            return json({ removed: true, decks: await decksOf() }, 200);
          }

          return json({ error: 'unknown action' }, 400);
        }

        return json({ error: 'method not allowed' }, 405);
      } catch (error) {
        return json({ error: String(error instanceof Error ? error.message : error) }, 502);
      }
    }

    // --- rebuild on demand -------------------------------------------------
    //
    // Under /work/api/ with the rest of the backend, so the one Access policy
    // covers it. POST only: a GET that changed the deployed site could be
    // fired by anything that prefetches a link.
    if (route === '/work/api/rebuild') {
      const throughAccess = request.headers.has('cf-access-jwt-assertion');
      const local = url.hostname !== APEX;
      if (!throughAccess && !local) return env.ASSETS.fetch(request);
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

      const token = env.GITHUB_TOKEN;
      if (!token) return json({ configured: false }, 200);

      try {
        const { commit } = await rebuild(token, 'Rebuild from the work hub');
        return json({ started: true, commit }, 200);
      } catch (error) {
        return json({ error: String(error instanceof Error ? error.message : error) }, 502);
      }
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

  /**
   * The daily check that publishes a scheduled post.
   *
   * A statically exported site has no "now" at read time, so a post dated
   * tomorrow is withheld by today's build and included by any build that runs
   * tomorrow or later — and until this existed, nothing guaranteed such a
   * build happened. The nightly play-data Action pushes only when play data
   * actually changed, so it is not a publisher.
   *
   * The build writes /scheduled.json saying the earliest date it withheld
   * something for. This reads it once a day and rebuilds ONLY when that date
   * has arrived, so the cost is one empty commit on the day a post is due
   * rather than a commit a day forever.
   *
   * Africa/Johannesburg, fixed, matching buildDay() in lib/content.ts. A cron
   * firing at 02:10 UTC is the previous day in UTC terms but already the new
   * day locally, and publishing a day late is the failure that would be
   * blamed on anything but the time zone.
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const token = env.GITHUB_TOKEN;
        if (!token) return;

        try {
          const response = await env.ASSETS.fetch(
            new Request(`https://${APEX}/scheduled.json`),
          );
          if (!response.ok) return;
          const { next } = (await response.json()) as { next: string | null };
          if (!next) return;

          const today = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
          if (next > today) return;

          // An empty commit: a new sha pointing at the same tree, which is a
          // push, which is a build. See rebuild() for why that is the only
          // trigger available.
          await rebuild(token, `Publish what was scheduled for ${next}`);
        } catch {
          // A failed check is tomorrow's problem. Throwing here would only
          // fill the Worker's logs with something nobody reads, and the post
          // goes out on the next deploy for any other reason regardless.
        }
      })(),
    );
  },
};
