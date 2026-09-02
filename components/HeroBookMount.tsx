'use client';

import dynamic from 'next/dynamic';

// three.js is a large dependency, so it is kept out of the initial bundle and
// fetched only once the page has rendered. ssr:false is required regardless —
// the scene touches window and WebGL, neither of which exists at build time.
const HeroBook = dynamic(() => import('./HeroBook'), {
  ssr: false,
  loading: () => null,
});

export default function HeroBookMount() {
  return <HeroBook />;
}
