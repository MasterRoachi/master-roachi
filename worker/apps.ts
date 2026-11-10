// The three backend apps on their own addresses: admin., learn. and tools.
//
// One Worker and one static build serve all of them (his ruling, 2026-11-10).
// What makes each address its own app is this: it is served only the pages and
// APIs that lib/work-tools.ts lists for it, its "/" opens its doors page, and
// it gets its own install file and icon, so the phone installs it as a
// separate app. A page that belongs to another app forwards to that app's
// address, so a link between apps lands in the right one.
//
// Kept pure and apart from index.ts so the rules can be tested on their own.
// Signing in is not decided here: Cloudflare Access sits in front of all three
// addresses, and the APIs check its token themselves (privateAllowed).

import { appForHost, WORK_APPS, type WorkApp } from '../lib/work-tools';

export type AppDecision =
  | { kind: 'pass' }
  | { kind: 'redirect'; location: string }
  | { kind: 'notfound' }
  | { kind: 'manifest'; app: WorkApp }
  | { kind: 'asset'; path: string };

const APEX = 'masterroachi.com';
/** Icon sizes cut for each app from design/app-icons/, in public/app-icons/. */
export const ICON_SIZES = [180, 192, 512] as const;

/** The folder a request is for: a page's own folder holds its HTML and RSC payloads. */
function folderOf(path: string): string {
  return path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
}

/** A file the browser fetches as part of a page, rather than a page itself. */
function isAsset(path: string): boolean {
  const last = path.slice(path.lastIndexOf('/') + 1);
  const dot = last.lastIndexOf('.');
  if (dot <= 0) return false;
  const ext = last.slice(dot + 1).toLowerCase();
  // HTML and the RSC payloads (.txt) are pages, and pages are per app.
  return ext !== 'html' && ext !== 'txt';
}

/** Old backend addresses that moved, kept so a bookmark still lands. */
const MOVED: Record<string, string> = {
  // Products became Shop on 2026-10-19.
  '/work/store/': '/work/shop/',
};

function moved(path: string): string | null {
  const key = path.endsWith('/') ? path : `${path}/`;
  return MOVED[key] ?? null;
}

/** Whether a page path belongs to an app: its doors page, or one of its tools. */
function owns(app: WorkApp, path: string): boolean {
  const folder = folderOf(path);
  if (folder === app.home) return true;
  return app.tools.some((tool) => !tool.outside && folder.startsWith(tool.href));
}

function apiOwned(app: WorkApp, route: string): boolean {
  return app.apis.some((api) => route === api || (api === '/share/ohana' && route.startsWith('/share/ohana/')));
}

function isApi(route: string): boolean {
  return route.startsWith('/work/api/') || route === '/api/work' || route === '/share/ohana' || route.startsWith('/share/ohana/');
}

/**
 * What to do with a request on an app's address, or null when the address is
 * not one of the apps (the public site, www, localhost), which go on as before.
 */
export function routeApp(url: URL): AppDecision | null {
  const app = appForHost(url.hostname);
  if (!app) return null;

  const path = url.pathname;
  const route = path.replace(/\/+$/, '');

  if (path === '/' || path === '') return { kind: 'redirect', location: `https://${app.host}${app.home}` };
  if (path === '/manifest.webmanifest') return { kind: 'manifest', app };

  // The site's own icons, as every page links them (app/icon.png,
  // app/apple-icon.png and app/favicon.ico), answered with this app's icon
  // instead: the ring of keys, the book and candle, the compass (his picks,
  // 2026-11-11, drawn in the lantern's style). The tab gets the close crop,
  // cut so its lines survive at 32px.
  if (path === '/apple-icon.png') return { kind: 'asset', path: `/app-icons/${app.key}-180.png` };
  if (path === '/icon.png') return { kind: 'asset', path: `/app-icons/${app.key}-favicon-48.png` };
  if (path === '/favicon.ico') return { kind: 'asset', path: `/app-icons/${app.key}-favicon-32.png` };

  // The maskable one is its own drawing, shrunk into the middle of the square,
  // because Admin's keys reach past the safe zone in the plain 512.
  if (path === '/app-icon-maskable-512.png') return { kind: 'asset', path: `/app-icons/${app.key}-maskable-512.png` };

  // The app's own icon at one fixed path, for its manifest.
  const icon = /^\/app-icon-(\d+)\.png$/.exec(path);
  if (icon) {
    return (ICON_SIZES as readonly number[]).includes(Number(icon[1]))
      ? { kind: 'asset', path: `/app-icons/${app.key}-${icon[1]}.png` }
      : { kind: 'notfound' };
  }

  if (isApi(route)) return apiOwned(app, route) ? { kind: 'pass' } : { kind: 'notfound' };

  // Scripts, styles, fonts and images are the public site's own and harmless.
  if (isAsset(path)) return { kind: 'pass' };

  const renamed = moved(path);
  if (renamed) {
    const to = WORK_APPS.find((candidate) => owns(candidate, renamed));
    if (to) return { kind: 'redirect', location: `https://${to.host}${renamed}` };
  }

  if (owns(app, path)) return { kind: 'pass' };
  const other = WORK_APPS.find((candidate) => candidate !== app && owns(candidate, path));
  if (other) return { kind: 'redirect', location: `https://${other.host}${path}${url.search}` };

  // A public page opened in an editor's preview frame stays on this address,
  // so the frame is same-origin with the editor (see WorkApp.previews).
  if (url.searchParams.get('preview') === '1' && app.previews?.some((base) => path.startsWith(base))) {
    return { kind: 'pass' };
  }

  // Anything else is the public site, which lives on the apex.
  if (!path.startsWith('/work/')) return { kind: 'redirect', location: `https://${APEX}${path}${url.search}` };
  return { kind: 'notfound' };
}

/**
 * masterroachi.com/work after the move (2026-11-10): every backend page
 * forwards to the app that owns it, and the private APIs no longer answer on
 * the public site's address; nor does Ohana's /share/ohana, which is on learn.
 * Null for anything else, which carries on as before.
 */
export function routeApexWork(url: URL): AppDecision | null {
  if (url.hostname !== APEX) return null;
  const path = url.pathname === '/work' ? '/work/' : url.pathname;
  const route = path.replace(/\/+$/, '');
  // Ohana moved to learn.masterroachi.com/share/ohana on 2026-11-10, and the
  // apex address was retired the same day.
  if (route === '/api/work' || route.startsWith('/work/api/') || route === '/share/ohana' || route.startsWith('/share/ohana/')) {
    return { kind: 'notfound' };
  }
  if (!path.startsWith('/work/')) return null;
  const target = moved(path) ?? path;
  const owner = WORK_APPS.find((candidate) => owns(candidate, target));
  // Permanent: the backend lives on the apps' addresses from now on.
  return owner ? { kind: 'redirect', location: `https://${owner.host}${target}${url.search}` } : { kind: 'notfound' };
}

/**
 * A public page served into an editor's preview frame on admin, with eval
 * allowed (2026-11-11, his call: option 1 of the three put to him).
 *
 * The preview draws the unsaved body by compiling its MDX in the browser
 * (components/LiveEntry.tsx), and the compiler runs its output with
 * `new Function`, which the site's policy forbids. Two policies apply to every
 * page, the header from public/_headers and the <meta> that scripts/csp.mjs
 * writes, and a script runs only if both allow it, so both get 'unsafe-eval'.
 * Only here: on admin, behind Access, with ?preview=1 (routeApp), where the
 * code being run is his own draft. Every other page keeps the strict policy.
 */
export async function previewPage(response: Response): Promise<Response> {
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;
  const html = (await response.text()).replace(
    /(<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content="script-src 'self')/i,
    "$1 'unsafe-eval'",
  );
  const out = new Response(html, response);
  const policy = out.headers.get('content-security-policy');
  if (policy) out.headers.set('content-security-policy', policy.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"));
  out.headers.delete('content-length');
  return out;
}

/** The web app manifest for one app: what the phone installs. */
export function manifestFor(app: WorkApp): string {
  return JSON.stringify({
    id: `${app.home}`,
    name: app.name,
    short_name: app.name,
    description: app.what,
    start_url: app.home,
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Its own image: the drawing inside the middle 64% on solid black, so
      // it survives Android's circle and squircle masks.
      { src: '/app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
}
