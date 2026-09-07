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

import path from 'node:path';
import { writeSnapshot } from './snapshot.mjs';

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

/**
 * The blank a design is printed on, from Printful's own catalogue.
 *
 * A synced variant knows its product_id but describes itself as "Bella +
 * Canvas 3001 Unisex Short Sleeve Jersey T-Shirt with Tear Away Label (Black
 * Heather / XS)" — the garment, the colour and the size run together in one
 * string, which is no use as a label. The catalogue splits them properly and
 * carries a hex code per colour, which is the only place a swatch can come
 * from.
 *
 * One request per distinct blank, cached, because a store with twelve designs
 * on the same tee should not ask twelve times. Best effort throughout: a
 * failure here costs a garment label and some swatches, not the catalogue.
 */
const catalogue = new Map();

/**
 * The spec bullets out of Printful's blurb.
 *
 * The description opens with marketing — "This t-shirt is everything you've
 * dreamed of and more" — and then lists the things a buyer actually needs:
 * fibre, weight, construction, where the blank is made. The bullets are kept
 * and the sales pitch is not, because a page that says a shirt is everything
 * you have dreamed of has told you nothing and reads like every other store.
 *
 * The disclaimer is pulled out separately. It warns that this fabric is
 * slightly sheer, which is exactly the sort of thing a store is tempted to
 * bury and a buyer would rather know before ordering.
 */
function readSpec(description) {
  const text = String(description ?? '');
  const spec = [];
  let disclaimer = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('•')) {
      spec.push(line.replace(/^•\s*/, '').trim());
    } else if (/^disclaimer:/i.test(line)) {
      disclaimer = line.replace(/^disclaimer:\s*/i, '').trim();
    }
  }

  return { spec, disclaimer };
}

/**
 * Garment measurements per size, laid flat.
 *
 * Printful publishes two tables: "measure_yourself" (measure a body) and
 * "product_measure" (measure the garment). The second is the one that settles
 * an argument about whether a size will fit something the buyer already owns,
 * so it is the one kept.
 *
 * Stored in centimetres only. Inches are 2.54 of them and converting at render
 * costs nothing, whereas fetching and shipping both tables doubles the data
 * for arithmetic.
 */
function readSizeGuide(result) {
  const table = (result?.size_tables ?? []).find(
    (t) => t.type === 'product_measure',
  );
  if (!table) return null;

  const measurements = (table.measurements ?? [])
    .map((m) => ({
      label: m.type_label ?? null,
      values: (m.values ?? []).map((v) => ({
        size: v.size,
        // A single figure for length, a range for anything measured around.
        value: v.value != null ? Number.parseFloat(v.value) : null,
        min: v.min_value != null ? Number.parseFloat(v.min_value) : null,
        max: v.max_value != null ? Number.parseFloat(v.max_value) : null,
      })),
    }))
    .filter((m) => m.label && m.values.length > 0);

  return measurements.length > 0 ? { unit: 'cm', measurements } : null;
}

async function blank(productId) {
  if (productId == null) return null;
  if (catalogue.has(productId)) return catalogue.get(productId);

  let info = null;
  try {
    const res = await api(`/products/${productId}`);
    const r = res?.result ?? {};
    const { spec, disclaimer } = readSpec(r.product?.description);

    // The size guide is a second request and a nice-to-have, so it fails on
    // its own without costing the rest of the catalogue entry.
    let sizeGuide = null;
    try {
      const sizes = await api(`/products/${productId}/sizes?unit=cm`);
      sizeGuide = readSizeGuide(sizes?.result);
    } catch (err) {
      console.log(`printful: no size guide for ${productId} (${err.message})`);
    }

    info = {
      brand: r.product?.brand ?? null,
      model: r.product?.model ?? null,
      // "Unisex Staple T-Shirt | Bella + Canvas 3001" — the brand is repeated
      // after the pipe, and it is already its own field.
      title: (r.product?.title ?? '').split('|')[0].trim() || null,
      spec,
      disclaimer,
      sizeGuide,
      colors: new Map(
        (r.variants ?? [])
          .filter((v) => v.color && v.color_code)
          .map((v) => [v.color, v.color_code]),
      ),
    };
  } catch (err) {
    console.log(`printful: no catalogue for blank ${productId} (${err.message})`);
  }

  catalogue.set(productId, info);
  return info;
}

/**
 * The product's own address on this site.
 *
 * Built from the name rather than the Printful id, because /store/roachi-shirt/
 * is a link someone can read and the id is not. Renaming a product therefore
 * moves its page — acceptable for a catalogue this size, and the payment link
 * map stays keyed on the id, which never changes.
 */
function slugify(name, taken) {
  const base =
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'product';
  if (!taken.has(base)) return base;
  // Two products with the same name is not a reason to serve one of them at a
  // path that silently belongs to the other.
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
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
  /** Slugs already handed out, so two products cannot claim one URL. */
  const slugs = new Set();
  for (const p of products) {
    // Prices live on the variants, so each product needs its own request.
    const detail = await api(`/store/products/${p.id}`);
    const variants = detail?.result?.sync_variants ?? [];

    // Every synced variant of one product sits on the same blank, so the first
    // one decides which catalogue entry to look up.
    const base = await blank(variants[0]?.product?.product_id);

    // What is actually for sale, kept rather than counted. The page was
    // reporting "9 options" for nine sizes of a single colour, which reads as
    // nine colourways — and hiding that the price nearly doubles from XS to
    // 5XL behind a single "from" figure.
    const shapedVariants = variants.map((v) => ({
      size: v.size ?? null,
      color: v.color ?? null,
      amount: Number.parseFloat(v.retail_price),
      currency: v.currency ?? 'USD',
      // Printful reports per-variant stock; a discontinued colourway should
      // not sit on the page looking buyable.
      available: v.availability_status === 'active',
    }));

    // Distinct colours, in the order Printful synced them, with the swatch
    // from the catalogue where there is one.
    const colors = [];
    for (const v of shapedVariants) {
      if (!v.color || colors.some((c) => c.name === v.color)) continue;
      colors.push({ name: v.color, hex: base?.colors?.get(v.color) ?? null });
    }

    shaped.push({
      id: p.id,
      // The connected platform's own id, which is what a product URL is built
      // from when the storefront is Etsy, Shopify and so on.
      externalId: p.external_id ?? null,
      slug: slugify(p.name, slugs),
      name: p.name,
      thumbnail: p.thumbnail_url ?? null,
      variantCount: p.variants ?? variants.length,
      from: fromPrice(variants),
      garment: base
        ? {
            brand: base.brand,
            model: base.model,
            title: base.title,
            spec: base.spec ?? [],
            disclaimer: base.disclaimer ?? null,
          }
        : null,
      sizeGuide: base?.sizeGuide ?? null,
      colors,
      variants: shapedVariants,
    });
    slugs.add(shaped[shaped.length - 1].slug);
  }

  const payload = {
    // Recorded so the page can say how fresh this is rather than implying the
    // catalogue is live.
    fetchedAt: new Date().toISOString(),
    store,
    products: shaped,
  };

  // store-art.mjs runs straight after this and enriches the very same file,
  // hanging `art`, `print` and `fabric` off each product. None of that comes
  // from Printful, so comparing the whole object means the catalogue never
  // matches what is on disk and this rewrites on every single build.
  //
  // Rather than name store-art's fields here and have this quietly start
  // churning again the day it adds a fourth, each product is compared only on
  // the keys this script sets — which are fixed just above, so a value that
  // genuinely moves is still caught.
  const ours = Object.keys(shaped[0] ?? {});
  const wrote = writeSnapshot(OUT, payload, {
    compare: (snap) => ({
      ...snap,
      products: snap.products?.map((p) =>
        Object.fromEntries(ours.map((k) => [k, p[k]])),
      ),
    }),
  });

  console.log(
    wrote
      ? `printful: wrote ${shaped.length} products`
      : `printful: ${shaped.length} products, unchanged since the last run`,
  );
} catch (err) {
  bail(`fetch failed (${err.message})`);
}
