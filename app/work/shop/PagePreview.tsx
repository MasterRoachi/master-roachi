'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './store.module.css';

// The real page, with the draft in it — a product page from Shop step 5, a
// project page from Stage 2. `type` names what the page listens for
// (components/usePreviewDraft.ts) and `payload` is the draft.
//
// Not a mock-up of the page: the deployed /store/<slug>/ in a frame, opened
// with ?preview=1, which makes its copy sections listen for a draft from this
// origin (components/LiveCopy.tsx). Everything else on it — layout, price,
// art, the 3D shirt — is exactly what a visitor gets, because it is the same
// page. Only the words are swapped, and only in this frame.
//
// What it cannot show is a change that is not words: new art or a re-sync
// reaches the frame after the deploy, like it reaches everyone.

const WIDTHS = [
  { key: 'desktop', name: 'Desktop', px: null },
  { key: 'phone', name: 'Phone', px: 390 },
] as const;

export default function PagePreview({
  href,
  name,
  type,
  payload,
  onClose,
}: {
  href: string;
  name: string;
  type: string;
  payload: unknown;
  onClose: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [width, setWidth] = useState<(typeof WIDTHS)[number]['key']>('desktop');

  // Send the draft on every change, and whenever the page asks — it asks once
  // it is listening, which is after this effect may already have run.
  useEffect(() => {
    const send = () => frame.current?.contentWindow?.postMessage({ type, payload }, window.location.origin);
    send();
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type === `${type}:ready`) send();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [type, payload]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const px = WIDTHS.find((w) => w.key === width)?.px ?? null;

  return (
    <div className={styles.pagePreview} role="dialog" aria-modal="true" aria-label={`${name} — page preview`}>
      <div className={styles.pagePreviewBar}>
        <p>
          <strong>{name}</strong> — the live page, with your unsaved words in it. Nothing here is saved or
          published.
        </p>
        <div className={styles.pagePreviewTools}>
          {WIDTHS.map((w) => (
            <button key={w.key} type="button" aria-pressed={width === w.key} onClick={() => setWidth(w.key)}>
              {w.name}
            </button>
          ))}
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className={styles.pagePreviewStage}>
        <iframe
          ref={frame}
          title={`${name} — preview`}
          src={`${href}?preview=1`}
          className={styles.pagePreviewFrame}
          style={px ? { width: `${px}px` } : undefined}
        />
      </div>
    </div>
  );
}
