'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Canvas, { type CanvasHandle } from './Canvas';
import styles from './scratchpad.module.css';

// Write, draw, save, export.
//
// A note is a Markdown file in notes/, committed when saved — so it is
// versioned and diffable like everything else here, rather than living in a
// store only this page can read. A drawing is a PNG beside it under the same
// slug, referenced from the note's own text so the Markdown stands alone when
// read anywhere else.
//
// Two saves, not one: the drawing is a separate file and therefore a separate
// commit. The note is written FIRST, because a drawing with no note is an
// orphan nothing points at, while a note whose image has not arrived yet is
// just a note with a broken image for a few seconds.

interface FileRef {
  path: string;
  sha: string;
}

const slug = (title: string) =>
  title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const today = () => new Date().toISOString().slice(0, 10);

function template(title: string) {
  return `---\ntitle: "${title}"\ndate: ${today()}\n---\n\n`;
}

export default function Scratchpad() {
  const [files, setFiles] = useState<FileRef[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [sha, setSha] = useState<string | undefined>();
  const [dirty, setDirty] = useState(false);
  const [drawingOn, setDrawingOn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvas = useRef<CanvasHandle | null>(null);

  const loadList = useCallback(async () => {
    const response = await fetch('/work/api/content?collection=notes', { cache: 'no-store' });
    if (!response.ok) {
      setStatus('Not switched on — GITHUB_TOKEN is not set.');
      setFiles([]);
      return;
    }
    const data = (await response.json()) as { configured: boolean; files: FileRef[] };
    setConfigured(data.configured);
    // Only the notes in the list; the drawings are reached through them.
    setFiles((data.files ?? []).filter((file) => file.path.endsWith('.md')));
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function open(path: string) {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/work/api/content?collection=notes&path=${encodeURIComponent(path)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) throw new Error(`could not open it (${response.status})`);
      const { file } = (await response.json()) as { file: { text: string; sha: string } };
      setOpenPath(path);
      setSha(file.sha);
      setText(file.text);
      setTitle(file.text.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? '');
      setDirty(false);
      setStatus(null);
      // A saved note's drawing is already in its Markdown; reopening the
      // canvas blank would invite overwriting it with an empty one.
      setDrawingOn(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not open it.');
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setOpenPath(null);
    setSha(undefined);
    setTitle('');
    setText('');
    setDirty(false);
    setDrawingOn(false);
    setStatus(null);
  }

  async function put(path: string, body: Record<string, unknown>) {
    const response = await fetch('/work/api/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection: 'notes', path, ...body }),
    });
    const data = (await response.json()) as { saved?: boolean; error?: string };
    if (response.status === 409) throw new Error('It changed since you opened it — reopen first.');
    if (!response.ok || !data.saved) throw new Error(data.error ?? `Failed (${response.status}).`);
    return data;
  }

  async function save() {
    const name = title.trim();
    if (!name) {
      setStatus('It needs a title — that is what names the file.');
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const base = openPath ? openPath.replace(/\.md$/, '') : `notes/${slug(name)}`;
      if (!openPath && !slug(name)) throw new Error('That title does not make a filename.');

      const drawing = drawingOn ? canvas.current?.toBase64() ?? null : null;
      const image = `${base}.png`;

      // The note carries the reference, so the Markdown is readable on its own
      // wherever it ends up — exported, in a diff, or on GitHub.
      let body = text.trim() ? text : template(name);
      if (drawing && !body.includes(`${slug(name)}.png`)) {
        body = `${body.replace(/\s*$/, '')}\n\n![drawing](./${image.split('/').pop()})\n`;
      }

      await put(`${base}.md`, { text: body, sha: openPath ? sha : undefined });

      if (drawing) {
        // Its own commit, because it is its own file. No sha: a redraw
        // replaces whatever is there, which is what redrawing means.
        await put(image, { text: drawing });
      }

      setText(body);
      setDirty(false);
      setStatus(
        drawing
          ? 'Saved, note and drawing. Both are committed.'
          : 'Saved. It is committed.',
      );
      await loadList();
      if (!openPath) await open(`${base}.md`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  /** Markdown, straight out of the editor — what is stored is what downloads. */
  function download(extension: 'md' | 'txt') {
    const name = slug(title) || 'note';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // PDF through the browser's own print dialogue rather than a PDF library.
  // Every browser has a competent PDF writer behind Ctrl+P, it handles fonts
  // and page breaks properly, and the alternative is a megabyte of dependency
  // that renders worse. The print stylesheet hides everything but the note.
  function pdf() {
    window.print();
  }

  if (files === null) return <p className={styles.status}>Reading the repo…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. Set <code>GITHUB_TOKEN</code> as a Worker secret.
      </p>
    );
  }

  return (
    <div className={styles.pad}>
      <aside className={styles.list}>
        <button type="button" className={styles.new} onClick={startNew}>
          New note
        </button>
        <ul>
          {files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                className={openPath === file.path ? styles.current : undefined}
                onClick={() => void open(file.path)}
              >
                {file.path.replace(/^notes\//, '').replace(/\.md$/, '')}
              </button>
            </li>
          ))}
        </ul>
        {files.length === 0 && <p className={styles.status}>No notes yet.</p>}
      </aside>

      <div className={styles.pane}>
        <p className={styles.bar}>
          <input
            className={styles.title}
            value={title}
            placeholder="Title"
            aria-label="Title"
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
          />
          {dirty && <span className={styles.dirty}>unsaved</span>}
          <button type="button" onClick={() => void save()} disabled={busy}>
            {busy ? 'Working…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setDrawingOn(!drawingOn)}
            aria-pressed={drawingOn}
          >
            {drawingOn ? 'Hide drawing' : 'Draw'}
          </button>
          <span className={styles.exports}>
            <button type="button" onClick={() => download('md')}>
              .md
            </button>
            <button type="button" onClick={() => download('txt')}>
              .txt
            </button>
            <button type="button" onClick={pdf}>
              PDF
            </button>
          </span>
        </p>

        {/* The printable region. Everything else is hidden when printing. */}
        <div className={styles.printable}>
          <h1 className={styles.printTitle}>{title}</h1>

          {/*
            Printing renders this <pre> and hides the textarea, rather than
            printing the textarea itself. A textarea prints only what is
            scrolled into view; the fix of letting it grow needs CSS
            field-sizing, which is recent enough that a browser without it
            would silently print a truncated note — the worst outcome for an
            export, since it looks like it worked. A <pre> is always its full
            height everywhere.
          */}
          <pre className={styles.printCopy}>{text}</pre>

          <textarea
            className={styles.text}
            value={text}
            spellCheck
            placeholder="Write. Markdown, and it is saved as a .md file in the repo."
            onChange={(event) => {
              setText(event.target.value);
              setDirty(true);
            }}
          />
        </div>

        {drawingOn && (
          <Canvas
            onReady={(handle) => {
              canvas.current = handle;
            }}
            onChange={() => setDirty(true)}
          />
        )}

        {status && <p className={styles.message}>{status}</p>}
      </div>
    </div>
  );
}
