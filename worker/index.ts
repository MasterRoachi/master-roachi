import { POLL_ID, pollCandidates } from '../lib/poll';

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
   * Salts the voter hash. Without it the hash of a given IP is guessable, so
   * someone could test whether a particular address had voted. Optional
   * because a missing salt should degrade rather than break; set it as a
   * Worker secret.
   */
  VOTE_SALT?: string;
}

/** Votes lapse after six months, so an abandoned poll empties itself. */
const VOTE_TTL = 60 * 60 * 24 * 180;

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

    // Static assets are matched before the Worker runs, so in practice only
    // unmatched paths arrive here. Anything that is not the API is handed
    // back to the asset binding, which serves the 404 page.
    if (url.pathname !== '/api/vote') return env.ASSETS.fetch(request);

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
