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

  // The site's own icons, as every page links them (app/icon.png and
  // app/apple-icon.png), answered with this app's icon instead, so the phone
  // shows the keys, the book or the hourglass rather than the site's face.
  if (path === '/apple-icon.png') return { kind: 'asset', path: `/app-icons/${app.key}-180.png` };
  if (path === '/icon.png') return { kind: 'asset', path: `/app-icons/${app.key}-192.png` };

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

  if (owns(app, path)) return { kind: 'pass' };
  const other = WORK_APPS.find((candidate) => candidate !== app && owns(candidate, path));
  if (other) return { kind: 'redirect', location: `https://${other.host}${path}${url.search}` };

  // Anything else is the public site, which lives on the apex.
  if (!path.startsWith('/work/')) return { kind: 'redirect', location: `https://${APEX}${path}${url.search}` };
  return { kind: 'notfound' };
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
      // The motif sits inside the middle 70% on solid black, so the same
      // image survives Android's circle and squircle masks.
      { src: '/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
}
