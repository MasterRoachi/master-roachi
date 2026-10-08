'use client';

import { useEffect, useState } from 'react';
import styles from './nav.module.css';

// The two things that are about the site rather than about any one tool, so
// they live on the front door rather than being repeated on every page.

/**
 * Whether what is deployed is the newest commit.
 *
 * No Cloudflare credential: every build stamps its commit into /version.json,
 * and this compares that with the head of main. It therefore reports a FAILED
 * build the same way as one still running — the site is simply not current —
 * which is the question actually being asked. Asking Cloudflare for the last
 * build's status would say "failed" and still leave you working out what is
 * live.
 */
function Version() {
  const [state, setState] = useState<{
    live: string | null;
    head: string | null;
    current: boolean | null;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await fetch('/work/api/version', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (alive) setState(data);
      } catch {
        /* the page works without this line */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!state) return null;

  // Unknown is its own answer, not a problem: a build made before the stamp
  // existed has nothing to compare, and must not read as out of date.
  if (state.current === null) {
    return <span className={styles.quiet}>Deployed version unknown.</span>;
  }

  if (state.current) {
    return <span className={styles.quiet}>Live and current, at {state.live?.slice(0, 7)}.</span>;
  }

  return (
    <span className={styles.stale}>
      Serving {state.live?.slice(0, 7)}, main is at {state.head?.slice(0, 7)} — a build is
      running or it failed.
    </span>
  );
}

/**
 * Make the site rebuild.
 *
 * Confirmed rather than instant, because it costs a commit in the history and
 * a build, and because the one thing worse than forgetting to rebuild is
 * rebuilding four times by double-clicking.
 */
export default function SiteActions() {
  const [state, setState] = useState<'idle' | 'working' | string>('idle');

  async function go() {
    if (!confirm('Rebuild the site? This commits and redeploys — about two minutes.')) return;
    setState('working');
    try {
      const response = await fetch('/work/api/rebuild', { method: 'POST' });
      const data = (await response.json()) as {
        started?: boolean;
        commit?: string;
        configured?: boolean;
        error?: string;
      };
      if (data.configured === false) setState('Not connected — GITHUB_TOKEN is not set.');
      else if (!response.ok || !data.started) setState(data.error ?? `Failed (${response.status}).`);
      else setState(`Building ${data.commit?.slice(0, 7)} — live in about two minutes.`);
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Failed.');
    }
  }

  return (
    <p className={styles.actions}>
      <button type="button" onClick={() => void go()} disabled={state === 'working'}>
        {state === 'working' ? 'Starting…' : 'Rebuild the site'}
      </button>
      {state === 'idle' || state === 'working' ? (
        <Version />
      ) : (
        <span className={styles.quiet}>{state}</span>
      )}
    </p>
  );
}
