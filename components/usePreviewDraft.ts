'use client';

import { useEffect, useState } from 'react';

// A page that can show a draft sent from the backend's preview frame.
//
// /work previews a page by opening the REAL deployed page in a frame with
// ?preview=1 and posting the unsaved draft into it (app/work/shop/PagePreview).
// This is the listening half. It listens only when the page is framed with
// ?preview=1, only to its own origin, and only for its own message type; a
// visitor's page is never in that state, so for them this returns `initial`
// and adds no listener. Once listening, it asks for the draft, so a frame that
// loads after the editor last sent is not left on the built version.

export function usePreviewDraft<T>(type: string, initial: T): T {
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    const previewing =
      window.parent !== window && new URLSearchParams(window.location.search).get('preview') === '1';
    if (!previewing) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; payload?: T } | null;
      if (data?.type === type && data.payload !== undefined) setDraft(data.payload);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: `${type}:ready` }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [type]);

  return draft;
}
