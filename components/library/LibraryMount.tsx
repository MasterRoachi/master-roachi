'use client';

import dynamic from 'next/dynamic';
import type { Collection } from '@/lib/library';
import type { Game } from './gamesroom';

// three.js stays out of the page's first bundle and the scene never renders at
// build time: it touches window and WebGL, neither of which exists there.
const Library = dynamic(() => import('./Library'), { ssr: false, loading: () => null });

export default function LibraryMount({ collection, games }: { collection: Collection; games: Game[] }) {
  return <Library collection={collection} games={games} />;
}
