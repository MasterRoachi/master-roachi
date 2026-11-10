'use client';

import styles from '../collection.module.css';

// The first screen: one card per entry, with its state, and the + New button.
//
// His pick, 2026-11-10 (redesign page, Projects and Writing: A): the list
// stays the first screen, and a card no longer opens in place: it opens the
// entry full screen (CollectionEditor). Projects keep ↑ and ↓, saved as one
// commit with Save order; Writing keeps its Drafts / Published / All pills.
//
// His call, 2026-11-10 (design pass: the public site's styling, the CRM's
// desktop layout): on a phone each entry is one of the site's cards, with the
// site's hover (the global card-link); from 900px the list is the narrow left
// column beside the open entry, its entries rows split by hairlines and the
// open one in accent words in an accent ring. An entry with something to fix
// says its count in an accent chip. State is the colour of the words, never a
// fill or a side stripe (DESIGN.md, his rulings, 11 Nov 2026).

export interface Summary {
  path: string;
  title: string;
  status?: string | null;
  kind?: string | null;
  track?: string | null;
  date: string;
  draft: boolean;
  problems: number;
}

type View = 'drafts' | 'published' | 'all';

export default function EntryList({
  noun,
  canCreate,
  onNew,
  shown,
  total,
  ordering,
  orderChanged,
  onMove,
  onSaveOrder,
  onUndoOrder,
  busy,
  draftViews,
  view,
  onView,
  draftCount,
  today,
  status,
  onOpen,
  openPath,
}: {
  noun: string;
  canCreate: boolean;
  onNew: () => void;
  /** The entries the current view lets through, in the public order. */
  shown: readonly Summary[];
  /** How many entries there are in all, for the last ↓. */
  total: number;
  ordering: boolean;
  orderChanged: boolean;
  onMove: (path: string, by: -1 | 1) => void;
  onSaveOrder: () => void;
  onUndoOrder: () => void;
  busy: boolean;
  draftViews?: boolean;
  view: View;
  onView: (view: View) => void;
  draftCount: number;
  /** Today in South Africa, for marking a post scheduled. */
  today: string;
  status: string | null;
  onOpen: (path: string) => void;
  /** The entry open beside the list ('' for a new one), or null for none. */
  openPath: string | null;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.listTop}>
        {draftViews ? (
          <div className={styles.views} role="group" aria-label="Show">
            {(
              [
                ['drafts', `Drafts${draftCount ? ` ${draftCount}` : ''}`],
                ['published', 'Published'],
                ['all', 'All'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={view === key ? styles.pillOn : styles.pill}
                aria-pressed={view === key}
                onClick={() => onView(key)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {canCreate && (
          <button type="button" className={styles.newButton} onClick={onNew}>
            + New {noun}
          </button>
        )}
      </div>

      {ordering && orderChanged && (
        <p className={styles.orderBar}>
          The grid&rsquo;s order has changed.
          <button type="button" className={styles.save} onClick={onSaveOrder} disabled={busy}>
            Save order
          </button>
          <button type="button" onClick={onUndoOrder} disabled={busy}>
            Undo
          </button>
        </p>
      )}

      {status && <p className={styles.message}>{status}</p>}

      <div className={styles.cards}>
        {draftViews && shown.length === 0 && (
          <p className={styles.message}>
            {view === 'drafts'
              ? 'No drafts — everything is published.'
              : view === 'published'
                ? 'Nothing published yet.'
                : `No ${noun}s yet.`}
          </p>
        )}
        {!draftViews && shown.length === 0 && <p className={styles.message}>No {noun}s yet.</p>}

        {shown.map((entry, index) => (
          <section
            key={entry.path}
            className={`${styles.card} card-link`}
            data-waiting={entry.problems > 0 || undefined}
            data-open={entry.path === openPath || undefined}
          >
            <div className={styles.cardHeadRow}>
              <button
                type="button"
                className={styles.cardHead}
                aria-current={entry.path === openPath || undefined}
                onClick={() => onOpen(entry.path)}
              >
                <span className={styles.cardName}>{entry.title}</span>
                <span className={styles.cardFacts}>
                  {[entry.kind ?? entry.track, entry.status].filter(Boolean).join(' · ')}
                  {entry.draft && <span className={styles.draftTag}>draft</span>}
                </span>
                <span className={styles.cardState}>
                  {entry.problems > 0
                    ? `${entry.problems} to fix`
                    : entry.date > today
                      ? `scheduled ${entry.date}`
                      : entry.date}
                </span>
              </button>
              {ordering && (
                <span className={styles.move}>
                  <button
                    type="button"
                    aria-label={`Move ${entry.title} up`}
                    disabled={index === 0}
                    onClick={() => onMove(entry.path, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${entry.title} down`}
                    disabled={index === total - 1}
                    onClick={() => onMove(entry.path, 1)}
                  >
                    ↓
                  </button>
                </span>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
