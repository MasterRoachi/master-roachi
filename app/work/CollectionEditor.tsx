'use client';

import { useCallback, useEffect, useState } from 'react';
import { isDraft } from '@/lib/collections';
import styles from './editor.module.css';

// One editor, for every collection of files in the repo.
//
// Writing and projects differ only in which directory they are in and what
// their frontmatter looks like, both of which live in lib/collections.ts. A
// second copy of this component per collection would be a second place for a
// bug about saving, which is the one operation here that can lose work.
//
// The body is one textarea holding the whole file, frontmatter included,
// rather than a field per key. A form means modelling every frontmatter key
// and silently dropping any it does not know — and losing a field on save is
// the worst failure this tool can have: quiet, committed, and self-deploying.
// What is stored is what is shown.

interface FileRef {
  path: string;
  sha: string;
}

/** The filename without directory or extension — what he actually calls it. */
function name(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.(mdx|json)$/, '');
}

export default function CollectionEditor({
  collection,
  noun,
  template,
}: {
  collection: string;
  /** "post", "project" — used in the one sentence of prose. */
  noun: string;
  /** Starting text for a new one. Omitted where nothing new can be created. */
  template?: string;
}) {
  const [files, setFiles] = useState<FileRef[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [open, setOpen] = useState<{ path: string | null; sha?: string }>({ path: null });
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const response = await fetch(`/work/api/content?collection=${collection}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      setStatus('Not switched on — GITHUB_TOKEN is not set.');
      setFiles([]);
      return;
    }
    const data = (await response.json()) as { configured: boolean; files: FileRef[] };
    setConfigured(data.configured);
    setFiles(data.files ?? []);
  }, [collection]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openFile(path: string) {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/work/api/content?collection=${collection}&path=${encodeURIComponent(path)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) throw new Error(`could not open (${response.status})`);
      const { file } = (await response.json()) as { file: { text: string; sha: string } };
      setOpen({ path, sha: file.sha });
      setText(file.text);
      setDirty(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not open it.');
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    if (!template) return;
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setOpen({ path: null });
    setText(template);
    setDirty(false);
    setStatus(null);
  }

  async function save(draft?: boolean) {
    setBusy(true);
    setStatus(null);
    try {
      const title = text.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? '';
      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collection,
          text,
          ...(open.path ? { path: open.path, sha: open.sha } : { title }),
          ...(draft === undefined ? {} : { draft }),
        }),
      });
      const data = (await response.json()) as {
        saved?: boolean;
        path?: string;
        error?: string;
      };

      if (response.status === 409) {
        setStatus(
          'That file changed since you opened it. Open it again — saving now would overwrite the newer version.',
        );
        return;
      }
      if (!response.ok || !data.saved) {
        setStatus(data.error ?? `Save failed (${response.status}).`);
        return;
      }

      setDirty(false);
      setStatus(`Saved to ${data.path}. The deploy takes about two minutes.`);
      if (data.path) await openFile(data.path);
      await loadList();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  if (files === null) return <p className={styles.status}>Reading the repo…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. Set <code>GITHUB_TOKEN</code> as a Worker secret — a
        fine-grained token for this repository, Contents: read and write.
      </p>
    );
  }

  const draft = isDraft(text);
  const showing = open.path !== null || text !== '';

  return (
    <div className={styles.editor}>
      <aside className={styles.list}>
        {template && (
          <button type="button" className={styles.new} onClick={startNew}>
            New {noun}
          </button>
        )}
        <ul>
          {files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                className={open.path === file.path ? styles.current : undefined}
                onClick={() => void openFile(file.path)}
              >
                {name(file.path)}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className={styles.pane}>
        {!showing ? (
          <p className={styles.status}>Pick one, or start a new {noun}.</p>
        ) : (
          <>
            <p className={styles.status}>
              {open.path ? name(open.path) : `New ${noun}`}
              {draft && <span className={styles.draft}>draft</span>}
              {dirty && <span className={styles.dirty}>unsaved</span>}

              <button type="button" onClick={() => void save()} disabled={busy || !dirty}>
                {busy ? 'Working…' : 'Save'}
              </button>

              {/* Publishing is a save with the flag flipped, so it cannot
                  happen without the text going with it — and it is enabled
                  whether or not there are edits, because flipping the flag IS
                  the edit. */}
              <button
                type="button"
                onClick={() => void save(!draft)}
                disabled={busy}
                title={
                  draft
                    ? 'Clear draft: true and publish it'
                    : 'Set draft: true and unpublish it'
                }
              >
                {draft ? 'Publish' : 'Unpublish'}
              </button>
            </p>
            <textarea
              className={styles.text}
              value={text}
              spellCheck
              onChange={(event) => {
                setText(event.target.value);
                setDirty(true);
              }}
            />
          </>
        )}
        {status && <p className={styles.message}>{status}</p>}
      </div>
    </div>
  );
}
