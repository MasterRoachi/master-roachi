'use client';

import { useMemo } from 'react';
import readingTime from 'reading-time/lib/reading-time';
import { checkProse, countIssues, type ProseIssue } from '@/lib/prose-check';
import styles from './collection.module.css';

// Style and grammar notes on the draft, live.
//
// Local, so it runs on every keystroke for nothing. It is not a grammar engine
// and the panel says so: it catches mechanical faults and house-style slips,
// not agreement or a dangling modifier. See lib/prose-check.ts.
//
// Clicking a note SELECTS it in the body textarea rather than describing where
// it is. A line number in a 1,600-word post is an instruction to go hunting,
// and the whole value of doing this live is not having to.
//
// The reading time comes from the same `reading-time` the build uses — the
// package's own entry point pulls in a Node stream module, so the calculation
// is imported directly from its lib. Reimplementing it would have been a
// second answer to "how long is this post" and the two would have disagreed by
// a minute, which is exactly the kind of small lie this site is written to
// avoid.

export default function ProsePanel({
  body,
  onSelect,
  /** Warned about on publish, since a thin post is the usual mistake. */
  wordTarget,
}: {
  body: string;
  onSelect?: (start: number, end: number) => void;
  wordTarget?: number;
}) {
  const issues = useMemo(() => checkProse(body), [body]);
  const counts = useMemo(() => countIssues(issues), [issues]);
  const stats = useMemo(() => readingTime(body), [body]);

  const minutes = Math.max(1, Math.round(stats.minutes));
  const words = stats.words;

  // Errors first — they are wrong rather than arguable — then by position, so
  // working down the list is working down the post.
  const ordered = useMemo(() => {
    const rank = (issue: ProseIssue) => (issue.severity === 'error' ? 0 : 1);
    return [...issues].sort((a, b) => rank(a) - rank(b) || a.start - b.start);
  }, [issues]);

  return (
    <section className={styles.prosePanel} aria-label="Style and grammar">
      <header className={styles.head}>
        <span className={styles.panelLabel}>Prose</span>
        <span className={styles.readingTime}>
          {words} words · {minutes} min
        </span>
      </header>

      {wordTarget !== undefined && words > 0 && words < wordTarget && (
        <p className={styles.thin}>
          Under {wordTarget} words. Publishing is still allowed — this is a note, not a gate.
        </p>
      )}

      <p className={styles.proseCounts}>
        {counts.errors > 0 ? (
          <span className={styles.errorCount}>
            {counts.errors} {counts.errors === 1 ? 'mistake' : 'mistakes'}
          </span>
        ) : (
          <span className={styles.clean}>Nothing wrong</span>
        )}
        <span className={styles.sep}>·</span>
        {counts.style} style {counts.style === 1 ? 'note' : 'notes'}
      </p>

      {ordered.length > 0 && (
        <ul className={styles.proseList}>
          {ordered.map((issue) => (
            <li key={`${issue.id}-${issue.start}`} className={styles[issue.severity]}>
              <button
                type="button"
                onClick={() => onSelect?.(issue.start, issue.end)}
                title="Find it in the body"
              >
                <span className={styles.issueLabel}>{issue.label}</span>
                <span className={styles.issueWhere}>line {issue.line}</span>
                {issue.snippet && <span className={styles.issueSnippet}>{issue.snippet}</span>}
                {issue.fix && <span className={styles.issueFix}>{issue.fix}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.caveat}>
        Mechanical faults and house style, found locally. Not a grammar engine: it will not catch
        agreement or a dangling modifier, and it does not check facts — nothing in a browser knows
        whether a claim is true.
      </p>
    </section>
  );
}
