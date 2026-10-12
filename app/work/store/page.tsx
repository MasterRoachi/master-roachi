import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import { site } from '@/lib/site';
import { getStore, garmentLabel, priceSummary, productPath } from '@/lib/store';
import StoreCopyEditor, { type EditorProduct } from './StoreCopyEditor';

// Product copy — the one part of a product page that is not a number out of
// Printful.
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
  path: '/work/store/',
  title: 'Product copy',
  description: 'What each design is, in your own words.',
  noIndex: true,
});

export default function WorkStorePage() {
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
      <PageHeader
        eyebrow="Private"
        title="Product copy"
        lede="One paragraph per line. Blank lines are ignored, and a product with nothing here shows no section at all — but its description then falls back to the supplier's own words about the blank."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <StoreCopyEditor
        products={[...synced, ...planned]}
        fetchedAt={fetchedAt ?? null}
        storeName={site.store.name}
        siteName={site.name}
      />
    </div>
  );
}
