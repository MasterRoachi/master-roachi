'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWhenIdleAndSeen } from './useWhenIdleAndSeen';
import type { FlatGood } from '@/lib/models';

// three.js waits for the visitor, as the shirt's does (ShirtViewerMount):
// fetched once the page has loaded, the browser is idle and it is in view.
const GoodsViewer = dynamic(() => import('./GoodsViewer'), { ssr: false, loading: () => null });

export default function GoodsViewerMount(props: { good: FlatGood; alt?: string }) {
  const spot = useRef<HTMLDivElement>(null);
  const ready = useWhenIdleAndSeen(spot);
  return (
    <div ref={spot} style={{ display: 'contents' }}>
      {ready && <GoodsViewer {...props} />}
    </div>
  );
}
