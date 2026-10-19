// The Printful catalogue, shaped the way this site stores it.
//
// Extracted from scripts/printful.mjs so that the build script and the Worker
// can both sync the store without two copies of the same transformation. There
// was no shared copy while only the build could sync; the moment /work/shop
// grew a Sync button there were two callers, and two ports of this logic would
// have drifted the first time Printful changed a field.
//
// Imported by BOTH a .ts Worker and a plain .mjs script, which is why it is
// written in erasable TypeScript only — interfaces and type annotations,
// no enums, no namespaces, no parameter properties. Node strips the types on
// import; anything needing real transformation would fail there while
// typechecking clean here.
//
// It performs no I/O of its own beyond fetch, writes no files and reads no
// environment. The caller supplies the token and decides what to do with the
// result, because one caller writes a file on disk and the other commits
// through the GitHub API.

/** A price, in whatever currency the store sells in. */
export interface Money {
  amount: number;
  currency: string;
}

export interface Variant {
  size: string | null;
  color: string | null;
  amount: number;
  currency: string;
  /** Printful reports per-variant stock; a discontinued colourway is not buyable. */
  available: boolean;
}

export interface Swatch {
  name: string;
  hex: string | null;
}

export interface Garment {
  brand: string | null;
  model: string | null;
  title: string | null;
  spec: string[];
  disclaimer: string | null;
}

export interface SizeGuide {
  unit: 'cm';
  measurements: {
    label: string | null;
    values: { size: string; value: number | null; min: number | null; max: number | null }[];
  }[];
}

export interface Product {
  id: number;
  externalId: string | null;
  slug: string;
  name: string;
  thumbnail: string | null;
  variantCount: number;
  from: Money | null;
  garment: Garment | null;
  sizeGuide: SizeGuide | null;
  colors: Swatch[];
  variants: Variant[];
}

export interface StoreInfo {
  type: string | null;
  name: string | null;
  website: string | null;
}

export interface Catalogue {
  fetchedAt: string;
  store: StoreInfo | null;
  products: Product[];
}

/**
 * The keys this module owns, and the only ones a sync may overwrite.
 *
 * `art`, `print` and `fabric` are hung off the same products by
 * scripts/store-art.mjs, and `artwork` by an upload from /work/shop. None of
 * them come from Printful, so a sync that wrote its own object wholesale would
 * silently delete the artwork — which is most of what the store page shows.
 * Both callers merge on this list rather than naming the foreign keys, so a
 * fourth one added elsewhere is preserved without anything here changing.
 */
export const SYNCED_KEYS: readonly string[] = [
  'id',
  'externalId',
  'slug',
  'name',
  'thumbnail',
  'variantCount',
  'from',
  'garment',
  'sizeGuide',
  'colors',
  'variants',
];

/**
 * Carry a freshly synced catalogue onto whatever is already stored.
 *
 * Per product, the synced keys win and every other key is kept from the
 * existing entry with the same id. A product that has gone from Printful goes
 * from here too — it is no longer for sale — and its artwork files are left on
 * disk rather than chased, because nothing links to them any more.
 */
export function mergeCatalogue(
  fresh: Catalogue,
  existing: { products?: Record<string, unknown>[] } | null,
): Catalogue {
  const before = new Map<number, Record<string, unknown>>();
  for (const product of existing?.products ?? []) {
    const id = Number(product.id);
    if (Number.isFinite(id)) before.set(id, product);
  }

  return {
    ...fresh,
    products: fresh.products.map((product) => {
      const kept = before.get(product.id);
      if (!kept) return product;
      const extra: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(kept)) {
        if (!SYNCED_KEYS.includes(key)) extra[key] = value;
      }
      return { ...product, ...extra };
    }),
  };
}

/** Cheapest variant price, which is what a catalogue tile should show. */
function fromPrice(variants: { retail_price?: string; currency?: string }[]): Money | null {
  const prices = variants
    .map((v) => Number.parseFloat(String(v.retail_price)))
    .filter((n) => Number.isFinite(n));
  if (prices.length === 0) return null;
  return { amount: Math.min(...prices), currency: variants[0]?.currency ?? 'USD' };
}

/**
 * The spec bullets out of Printful's blurb.
 *
 * The description opens with marketing — "This t-shirt is everything you've
 * dreamed of and more" — and then lists what a buyer actually needs: fibre,
 * weight, construction, where the blank is made. The bullets are kept and the
 * sales pitch is not, because a page that says a shirt is everything you have
 * dreamed of has told you nothing and reads like every other store.
 *
 * The disclaimer is pulled out separately. It warns that this fabric is
 * slightly sheer, which is exactly the sort of thing a store is tempted to
 * bury and a buyer would rather know before ordering.
 */
function readSpec(description: unknown): { spec: string[]; disclaimer: string | null } {
  const text = String(description ?? '');
  const spec: string[] = [];
  let disclaimer: string | null = null;

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
 * "product_measure" (measure the garment). The second settles an argument
 * about whether a size will fit something the buyer already owns, so it is the
 * one kept.
 *
 * Centimetres only. Inches are 2.54 of them and converting at render costs
 * nothing, whereas shipping both tables doubles the data for arithmetic.
 */
/* ---------------------------------------------------------------------------
 * The Printful API, as much of it as this file reads.
 *
 * These describe the fields used, not the full responses. The API is external
 * and sends a great deal more; typing what we never read would be inventing a
 * contract we cannot hold to, and it would go stale silently the first time
 * Printful changed something we do not look at.
 *
 * Every field is optional on purpose. A missing one is ordinary, and every
 * read below already guards for it with ?? or ?. — the types now say so
 * instead of `any` quietly promising that everything is always there.
 * ------------------------------------------------------------------------- */

interface PfSizeValue {
  /** Required: it is copied straight into SizeGuide, which names every row. */
  size: string;
  value?: string | null;
  min_value?: string | null;
  max_value?: string | null;
}

interface PfMeasurement {
  type_label?: string | null;
  values?: PfSizeValue[];
}

interface PfSizeTable {
  type?: string;
  measurements?: PfMeasurement[];
}

interface PfSizeGuideResult {
  size_tables?: PfSizeTable[];
}

interface PfCatalogueVariant {
  color?: string | null;
  color_code?: string | null;
}

interface PfCatalogueResult {
  product?: {
    brand?: string | null;
    model?: string | null;
    title?: string | null;
    description?: string | null;
  };
  variants?: PfCatalogueVariant[];
}

interface PfStoreResult {
  type?: string | null;
  name?: string | null;
  website?: string | null;
}

interface PfStoreProduct {
  /* id and name are not optional: the loop builds a slug and a product id out
     of them without guarding, so a response missing either is a broken
     response rather than an ordinary absence. */
  id: number;
  name: string;
  is_ignored?: boolean;
  external_id?: string | null;
  thumbnail_url?: string | null;
  /** Printful's own count, which can differ from the synced variants we see. */
  variants?: number;
}

interface PfSyncVariant {
  size?: string | null;
  color?: string | null;
  /** Read straight into parseFloat, so a variant without one is malformed. */
  retail_price: string;
  currency?: string;
  availability_status?: string;
  product?: { product_id?: number | null };
}

/** What `blank()` keeps about a catalogue entry, once it has been read. */
interface Blank {
  brand: string | null;
  model: string | null;
  title: string | null;
  /** readSpec returns the bullet lines, which is Garment['spec']. */
  spec: string[];
  disclaimer: string | null;
  sizeGuide: SizeGuide | null;
  colors: Map<string, string>;
}

function readSizeGuide(result: PfSizeGuideResult | undefined): SizeGuide | null {
  const table = (result?.size_tables ?? []).find((t) => t.type === 'product_measure');
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

/**
 * The product's own address on this site.
 *
 * Built from the name rather than the Printful id, because /store/roachi-shirt/
 * is a link someone can read and the id is not. Renaming a product therefore
 * moves its page — acceptable for a catalogue this size, and the payment link
 * map stays keyed on the id, which never changes.
 */
function slugify(name: unknown, taken: Set<string>): string {
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

export interface SyncOptions {
  token: string;
  /** Only needed for account-level tokens. */
  storeId?: string | null;
  /** Called with each progress line. The build prints them; the Worker collects them. */
  log?: (line: string) => void;
}

/**
 * Fetch and shape the whole catalogue.
 *
 * Throws if the store cannot be listed at all, so a caller can leave whatever
 * it already has in place. Everything below that is best effort: a missing
 * garment costs a label and some swatches, not the catalogue.
 */
export async function fetchCatalogue(options: SyncOptions): Promise<Catalogue> {
  const note = options.log ?? (() => {});
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.token}`,
    ...(options.storeId ? { 'X-PF-Store-Id': options.storeId } : {}),
  };

  // Generic rather than `any`: each call site says what it expects back, so
  // the shape is declared where it is known instead of lost at the boundary.
  async function api<T>(pathname: string): Promise<T> {
    const res = await fetch(`https://api.printful.com${pathname}`, {
      headers,
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`${pathname} returned ${res.status}`);
    return res.json() as Promise<T>;
  }

  /**
   * One request per distinct blank, cached, because a store with twelve
   * designs on the same tee should not ask twelve times.
   */
  const catalogue = new Map<number, Blank | null>();

  async function blank(productId: number | null | undefined) {
    if (productId == null) return null;
    if (catalogue.has(productId)) return catalogue.get(productId);

    let info = null;
    try {
      const res = await api<{ result?: PfCatalogueResult }>(`/products/${productId}`);
      const r: PfCatalogueResult = res?.result ?? {};
      const { spec, disclaimer } = readSpec(r.product?.description);

      // A second request and a nice-to-have, so it fails on its own without
      // costing the rest of the catalogue entry.
      let sizeGuide: SizeGuide | null = null;
      try {
        const sizes = await api<{ result?: PfSizeGuideResult }>(`/products/${productId}/sizes?unit=cm`);
        sizeGuide = readSizeGuide(sizes?.result);
      } catch (err) {
        note(`no size guide for ${productId} (${(err as Error).message})`);
      }

      info = {
        brand: r.product?.brand ?? null,
        model: r.product?.model ?? null,
        // "Unisex Staple T-Shirt | Bella + Canvas 3001" — the brand is
        // repeated after the pipe, and it is already its own field.
        title: (r.product?.title ?? '').split('|')[0].trim() || null,
        spec,
        disclaimer,
        sizeGuide,
        colors: new Map<string, string>(
          (r.variants ?? [])
            .filter((v) => v.color && v.color_code)
            .map((v) => [v.color as string, v.color_code as string]),
        ),
      };
    } catch (err) {
      note(`no catalogue for blank ${productId} (${(err as Error).message})`);
    }

    catalogue.set(productId, info);
    return info;
  }

  // What kind of store this is decides where checkout can live: a store
  // connected to Etsy or Shopify already has a checkout, a manual one does
  // not. Reported rather than assumed, and never fatal.
  let store: StoreInfo | null = null;
  try {
    const info = await api<{ result?: PfStoreResult }>('/store');
    const r: PfStoreResult = info?.result ?? {};
    store = { type: r.type ?? null, name: r.name ?? null, website: r.website ?? null };
    note(
      `store "${store.name ?? '?'}" type=${store.type ?? '?'}` +
        (store.website ? ` website=${store.website}` : ''),
    );
  } catch (err) {
    note(`could not read store info (${(err as Error).message})`);
  }

  const list = await api<{ result?: PfStoreProduct[] }>('/store/products');
  const listed = (list?.result ?? []).filter((p) => !p.is_ignored);
  if (listed.length === 0) throw new Error('store has no synced products yet');

  const products: Product[] = [];
  /** Slugs already handed out, so two products cannot claim one URL. */
  const slugs = new Set<string>();

  for (const p of listed) {
    // Prices live on the variants, so each product needs its own request.
    const detail = await api<{ result?: { sync_variants?: PfSyncVariant[] } }>(
      `/store/products/${p.id}`,
    );
    const variants: PfSyncVariant[] = detail?.result?.sync_variants ?? [];

    // Every synced variant of one product sits on the same blank, so the
    // first one decides which catalogue entry to look up.
    const base = await blank(variants[0]?.product?.product_id);

    // What is actually for sale, kept rather than counted. The page was
    // reporting "9 options" for nine sizes of a single colour, which reads as
    // nine colourways — and hiding that the price nearly doubles from XS to
    // 5XL behind a single "from" figure.
    const shapedVariants: Variant[] = variants.map((v) => ({
      size: v.size ?? null,
      color: v.color ?? null,
      amount: Number.parseFloat(v.retail_price),
      currency: v.currency ?? 'USD',
      available: v.availability_status === 'active',
    }));

    // Distinct colours, in the order Printful synced them, with the swatch
    // from the catalogue where there is one.
    const colors: Swatch[] = [];
    for (const v of shapedVariants) {
      if (!v.color || colors.some((c) => c.name === v.color)) continue;
      colors.push({ name: v.color, hex: base?.colors?.get(v.color) ?? null });
    }

    const slug = slugify(p.name, slugs);
    slugs.add(slug);

    products.push({
      id: p.id,
      // The connected platform's own id, which is what a product URL is built
      // from when the storefront is Etsy, Shopify and so on.
      externalId: p.external_id ?? null,
      slug,
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
  }

  return {
    // Recorded so the page can say how fresh this is rather than implying the
    // catalogue is live.
    fetchedAt: new Date().toISOString(),
    store,
    products,
  };
}
