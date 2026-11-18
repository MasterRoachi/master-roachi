import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { collection, LIBRARY_NAME } from '@/lib/library';
import LibraryMount from '@/components/library/LibraryMount';
import type { Game } from '@/components/library/gamesroom';
import gamesData from '@/data/wyggzantium-games.json';
import styles from './wyggzantium.module.css';

// The Library of Wyggzantium: lib/library.ts says what it is. It is meant for
// wigga.masterroachi.com, so it fills the whole window and covers the site's
// nav and footer rather than sitting between them.
//
// Its address is wigga.masterroachi.com (worker/library.ts), which opens on
// this page; on the apex the page forwards there. So the canonical and the
// share card name that address, not the apex path pageMeta would give.
const ADDRESS = 'https://wigga.masterroachi.com/wyggzantium/';
const meta = pageMeta({
  path: '/wyggzantium/',
  title: LIBRARY_NAME,
  description:
    'A Byzantine hall of CDs, records and box sets. Take anything down, open it, play the music, the podcasts, the lectures and the debates.',
});
export const metadata: Metadata = {
  ...meta,
  alternates: { ...meta.alternates, canonical: ADDRESS },
  openGraph: { ...meta.openGraph, url: ADDRESS },
};

export default function WyggzantiumPage() {
  return (
    <section className={styles.stage} aria-label={LIBRARY_NAME}>
      <LibraryMount collection={collection} games={gamesData.games as Game[]} />
    </section>
  );
}
