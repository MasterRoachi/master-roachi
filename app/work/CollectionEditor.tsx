'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { checkProse, countIssues } from '@/lib/prose-check';
import { scoreSeo, type SeoInput } from '@/lib/seo-score';
import { ENTRY_PREVIEW } from '@/components/LiveEntry';
import PagePreview from './shop/PagePreview';
import FrontmatterFields from './FrontmatterFields';
import BodyEditor from './editor/BodyEditor';
import CheckTab, { Snapshots, Warnings } from './editor/CheckTab';
import EntryList from './editor/EntryList';
import { groupFields } from './editor/groups';
import LiveFrame, { useWide } from './editor/LiveFrame';
import PicturesTab from './editor/PicturesTab';
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
//
// THE LAYOUT, his pick, 2026-11-10 (redesign page, Projects and Writing: A,
// "Four tabs and a fixed bar"). The list of cards is the first screen
// (editor/EntryList.tsx). An entry opens full screen, in four tabs: Details
// (the fields that matter, the rest under More details), Words (the body),
// Pictures (cover, hero, the body's images, upload) and Check (prose, SEO and
// the four previews, its label counting the problems). Preview, Publish and
// Save are pinned in a bar at the foot. From 1000px the live page sits in a
// panel on the right (editor/LiveFrame.tsx), where the sticky column of
// previews used to be. It replaced a card that opened in place, which put up
// to sixteen fields, the body and that column on one long page.
//
// Every tab stays mounted and the others are only hidden, so switching keeps
// each one's scroll and the body's cursor.

type Tab = 'details' | 'words' | 'pictures' | 'check';

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
  /** Which of the four tabs an open entry shows. */
  const [tab, setTab] = useState<Tab>('words');
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  /** A prose finding to select once the Words tab and its one text are up. */
  const pendingSelect = useRef<[number, number] | null>(null);
  const wide = useWide();

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
  const lines = useMemo(() => draftFile?.frontmatter ?? [], [draftFile]);
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
    // An entry that exists is opened to be written in.
    setTab('words');
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
    // A new one needs its title first, which is what names its file.
    setTab('details');
  }

  /** Back to the list. */
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

  /* What the preview frames show: memoised on its contents, so a frame is
     sent a draft when the words change and not on every render. */
  const previewPayload = useMemo(
    () => (draftFile ? { title: values.title ?? '', summary: values.summary ?? '', body: draftFile.body } : null),
    [draftFile, values.title, values.summary],
  );

  const groups = useMemo(() => groupFields(collection, fields), [collection, fields]);

  /* The SEO panel's input, built once per change and shared with the Check
     tab's count, so the number on the tab and the panel cannot disagree. */
  const seoInput = useMemo<SeoInput | null>(() => {
    if (!seo || !draftFile) return null;
    return {
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
    };
  }, [seo, draftFile, collection, values, siteName]);

  /* The count on the Check tab: what is WRONG, not what could be better. The
     field warnings, the prose mistakes (not its style notes), and the SEO
     checks that fail outright (not the ones that only warn). A count that
     included every arguable note would never be zero, and a number that is
     never zero stops being read. */
  const problems = useMemo(() => {
    if (!draftFile) return 0;
    const proseErrors = prose ? countIssues(checkProse(draftFile.body)).errors : 0;
    const seoFails = seoInput ? scoreSeo(seoInput).checks.filter((check) => check.state === 'fail').length : 0;
    return warnings.length + proseErrors + seoFails;
  }, [draftFile, prose, seoInput, warnings]);

  /* A prose finding is a place in the whole body, so it is shown in the
     one-text box on the Words tab. The click switches there; this selects it
     once that box is on screen. */
  useEffect(() => {
    const at = pendingSelect.current;
    const area = bodyRef.current;
    if (!at || !area || tab !== 'words') return;
    pendingSelect.current = null;
    const [start, end] = at;
    area.focus();
    area.setSelectionRange(start, end);
    // Scroll the selection into view, which setSelectionRange does not do on
    // its own in any browser.
    const text = area.value;
    const before = text.slice(0, start).split('\n').length;
    const lineHeight = area.scrollHeight / Math.max(1, text.split('\n').length);
    area.scrollTop = Math.max(0, (before - 3) * lineHeight);
  }, [tab, rawBody]);

  if (entries === null) return <p className={styles.status}>Reading the repo…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. Set <code>GITHUB_TOKEN</code> as a Worker secret — a fine-grained token for
        this repository, Contents: read and write.
      </p>
    );
  }

  if (!draftFile) {
    return (
      <EntryList
        noun={noun}
        canCreate={Boolean(template)}
        onNew={startNew}
        shown={shown}
        total={listed.length}
        ordering={ordering}
        orderChanged={Boolean(order)}
        onMove={move}
        onSaveOrder={() => void saveOrder()}
        onUndoOrder={() => setOrder(null)}
        busy={busy}
        draftViews={draftViews}
        view={view}
        onView={setView}
        draftCount={draftCount}
        today={todayLocal}
        status={status}
        onOpen={openEntry}
      />
    );
  }

  const draft = readScalar(draftFile.frontmatter, 'draft') === 'true';
  const mine = images.filter((path) => !slug || path.includes(slug));
  const artPrefix = art ? `${art.dir.replace(/^public/, '')}/` : '/';
  const hasPictures = groups.pictures.length > 0 || Boolean(art);
  const hasCheck = Boolean(seo || prose);
  const unknown = unknownFields(draftFile.frontmatter, known);

  const moreKeys = new Set(groups.more.map((field) => field.key));
  const pictureKeys = new Set(groups.pictures.map((field) => field.key));
  const moreWarnings = warnings.filter((warning) => moreKeys.has(warning.key)).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'words', label: 'Words' },
    ...(hasPictures ? [{ key: 'pictures' as const, label: 'Pictures' }] : []),
    ...(hasCheck ? [{ key: 'check' as const, label: problems > 0 ? `Check · ${problems}` : 'Check' }] : []),
  ];

  const snapshots = seo ? (
    <Snapshots
      values={values}
      collection={collection}
      slug={slug}
      saved={Boolean(openPath)}
      siteName={siteName}
      previewBase={previewBase}
    />
  ) : null;

  /* The panel on the right, on a computer: the live page where there is one
     to show, and the previews for an entry that has no page yet. */
  const side =
    wide && previewBase && openPath ? (
      <aside className={styles.side} aria-label="Live preview">
        <p className={styles.sideNote}>The live page, with your unsaved words in it.</p>
        <LiveFrame
          href={`${previewBase}${slug}/`}
          name={values.title || slug}
          type={ENTRY_PREVIEW}
          payload={previewPayload}
        />
      </aside>
    ) : wide && snapshots ? (
      <aside className={`${styles.side} ${styles.sideScroll}`} aria-label="How it will look">
        {snapshots}
      </aside>
    ) : null;

  const panel = (key: Tab) => ({
    role: 'tabpanel' as const,
    id: `panel-${key}`,
    'aria-labelledby': `tab-${key}`,
    hidden: tab !== key,
    className: styles.tabPanel,
  });

  return (
    <div className={styles.editor}>
      <div className={styles.editorHead}>
        <button type="button" className={styles.back} onClick={close} aria-label="Back to the list">
          <span aria-hidden="true">‹</span>
        </button>
        <span className={styles.editorTitle}>
          <span className={styles.editorName}>{values.title || (isNew ? `New ${noun}` : slug)}</span>
          <span className={styles.editorFile}>
            {openPath ? name(openPath) : 'not saved yet'}
            {draft && <span className={styles.draftTag}>draft</span>}
            {dirty && <span className={styles.dirty}>unsaved</span>}
          </span>
        </span>
      </div>

      <div className={side ? styles.editorSplit : styles.editorOne}>
        <div className={styles.editorMain}>
          <div className={styles.tabs} role="tablist" aria-label={`Edit this ${noun}`}>
            {tabs.map((one) => (
              <button
                key={one.key}
                type="button"
                role="tab"
                id={`tab-${one.key}`}
                aria-selected={tab === one.key}
                aria-controls={`panel-${one.key}`}
                className={tab === one.key ? styles.tabOn : styles.tab}
                data-problems={(one.key === 'check' && problems > 0) || undefined}
                onClick={() => setTab(one.key)}
              >
                {one.label}
              </button>
            ))}
          </div>

          <div className={styles.pane}>
            <div {...panel('details')}>
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

              <Warnings
                warnings={warnings.filter((warning) => !pictureKeys.has(warning.key))}
              />

              <FrontmatterFields
                fields={groups.main}
                lines={draftFile.frontmatter}
                onChange={(frontmatter) => edit({ frontmatter })}
                images={images}
                onUpload={art ? upload : undefined}
                uploading={uploading}
                dynamicOptions={{ projects, tags: usedTags }}
              />

              {/* The rarely used fields, and the raw box, folded away. */}
              <details className={styles.more}>
                <summary>
                  More details
                  {moreWarnings > 0 && <span className={styles.moreFlag}>{moreWarnings} to fix</span>}
                </summary>

                {groups.more.length > 0 && (
                  <FrontmatterFields
                    fields={groups.more}
                    lines={draftFile.frontmatter}
                    onChange={(frontmatter) => edit({ frontmatter })}
                    images={images}
                    onUpload={art ? upload : undefined}
                    uploading={uploading}
                    dynamicOptions={{ projects, tags: usedTags }}
                  />
                )}

                {/* Everything the schema does not model, as its own text. It
                    round-trips untouched either way; showing it is the
                    difference between a form that keeps your fields and a form
                    you can believe keeps your fields. */}
                <details className={styles.other} open={unknown !== ''}>
                  <summary>Other frontmatter</summary>
                  <textarea
                    className={styles.fieldText}
                    rows={4}
                    spellCheck={false}
                    value={unknown}
                    aria-label="Other frontmatter"
                    onChange={(event) =>
                      edit({
                        frontmatter: setUnknownFields(draftFile.frontmatter, known, event.target.value),
                      })
                    }
                  />
                  <p className={styles.hint}>
                    Keys with no control elsewhere. Edited as text, kept exactly as written.
                  </p>
                </details>
              </details>
            </div>

            <div {...panel('words')}>
              <BodyEditor
                body={draftFile.body}
                onChange={(body) => edit({ body })}
                sections={bodySections}
                rawBody={rawBody}
                onToggleRaw={() => setRawBody((was) => !was)}
                images={mine}
                artPrefix={artPrefix}
                bodyRef={bodyRef}
                onInsertImage={insertImage}
              />
            </div>

            {hasPictures && (
              <div {...panel('pictures')}>
                <Warnings warnings={warnings.filter((warning) => pictureKeys.has(warning.key))} />
                <PicturesTab
                  fields={groups.pictures}
                  lines={draftFile.frontmatter}
                  onChange={(frontmatter) => edit({ frontmatter })}
                  images={images}
                  mine={mine}
                  artPrefix={artPrefix}
                  body={draftFile.body}
                  onUpload={art ? upload : undefined}
                  uploading={uploading}
                />
              </div>
            )}

            {hasCheck && (
              <div {...panel('check')}>
                <CheckTab
                  warnings={warnings}
                  snapshots={snapshots}
                  body={draftFile.body}
                  prose={prose}
                  wordTarget={collection === 'writing' ? 500 : undefined}
                  seo={seoInput}
                  onSelect={(start, end) => {
                    pendingSelect.current = [start, end];
                    if (bodySections) setRawBody(true);
                    setTab('words');
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {side}
      </div>

      {status && (
        <p className={styles.editorMessage} role="status">
          {status}
        </p>
      )}

      {/* Pinned at the foot. Status is the visible state of a project and
          draft is a separate thing — one is "what stage is this at", the
          other is "is this page on the site at all". No project has ever
          used draft, so Publish / Hide page is a quiet button. */}
      <div className={styles.actionBar}>
        {previewBase && openPath && (
          <button
            type="button"
            className={styles.quiet}
            onClick={() => setPreviewing(true)}
            title="Preview the page: the real page, full screen, with this draft in it"
          >
            Preview
          </button>
        )}
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
      </div>

      {previewing && previewBase && openPath && (
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
