import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Cards from './Cards';

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
  return (
    <div className="shell">
      <Cards />
    </div>
  );
}
