import type { Metadata } from 'next';
import Starfield from '@/components/Starfield';
import { getStore, buyUrl, formatPrice } from '@/lib/store';
import { site } from '@/lib/site';
import styles from './store.module.css';

export const metadata: Metadata = {
  title: 'Store',
  description:
    'Fabled Threads — print-on-demand merch built around anime and early-2000s cartoon inspired illustrations.',
};

// Fabled Threads keeps its own colour here, the one its project card carried.
const ACCENT = 'oklch(72% 0.26 350)';
const ACCENT_2 = 'oklch(80% 0.14 230)';

export default function StorePage() {
  const { products, fetchedAt } = getStore();

  return (
    <div
      className={styles.page}
      style={
        {
          '--accent-a': ACCENT,
          '--accent-b': ACCENT_2,
        } as React.CSSProperties
      }
    >
      <section className={styles.top}>
        <Starfield
          tint={`radial-gradient(120% 90% at 70% 28%, color-mix(in oklch, ${ACCENT} 20%, transparent), transparent 68%), radial-gradient(90% 70% at 18% 88%, color-mix(in oklch, ${ACCENT_2} 14%, transparent), transparent 62%)`}
        />
        <div className={`shell ${styles.topInner}`}>
          <p className="eyebrow">{site.store.name}</p>
          <h1 className={styles.title}>Wear the thing</h1>
          <p className={styles.lede}>
            Print-on-demand merch built around original illustrations — the
            Saturday-morning end of anime and early-2000s cartoons, not the
            prestige end.
          </p>
        </div>
      </section>

      <section className={`shell ${styles.body}`}>
        {products.length === 0 ? (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>Nothing on the rail yet</h2>
            <p>
              The designs are still being drawn. When the first ones are ready
              they appear here, and the catalogue keeps itself up to date from
              then on.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {products.map((product) => {
                const href = buyUrl(product);
                const price = formatPrice(product.from);

                const inner = (
                  <>
                    <div className={styles.art}>
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className={styles.noArt} aria-hidden="true" />
                      )}
                    </div>
                    <div className={styles.detail}>
                      <h2 className={styles.name}>{product.name}</h2>
                      <div className={styles.meta}>
                        {price && <span className={styles.price}>{price}</span>}
                        {product.variantCount > 1 && (
                          <span className={styles.variants}>
                            {product.variantCount} options
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                );

                return href ? (
                  <a
                    key={product.id}
                    className={styles.product}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {inner}
                    <span className={styles.buy}>Buy ↗</span>
                  </a>
                ) : (
                  <div key={product.id} className={styles.product}>
                    {inner}
                    <span className={styles.pending}>Not on sale yet</span>
                  </div>
                );
              })}
            </div>

            {/* Said plainly rather than implying a live shop front. */}
            <p className={styles.note}>
              Checkout happens on the storefront, not here.
              {fetchedAt && (
                <>
                  {' '}
                  Catalogue last synced{' '}
                  <time dateTime={fetchedAt}>
                    {new Date(fetchedAt).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  .
                </>
              )}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
