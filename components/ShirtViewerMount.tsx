'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWhenIdleAndSeen } from './useWhenIdleAndSeen';
import type { PrintPlacement } from './ShirtViewer';

// three.js is a large dependency and only the featured product needs it, so it
// is kept out of the initial bundle and fetched once the page has loaded, the
// browser is idle and the shirt is in view (useWhenIdleAndSeen; the audit's
// ninth finding). The flat picture of the product shows until then.
// ssr:false is required regardless — the scene touches window and WebGL,
// neither of which exists at build time.
const ShirtViewer = dynamic(() => import('./ShirtViewer'), {
  ssr: false,
  loading: () => null,
});

export default function ShirtViewerMount(props: {
  print?: PrintPlacement | null;
  fabric?: string;
  alt?: string;
  model?: string;
  printBand?: { top: number; bottom: number };
}) {
  const spot = useRef<HTMLDivElement>(null);
  const ready = useWhenIdleAndSeen(spot);
  return (
    <div ref={spot} style={{ display: 'contents' }}>
      {ready && <ShirtViewer {...props} />}
    </div>
  );
}
