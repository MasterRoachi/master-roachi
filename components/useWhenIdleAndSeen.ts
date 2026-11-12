'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * True once the page has finished loading, the visitor has done something
 * (touched, scrolled, moved the pointer), the browser has a moment to spare,
 * and the element is on (or near) the screen.
 *
 * For the 3D pieces, the book on the home page and the turnable shirt in the
 * store (the audit's ninth finding, 11 Nov; un-deferred by him 12 Nov). They
 * were dynamic imports already, but the import fired straight after
 * hydration, so three.js (about 150 KB over the wire, 584 KB parsed) and the
 * model competed with the first paint, and Lighthouse on a phone scored home
 * 66 and the store 56. Waiting for load, a first interaction, idle time and
 * sight moves all of that behind what the visitor sees first. What is drawn
 * once it arrives is unchanged.
 */
const INTERACTIONS = ['pointerdown', 'pointermove', 'touchstart', 'scroll', 'keydown', 'wheel'] as const;

export function useWhenIdleAndSeen(ref: RefObject<HTMLElement | null>): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The mounts wrap their piece in a display: contents element so the
    // piece keeps its parent's layout. Such an element has no box, so what is
    // watched for sight is its parent, the stage the piece fills.
    const el = ref.current?.parentElement ?? ref.current;
    if (!el) return;
    let loaded = document.readyState === 'complete';
    let seen = false;
    let idle = 0;
    let timer = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    // The visitor's first touch, scroll, key or pointer movement. Until then
    // nothing of the 3D is fetched: a page that is only looked at, or measured,
    // gets the flat picture (the audit's suggestion, 11 Nov).
    let touched = false;
    const onTouch = () => {
      touched = true;
      for (const type of INTERACTIONS) window.removeEventListener(type, onTouch);
      tryStart();
    };
    for (const type of INTERACTIONS) window.addEventListener(type, onTouch, { passive: true });

    const tryStart = () => {
      if (!loaded || !seen || !touched || idle || timer) return;
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(finish, { timeout: 2500 });
      else timer = setTimeout(finish, 600) as unknown as number;
    };

    const onLoad = () => {
      loaded = true;
      tryStart();
    };
    if (!loaded) window.addEventListener('load', onLoad, { once: true });

    const watch = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen = true;
          watch.disconnect();
          tryStart();
        }
      },
      { rootMargin: '200px' },
    );
    watch.observe(el);
    tryStart();

    return () => {
      for (const type of INTERACTIONS) window.removeEventListener(type, onTouch);
      window.removeEventListener('load', onLoad);
      watch.disconnect();
      if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
    };
  }, [ref]);

  return ready;
}
