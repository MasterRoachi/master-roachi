'use client';

import { useId } from 'react';
import {
  readBlockList,
  readFlowList,
  readScalar,
  setBlockList,
  setFlowList,
  setScalar,
  type BlockEntry,
} from '@/lib/frontmatter';
import { hexToOklch, oklchToHex } from '@/lib/oklch';
import type { FieldSpec } from '@/lib/editor-fields';
import styles from './collection.module.css';

// Controls for the frontmatter fields a collection knows about.
//
// Every control reads its value out of the frontmatter LINES on each render
// and writes back by replacing one field's lines. There is no second copy of
// the frontmatter held as an object, which is the point: a form that keeps its
// own state and serialises it on save is a form that can disagree with the
// file, and the way that failure shows up is a field quietly reverting or a
// key the form never knew about disappearing. Here the file is the state.
//
// See lib/frontmatter.ts for why the editing is line-oriented, and
// lib/editor-fields.ts for why this schema is not exhaustive.

export default function FrontmatterFields({
  fields,
  lines,
  onChange,
  images,
  onUpload,
  uploading,
}: {
  fields: readonly FieldSpec[];
  lines: string[];
  onChange: (next: string[]) => void;
  /** Image paths under public/ this entry may point at. */
  images: readonly string[];
  onUpload?: (file: File, assignTo: string | null) => void;
  uploading?: boolean;
}) {
  const id = useId();
  const set = (key: string, value: string | null) => onChange(setScalar(lines, key, value));

  return (
    <div className={styles.fields}>
      {fields.map((field) => {
        const name = `${id}-${field.key}`;
        const value = readScalar(lines, field.key) ?? '';

        return (
          <div key={field.key} className={styles.field} data-kind={field.kind}>
            <label htmlFor={name}>{field.label}</label>

            {field.kind === 'textarea' && (
              <textarea
                id={name}
                className={styles.fieldText}
                rows={3}
                spellCheck
                value={value}
                onChange={(event) => set(field.key, event.target.value || null)}
              />
            )}

            {(field.kind === 'text' || field.kind === 'url' || field.kind === 'date') && (
              <input
                id={name}
                className={styles.fieldInput}
                // A date input would be nicer and is wrong here: these dates
                // are plain 'YYYY-MM-DD' strings in YAML, and a date picker
                // hands back whatever the browser's locale felt like.
                type="text"
                inputMode={field.kind === 'url' ? 'url' : undefined}
                spellCheck={field.kind === 'text'}
                value={value}
                placeholder={field.kind === 'date' ? 'YYYY-MM-DD' : undefined}
                onChange={(event) => set(field.key, event.target.value || null)}
              />
            )}

            {field.kind === 'select' && (
              <select
                id={name}
                className={styles.fieldInput}
                value={value}
                onChange={(event) => set(field.key, event.target.value || null)}
              >
                {/* Absent stays absent: the first option removes the key
                    rather than writing a default the author never chose. */}
                <option value="">— not set —</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                {/* A value already in the file that is not in the list stays
                    selectable, so opening the editor cannot silently change
                    it just by rendering. */}
                {value && !field.options?.includes(value) && (
                  <option value={value}>{value} (not a known value)</option>
                )}
              </select>
            )}

            {field.kind === 'tags' && (
              <input
                id={name}
                className={styles.fieldInput}
                type="text"
                value={readFlowList(lines, field.key).join(', ')}
                placeholder="Godot, Python"
                onChange={(event) =>
                  onChange(
                    setFlowList(
                      lines,
                      field.key,
                      event.target.value.split(',').map((item) => item.trim()),
                    ),
                  )
                }
              />
            )}

            {field.kind === 'color' && (
              <div className={styles.colour}>
                <input
                  id={name}
                  className={styles.fieldInput}
                  type="text"
                  value={value}
                  placeholder="oklch(84% 0.16 92)"
                  onChange={(event) => set(field.key, event.target.value || null)}
                />
                {/* Writes only when actually moved. A colour picker is sRGB,
                    so seeding it from an out-of-gamut oklch and writing the
                    result straight back would clamp a colour nobody touched —
                    Fabled Threads' pink moves 4 degrees of hue on that round
                    trip. Typing in the box beside it stays exact. */}
                <input
                  type="color"
                  aria-label={`${field.label} picker`}
                  className={styles.swatch}
                  value={oklchToHex(value || 'oklch(50% 0 0)')}
                  onChange={(event) => set(field.key, hexToOklch(event.target.value))}
                />
              </div>
            )}

            {field.kind === 'image' && (
              <div className={styles.image}>
                <div className={styles.imageRow}>
                  <input
                    id={name}
                    className={styles.fieldInput}
                    type="text"
                    value={value}
                    placeholder="/projects/thing-hero.webp"
                    onChange={(event) => set(field.key, event.target.value || null)}
                  />
                  {images.length > 0 && (
                    <select
                      aria-label={`Pick an existing image for ${field.label}`}
                      className={styles.fieldInput}
                      value={images.includes(value) ? value : ''}
                      onChange={(event) => set(field.key, event.target.value || null)}
                    >
                      <option value="">— pick —</option>
                      {images.map((path) => (
                        <option key={path} value={path}>
                          {path.replace('/projects/', '')}
                        </option>
                      ))}
                    </select>
                  )}
                  {onUpload && (
                    <label className={styles.uploadButton}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (file) onUpload(file, field.key);
                        }}
                      />
                      <span>{uploading ? 'Converting…' : 'Upload'}</span>
                    </label>
                  )}
                </div>
                {value && <img className={styles.imagePreview} src={value} alt="" />}
              </div>
            )}

            {field.kind === 'blocklist' && (
              <BlockList
                field={field}
                entries={readBlockList(lines, field.key)}
                onChange={(entries) => onChange(setBlockList(lines, field.key, entries))}
              />
            )}

            {field.hint && <p className={styles.hint}>{field.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * A repeating editor for a block list — `pieces`, and nothing else so far.
 *
 * Odin's is twenty-four entries and a hundred-odd lines of nested YAML, which
 * was two thirds of that file and the easiest thing in the repository to break
 * with a stray indent. Reordering is up/down buttons rather than drag: the
 * list is long, the moves are usually one place, and a drag target inside a
 * scrolling column is worse than a button for both.
 */
function BlockList({
  field,
  entries,
  onChange,
}: {
  field: FieldSpec;
  entries: BlockEntry[];
  onChange: (entries: BlockEntry[]) => void;
}) {
  const move = (at: number, by: number) => {
    const to = at + by;
    if (to < 0 || to >= entries.length) return;
    const next = [...entries];
    [next[at], next[to]] = [next[to], next[at]];
    onChange(next);
  };

  const edit = (at: number, key: string, value: string) => {
    const next = [...entries];
    next[at] = { ...next[at], [key]: value };
    onChange(next);
  };

  return (
    <div className={styles.blocks}>
      {entries.map((entry, at) => (
        <div key={at} className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockNumber}>{at + 1}</span>
            <button type="button" onClick={() => move(at, -1)} disabled={at === 0} title="Move up">
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(at, 1)}
              disabled={at === entries.length - 1}
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              className={styles.blockRemove}
              onClick={() => onChange(entries.filter((_, index) => index !== at))}
              title="Remove"
            >
              Remove
            </button>
          </div>
          {field.entry?.map((sub) => (
            <label key={sub.key} className={styles.blockField}>
              <span>{sub.label}</span>
              {sub.kind === 'textarea' ? (
                <textarea
                  rows={2}
                  className={styles.fieldText}
                  spellCheck
                  value={entry[sub.key] ?? ''}
                  onChange={(event) => edit(at, sub.key, event.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={entry[sub.key] ?? ''}
                  placeholder={sub.kind === 'tags' ? '["HTML", "CSS"]' : undefined}
                  onChange={(event) => edit(at, sub.key, event.target.value)}
                />
              )}
            </label>
          ))}
          {/* Anything in this entry the schema does not model, kept visible
              rather than hidden — it round-trips either way, but a field you
              cannot see is a field you will be surprised by. */}
          {entry.__raw && <pre className={styles.blockRaw}>{entry.__raw}</pre>}
        </div>
      ))}
      <button
        type="button"
        className={styles.blockAdd}
        onClick={() =>
          onChange([
            ...entries,
            Object.fromEntries((field.entry ?? []).map((sub) => [sub.key, ''])) as BlockEntry,
          ])
        }
      >
        + Add {field.label.replace(/s$/, '').toLowerCase()}
      </button>
    </div>
  );
}
