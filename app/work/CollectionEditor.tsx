'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SeoPanel from '@/components/SeoPanel';
import { generatedCoverNames, isDraft } from '@/lib/collections';
import { fieldsFor, knownKeys, warningsFor } from '@/lib/editor-fields';
import {
  joinFile,
  readFlowList,
  readScalar,
  setScalar,
  setUnknownFields,
  splitFile,
  unknownFields,
  type SplitFile,
} from '@/lib/frontmatter';
import { isOklch } from '@/lib/oklch';
import { ENTRY_PREVIEW } from '@/components/LiveEntry';
import {
  joinSections,
  newSection,
  shownText,
  splitBlock,
  splitSections,
  withBreak,
  type Sections,
} from '@/lib/body-sections';
import PagePreview from './shop/PagePreview';
import ProsePanel from './ProsePanel';
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
  art,
  orderable,
  projects,
  prose,
  sections: bodySections,
  previewBase,
  draftViews,
}: {
  collection: string;
  noun: string;
  template?: string;
  seo?: boolean;
  siteName?: string;
  /**
   * Where this collection's uploaded images live, if it has any.
   *
   * A prop rather than a check on `collection`, which is what this was: two
   * collections now upload images into two different directories, and a third
   * would have been a third branch in here instead of a line at the call site.
   */
  art?: { collection: string; dir: string };
  /** Whether the cards set the public order, by ↑ and ↓. Projects only. */
  orderable?: boolean;
  /** Real project slugs, for a post pointing at one. */
  projects?: readonly string[];
  /** Run the style and grammar checks on the body. Prose collections. */
  prose?: boolean;
  /**
   * Edit the body as an opening and its `## ` sections (lib/body-sections.ts),
   * with the whole text one toggle away. Projects, since Stage 2.
   */
  sections?: boolean;
  /** Where an entry's live page is, for Preview the page: '/projects/'. */
  previewBase?: string;
  /**
   * Drafts / Published / All pills over the cards, opening on Drafts. Writing,
   * since Stage 3: most of its posts are drafts, and those are what is being
   * worked on.
   */
  draftViews?: boolean;
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
  /** The body as one text rather than as sections, where sections are on. */
  const [rawBody, setRawBody] = useState(false);
  /** Whether the real page is open in the preview frame. */
  const [previewing, setPreviewing] = useState(false);
  /** Which posts the pills show, where there are pills. */
  const [view, setView] = useState<'drafts' | 'published' | 'all'>('drafts');
  const [order, setOrder] = useState<string[] | null>(null);
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
   * Flat, in one directory per collection. Writing's existing covers sit in
   * nested folders — /writing/bioshock/cover.webp — which the one-level path
   * guard deliberately will not write to; those keep working and new ones are
   * <slug>-cover.webp beside them. */
  useEffect(() => {
    if (!art) return;
    let live = true;
    (async () => {
      const response = await fetch(`/work/api/content?collection=${art.collection}`, {
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
  }, [art]);

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
        date: readScalar(lines, 'date') ?? '',
        draft: isDraft(entry.text),
        // What would be flagged if it were opened — the gold on a shut card.
        problems: warningsFor(
          collection,
          Object.fromEntries(fields.map((field) => [field.key, readScalar(lines, field.key) ?? ''])),
          { images, isOklch, projects },
        ).length,
      };
    });
  }, [entries, collection, fields, images, projects]);

  /* Ordered the way the public side orders it, which is the point: the grid is
   * highest weight first and the blog is newest first.
   *
   * The date fallback is not decoration. Sorting by weight then title put the
   * Writing list in alphabetical order, because no post has a weight — which
   * is a worse order than the alphabetical-by-filename it replaced, since at
   * least that one was stable. A blog listed alphabetically is a blog where
   * the thing you just wrote is in the middle somewhere. */
  const listed = useMemo(() => {
    const sorted = [...summaries].sort(
      (a, b) =>
        b.weight - a.weight ||
        b.date.localeCompare(a.date) ||
        a.title.localeCompare(b.title),
    );
    if (!order) return sorted;
    const byPath = new Map(sorted.map((entry) => [entry.path, entry]));
    return order.map((path) => byPath.get(path)).filter((entry): entry is (typeof sorted)[0] => Boolean(entry));
  }, [summaries, order]);

  const ordering = Boolean(orderable);

  /* What the pills let through. Ordering, where it exists, still works on the
     whole list — the pills are a view, not a different order. */
  const shown = useMemo(() => {
    if (!draftViews || view === 'all') return listed;
    return listed.filter((entry) => (view === 'drafts' ? entry.draft : !entry.draft));
  }, [listed, draftViews, view]);
  const draftCount = useMemo(() => listed.filter((entry) => entry.draft).length, [listed]);

  const current = entries?.find((entry) => entry.path === openPath) ?? null;
  const lines = draftFile?.frontmatter ?? [];
  const slug = openPath ? name(openPath) : '';

  const values = useMemo(() => {
    const out: Record<string, string> = {};
    for (const field of fields) out[field.key] = readScalar(lines, field.key) ?? '';
    return out;
  }, [fields, lines]);

  /** Every tag already used in this collection, so spellings stay consistent. */
  const usedTags = useMemo(() => {
    const all = new Set<string>();
    for (const entry of entries ?? []) {
      const split = splitFile(entry.text);
      if (!split) continue;
      for (const tag of readFlowList(split.frontmatter, 'tags')) all.add(tag);
    }
    return [...all].sort();
  }, [entries]);

  const warnings = useMemo(
    () => (draftFile ? warningsFor(collection, values, { images, isOklch, projects }) : []),
    [collection, values, images, draftFile, projects],
  );

  /* Changing the track moves the post between pages, which is not obvious from
   * a dropdown: /gaming shows gaming, /orthodoxy shows theology, /writing
   * shows everything. Compared against the SAVED file rather than against the
   * last render, so it says this only when the change is real and unsaved. */
  const trackMoved = useMemo(() => {
    if (!current || !draftFile) return null;
    const saved = splitFile(current.text);
    if (!saved) return null;
    const was = readScalar(saved.frontmatter, 'track');
    const now = readScalar(draftFile.frontmatter, 'track');
    return was && now && was !== now ? { was, now } : null;
  }, [current, draftFile]);

  /* A date in the future withholds the post until a build on or after it.
   * Worth saying out loud, because the post simply not appearing is otherwise
   * indistinguishable from a broken deploy. */
  /* The clock is read once on mount, not inside the memo. A memo that calls
     Date.now() is not a pure function of its dependencies, so it could return
     a different answer for the same date on a later render - which is exactly
     what a memo is supposed to rule out. */
  const [mountedAt] = useState(() => Date.now());
  /** Today in South Africa, for marking a post scheduled. */
  const todayLocal = new Date(mountedAt + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const scheduled = useMemo(() => {
    const date = values.date?.trim();
    if (!date) return null;
    const today = new Date(mountedAt + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return date > today ? date : null;
  }, [values.date, mountedAt]);

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

  /** Shut the open card. */
  function close() {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setOpenPath(null);
    setDraftFile(null);
    setIsNew(false);
    setDirty(false);
    setPreviewing(false);
  }

  /** One step up or down the grid; saved with Save order, in one commit. */
  function move(path: string, by: -1 | 1) {
    const paths = listed.map((entry) => entry.path);
    const from = paths.indexOf(path);
    const to = from + by;
    if (from < 0 || to < 0 || to >= paths.length) return;
    [paths[from], paths[to]] = [paths[to], paths[from]];
    setOrder(paths);
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
    if (!art) {
      setStatus('This collection has nowhere to put an image.');
      return;
    }
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

      // <slug>-hero.webp for a hero, <slug>-cover.webp for a cover, and the
      // source filename otherwise. Lower case and hyphens only, because that
      // is all the path guard allows.
      const stem =
        assignTo === 'hero' || assignTo === 'cover'
          ? assignTo
          : (file.name.replace(/\.[^.]+$/, '') || 'image')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || 'image';
      const filename = `${slug}-${stem}.webp`;

      // covers.mjs regenerates three names per project on every build; an
      // upload saved over one of them would survive until the next deploy and
      // then vanish with nothing to explain why. Writing has no generated
      // covers, so the guard only applies where something generates.
      if (art.dir === 'public/projects' && generatedCoverNames(slug).includes(filename)) {
        throw new Error(`${filename} is regenerated on every build — give it another name`);
      }

      const path = `${art.dir}/${filename}`;
      const head = await fetch(
        `/work/api/content?collection=${art.collection}&path=${encodeURIComponent(path)}`,
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
          collection: art.collection,
          path,
          content: btoa(binary),
          sha: existing,
        }),
      });
      const data = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) {
        throw new Error(data.error ?? `Upload failed (${response.status}).`);
      }

      const publicPath = `${art.dir.replace(/^public/, '')}/${filename}`;
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

  /* What the preview frame shows: memoised on its contents, so the frame is
     sent a draft when the words change and not on every render. */
  const previewPayload = useMemo(
    () => (draftFile ? { title: values.title ?? '', summary: values.summary ?? '', body: draftFile.body } : null),
    [draftFile, values.title, values.summary],
  );

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
  const artPrefix = art ? `${art.dir.replace(/^public/, '')}/` : '/';
  const parts: Sections | null = draftFile && bodySections && !rawBody ? splitSections(draftFile.body) : null;
  const setParts = (next: Sections) => edit({ body: joinSections(next) });

  /* The body: as an opening and its sections, or as one text. */
  const bodyEditor = draftFile ? (
    <>
      <div className={styles.bodyHead}>
        <span className={styles.bodyLabel}>Body</span>
        {bodySections && (
          <button type="button" className={styles.quietLink} onClick={() => setRawBody((was) => !was)}>
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
              {mine.length > 0 && (
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
                      const text = section.text.endsWith('\n\n') ? section.text : `${section.text.replace(/\n*$/, '')}\n\n`;
                      sections[i] = { ...section, text: `${text}${splitBlock(src, side as 'left' | 'right')}\n` };
                      setParts({ ...parts, sections });
                    }}
                  >
                    <option value="">add one…</option>
                    {mine.flatMap((path) => [
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

          <div className={styles.addSection}>
            <button
              type="button"
              className={styles.addToggle}
              aria-label="Add a section"
              title="Add a section"
              onClick={() => setParts({ ...parts, sections: [...parts.sections, newSection()] })}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <span className={styles.hint}>Add a section</span>
          </div>
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <p className={styles.insertRow}>
              Insert an image:
              {mine.map((path) => (
                <button key={path} type="button" onClick={() => insertImage(path)}>
                  {path.replace(artPrefix, '')}
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
        </>
      )}
    </>
  ) : null;

  /* Everything inside an open card: the fields, the body, and beside them
     what the page will say and how it scores. */
  const openBody = draftFile ? (
    <div className={`${styles.cardBody} ${seo ? '' : styles.cardBodyPlain}`}>
      <div className={styles.cardMain}>
        <div className={styles.bar}>
          <span className={styles.barName}>
            {openPath ? name(openPath) : `New ${noun}`}
            {draft && <span className={styles.draftTag}>draft</span>}
            {dirty && <span className={styles.dirty}>unsaved</span>}
          </span>
          <span className={styles.barButtons}>
            {previewBase && openPath && (
              <button type="button" className={styles.quiet} onClick={() => setPreviewing(true)}>
                Preview the page
              </button>
            )}
            {/* Status is the visible state of a project and draft is a
                separate thing — one is "what stage is this at", the other is
                "is this page on the site at all". No project has ever used
                draft, so it is the quiet button. */}
            <button
              type="button"
              className={styles.quiet}
              onClick={() => void save(!draft)}
              disabled={busy}
              title={draft ? 'Clear draft: true and publish it' : 'Set draft: true and take the page down'}
            >
              {draft ? 'Publish' : 'Hide page'}
            </button>
            <button type="button" className={styles.save} onClick={() => void save()} disabled={busy || !dirty}>
              {busy ? 'Working…' : 'Save'}
            </button>
          </span>
        </div>

            {trackMoved && (
              <p className={styles.notice}>
                Track changed from <strong>{trackMoved.was}</strong> to{' '}
                <strong>{trackMoved.now}</strong>. Saving moves this post between the pages built
                from it — /gaming shows gaming, /orthodoxy shows theology, /writing shows all.
              </p>
            )}

            {scheduled && (
              <p className={styles.notice}>
                Dated {scheduled}, which is in the future, so this post is withheld from every
                listing, the feed and the sitemap until then. A daily check rebuilds the site on
                the day it is due.
              </p>
            )}

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
              onUpload={art ? upload : undefined}
              uploading={uploading}
              dynamicOptions={{ projects, tags: usedTags }}
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

        {bodyEditor}

        {status && <p className={styles.message}>{status}</p>}
      </div>

      {seo && (
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
            <h3 className={styles.previewHead}>The social card</h3>
            {openPath ? (
              <>
                <img
                  className={styles.ogPreview}
                  src={`/og/${collection}/${slug}.png`}
                  alt=""
                  // A post saved a minute ago has no card until the deploy
                  // finishes, and a broken frame reads as a bug rather than as
                  // a thing that is on its way.
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <p className={styles.hint}>
                  Drawn from the title by scripts/og.mjs at build, not from the cover. It appears
                  after the next deploy and is redrawn whenever the title changes.
                </p>
              </>
            ) : (
              <p className={styles.hint}>
                Generated at the first deploy after this is saved, from the title.
              </p>
            )}

            <p className={styles.hint}>
              {previewBase
                ? 'The body is rendered in Preview the page: the real page, with this draft in it.'
                : 'The body is not rendered here: it is MDX, and the components in it only run at build.'}
            </p>
          </section>

          {prose && (
            <ProsePanel
              body={draftFile.body}
              wordTarget={collection === 'writing' ? 500 : undefined}
              onSelect={(start, end) => {
                // A finding is a place in the whole body, so it is shown in
                // the one-text box: switch to it first if sections are open.
                if (!bodyRef.current && bodySections) {
                  setRawBody(true);
                  requestAnimationFrame(() => {
                    const area = bodyRef.current;
                    if (!area) return;
                    area.focus();
                    area.setSelectionRange(start, end);
                  });
                  return;
                }
                const area = bodyRef.current;
                if (!area) return;
                area.focus();
                area.setSelectionRange(start, end);
                // Scroll the selection into view, which setSelectionRange
                // does not do on its own in any browser.
                const before = draftFile.body.slice(0, start).split('\n').length;
                const lineHeight = area.scrollHeight / Math.max(1, draftFile.body.split('\n').length);
                area.scrollTop = Math.max(0, (before - 3) * lineHeight);
              }}
            />
          )}

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
  ) : null;

  return (
    <div className={styles.page}>
      {/* A new entry, as the round + Habits and Reading use: shut until wanted. */}
      {template && (
        <section className={styles.addSection}>
          <button
            type="button"
            className={isNew ? styles.addToggleOn : styles.addToggle}
            aria-expanded={isNew}
            aria-label={isNew ? 'Close' : `New ${noun}`}
            title={isNew ? 'Close' : `New ${noun}`}
            onClick={() => (isNew ? close() : startNew())}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </section>
      )}

      {ordering && order && (
        <p className={styles.orderBar}>
          The grid&rsquo;s order has changed.
          <button type="button" className={styles.save} onClick={() => void saveOrder()} disabled={busy}>
            Save order
          </button>
          <button type="button" onClick={() => setOrder(null)} disabled={busy}>
            Undo
          </button>
        </p>
      )}

      {draftViews && (
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
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!draftFile && status && <p className={styles.message}>{status}</p>}

      {/* One shut card per entry, as the Shop's are: a pill in the middle of
          the page that opens to the width of the column. Gold where something
          on it would be flagged if opened. */}
      <div className={styles.cards}>
        {isNew && draftFile && (
          <section className={styles.cardOpen}>
            <div className={styles.cardHeadRow}>
              <button type="button" className={styles.cardHead} aria-expanded onClick={close}>
                <span className={styles.cardName}>New {noun}</span>
              </button>
            </div>
            {openBody}
          </section>
        )}

        {draftViews && shown.length === 0 && (
          <p className={styles.message}>
            {view === 'drafts' ? 'No drafts — everything is published.' : 'Nothing published yet.'}
          </p>
        )}

        {shown.map((entry, index) => {
          const isOpen = !isNew && openPath === entry.path;
          return (
            <section
              key={entry.path}
              className={isOpen ? styles.cardOpen : styles.card}
              data-waiting={entry.problems > 0 || undefined}
            >
              <div className={styles.cardHeadRow}>
                <button
                  type="button"
                  className={styles.cardHead}
                  aria-expanded={isOpen}
                  onClick={() => (isOpen ? close() : openEntry(entry.path))}
                >
                  <span className={styles.cardName}>{entry.title}</span>
                  <span className={styles.cardFacts}>
                    {[entry.kind ?? entry.track, entry.status].filter(Boolean).join(' · ')}
                    {entry.draft && <span className={styles.draftTag}>draft</span>}
                  </span>
                  <span className={styles.cardState}>
                    {entry.problems > 0
                      ? `${entry.problems} to fix`
                      : entry.date > todayLocal
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
                      onClick={() => move(entry.path, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${entry.title} down`}
                      disabled={index === listed.length - 1}
                      onClick={() => move(entry.path, 1)}
                    >
                      ↓
                    </button>
                  </span>
                )}
              </div>
              {isOpen && openBody}
            </section>
          );
        })}
      </div>

      {previewing && previewBase && openPath && draftFile && (
        <PagePreview
          href={`${previewBase}${slug}/`}
          name={values.title || slug}
          type={ENTRY_PREVIEW}
          payload={previewPayload}
          onClose={() => setPreviewing(false)}
        />
      )}
    </div>
  );
}
