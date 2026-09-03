'use client';

import dynamic from 'next/dynamic';

// three.js is a large dependency and only the featured product needs it, so it
// is kept out of the initial bundle and fetched after the page renders.
// ssr:false is required regardless — the scene touches window and WebGL,
// neither of which exists at build time.
const ShirtViewer = dynamic(() => import('./ShirtViewer'), {
  ssr: false,
  loading: () => null,
});

export default function ShirtViewerMount(props: { src: string; alt?: string }) {
  return <ShirtViewer {...props} />;
}
