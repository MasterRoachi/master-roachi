import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { site } from '@/lib/site';
import { getStore, garmentLabel, priceSummary, productPath } from '@/lib/store';
import StoreCopyEditor, { type EditorProduct } from './StoreCopyEditor';
import Orders from './Orders';
import ShopTabs from './ShopTabs';

// Shop — the store's admin. Two tabs: Orders, live from D1, and Products,
// the one part of a product page that is not a number out of Printful, which
// is the copy. It was /work/store, and only the copy, until 2026-10-19.
//
// The product LIST is read at build time, because products come from Printful
// and only change when the store is synced. That used to mean "a new product
// appears here after a rebuild", which was true and useless: the build has
// never had PRINTFUL_TOKEN, so a rebuild changed nothing and the committed
// catalogue went a month stale without saying so. Hence `fetchedAt` on screen
// and the Sync button, which fetches from the Worker and commits the result.
//
// The copy itself is loaded live from the repo, because that is what this page
// edits and a stale copy of it would overwrite newer text.

export const metadata: Metadata = pageMeta({
  path: '/work/shop/',
  title: 'Shop',
  description: 'Orders, and what each design is in your own words.',
  noIndex: true,
});

export default function WorkShopPage() {
  const { products, fetchedAt } = getStore();

  const synced: EditorProduct[] = products.map((product) => ({
    id: String(product.id),
    name: product.name,
    synced: true,
    href: productPath(product),
    price: priceSummary(product),
    garment: garmentLabel(product),
    variantCount: product.variantCount ?? product.variants?.length ?? 0,
    // Every image this product has, for the art grid. Ordered by what leads
    // the public page, so the first tile is the one a visitor actually sees.
    images: [
      product.artwork && { key: 'artwork', label: 'Uploaded', src: product.artwork },
      product.art && { key: 'art', label: 'Cut-out mockup', src: product.art },
      product.print?.src && { key: 'print', label: 'Print only', src: product.print.src },
      product.thumbnail && { key: 'thumbnail', label: 'Printful mockup', src: product.thumbnail },
    ].filter(Boolean) as EditorProduct['images'],
  }));

  /* The designs that exist as a decision and not yet as a product.
   *
   * Listed because he asked to see everything, synced or not, and marked
   * read-only because copy is keyed by Printful id and these have none —
   * there is nowhere to save words for a product that does not exist. The
   * Sync button is what turns one of these into a row that can be written in.
   */
  const planned: EditorProduct[] = site.store.planned.map((design) => ({
    id: `planned:${design.name}`,
    name: design.name,
    synced: false,
    category: design.category,
    images: [],
    variantCount: 0,
  }));

  return (
    <div className="shell">
      <ShopTabs
        orders={<Orders />}
        products={
          <StoreCopyEditor
            products={[...synced, ...planned]}
            fetchedAt={fetchedAt ?? null}
            storeName={site.store.name}
            siteName={site.name}
          />
        }
      />
    </div>
  );
}
