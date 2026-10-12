// Pulls the Fabled Threads catalogue from Printful and writes data/store.json.
//
//   node scripts/printful.mjs
//
// Runs as part of prebuild, so every deploy refreshes the catalogue. The site
// is a static export, so products are baked in at build rather than fetched in
// the browser — which also keeps the API token on the build machine. A browser
// fetch would expose it to anyone who opened devtools.
//
// Nothing here touches money. The token is read-only in practice: it lists
// products and prices. Checkout happens on the hosted storefront, so no card
// data, order state or refund handling ever passes through this site.
//
// Environment:
//
//   PRINTFUL_TOKEN     from Printful → Settings → API
//   PRINTFUL_STORE_ID  only needed for account-level tokens
//
// A missing token, an unreachable API or an empty store all leave the
// committed data/store.json alone and let the build continue.
//
// THE SHAPING LIVES IN lib/printful.ts, not here. /work/store grew a Sync
// button that does the same job from the Worker, and two ports of this
// transformation would have drifted the first time Printful changed a field.
// This file is now the build's half: environment, disk, and the decision not
// to rewrite an unchanged file. Node strips the types on import, so a plain
// .mjs script importing a .ts module works — the module is written in erasable
// TypeScript for exactly that reason.

import path from 'node:path';
import fs from 'node:fs';
import { writeSnapshot } from './snapshot.mjs';
import { fetchCatalogue, mergeCatalogue, SYNCED_KEYS } from '../lib/printful.ts';

const OUT = path.join(process.cwd(), 'data', 'store.json');
const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE_ID = process.env.PRINTFUL_STORE_ID;

function bail(why) {
  console.log(`printful: ${why} — keeping the committed data/store.json`);
  process.exit(0);
}

if (!TOKEN) bail('PRINTFUL_TOKEN not set');

/** Whatever is already on disk, for the merge and for the comparison. */
function stored() {
  try {
    return JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch {
    return null;
  }
}

let fresh;
try {
  fresh = await fetchCatalogue({
    token: TOKEN,
    storeId: STORE_ID,
    log: (line) => console.log(`printful: ${line}`),
  });
} catch (err) {
  bail(`fetch failed (${err.message})`);
}

// Merged rather than written wholesale. store-art.mjs runs straight after this
// and hangs `art`, `print` and `fabric` off these same products, and an upload
// from /work/store adds `artwork` — none of it from Printful. Writing the raw
// catalogue dropped all of that and relied on store-art.mjs running next to
// put it back, which is true in a build and not true of `npm run store` on its
// own. Merging keeps the artwork whoever runs this.
const payload = mergeCatalogue(fresh, stored());

// Compared only on the keys this sync owns, so the enrichment above does not
// make the catalogue permanently differ from what is on disk and rewrite on
// every single build. SYNCED_KEYS is that list, shared with the merge so the
// two cannot disagree.
const wrote = writeSnapshot(OUT, payload, {
  compare: (snap) => ({
    ...snap,
    products: snap.products?.map((p) =>
      Object.fromEntries(SYNCED_KEYS.map((k) => [k, p[k]])),
    ),
  }),
});

console.log(
  wrote
    ? `printful: wrote ${payload.products.length} products`
    : `printful: ${payload.products.length} products, unchanged since the last run`,
);
