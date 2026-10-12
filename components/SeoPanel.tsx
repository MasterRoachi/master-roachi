'use client';

import { useMemo } from 'react';
import { scoreSeo, type SeoInput } from '@/lib/seo-score';
import styles from './SeoPanel.module.css';

// The live SEO readout beside an editor.
//
// Shared across the backend's public-facing editors — product copy first, then
// writing and projects — because all three publish prose and all three want
// the same questions asked. Nothing under /work that stays private gets one:
// a curriculum lesson has no search result to win.
//
// It renders a score, then the things still worth doing, then the full list.
// That order is deliberate. A score on its own is a number nobody can act on,
// and the full checklist on its own buries the two items that matter today
// among the eight that are already fine — so the outstanding ones are lifted
// out and the rest are left below for when they are not.
//
// The score is explicitly NOT a prediction of ranking. See lib/seo-score.ts.

export default function SeoPanel({
  input,
  title = 'SEO',
}: {
  input: SeoInput;
  title?: string;
}) {
  // Recomputed on every keystroke, which is the point of it. The whole scorer
  // is string work over a few hundred words, so memoising on the input is
  // enough to keep typing smooth without any debouncing to tune.
  const report = useMemo(
    () => scoreSeo(input),
    [input.kind, input.title, input.description, input.body, input.focus, input.internalLinks, input.images],
  );

  return (
    <section className={styles.panel} aria-label={title}>
      <header className={styles.head}>
        <span className={styles.label}>{title}</span>
        <span className={`${styles.score} ${styles[report.grade]}`}>
          {report.score}
          <span className={styles.outOf}>/100</span>
        </span>
      </header>

      <div className={styles.meter} role="presentation">
        <span className={`${styles.fill} ${styles[report.grade]}`} style={{ width: `${report.score}%` }} />
      </div>

      <p className={styles.counts}>
        {report.words} word{report.words === 1 ? '' : 's'} · {report.paragraphs} paragraph
        {report.paragraphs === 1 ? '' : 's'}
      </p>

      {report.todo.length > 0 ? (
        <>
          <h3 className={styles.subhead}>To improve</h3>
          <ul className={styles.todo}>
            {report.todo.map((check) => (
              <li key={check.id} className={styles[check.state]}>
                <span className={styles.checkLabel}>{check.label}</span>
                <span className={styles.detail}>{check.detail}</span>
                {check.fix && <span className={styles.fix}>{check.fix}</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.clear}>Everything checkable is passing.</p>
      )}

      <details className={styles.all}>
        <summary>All {report.checks.length} checks</summary>
        <ul className={styles.list}>
          {report.checks.map((check) => (
            <li key={check.id} className={styles[check.state]}>
              <span className={styles.mark} aria-hidden="true">
                {check.state === 'pass' ? '✓' : check.state === 'warn' ? '!' : check.state === 'fail' ? '✕' : '–'}
              </span>
              <span className={styles.checkLabel}>{check.label}</span>
              <span className={styles.detail}>{check.detail}</span>
            </li>
          ))}
        </ul>
        <p className={styles.caveat}>
          A checklist, not a prediction. Nothing in a browser can know how a page will rank; these are
          the things that are known to matter and are knowable from the text.
        </p>
      </details>
    </section>
  );
}
