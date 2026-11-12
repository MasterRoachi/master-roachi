'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWhenIdleAndSeen } from './useWhenIdleAndSeen';

// three.js is a large dependency, so it is kept out of the initial bundle and
// fetched only once the page has loaded, the browser is idle and the book is
// in view (useWhenIdleAndSeen; the audit's ninth finding). ssr:false is required regardless —
// the scene touches window and WebGL, neither of which exists at build time.
const HeroBook = dynamic(() => import('./HeroBook'), {
  ssr: false,
  loading: () => null,
});

export default function HeroBookMount() {
  const spot = useRef<HTMLDivElement>(null);
  const ready = useWhenIdleAndSeen(spot);
  return (
    <div ref={spot} style={{ display: 'contents' }}>
      {ready && <HeroBook />}
    </div>
  );
}
