'use client';

import SeoPanel from '@/components/SeoPanel';
import type { Warning } from '@/lib/editor-fields';
import type { SeoInput } from '@/lib/seo-score';
import ProsePanel from '../ProsePanel';
import styles from '../collection.module.css';

// The Check tab: what is wrong, and what the page will look like where people
// first meet it. His pick, 2026-11-10 (redesign page, Projects and Writing: A):
// the prose panel and the SEO panel, with the grid card, the search result,
// the top of the page and the social card. This was the sticky column beside
// the fields; on a computer that column is now the live page instead
// (editor/LiveFrame.tsx), and these moved here.

/** A list of warnings: survivable, so said out loud and left to him. */
export function Warnings({ warnings }: { warnings: readonly Warning[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className={styles.warnings}>
      {warnings.map((warning) => (
        <li key={`${warning.key}-${warning.text}`}>{warning.text}</li>
      ))}
    </ul>
  );
}

/** The four places the page is seen before anyone opens it. */
export function Snapshots({
  values,
  collection,
  slug,
  saved,
  siteName,
  previewBase,
}: {
  values: Record<string, string>;
  collection: string;
  slug: string;
  /** Whether the entry has been saved, and so has, or will have, a card. */
  saved: boolean;
  siteName?: string;
  previewBase?: string;
}) {
  return (
    <section className={styles.preview}>
      <h2 className={styles.previewHead}>In the grid</h2>
      <div
        className={styles.gridCard}
        style={{
          background: `linear-gradient(145deg, color-mix(in oklch, ${values.accent || 'var(--accent)'} 24%, transparent), color-mix(in oklch, ${values.accent2 || values.accent || 'var(--accent)'} 14%, transparent))`,
        }}
      >
        {values.cover ? (
          <img src={values.cover} alt="" />
        ) : (
          <p className={styles.cardNoCover}>Cover generated from the accents at build.</p>
        )}
        <p className={styles.cardMeta}>
          {values.kind}
          {values.status && ` · ${values.status}`}
        </p>
        <p className={styles.cardTitle}>{values.title || 'Untitled'}</p>
        <p className={styles.cardSummary}>{values.summary}</p>
      </div>

      <h3 className={styles.previewHead}>The search result</h3>
      <p className={styles.resultTitle}>
        {values.title || 'Untitled'} — {siteName ?? ''}
      </p>
      <p className={styles.resultUrl}>
        masterroachi.com/{collection}/{slug || 'new'}/
      </p>
      <p className={styles.resultDesc}>{values.summary}</p>

      <h3 className={styles.previewHead}>Top of the page</h3>
      {values.hero ? (
        <img className={styles.heroPreview} src={values.hero} alt="" />
      ) : (
        <p className={styles.hint}>No hero image — the page opens on the colour field.</p>
      )}

      <h3 className={styles.previewHead}>The social card</h3>
      {saved ? (
        <>
          <img
            className={styles.ogPreview}
            src={`/og/${collection}/${slug}.png`}
            alt=""
            // A post saved a minute ago has no card until the deploy
            // finishes, and a broken frame reads as a bug rather than as a
            // thing that is on its way.
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <p className={styles.hint}>
            Drawn from the title by scripts/og.mjs at build, not from the cover. It appears after the
            next deploy and is redrawn whenever the title changes.
          </p>
        </>
      ) : (
        <p className={styles.hint}>Generated at the first deploy after this is saved, from the title.</p>
      )}

      <p className={styles.hint}>
        {previewBase
          ? 'The body is rendered in Preview, at the foot: the real page, with this draft in it.'
          : 'The body is not rendered here: it is MDX, and the components in it only run at build.'}
      </p>
    </section>
  );
}

export default function CheckTab({
  warnings,
  snapshots,
  body,
  prose,
  wordTarget,
  onSelect,
  seo,
}: {
  warnings: readonly Warning[];
  /** The previews, or null where the collection has no public page. */
  snapshots: React.ReactNode;
  body: string;
  prose?: boolean;
  wordTarget?: number;
  onSelect: (start: number, end: number) => void;
  /** The SEO panel's input, or null where there is no search result to win. */
  seo: SeoInput | null;
}) {
  return (
    <div className={styles.checkStack}>
      <Warnings warnings={warnings} />
      {snapshots}
      {prose && <ProsePanel body={body} wordTarget={wordTarget} onSelect={onSelect} />}
      {seo && <SeoPanel input={seo} />}
    </div>
  );
}
