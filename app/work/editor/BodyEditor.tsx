'use client';

import type { RefObject } from 'react';
import {
  joinSections,
  newSection,
  shownText,
  splitBlock,
  splitSections,
  withBreak,
  type Sections,
} from '@/lib/body-sections';
import styles from '../collection.module.css';

// The Words tab: the body, as an opening and its `## ` sections, or as one
// text. Sections are a view over the one string (lib/body-sections.ts): each
// edit joins them back, so switching modes loses nothing.

export default function BodyEditor({
  body,
  onChange,
  sections: sectionsOn,
  rawBody,
  onToggleRaw,
  images,
  artPrefix,
  bodyRef,
  onInsertImage,
}: {
  body: string;
  onChange: (body: string) => void;
  /** Whether this collection edits its body as sections at all. */
  sections?: boolean;
  /** Showing the one text where sections are on. */
  rawBody: boolean;
  onToggleRaw: () => void;
  /** This entry's own images, for the insert controls. */
  images: readonly string[];
  /** The images directory as a public path, trimmed off the shown names. */
  artPrefix: string;
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  onInsertImage: (publicPath: string) => void;
}) {
  const parts: Sections | null = sectionsOn && !rawBody ? splitSections(body) : null;
  const setParts = (next: Sections) => onChange(joinSections(next));

  return (
    <>
      <div className={styles.bodyHead}>
        <span className={styles.bodyLabel}>Body</span>
        {sectionsOn && (
          <button type="button" className={styles.quietLink} onClick={onToggleRaw}>
            {rawBody ? 'Edit as sections' : 'Edit as one text'}
          </button>
        )}
      </div>

      {parts ? (
        <div className={styles.sections}>
          <label className={styles.sectionCard}>
            <span className={styles.sectionLabel}>Opening</span>
            <textarea
              className={styles.sectionText}
              value={parts.opening}
              spellCheck
              rows={Math.min(14, Math.max(4, parts.opening.split('\n').length + 1))}
              onChange={(event) => setParts({ ...parts, opening: event.target.value })}
            />
          </label>

          {parts.sections.map((section, i) => (
            <div key={i} className={styles.sectionCard}>
              <div className={styles.sectionHeadRow}>
                <span className={styles.sectionHash} aria-hidden="true">
                  ##
                </span>
                <input
                  className={styles.sectionHeading}
                  value={section.heading}
                  aria-label="Section heading"
                  onChange={(event) => {
                    const sections = [...parts.sections];
                    sections[i] = { ...section, heading: event.target.value };
                    setParts({ ...parts, sections });
                  }}
                />
                <span className={styles.sectionTools}>
                  <button
                    type="button"
                    aria-label="Move section up"
                    disabled={i === 0}
                    onClick={() => {
                      const sections = [...parts.sections];
                      [sections[i - 1], sections[i]] = [sections[i], sections[i - 1]];
                      setParts({ ...parts, sections });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move section down"
                    disabled={i === parts.sections.length - 1}
                    onClick={() => {
                      const sections = [...parts.sections];
                      [sections[i + 1], sections[i]] = [sections[i], sections[i + 1]];
                      setParts({ ...parts, sections });
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Remove section"
                    onClick={() => {
                      if (!confirm(`Remove the section "${section.heading}"?`)) return;
                      setParts({ ...parts, sections: parts.sections.filter((_, k) => k !== i) });
                    }}
                  >
                    ✕
                  </button>
                </span>
              </div>
              <textarea
                className={styles.sectionText}
                value={shownText(section.text)}
                spellCheck
                rows={Math.min(18, Math.max(4, section.text.split('\n').length + 1))}
                onChange={(event) => {
                  const sections = [...parts.sections];
                  sections[i] = { ...section, text: withBreak(event.target.value) };
                  setParts({ ...parts, sections });
                }}
              />
              {/* An image beside text, as the page's <Split> — the one block
                  every project page reaches for. Appended to the section. */}
              {images.length > 0 && (
                <div className={styles.sectionInsert}>
                  <span>Image beside text:</span>
                  <select
                    defaultValue=""
                    aria-label="Image for a new image block"
                    onChange={(event) => {
                      const [src, side] = event.target.value.split('|');
                      event.target.value = '';
                      if (!src) return;
                      const sections = [...parts.sections];
                      const text = section.text.endsWith('\n\n')
                        ? section.text
                        : `${section.text.replace(/\n*$/, '')}\n\n`;
                      sections[i] = { ...section, text: `${text}${splitBlock(src, side as 'left' | 'right')}\n` };
                      setParts({ ...parts, sections });
                    }}
                  >
                    <option value="">add one…</option>
                    {images.flatMap((path) => [
                      <option key={`${path}|left`} value={`${path}|left`}>
                        {path.replace(artPrefix, '')} — image left
                      </option>,
                      <option key={`${path}|right`} value={`${path}|right`}>
                        {path.replace(artPrefix, '')} — image right
                      </option>,
                    ])}
                  </select>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            className={styles.addSectionButton}
            onClick={() => setParts({ ...parts, sections: [...parts.sections, newSection()] })}
          >
            + Add a section
          </button>
        </div>
      ) : (
        <>
          {images.length > 0 && (
            <p className={styles.insertRow}>
              Insert an image:
              {images.map((path) => (
                <button key={path} type="button" onClick={() => onInsertImage(path)}>
                  {path.replace(artPrefix, '')}
                </button>
              ))}
            </p>
          )}
          <textarea
            id="entry-body"
            ref={bodyRef}
            className={styles.body}
            value={body}
            spellCheck
            aria-label="Body"
            onChange={(event) => onChange(event.target.value)}
          />
        </>
      )}
    </>
  );
}
