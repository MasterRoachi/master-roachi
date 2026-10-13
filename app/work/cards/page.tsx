import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Cards from './Cards';
import styles from './cards.module.css';

// Flashcards, because Anki was not going to be used.
//
// A deck is a curriculum and the cards are made by its lessons, so there is no
// deck to find and nothing to set up — the two things that stopped Anki being
// used at all. See migrations/0010_cards.sql for the rest of that reasoning.

export const metadata: Metadata = pageMeta({
  path: '/work/cards/',
  title: 'Cards',
  description: 'What needs reviewing, and nothing else.',
  noIndex: true,
});

export default function WorkCardsPage() {
  /* NOT the site's .shell wrapper, which every other backend page uses. That
   * caps the width at 1180px and pads it by up to 64px a side, and this page's
   * whole job is a writing panel as large as the screen will give — "only a
   * 10px gap between it and screen edges". So it opts out and takes the
   * viewport. */
  return (
    <div className={styles.bleed}>
      <Cards />
    </div>
  );
}
