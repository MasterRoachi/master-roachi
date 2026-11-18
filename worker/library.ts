// The Library of Wyggzantium on its own address, wigga.masterroachi.com (his
// ask, 18 Nov 2026). Public: unlike admin., learn. and tools., there is no
// Access in front of it.
//
// One Worker and one static build serve it, as they do the apps (worker/apps.ts).
// The library is the page /wyggzantium/ in that build. Its address opens on it
// by a redirect, the way each app's "/" opens on its doors page: serving the
// page's HTML at "/" instead would hand Next's router a page whose own path is
// not the address bar's, and it may then fetch "/"'s payload, which is the
// site's home page.
//
// Kept pure and apart from index.ts so the rules can be tested on their own.

export const LIBRARY_HOST = 'wigga.masterroachi.com';
const APEX = 'masterroachi.com';
const HOME = '/wyggzantium/';

export type LibraryDecision =
  | { kind: 'pass' }
  | { kind: 'redirect'; location: string; permanent: boolean }
  /** A game file from the private store, or (key '') the sign-in door to it. */
  | { kind: 'roms'; key: string };

/** A file the browser fetches as part of a page (script, style, font, image), not a page. */
function isAsset(path: string): boolean {
  const last = path.slice(path.lastIndexOf('/') + 1);
  const dot = last.lastIndexOf('.');
  if (dot <= 0) return false;
  const ext = last.slice(dot + 1).toLowerCase();
  return ext !== 'html' && ext !== 'txt';
}

/**
 * What to do with a request for the library, or null for anything that is not
 * the library's (the public site, the apps, localhost), which goes on as before.
 */
export function routeLibrary(url: URL): LibraryDecision | null {
  const path = url.pathname;

  if (url.hostname === LIBRARY_HOST) {
    if (path === '/' || path === '') return { kind: 'redirect', location: `https://${LIBRARY_HOST}${HOME}`, permanent: false };
    // The games room's games: Master Roachi's own, private (serveRom).
    if (path === '/roms' || path.startsWith('/roms/')) return { kind: 'roms', key: decodeURIComponent(path.slice(6)) };
    // The library's page, its payloads, its covers and pictures.
    if (path === '/wyggzantium' || path.startsWith(HOME)) return { kind: 'pass' };
    // Next's scripts and styles, and the site's fonts and icons.
    if (path.startsWith('/_next/') || isAsset(path)) return { kind: 'pass' };
    // Any other page is the public site's, which lives on the apex.
    return { kind: 'redirect', location: `https://${APEX}${path}${url.search}`, permanent: false };
  }

  // The library has one address: on the apex its page forwards there. Its
  // files stay where they are, since the same build serves both hosts.
  if (url.hostname === APEX && (path === '/wyggzantium' || path === HOME || path === `${HOME}index.html`)) {
    return { kind: 'redirect', location: `https://${LIBRARY_HOST}${HOME}${url.search}`, permanent: true };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cross-origin isolation, for the games room's heavier emulators.
//
// PSP (and, later, PS2 and Dreamcast) emulate on several threads, which a
// browser allows only to a page that is cross-origin isolated: served with
// COOP same-origin and a COEP. Isolation would block the library's YouTube
// embeds, except under COEP `credentialless` with the iframe marked
// `credentialless`, which only Chromium-based browsers support. So only they
// are sent the two headers; Firefox and Safari get the page as before, with
// the YouTube embeds working and those consoles shown as unavailable.

/** The library's own documents: its page and the games room's TV. */
const isDocument = (path: string) =>
  path === '/wyggzantium' || path === HOME || path === `${HOME}index.html` || (path.startsWith(`${HOME}tv/`) && (path.endsWith('/') || path.endsWith('.html')));

/** Whether the browser is Chromium-based, by its client hints (sent by default over HTTPS). */
const isChromium = (headers: Headers) => /"(Chromium|Google Chrome|Microsoft Edge)"/.test(headers.get('sec-ch-ua') ?? '');

/**
 * The site's policy (public/_headers), widened for the games room's TV page
 * only (/wyggzantium/tv/): EmulatorJS from its CDN, compiling WebAssembly,
 * evaluating its cores' generated code, and starting workers from blob: URLs.
 * The page holds nothing but the emulator and runs in a frame of the library;
 * the library's own page keeps the site's policy. scripts/csp.mjs widens the
 * TV page's meta policy to match; a browser enforces both, so both must allow it.
 */
export function widenPolicy(csp: string): string {
  const add: Record<string, string> = {
    'script-src': "'unsafe-eval' 'wasm-unsafe-eval' https://cdn.emulatorjs.org blob:",
    'style-src': 'https://cdn.emulatorjs.org',
    'connect-src': 'https://cdn.emulatorjs.org',
    'font-src': 'https://cdn.emulatorjs.org data:',
  };
  const parts = csp.split(';').map((p) => p.trim()).filter(Boolean);
  const out = parts.map((p) => {
    const name = p.split(/\s+/)[0];
    return add[name] ? `${p} ${add[name]}` : p;
  });
  if (!parts.some((p) => p.startsWith('worker-src'))) out.push("worker-src 'self' blob:");
  return out.join('; ');
}

/** The library's response: cross-origin isolated where it is a page and the browser can take it, and the TV page's policy widened. */
export function isolated(request: Request, url: URL, response: Response): Response {
  if (!isDocument(url.pathname)) return response;
  const out = new Response(response.body, response);
  out.headers.append('vary', 'Sec-CH-UA');
  const csp = out.headers.get('content-security-policy');
  if (csp && url.pathname.startsWith(`${HOME}tv/`)) out.headers.set('content-security-policy', widenPolicy(csp));
  if (isChromium(request.headers)) {
    out.headers.set('cross-origin-opener-policy', 'same-origin');
    out.headers.set('cross-origin-embedder-policy', 'credentialless');
  }
  return out;
}

// ---------------------------------------------------------------------------
// The private game store: an R2 bucket, read only by Master Roachi. Access
// guards /roms/ on the library's address (the same application as admin,
// learn and tools), and the caller verifies the token as well, so a path
// that Access somehow missed still refuses. The cases on the
// shelves are public; the games in them are not (his ruling, 18 Nov 2026).

export interface RomBucket {
  get(key: string): Promise<{ body: ReadableStream; size: number; httpEtag: string } | null>;
}

export async function serveRom(key: string, bucket: RomBucket | undefined, signedIn: () => Promise<boolean>): Promise<Response> {
  const headers = { 'cache-control': 'private, no-store', 'content-type': 'text/plain; charset=utf-8' };
  if (!(await signedIn())) return new Response('Sign in to play.', { status: 403, headers });
  // The bare /roms/ is the door you sign in through: back to the library.
  if (!key) return Response.redirect(`https://${LIBRARY_HOST}${HOME}`, 302);
  if (key.split('/').some((part) => part === '' || part === '.' || part === '..')) return new Response('Not found.', { status: 404, headers });
  if (!bucket) return new Response('The game store is not set up.', { status: 503, headers });
  const object = await bucket.get(key);
  if (!object) return new Response('Not found.', { status: 404, headers });
  return new Response(object.body, {
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': String(object.size),
      etag: object.httpEtag,
      // Kept in his browser for a day, never in a shared cache.
      'cache-control': 'private, max-age=86400',
      'cross-origin-resource-policy': 'same-origin',
    },
  });
}
