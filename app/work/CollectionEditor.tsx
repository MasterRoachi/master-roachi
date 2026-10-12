'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SeoPanel from '@/components/SeoPanel';
import { generatedCoverNames, isDraft } from '@/lib/collections';
import { fieldsFor, knownKeys, warningsFor } from '@/lib/editor-fields';
import {
  joinFile,
  readScalar,
  setScalar,
  setUnknownFields,
  splitFile,
  unknownFields,
  type SplitFile,
} from '@/lib/frontmatter';
import { isOklch } from '@/lib/oklch';
import FrontmatterFields from './FrontmatterFields';
import styles from './collection.module.css';

// One editor, for every collection of files in the repo.
//
// Writing and projects differ only in which directory they are in and what
// their frontmatter looks like, both of which live in lib/collections.ts and
// lib/editor-fields.ts. A second copy of this component per collection would
// be a second place for a bug about saving, which is the one operation here
// that can lose work.
//
// IT USED TO BE ONE TEXTAREA HOLDING THE WHOLE FILE, and the comment defending
// that said a field-per-key form means modelling every frontmatter key and
// silently dropping any it does not know. That was the right worry and it is
// why the fields are built the way they are: nothing parses and reserialises a
// document. Frontmatter is held as its own lines, a control edits one field's
// lines, and any key with no control is shown as raw text in a box of its own.
// Nothing is modelled away. What changed is that Odin's file is 106 lines of
// YAML before a word of prose — two thirds of it a nested `pieces` list — and
// hand-editing that in a plain textarea is how you commit a stray indent that
// fails the build two minutes later.
//
// Everything is loaded on open: the list, and every entry's text. That is six
// requests for six projects and it buys the list its status badges, the right
// order, and instant switching between entries with no second fetch.

interface Entry {
  path: string;
  sha: string;
  text: string;
}

/** The filename without directory or extension — what he actually calls it. */
function name(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.(mdx|json)$/, '');
}

export default function CollectionEditor({
  collection,
  noun,
  template,
  /** Shown as a search-result preview and scored. Public collections only. */
  seo,
  siteName,
}: {
  collection: string;
  noun: string;
  template?: string;
  seo?: boolean;
  siteName?: string;
}) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [openPath, setOpenPath] = useState<string | null>(null);
  /** The file being edited, split once on open. */
  const [draftFile, setDraftFile] = useState<SplitFile | null>(null);
  /** For a new entry, which has no path yet. */
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const fields = useMemo(() => fieldsFor(collection), [collection]);
  const known = useMemo(() => knownKeys(collection), [collection]);

  const load = useCallback(async () => {
    const response = await fetch(`/work/api/content?collection=${collection}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      setStatus('Not switched on — GITHUB_TOKEN is not set.');
      setEntries([]);
      return;
    }
    const data = (await response.json()) as {
      configured: boolean;
      files: { path: string; sha: string }[];
    };
    setConfigured(data.configured);
    if (!data.configured) {
      setEntries([]);
      return;
    }

    // Every entry's text, in parallel. The list alone cannot say what a
    // project's status is, and a list that cannot be ordered the way the grid
    // is ordered is a list in an order nobody cares about.
    const loaded = await Promise.all(
      (data.files ?? []).map(async (file) => {
        const one = await fetch(
          `/work/api/content?collection=${collection}&path=${encodeURIComponent(file.path)}`,
          { cache: 'no-store' },
        );
        if (!one.ok) return { ...file, text: '' };
        const { file: got } = (await one.json()) as { file: { text: string; sha: string } };
        return { path: file.path, sha: got.sha, text: got.text };
      }),
    );
    setEntries(loaded);
  }, [collection]);

  useEffect(() => {
    void load();
  }, [load]);

  /* The images this collection may point at.
   *
   * Only projects has an image collection so far; writing's covers sit in
   * nested folders that the one-level path guard does not cover, and widening
   * that guard is not worth doing before the Writing page is worked on. */
  useEffect(() => {
    if (collection !== 'projects') return;
    let live = true;
    (async () => {
      const response = await fetch('/work/api/content?collection=project-art', {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const data = (await response.json()) as { files?: { path: string }[] };
      if (!live) return;
      setImages((data.files ?? []).map((file) => file.path.replace(/^public/, '')));
    })();
    return () => {
      live = false;
    };
  }, [collection]);

  /** Each entry's headline facts, for the list. */
  const summaries = useMemo(() => {
    return (entries ?? []).map((entry) => {
      const split = splitFile(entry.text);
      const lines = split?.frontmatter ?? [];
      return {
        path: entry.path,
        title: readScalar(lines, 'title') || name(entry.path),
        status: readScalar(lines, 'status'),
        kind: readScalar(lines, 'kind'),
        track: readScalar(lines, 'track'),
        weight: Number(readScalar(lines, 'weight') ?? '0') || 0,
        draft: isDraft(entry.text),
      };
    });
  }, [entries]);

  /* Ordered the way the public grid orders it — highest weight first — rather
   * than alphabetically by filename, which tells you nothing you care about.
   * Writing has no weight, so it falls back to newest first. */
  const listed = useMemo(() => {
    const sorted = [...summaries].sort(
      (a, b) => b.weight - a.weight || a.title.localeCompare(b.title),
    );
    if (!order) return sorted;
    const byPath = new Map(sorted.map((entry) => [entry.path, entry]));
    return order.map((path) => byPath.get(path)).filter((entry): entry is (typeof sorted)[0] => Boolean(entry));
  }, [summaries, order]);

  const ordering = collection === 'projects';

  const current = entries?.find((entry) => entry.path === openPath) ?? null;
  const lines = draftFile?.frontmatter ?? [];
  const slug = openPath ? name(openPath) : '';

  const values = useMemo(() => {
    const out: Record<string, string> = {};
    for (const field of fields) out[field.key] = readScalar(lines, field.key) ?? '';
    return out;
  }, [fields, lines]);

  const warnings = useMemo(
    () => (draftFile ? warningsFor(collection, values, { images, isOklch }) : []),
    [collection, values, images, draftFile],
  );

  function openEntry(path: string) {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    const entry = entries?.find((one) => one.path === path);
    if (!entry) return;
    const split = splitFile(entry.text);
    if (!split) {
      setStatus('That file has no frontmatter — opening it here would not be safe.');
      return;
    }
    setOpenPath(path);
    setDraftFile(split);
    setIsNew(false);
    setDirty(false);
    setStatus(null);
  }

  function startNew() {
    if (!template) return;
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    const split = splitFile(template);
    if (!split) return;
    setOpenPath(null);
    setDraftFile(split);
    setIsNew(true);
    setDirty(false);
    setStatus(null);
  }

  function edit(next: Partial<SplitFile>) {
    if (!draftFile) return;
    setDraftFile({ ...draftFile, ...next });
    setDirty(true);
  }

  async function save(draft?: boolean) {
    if (!draftFile) return;
    setBusy(true);
    setStatus(null);
    try {
      const frontmatter =
        draft === undefined
          ? draftFile.frontmatter
          : setScalar(draftFile.frontmatter, 'draft', draft ? 'true' : null);
      const text = joinFile({ ...draftFile, frontmatter });
      const title = readScalar(frontmatter, 'title') ?? '';

      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collection,
          text,
          ...(openPath ? { path: openPath, sha: current?.sha } : { title }),
        }),
      });
      const data = (await response.json()) as { saved?: boolean; path?: string; error?: string };

      if (response.status === 409) {
        setStatus(
          'That file changed since you opened it. Reload before saving — saving now would overwrite the newer version.',
        );
        return;
      }
      if (!response.ok || !data.saved) {
        setStatus(data.error ?? `Save failed (${response.status}).`);
        return;
      }

      setDirty(false);
      setStatus(`Saved to ${data.path}. The deploy takes about two minutes.`);
      await load();
      if (data.path) {
        setOpenPath(data.path);
        setIsNew(false);
        const split = splitFile(text);
        if (split) setDraftFile(split);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  /** Commit the dragged order as one commit, not one per file. */
  async function saveOrder() {
    if (!order) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch('/work/api/reorder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ collection, order }),
      });
      const data = (await response.json()) as { reordered?: boolean; written?: number; error?: string };
      if (!response.ok || !data.reordered) {
        setStatus(data.error ?? `Reorder failed (${response.status}).`);
        return;
      }
      setStatus(
        data.written
          ? `Reordered — ${data.written} file${data.written === 1 ? '' : 's'} in one commit.`
          : 'That is already the order.',
      );
      setOrder(null);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Reorder failed.');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Convert in the browser, upload, and point a field at it.
   *
   * Converted here rather than in the Worker because a Worker has no image
   * decoder worth the name, and because what should be capped is what lands in
   * the repository — git keeps every version of a binary at full size.
   */
  async function upload(file: File, assignTo: string | null) {
    if (!slug && !isNew) {
      setStatus('Save the project first, so its images have a name to sit under.');
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('no canvas context');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.9),
      );
      if (!blob) throw new Error('could not convert that image');
      if (blob.size > 2_000_000) {
        throw new Error(`still ${(blob.size / 1e6).toFixed(1)}MB after conversion — try a smaller source`);
      }

      // <slug>-hero.webp for the hero, <slug>-<source name> otherwise. Lower
      // case and hyphens only, because that is all the path guard allows.
      const stem =
        assignTo === 'hero'
          ? 'hero'
          : (file.name.replace(/\.[^.]+$/, '') || 'image')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || 'image';
      const filename = `${slug}-${stem}.webp`;

      // covers.mjs regenerates three names per project on every build; an
      // upload saved over one of them would survive until the next deploy and
      // then vanish with nothing to explain why.
      if (generatedCoverNames(slug).includes(filename)) {
        throw new Error(`${filename} is regenerated on every build — give it another name`);
      }

      const path = `public/projects/${filename}`;
      const head = await fetch(
        `/work/api/content?collection=project-art&path=${encodeURIComponent(path)}`,
        { cache: 'no-store' },
      );
      const existing = head.ok
        ? ((await head.json()) as { file?: { sha: string } | null }).file?.sha
        : undefined;

      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);

      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collection: 'project-art',
          path,
          content: btoa(binary),
          sha: existing,
        }),
      });
      const data = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) {
        throw new Error(data.error ?? `Upload failed (${response.status}).`);
      }

      const publicPath = `/projects/${filename}`;
      setImages((before) => (before.includes(publicPath) ? before : [...before, publicPath]));
      if (assignTo && draftFile) edit({ frontmatter: setScalar(draftFile.frontmatter, assignTo, publicPath) });
      setStatus(
        `Uploaded ${filename}. It is on the site after the next deploy; the preview here is already pointing at it.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  /** Drop an image into the body at the cursor. */
  function insertImage(publicPath: string) {
    if (!draftFile) return;
    const area = bodyRef.current;
    const markdown = `\n![](${publicPath})\n`;
    if (!area) {
      edit({ body: `${draftFile.body}${markdown}` });
      return;
    }
    const at = area.selectionStart ?? draftFile.body.length;
    const body = `${draftFile.body.slice(0, at)}${markdown}${draftFile.body.slice(at)}`;
    edit({ body });
    // Put the caret inside the empty alt text, which is the next thing to type.
    requestAnimationFrame(() => {
      const caret = at + 3;
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  }

  if (entries === null) return <p className={styles.status}>Reading the repo…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. Set <code>GITHUB_TOKEN</code> as a Worker secret — a fine-grained token for
        this repository, Contents: read and write.
      </p>
    );
  }

  const draft = draftFile ? readScalar(draftFile.frontmatter, 'draft') === 'true' : false;
  const mine = images.filter((path) => !slug || path.includes(slug));

  return (
    <div className={`${styles.layout} ${draftFile && seo ? '' : styles.layoutPlain}`}>
      <aside className={styles.list}>
        {template && (
          <button type="button" className={styles.new} onClick={startNew}>
            New {noun}
          </button>
        )}

        {ordering && (
          <p className={styles.listNote}>
            Drag to set the order of the grid.
            {order && (
              <button type="button" onClick={() => void saveOrder()} disabled={busy}>
                Save order
              </button>
            )}
          </p>
        )}

        <ul>
          {listed.map((entry) => (
            <li
              key={entry.path}
              draggable={ordering}
              onDragStart={() => setDragging(entry.path)}
              onDragEnd={() => setDragging(null)}
              onDragOver={(event) => {
                if (!ordering || !dragging || dragging === entry.path) return;
                event.preventDefault();
                const from = listed.findIndex((one) => one.path === dragging);
                const to = listed.findIndex((one) => one.path === entry.path);
                if (from === -1 || to === -1) return;
                const next = listed.map((one) => one.path);
                next.splice(to, 0, ...next.splice(from, 1));
                setOrder(next);
              }}
              className={dragging === entry.path ? styles.draggingRow : undefined}
            >
              <button
                type="button"
                className={openPath === entry.path ? styles.current : undefined}
                onClick={() => openEntry(entry.path)}
              >
                <span className={styles.entryTitle}>{entry.title}</span>
                <span className={styles.entryMeta}>
                  {entry.kind ?? entry.track ?? ''}
                  {entry.status && <span data-status={entry.status}>{entry.status}</span>}
                  {entry.draft && <span className={styles.draftTag}>draft</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className={styles.main}>
        {!draftFile ? (
          <p className={styles.status}>Pick one, or start a new {noun}.</p>
        ) : (
          <>
            <div className={styles.bar}>
              <span className={styles.barName}>
                {openPath ? name(openPath) : `New ${noun}`}
                {draft && <span className={styles.draftTag}>draft</span>}
                {dirty && <span className={styles.dirty}>unsaved</span>}
              </span>
              <span className={styles.barButtons}>
                <button type="button" onClick={() => void save()} disabled={busy || !dirty}>
                  {busy ? 'Working…' : 'Save'}
                </button>
                {/* Status is the visible state of a project and draft is a
                    separate thing — one is "what stage is this at", the other
                    is "is this page on the site at all". No project has ever
                    used draft, so it is the quiet button. */}
                <button
                  type="button"
                  className={styles.quiet}
                  onClick={() => void save(!draft)}
                  disabled={busy}
                  title={draft ? 'Clear draft: true and publish it' : 'Set draft: true and take the page down'}
                >
                  {draft ? 'Publish' : 'Hide page'}
                </button>
              </span>
            </div>

            {warnings.length > 0 && (
              <ul className={styles.warnings}>
                {warnings.map((warning) => (
                  <li key={`${warning.key}-${warning.text}`}>{warning.text}</li>
                ))}
              </ul>
            )}

            <FrontmatterFields
              fields={fields}
              lines={draftFile.frontmatter}
              onChange={(frontmatter) => edit({ frontmatter })}
              images={images}
              onUpload={collection === 'projects' ? upload : undefined}
              uploading={uploading}
            />

            {/* Everything the schema does not model, as its own text. It
                round-trips untouched either way; showing it is the difference
                between a form that keeps your fields and a form you can
                believe keeps your fields. */}
            <details className={styles.other} open={unknownFields(draftFile.frontmatter, known) !== ''}>
              <summary>Other frontmatter</summary>
              <textarea
                className={styles.fieldText}
                rows={4}
                spellCheck={false}
                value={unknownFields(draftFile.frontmatter, known)}
                onChange={(event) =>
                  edit({
                    frontmatter: setUnknownFields(draftFile.frontmatter, known, event.target.value),
                  })
                }
              />
              <p className={styles.hint}>
                Keys with no control above. Edited as text, kept exactly as written.
              </p>
            </details>

            <label className={styles.bodyLabel} htmlFor="entry-body">
              Body
            </label>
            {mine.length > 0 && (
              <p className={styles.insertRow}>
                Insert an image:
                {mine.map((path) => (
                  <button key={path} type="button" onClick={() => insertImage(path)}>
                    {path.replace('/projects/', '')}
                  </button>
                ))}
              </p>
            )}
            <textarea
              id="entry-body"
              ref={bodyRef}
              className={styles.body}
              value={draftFile.body}
              spellCheck
              onChange={(event) => edit({ body: event.target.value })}
            />

            {status && <p className={styles.message}>{status}</p>}
          </>
        )}
        {!draftFile && status && <p className={styles.message}>{status}</p>}
      </div>

      {draftFile && seo && (
        <aside className={styles.aside}>
          <section className={styles.preview}>
            <h2 className={styles.previewHead}>In the grid</h2>
            <div
              className={styles.card}
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
            <p className={styles.hint}>
              The body is not rendered here: it is MDX, and the components in it only run at build.
            </p>
          </section>

          <SeoPanel
            input={{
              kind: collection === 'projects' ? 'project' : 'post',
              title: `${values.title || ''} — ${siteName ?? ''}`,
              description: values.summary ?? '',
              body: draftFile.body,
              focus: values.title,
              images: [
                values.hero && { alt: values.heroAlt },
                values.cover && { alt: values.coverAlt },
                // Body images, which carry their own alt text in the markdown.
                ...[...draftFile.body.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)].map((match) => ({
                  alt: match[1],
                })),
              ].filter(Boolean) as { alt?: string | null }[],
              internalLinks: (draftFile.body.match(/\]\(\//g) ?? []).length,
            }}
          />
        </aside>
      )}
    </div>
  );
}
