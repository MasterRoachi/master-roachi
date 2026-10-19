'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { ProductCopy } from '@/lib/product-copy';

// The parts of a product page that are his words, able to show a draft.
//
// Shop step 5: /work/shop previews the REAL product page in a frame and sends
// the unsaved copy into it as he types, so what he sees is what a visitor will
// — the same layout, the same 3D shirt, the same everything else — with only
// the words swapped. Each piece renders the built copy until a draft arrives.
//
// It listens only when the page was opened as /store/<slug>/?preview=1 inside
// a frame, and only to messages from this site's own origin. A visitor's page
// is never in that state, so for them this is static text with no listener.

export const PREVIEW_MESSAGE = 'product-copy-preview';

function useLiveCopy(initial: ProductCopy): ProductCopy {
  const [copy, setCopy] = useState(initial);

  useEffect(() => {
    const previewing =
      window.parent !== window && new URLSearchParams(window.location.search).get('preview') === '1';
    if (!previewing) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; copy?: ProductCopy } | null;
      if (data?.type === PREVIEW_MESSAGE && data.copy) setCopy(data.copy);
    };
    window.addEventListener('message', onMessage);
    // Asks for the draft once listening, so a frame that loads after the
    // editor last sent does not sit on the built copy until the next keystroke.
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return copy;
}

export function LiveTagline({ initial, className }: { initial: ProductCopy; className?: string }) {
  const copy = useLiveCopy(initial);
  return copy.tagline ? <p className={className}>{copy.tagline}</p> : null;
}

/** The design or the story: a section of paragraphs, or nothing when empty. */
export function LiveSection({
  initial,
  field,
  eyebrow,
  sectionClassName,
  bodyClassName,
}: {
  initial: ProductCopy;
  field: 'description' | 'story';
  eyebrow: string;
  sectionClassName?: string;
  bodyClassName?: string;
}) {
  const copy = useLiveCopy(initial);
  const paragraphs = copy[field];
  if (paragraphs.length === 0) return null;
  return (
    <section className={sectionClassName}>
      <p className="eyebrow">{eyebrow}</p>
      <div className={bodyClassName}>
        {paragraphs.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </section>
  );
}

/**
 * Fit and care: his note above Printful's size table. The table is passed in
 * as children so it stays rendered on the server; only the note is live.
 */
export function LiveFit({
  initial,
  sectionClassName,
  careClassName,
  children,
}: {
  initial: ProductCopy;
  sectionClassName?: string;
  careClassName?: string;
  /** The size guide, or nothing when the product has none. */
  children?: ReactNode;
}) {
  const copy = useLiveCopy(initial);
  if (!copy.care && !children) return null;
  return (
    <section className={sectionClassName}>
      <p className="eyebrow">Fit</p>
      <h2 className="section-title">{copy.care ? 'Fit and care' : 'Size guide'}</h2>
      {copy.care && <p className={careClassName}>{copy.care}</p>}
      {children}
    </section>
  );
}
