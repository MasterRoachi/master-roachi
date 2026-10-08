import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import { getStoreProducts } from '@/lib/store';
import StoreCopyEditor from './StoreCopyEditor';

// Product copy — the one part of a product page that is not a number out of
// Printful.
//
// The product LIST is read at build time, because products come from Printful
// and only change when the store is synced, which is a build. So a brand new
// product appears here after a rebuild, not before — which is the same moment
// it appears on the site, so the two cannot disagree.
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
  // Only what the editor needs. The rest of a product is prices and variants.
  const products = getStoreProducts().map((product) => ({
    id: String(product.id),
    name: product.name,
  }));

  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Product copy"
        lede="One paragraph per line. Blank lines are ignored, and a product with nothing here shows no section at all."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <StoreCopyEditor products={products} />
    </div>
  );
}
