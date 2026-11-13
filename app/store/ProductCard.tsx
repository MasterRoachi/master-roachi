import Link from 'next/link';
import Swatches from '@/components/Swatches';
import { isSoldOut, priceSummary, productPath, sizeRun, sizesOf, type StoreProduct } from '@/lib/store';
import styles from './store.module.css';

// One product on a shelf. Its own file since 2026-11-12, when the store grew a
// page per artwork and the same card had to stand on both.

export default function ProductCard({ product }: { product: StoreProduct }) {
  const sizes = sizesOf(product);
  const soldOut = isSoldOut(product);

  // Always the product page, never straight out to a payment link: a card is
  // a thing to look at, and sending someone from a thumbnail to a checkout
  // skips every question they have not asked yet.
  return (
    <Link className={styles.product} href={productPath(product)}>
      <span className={styles.art}>
        {product.art || product.thumbnail ? (
          <img
            src={product.art ?? product.thumbnail ?? undefined}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          /* No mockup cut for this one yet. A shorter band with the mark in
             it, rather than a square of near-black diagonal stripes — which is
             what the invented placeholders used to look like, and read as a
             product that had failed to load. */
          <span className={styles.noArt} aria-hidden="true">
            <img src="/logo-mark-lg.webp" alt="" loading="lazy" />
          </span>
        )}
      </span>
      <span className={styles.detail}>
        <span className={styles.name}>{product.name}</span>
        <span className={styles.meta}>
          {priceSummary(product) && <span className={styles.price}>{priceSummary(product)}</span>}
          {sizes.length > 0 && <span className={styles.variants}>{sizeRun(sizes)}</span>}
        </span>
        <Swatches colors={product.colors ?? []} compact />
        {soldOut ? (
          <span className={styles.pending}>Sold out</span>
        ) : (
          <span className={styles.buy}>See it →</span>
        )}
      </span>
    </Link>
  );
}
