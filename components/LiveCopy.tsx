'use client';

import type { ReactNode } from 'react';
import { usePreviewDraft } from './usePreviewDraft';
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

const useLiveCopy = (initial: ProductCopy) => usePreviewDraft(PREVIEW_MESSAGE, initial);

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
 * Fit and care: his note above Printful's size table, in a card shut until
 * opened. The table is passed in as children so it stays rendered on the
 * server; only the note is live.
 */
export function LiveFit({
  initial,
  foldClassName,
  headClassName,
  titleClassName,
  plusClassName,
  careClassName,
  children,
}: {
  initial: ProductCopy;
  foldClassName?: string;
  headClassName?: string;
  titleClassName?: string;
  plusClassName?: string;
  careClassName?: string;
  /** The size guide, or nothing when the product has none. */
  children?: ReactNode;
}) {
  const copy = useLiveCopy(initial);
  if (!copy.care && !children) return null;
  return (
    <details className={foldClassName}>
      <summary className={headClassName}>
        <span>
          <span className="eyebrow">Fit</span>
          <span className={titleClassName}>{copy.care ? 'Fit and care' : 'Size guide'}</span>
        </span>
        <span className={plusClassName} aria-hidden="true" />
      </summary>
      {copy.care && <p className={careClassName}>{copy.care}</p>}
      {children}
    </details>
  );
}
