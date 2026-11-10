'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import styles from '../collection.module.css';

// The live preview panel beside the editor on a computer.
//
// His pick, 2026-11-10 (redesign page, Projects and Writing: A): on a
// computer, the tabs sit on the left and a live preview on the right. From
// 1280px rather than 1000px since his call, 2026-11-10 (design pass: the
// public site's styling, the CRM's desktop layout): the entry list now keeps
// a column of its own from 900px, and under 1280px there is no room left for
// a frame big enough to read. It is the
// same thing Preview the page opens full screen (app/work/shop/PagePreview):
// the real deployed page in a frame with ?preview=1, sent the unsaved draft on
// every change and whenever it asks (components/usePreviewDraft.ts). Kept as
// its own small frame rather than a mode of PagePreview because PagePreview is
// a full-screen dialog owned by the shop, and this is a panel that never
// covers anything.

/** Where the side panel appears. One number, matched by the CSS. */
export const WIDE = '(min-width: 1280px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Whether the screen is wide enough for the side panel.
 *
 * Asked so the frame is only mounted where it shows. A frame hidden by CSS
 * still loads the whole page, and on a phone that is a second copy of the
 * site downloading behind the editor for nothing.
 */
export function useWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

export default function LiveFrame({
  href,
  name,
  type,
  payload,
}: {
  href: string;
  name: string;
  type: string;
  payload: unknown;
}) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const send = () => frame.current?.contentWindow?.postMessage({ type, payload }, window.location.origin);
    send();
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.current?.contentWindow) return;
      if ((event.data as { type?: string } | null)?.type === `${type}:ready`) send();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [type, payload]);

  return (
    <iframe
      ref={frame}
      title={`${name} — live preview`}
      src={`${href}?preview=1`}
      className={styles.liveFrame}
    />
  );
}
