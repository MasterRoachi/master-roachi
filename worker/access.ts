// Verifying a Cloudflare Access token for real.
//
// The /work routes only check that `cf-access-jwt-assertion` is PRESENT, a
// backstop that leans on the Access policy in front of them. /share/ohana is
// reached by another app with a service token, and its writes change his study
// history, so the token is verified here: signature against the team's
// published keys, audience, issuer and expiry. Anything short of that answers
// as if the path did not exist.

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}

const KEY_TTL_MS = 60 * 60 * 1000;
let cached: { team: string; at: number; keys: Map<string, CryptoKey> } | null = null;

function b64urlBytes(text: string): Uint8Array<ArrayBuffer> {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function b64urlJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(new TextDecoder().decode(b64urlBytes(text)));
  } catch {
    return null;
  }
}

async function teamKeys(
  team: string,
  fetcher: typeof fetch,
  refresh = false,
): Promise<Map<string, CryptoKey>> {
  if (!refresh && cached && cached.team === team && Date.now() - cached.at < KEY_TTL_MS) {
    return cached.keys;
  }
  const response = await fetcher(`https://${team}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`certs ${response.status}`);
  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = new Map<string, CryptoKey>();
  for (const jwk of body.keys ?? []) {
    if (jwk.kty !== 'RSA') continue;
    keys.set(
      jwk.kid,
      await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      ),
    );
  }
  cached = { team, at: Date.now(), keys };
  return keys;
}

/**
 * True only for a token Access issued, for this application, still in date.
 *
 * `team` is the team domain, e.g. `example.cloudflareaccess.com`; `aud` is the
 * application's Audience tag. Both unset means not configured: false, so the
 * path fails closed.
 */
export async function accessTokenValid(
  request: Request,
  team: string | undefined,
  aud: string | undefined,
  fetcher: typeof fetch = fetch,
  now: number = Date.now(),
): Promise<boolean> {
  if (!team || !aud) return false;
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const header = b64urlJson(parts[0]);
  const claims = b64urlJson(parts[1]);
  if (!header || !claims || header.alg !== 'RS256' || typeof header.kid !== 'string') return false;

  let keys: Map<string, CryptoKey>;
  try {
    keys = await teamKeys(team, fetcher);
    // A key rotated since the cache was filled: one refresh, then give up.
    if (!keys.has(header.kid)) keys = await teamKeys(team, fetcher, true);
  } catch {
    return false;
  }
  const key = keys.get(header.kid);
  if (!key) return false;

  const signed = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!signed) return false;

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(aud)) return false;
  if (claims.iss !== `https://${team}`) return false;
  const seconds = now / 1000;
  if (typeof claims.exp !== 'number' || claims.exp < seconds) return false;
  if (typeof claims.nbf === 'number' && claims.nbf > seconds + 60) return false;
  return true;
}

/** For the tests: forget the cached keys. */
export function resetAccessKeys(): void {
  cached = null;
}
