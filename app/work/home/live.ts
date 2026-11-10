'use client';

import { useCallback, useEffect, useState } from 'react';

// How the three homes read their live numbers.
//
// A HOME NEVER SHOWS AN ERROR (his rule for the redesign, 2026-11-10). Every
// read here answers null on any failure — a refused request, Access's login
// page where JSON was expected, a network drop — and the page that asked
// simply draws the plain door or leaves the card out. The tool behind the door
// is where a problem is reported, because that is where it can be fixed.
//
// Each home calls only the APIs its own app is served (`apis` in
// lib/work-tools.ts), the same endpoints the tools themselves call; nothing
// here needs an endpoint of its own.

/** JSON from one of the app's own endpoints, or null. Never throws. */
export async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * A value read once on mount, and a way to read it again.
 *
 * `load` must be stable (a module-level function), or it reads on every
 * render. A reload that fails keeps the value it had: on the tools home that
 * is what makes a refused tick look refused rather than vanish.
 */
export function useLive<T>(load: () => Promise<T | null>): [T | null, () => Promise<void>] {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let alive = true;
    void load()
      .catch(() => null)
      .then((got) => {
        if (alive && got !== null) setValue(got);
      });
    return () => {
      alive = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    const got = await load().catch(() => null);
    if (got !== null) setValue(got);
  }, [load]);

  return [value, reload];
}
