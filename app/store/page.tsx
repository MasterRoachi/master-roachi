import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import HalftoneField from '@/components/HalftoneField';
import ShirtIcon from '@/components/ShirtIcon';
import ShirtViewerMount from '@/components/ShirtViewerMount';
import GoodsViewerMount from '@/components/GoodsViewerMount';
import PageHeader from '@/components/PageHeader';
import CyclingQuote from '@/components/CyclingQuote';
import Swatches from '@/components/Swatches';
import SaDelivery from '@/components/SaDelivery';
import ModelCredit from '@/components/ModelCredit';
import { quotes } from '@/lib/quotes';
import {
  getStore,
  isBuyable,
  categoryOf,
  storeCategories,
  storePieces,
  productsInPiece,
  piecePath,
  pieceImage,
  productPath,
  sizesOf,
  priceSummary,
  isSoldOut,
  garmentLabel,
  copyOf,
  type StoreProduct,
} from '@/lib/store';
import { goodsFor, modelFor } from '@/lib/models';
import { site } from '@/lib/site';
import ProductCard from './ProductCard';
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

  // The first product leads: his order where he has set one in /work/shop,
  // Printful's otherwise. Everything else falls onto its shelf.
  const lead = products[0] ?? null;
  // The newest thing on the rail will not always be a t-shirt.
  const leadModel = lead ? modelFor(lead) : null;
  // Or, for a poster, canvas, button or mat, the shape built for it.
  const leadGood = lead && !leadModel ? goodsFor(lead) : null;
  const rest = products.filter((p) => p.id !== lead?.id);

  // His shelves, in his order (/work/shop), and only those with anything on.
  const shelves = storeCategories()
    .map(({ id, name }) => ({
      id,
      category: name,
      items: rest.filter((p) => categoryOf(p) === id),
    }))
    .filter((s) => s.items.length > 0);

  // The second way in: one link per artwork, so everything with one drawing
  // on it is a single page. Only collections with something in them.
  const pieces = storePieces()
    .map((piece) => ({ piece, items: productsInPiece(piece.id) }))
    .filter((p) => p.items.length > 0);

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
            <div className={styles.stageCol}>
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
              {/* Only when the model is this product — the newest thing on the
                  rail will not always be a t-shirt. */}
              {leadModel && (
                <ShirtViewerMount
                  model={leadModel.src}
                  printBand={leadModel.printBand}
                  print={lead.print}
                  fabric={lead.fabric ?? undefined}
                  alt={`${copyOf(lead).alt || lead.name}, which can be turned`}
                />
              )}
              {leadGood && <GoodsViewerMount good={leadGood} alt={`${copyOf(lead).alt || lead.name}, which can be turned`} />}
            </div>
            {/* Under the shirt, as on the product page: it describes the
                thing above it, not the product. */}
            {(leadModel || leadGood) && <p className={styles.turn}>Drag it to turn it.</p>}
            </div>

            <div className={styles.featureBody}>
              <p className="eyebrow">Latest</p>
              <h2 className={styles.featureName}>{lead.name}</h2>

              {priceSummary(lead) && (
                <>
                  {/* One line, not a ladder: sizes and their prices are
                      chosen together on the product page now. */}
                  <p className={styles.priceLine}>
                    {priceSummary(lead)}
                    <span className={styles.sizeCount}> · {sizesOf(lead).length} sizes</span>
                  </p>
                  <SaDelivery productId={String(lead.id)} className={styles.shipping} />
                </>
              )}

              <Swatches colors={lead.colors ?? []} />


              {garmentLabel(lead) && (
                <p className={styles.garment}>{garmentLabel(lead)}</p>
              )}

              <div className={styles.actions}>
                {/* The product page is where the detail lives — size guide,
                    what the blank actually is, why it cannot be bought yet —
                    so it is offered whether or not there is a Buy link. */}
                <Link href={productPath(lead)} className={styles.buyButton}>
                  {/* Not "see the shirt" — the newest thing on the rail is
                      whatever was made last, and it will not always be one. */}
                  See it →
                </Link>
                {/* No Buy link here any more: buying needs a size, and the
                    size is chosen on the product page. */}
                {isSoldOut(lead) ? (
                  <span className={styles.pending}>Sold out</span>
                ) : isBuyable(lead) ? null : (
                  <span className={styles.pending}>Not on sale yet</span>
                )}
              </div>
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>Nothing on the rail yet</h2>
            <p>
              The designs are still being drawn. When the first ones are ready
              they appear here, and the catalogue keeps itself up to date from
              then on.
            </p>
          </div>
        )}

        {pieces.length > 0 && (
          <nav className={styles.pieces} aria-label="By artwork">
            <h2 className={styles.shelfHead}>
              <span>By artwork</span>
              <span className={styles.shelfCount}>{pieces.length}</span>
            </h2>
            <ul className={styles.pieceList}>
              {pieces.map(({ piece, items }) => (
                <li key={piece.id}>
                  <Link href={piecePath(piece)} className={styles.pieceLink}>
                    <span className={styles.pieceArt}>
                      {pieceImage(piece) ? (
                        <img
                          src={pieceImage(piece) ?? undefined}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                    </span>
                    <span className={styles.pieceName}>{piece.name}</span>
                    <span className={styles.pieceMeta}>
                      {piece.artist ? `Art by ${piece.artist} · ` : ''}
                      {items.length} {items.length === 1 ? 'thing' : 'things'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {shelves.map(({ id, category, items }) => (
          <section key={id} id={id} className={styles.shelf}>
            <h2 className={styles.shelfHead}>
              <span>{category}</span>
              <span className={styles.shelfCount}>{items.length}</span>
            </h2>
            <div className={styles.grid}>
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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

        {/* Required by the model's licence, not optional politeness — and only
            where the model is shown. CC BY 4.0, see public/store/tshirt-license.txt.
            At the foot of the page rather than in the feature, where it read as
            part of the product. */}
        {leadModel && <ModelCredit model={leadModel} className={styles.credit} />}
      </div>
    </div>
  );
}
