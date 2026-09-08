import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageMeta } from '@/lib/seo';
import HalftoneField from '@/components/HalftoneField';
import ShirtViewerMount from '@/components/ShirtViewerMount';
import Swatches from '@/components/Swatches';
import SizeTable from '@/components/SizeTable';
import ModelCredit from '@/components/ModelCredit';
import {
  getStoreProducts,
  findProduct,
  buyUrl,
  formatPrice,
  money,
  sizesOf,
  sizeRun,
  priceLadder,
  isSoldOut,
  garmentLabel,
  blurbOf,
  hasArtwork,
  type StoreProduct,
} from '@/lib/store';
import { modelFor } from '@/lib/models';
import { site } from '@/lib/site';
import styles from './product.module.css';

// The store's own colour, the same one the index and the project card carry.
const ACCENT = 'oklch(72% 0.26 350)';
const ACCENT_2 = 'oklch(80% 0.14 230)';

export function generateStaticParams() {
  return getStoreProducts().map((p) => ({ slug: p.slug ?? String(p.id) }));
}

function priceSummary(product: StoreProduct): string | null {
  const bands = priceLadder(product);
  if (bands.length === 0) return formatPrice(product.from);
  const low = bands[0];
  const high = bands[bands.length - 1];
  return low.amount === high.amount
    ? money(low.amount, low.currency)
    : `${money(low.amount, low.currency)} – ${money(high.amount, high.currency)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};

  const price = priceSummary(product);
  const garment = garmentLabel(product);

  return pageMeta({
    path: `/store/${slug}/`,
    title: product.name,
    description: [
      `${product.name} from ${site.store.name}.`,
      garment,
      price && `${price}.`,
    ]
      .filter(Boolean)
      .join(' '),
    // A card built for this product by scripts/og.mjs — the garment on the
    // site's ground with its name and price, at the 1200x630 every platform
    // crops to. Pointing this at the cut-out mockup instead, as it first did,
    // sent a portrait WebP on transparency to services that mostly cannot
    // render one.
    image: `/store/og/${slug}.png`,
    imageSize: { width: 1200, height: 630 },
    imageAlt: `${product.name} — ${site.store.name}`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const sizes = sizesOf(product);
  const ladder = priceLadder(product);
  const soldOut = isSoldOut(product);
  const href = buyUrl(product);
  const spec = product.garment?.spec ?? [];
  const blurb = blurbOf(product);
  // Which 3D garment stands for this product, if any.
  const model = modelFor(product);

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
        <Link href="/store/" className={styles.back}>
          ← {site.store.name}
        </Link>

        {/* With no mockup and no model there is nothing to put in the stage,
            and an empty 4:5 box beside the copy looks like a failed image
            rather than a product without a photograph yet. */}
        <div className={styles.top} data-bare={!hasArtwork(product) || undefined}>
          {hasArtwork(product) && (
          <div className={styles.stageCol}>
            <div className={styles.stage}>
              {/* Same arrangement as the index feature: the flat mockup is the
                  floor, and the turnable one fades in over it where WebGL is
                  available and motion is allowed. */}
              {hasArtwork(product) ? (
                <img
                  className={styles.stageFlat}
                  src={product.art ?? product.thumbnail ?? undefined}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                />
              ) : null}
              {/* Only where the model is this product. A poster is not a
                  t-shirt and should not be shown as one. */}
              {model && (
                <ShirtViewerMount
                  model={model.src}
                  printBand={model.printBand}
                  print={product.print}
                  fabric={product.fabric ?? undefined}
                  alt={`${product.name}, which can be turned`}
                />
              )}
            </div>
            {/* Below the garment, not over it — the shirt fills its stage to
                the edges and an overlaid caption lands on the hem. */}
            {model && <p className={styles.turn}>Drag it to turn it.</p>}
          </div>
          )}

          <div className={styles.detail}>
            <p className="eyebrow">{site.store.name}</p>
            <h1 className={styles.name}>{product.name}</h1>

            {priceSummary(product) && (
              <>
                <p className={styles.priceLine}>{priceSummary(product)}</p>
                {/* Said next to the number rather than in the policy alone.
                    A price that turns out to exclude postage is the single
                    most common way an online store feels like a trick. */}
                <p className={styles.shipping}>Worldwide delivery included</p>
              </>
            )}

            <Swatches colors={product.colors ?? []} />

            {sizes.length > 0 && (
              <p className={styles.sizes}>
                <span className={styles.sizesLabel}>Sizes</span>
                {sizes.map((s) => (
                  <span key={s} className={styles.size}>
                    {s}
                  </span>
                ))}
              </p>
            )}

            {ladder.length > 1 && (
              <dl className={styles.ladder}>
                {ladder.map((band) => (
                  <div key={band.sizes.join()} className={styles.band}>
                    <dt>{sizeRun(band.sizes)}</dt>
                    <dd>{money(band.amount, band.currency)}</dd>
                  </div>
                ))}
              </dl>
            )}

            {soldOut ? (
              <p className={styles.pending}>Sold out</p>
            ) : href ? (
              <a
                className={styles.buyButton}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy ↗
              </a>
            ) : (
              <div className={styles.notYet}>
                <p className={styles.pending}>Not on sale yet</p>
                {/* The store has no checkout. Saying so here is better than a
                    button that goes nowhere, and better than silence. */}
                <p className={styles.notYetWhy}>
                  Payment is still being set up. The design is finished and
                  this is a real product — there is just nowhere to take your
                  money yet.
                </p>
              </div>
            )}

            {garmentLabel(product) && (
              <p className={styles.garment}>
                Printed on {garmentLabel(product)}
              </p>
            )}
          </div>
        </div>

        {blurb.length > 0 && (
          /* No heading. It is four sentences about a drawing, and titling it
             "About this design" would be more furniture than the words. */
          <section className={styles.section}>
            <p className="eyebrow">The design</p>
            <div className={styles.blurb}>
              {blurb.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        )}

        {spec.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">The blank</p>
            <h2 className="section-title">What it is printed on</h2>
            <ul className={styles.spec}>
              {spec.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {product.garment?.disclaimer && (
              <p className={styles.disclaimer}>
                {product.garment.disclaimer}
              </p>
            )}
          </section>
        )}

        {product.sizeGuide && sizes.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Fit</p>
            <h2 className="section-title">Size guide</h2>
            <SizeTable guide={product.sizeGuide} sizes={sizes} />
          </section>
        )}

        <section className={styles.section}>
          <p className="eyebrow">How this works</p>
          <h2 className="section-title">Printed when you order it</h2>
          <div className={styles.prose}>
            <p>
              Nothing here sits in a box in a garage. Each one is printed and
              shipped by Printful when it is ordered, which is why there is no
              stock to run out of and no minimum order to hit before a design
              is worth making.
            </p>
            <p>
              It also means it takes longer to arrive than something already on
              a shelf somewhere, and that a change of mind cannot be restocked.
              What happens if it turns up faulty, late or wrong is written
              down: see <Link href="/policies/">terms, delivery and returns</Link>.
            </p>
          </div>
        </section>

        {/* Required by the model's licence, not optional politeness — and
            only where the model is actually shown. Crediting it on a poster's
            page was crediting work the page did not use.
            CC BY 4.0 — see public/store/tshirt-license.txt. */}
        {model && <ModelCredit model={model} className={styles.credit} />}
      </div>
    </div>
  );
}
