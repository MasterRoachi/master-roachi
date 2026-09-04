import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import HalftoneField from '@/components/HalftoneField';
import ShirtIcon from '@/components/ShirtIcon';
import ShirtViewerMount from '@/components/ShirtViewerMount';
import PageHeader from '@/components/PageHeader';
import CyclingQuote from '@/components/CyclingQuote';
import { quotes } from '@/lib/quotes';
import {
  getStore,
  buyUrl,
  formatPrice,
  categoryOf,
  type StoreProduct,
} from '@/lib/store';
import { site } from '@/lib/site';
import styles from './store.module.css';

export const metadata: Metadata = pageMeta({
  path: '/store/',
  title: 'Store',
  description:
    'Fabled Threads — print-on-demand merch built around anime and early-2000s cartoon inspired illustrations.',
});

// Fabled Threads keeps its own colour here, the one its project card carried.
const ACCENT = 'oklch(72% 0.26 350)';
const ACCENT_2 = 'oklch(80% 0.14 230)';

export default function StorePage() {
  const { products } = getStore();

  /**
   * Invented items alongside the real ones, so the grid can be judged before
   * there is a catalogue to judge. They carry no price link and are marked, and
   * they disappear the moment `placeholders` in lib/site.ts is emptied.
   */
  const invented: StoreProduct[] = site.store.placeholders.map((p, i) => ({
    id: -1 - i,
    externalId: null,
    name: p.name,
    thumbnail: null,
    variantCount: p.options,
    from: { amount: p.from, currency: 'USD' },
    category: p.category,
    placeholder: true,
  }));

  const all = [...products, ...invented];

  // The newest real product leads. Everything else falls onto its shelf.
  const lead = products[0] ?? null;
  const rest = all.filter((p) => p.id !== lead?.id);

  const shelves = site.store.categories
    .map((category) => ({
      category,
      items: rest.filter((p) => categoryOf(p) === category),
    }))
    .filter((s) => s.items.length > 0);

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
          lede={<CyclingQuote quotes={quotes} seed="store" />}
        />

        {lead && (
          <div className={styles.feature}>
            <div className={styles.stage}>
              {/* The flat cut-out is the floor: it is what shows before
                  three.js arrives, where WebGL is unavailable, and under
                  reduced motion. The viewer fades in over it. */}
              {lead.art || lead.thumbnail ? (
                <img
                  className={styles.stageFlat}
                  src={lead.art ?? lead.thumbnail ?? undefined}
                  alt=""
                  loading="eager"
                  decoding="async"
                />
              ) : null}
              <ShirtViewerMount
                print={lead.print}
                fabric={lead.fabric ?? undefined}
                alt={`${lead.name}, which can be turned`}
              />
            </div>

            <div className={styles.featureBody}>
              <p className="eyebrow">Latest</p>
              <h2 className={styles.featureName}>{lead.name}</h2>
              <div className={styles.meta}>
                {formatPrice(lead.from) && (
                  <span className={styles.price}>{formatPrice(lead.from)}</span>
                )}
                {lead.variantCount > 1 && (
                  <span className={styles.variants}>
                    {lead.variantCount} options
                  </span>
                )}
              </div>
              <p className={styles.turn}>Drag it to turn it.</p>
              {/* Required by the model's licence, not optional politeness.
                  CC BY 4.0 — see public/store/tshirt-license.txt. */}
              <p className={styles.credit}>
                Shirt model{' '}
                <a
                  href="https://sketchfab.com/3d-models/tshirt-5a21282b2e454d1696547148f617d3d0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tshirt
                </a>{' '}
                by{' '}
                <a
                  href="https://sketchfab.com/Tabbuso"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tabbuso
                </a>
                , licensed{' '}
                <a
                  href="http://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CC BY 4.0
                </a>
                .
              </p>
              {buyUrl(lead) ? (
                <a
                  className={styles.buyButton}
                  href={buyUrl(lead) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy ↗
                </a>
              ) : (
                <span className={styles.pending}>Not on sale yet</span>
              )}
            </div>
          </div>
        )}

        {products.length === 0 && invented.length === 0 && (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>Nothing on the rail yet</h2>
            <p>
              The designs are still being drawn. When the first ones are ready
              they appear here, and the catalogue keeps itself up to date from
              then on.
            </p>
          </div>
        )}

        {shelves.map(({ category, items }) => (
          <section key={category} className={styles.shelf}>
            <h2 className={styles.shelfHead}>
              <span>{category}</span>
              <span className={styles.shelfCount}>{items.length}</span>
            </h2>
            <div className={styles.grid}>
              {items.map((product) => {
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
                      {product.placeholder ? (
                        <span className={styles.placeholder}>Placeholder</span>
                      ) : href ? (
                        <span className={styles.buy}>Buy ↗</span>
                      ) : (
                        <span className={styles.pending}>Not on sale yet</span>
                      )}
                    </span>
                  </>
                );

                return href && !product.placeholder ? (
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
                  <div
                    key={product.id}
                    className={styles.product}
                    data-placeholder={product.placeholder || undefined}
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

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

        {site.store.coming.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Soon</p>
            <h2 className="section-title">Still being drawn</h2>
            <ul className={styles.coming}>
              {site.store.coming.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
