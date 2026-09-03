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

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'data', 'store.json');
const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE_ID = process.env.PRINTFUL_STORE_ID;

function bail(why) {
  console.log(`printful: ${why} — keeping the committed data/store.json`);
  process.exit(0);
}

if (!TOKEN) bail('PRINTFUL_TOKEN not set');

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  ...(STORE_ID ? { 'X-PF-Store-Id': STORE_ID } : {}),
};

async function api(pathname) {
  const res = await fetch(`https://api.printful.com${pathname}`, {
    headers,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${pathname} returned ${res.status}`);
  return res.json();
}

/** Cheapest variant price, which is what a catalogue tile should show. */
function fromPrice(variants) {
  const prices = variants
    .map((v) => Number.parseFloat(v.retail_price))
    .filter((n) => Number.isFinite(n));
  if (prices.length === 0) return null;
  return {
    amount: Math.min(...prices),
    currency: variants[0]?.currency ?? 'USD',
  };
}

try {
  // What kind of store this is decides where checkout can live: a store
  // connected to Etsy or Shopify already has a checkout, a manual one does
  // not. Reported rather than assumed, and never fatal.
  let store = null;
  try {
    const info = await api('/store');
    const r = info?.result ?? {};
    store = { type: r.type ?? null, name: r.name ?? null, website: r.website ?? null };
    console.log(
      `printful: store "${store.name ?? '?'}" type=${store.type ?? '?'}` +
        (store.website ? ` website=${store.website}` : ''),
    );
  } catch (err) {
    console.log(`printful: could not read store info (${err.message})`);
  }

  const list = await api('/store/products');
  const products = (list?.result ?? []).filter((p) => !p.is_ignored);

  if (products.length === 0) bail('store has no synced products yet');

  const shaped = [];
  for (const p of products) {
    // Prices live on the variants, so each product needs its own request.
    const detail = await api(`/store/products/${p.id}`);
    const variants = detail?.result?.sync_variants ?? [];

    shaped.push({
      id: p.id,
      // The connected platform's own id, which is what a product URL is built
      // from when the storefront is Etsy, Shopify and so on.
      externalId: p.external_id ?? null,
      name: p.name,
      thumbnail: p.thumbnail_url ?? null,
      variantCount: p.variants ?? variants.length,
      from: fromPrice(variants),
    });
  }

  const payload = {
    // Recorded so the page can say how fresh this is rather than implying the
    // catalogue is live.
    fetchedAt: new Date().toISOString(),
    store,
    products: shaped,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`printful: wrote ${shaped.length} products`);
} catch (err) {
  bail(`fetch failed (${err.message})`);
}
