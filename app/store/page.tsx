import type { Metadata } from 'next';
import HalftoneField from '@/components/HalftoneField';
import ShirtIcon from '@/components/ShirtIcon';
import PageHeader from '@/components/PageHeader';
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

  // One product gets a panel; several get a grid. A single card marooned in a
  // six-column grid reads as a shop that failed to load rather than one that
  // is starting.
  const solo = products.length === 1;
  const coming = site.store.coming;

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
      <HalftoneField />

      <div className={`shell ${styles.body}`}>
        <PageHeader
          mark={<ShirtIcon />}
          eyebrow={site.store.name}
          title="Wear the thing"
          lede="Print-on-demand merch built around original illustrations — the Saturday-morning end of anime and early-2000s cartoons, not the prestige end."
        />

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
          <div className={solo ? styles.solo : styles.grid}>
            {products.map((product) => {
              const href = buyUrl(product);
              const price = formatPrice(product.from);

              const inner = (
                <>
                  <span className={styles.art}>
                    {product.art || product.thumbnail ? (
                      <img
                        src={product.art ?? product.thumbnail ?? undefined}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className={styles.noArt} aria-hidden="true" />
                    )}
                  </span>
                  <span className={styles.detail}>
                    <span className={styles.name}>{product.name}</span>
                    <span className={styles.meta}>
                      {price && <span className={styles.price}>{price}</span>}
                      {product.variantCount > 1 && (
                        <span className={styles.variants}>
                          {product.variantCount} options
                        </span>
                      )}
                    </span>
                    {href ? (
                      <span className={styles.buy}>Buy ↗</span>
                    ) : (
                      <span className={styles.pending}>Not on sale yet</span>
                    )}
                  </span>
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
                </a>
              ) : (
                <div key={product.id} className={styles.product}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        <section className={styles.section}>
          <p className="eyebrow">The idea</p>
          <h2 className="section-title">What Fabled Threads is</h2>
          <div className={styles.prose}>
            <p>
              Original illustrations, printed on things you can wear. The
              drawing comes first — the shirt is where it ends up, not the
              reason it exists.
            </p>
            <p>
              The reference is the Saturday-morning end of anime and early-2000s
              cartoons: the shows that were on before anyone told you which ones
              were supposed to be good. Loud line work, flat colour, characters
              drawn to be recognised from across a room.
            </p>
          </div>
        </section>

        {coming.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Soon</p>
            <h2 className="section-title">Still being drawn</h2>
            <ul className={styles.coming}>
              {coming.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <p className="eyebrow">Ordering</p>
          <h2 className="section-title">How buying works</h2>
          <div className={styles.prose}>
            <p>
              Each design has its own payment link. Paying opens it — this site
              never takes a card number, and there is no basket to abandon.
            </p>
            <p>
              Nothing is printed until it is bought. The order goes to a
              print-on-demand shop, is made for you, and ships from wherever is
              nearest. That is why a design can exist without a warehouse full
              of it, and why an unsold one costs nothing to keep listed.
            </p>
            {fetchedAt && (
              <p className={styles.synced}>
                Catalogue read straight from the print shop, last synced{' '}
                <time dateTime={fetchedAt}>
                  {new Date(fetchedAt).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                .
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
