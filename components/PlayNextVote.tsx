'use client';

import { useEffect, useState } from 'react';
import type { Candidate, PollState } from '@/lib/poll';
import styles from './playNextVote.module.css';

// The queue, with a vote on what comes first.
//
// The list itself is rendered on the server and is in the static HTML, so the
// queue is readable with no JavaScript and before the API answers. Only the
// tally and the buttons are added afterwards. If the poll has no store bound,
// or the request fails, this quietly stays a list — which is still true and
// still worth reading, rather than an error where a feature should be.

export default function PlayNextVote({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const [poll, setPoll] = useState<PollState | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/vote', { headers: { accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
      .then((data: PollState) => {
        if (live) setPoll(data);
      })
      // A failed request is indistinguishable from voting being switched off,
      // and both mean the same thing here: show the list, skip the tally.
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const open = poll?.configured === true;

  async function cast(id: string) {
    // Narrowed rather than relying on `open`, which TypeScript cannot follow
    // back to `poll` being non-null.
    if (!poll?.configured || pending) return;
    setPending(id);

    // The change is shown immediately rather than after the round trip. KV is
    // eventually consistent, so the tally that comes back may not include this
    // vote yet — waiting for it would look like the click did nothing.
    const taking = poll.yours === id;
    setPoll({
      configured: true,
      yours: taking ? null : id,
      counts: adjust(poll.counts, poll.yours, taking ? null : id),
    });

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ choice: id }),
      });
      if (!res.ok) throw new Error();
      const data: PollState = await res.json();
      // The server decides who voted for what; its counts are only a baseline,
      // so the local change is reapplied on top of them.
      setPoll({
        configured: true,
        yours: data.yours,
        counts: reconcile(data.counts, data.yours),
      });
    } catch {
      // Put it back the way it was rather than leaving a vote that never
      // landed on screen.
      setPoll(poll);
    } finally {
      setPending(null);
    }
  }

  const counts = poll?.counts ?? {};
  const total = candidates.reduce((sum, c) => sum + (counts[c.id] ?? 0), 0);
  const most = Math.max(1, ...candidates.map((c) => counts[c.id] ?? 0));

  return (
    <>
      <p className="eyebrow">Up next</p>
      <h2 className="section-title">{open ? 'You pick' : 'Queued'}</h2>
      {open && (
        <p className={styles.note}>
          All of these are getting played. The vote decides the order — one each,
          and clicking again takes it back.
        </p>
      )}

      <ul className={styles.list}>
        {candidates.map((candidate) => {
          const count = counts[candidate.id] ?? 0;
          const mine = poll?.yours === candidate.id;

          const inner = (
            <>
              {open && (
                <span
                  className={styles.fill}
                  style={{ width: `${(count / most) * 100}%` }}
                  aria-hidden="true"
                />
              )}
              <span className={styles.title}>{candidate.title}</span>
              {open && (
                <span className={styles.right}>
                  {/* Said outright rather than left to a border tint. With one
                      vote among six options the winning row is already the
                      only filled one, so a shift in shade reads as decoration
                      rather than as "this is the one you chose". */}
                  {mine && (
                    <span className={styles.yours}>
                      <span aria-hidden="true">✓</span> Your pick
                    </span>
                  )}
                  <span className={styles.count}>
                    {count}
                    <span className={styles.countLabel}>
                      {count === 1 ? 'vote' : 'votes'}
                    </span>
                  </span>
                </span>
              )}
            </>
          );

          return (
            <li
              key={candidate.id}
              className={`${styles.row} ${mine ? styles.chosen : ''}`}
            >
              {open ? (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => cast(candidate.id)}
                  disabled={pending !== null}
                  aria-pressed={mine}
                >
                  {inner}
                </button>
              ) : (
                <span className={styles.static}>{inner}</span>
              )}
            </li>
          );
        })}
      </ul>

      {open && (
        <p className={styles.total} aria-live="polite">
          {total} {total === 1 ? 'vote' : 'votes'} so far
          {poll?.yours ? ' · yours is counted' : ''}
        </p>
      )}
    </>
  );
}

/** Moves one vote from `was` to `now`, either of which may be nothing. */
function adjust(
  counts: Record<string, number>,
  was: string | null,
  now: string | null,
): Record<string, number> {
  const next = { ...counts };
  if (was) next[was] = Math.max(0, (next[was] ?? 0) - 1);
  if (now) next[now] = (next[now] ?? 0) + 1;
  return next;
}

/**
 * Guarantees the visitor can see their own vote in the total even if the
 * eventually-consistent read that produced these counts predates it.
 */
function reconcile(
  counts: Record<string, number>,
  yours: string | null,
): Record<string, number> {
  if (!yours) return counts;
  return { ...counts, [yours]: Math.max(1, counts[yours] ?? 0) };
}
