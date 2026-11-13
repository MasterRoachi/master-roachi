import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageMeta } from '@/lib/seo';
import HalftoneField from '@/components/HalftoneField';
import {
  categoryOf,
  pieceImage,
  piecePath,
  productsInPiece,
  storeCategories,
  storePieces,
} from '@/lib/store';
import { site } from '@/lib/site';
import ProductCard from '../../ProductCard';
import styles from '../../store.module.css';

// One drawing, and everything it is printed on: the store's second way in,
// beside the shelves. Added 2026-11-12 with Timon's fifteen pieces, so that
// everything with Grumpy Television on it is one link.
//
// Built only for collections with something in them. An empty one has no page
// rather than a page saying so, which is also why the store index only links
// the ones that are filled.

const ACCENT = 'oklch(72% 0.26 350)';
const ACCENT_2 = 'oklch(80% 0.14 230)';

function findPiece(id: string) {
  return storePieces().find((p) => p.id === id) ?? null;
}

export function generateStaticParams() {
  return storePieces()
    .filter((p) => productsInPiece(p.id).length > 0)
    .map((p) => ({ piece: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ piece: string }>;
}): Promise<Metadata> {
  const { piece: id } = await params;
  const piece = findPiece(id);
  if (!piece) return {};
  const by = piece.artist ? `, art by ${piece.artist}` : '';
  return pageMeta({
    path: piecePath(piece),
    title: `${piece.name} — ${site.store.name}`,
    description: `${piece.name}${by}: every print, sticker and shirt it comes on, from ${site.store.name}.`,
  });
}

export default async function PiecePage({ params }: { params: Promise<{ piece: string }> }) {
  const { piece: id } = await params;
  const piece = findPiece(id);
  if (!piece) notFound();
  const products = productsInPiece(piece.id);
  if (products.length === 0) notFound();

  // On the same shelves as the store, in the same order, so a poster is never
  // between two shirts.
  const shelves = storeCategories()
    .map(({ id: shelf, name }) => ({ shelf, name, items: products.filter((p) => categoryOf(p) === shelf) }))
    .filter((s) => s.items.length > 0);
  const image = pieceImage(piece);

  return (
    <div
      className={styles.page}
      style={{ '--accent-a': ACCENT, '--accent-b': ACCENT_2 } as React.CSSProperties}
    >
      <HalftoneField />

      <div className={`shell ${styles.body}`}>
        <Link href="/store/" className={styles.back}>
          ← {site.store.name}
        </Link>

        <header className={styles.pieceHead}>
          {image && (
            <img className={styles.pieceHero} src={image} alt="" loading="eager" decoding="async" />
          )}
          <div>
            <p className="eyebrow">Artwork</p>
            <h1 className={styles.pieceTitle}>{piece.name}</h1>
            {piece.artist && <p className={styles.pieceBy}>Art by {piece.artist}</p>}
          </div>
        </header>

        {shelves.map(({ shelf, name, items }) => (
          <section key={shelf} className={styles.shelf}>
            <h2 className={styles.shelfHead}>
              <span>{name}</span>
              <span className={styles.shelfCount}>{items.length}</span>
            </h2>
            <div className={styles.grid}>
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
