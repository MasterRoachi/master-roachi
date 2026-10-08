'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './editor.module.css';

// The editor is one textarea holding the whole file, frontmatter included.
//
// That is a deliberate choice over a field per frontmatter key. Parsing the
// frontmatter into inputs and writing it back means modelling every key that
// exists today — title, summary, date, track, draft, and whatever the next
// post needs — and silently dropping any key the form does not know about.
// Losing a field on save is a bad failure in a publishing tool: it is quiet,
// it is committed, and it deploys itself.
//
// So what is stored is what is shown. New posts get a filled-in template, so
// the common case still does not require remembering the shape.

const TEMPLATE = (today: string) => `---
title: ""
summary:
date: ${today}
track:
draft: true
---

`;

interface PostRef {
  path: string;
  sha: string;
}

/** The filename without its directory or extension — what he actually calls it. */
function name(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.mdx$/, '');
}

export default function Editor() {
  const [posts, setPosts] = useState<PostRef[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [open, setOpen] = useState<{ path: string | null; sha?: string }>({ path: null });
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const response = await fetch('/work/api/content', { cache: 'no-store' });
    if (!response.ok) {
      setStatus('The editor is not switched on — GITHUB_TOKEN is not set.');
      setPosts([]);
      return;
    }
    const data = (await response.json()) as { configured: boolean; posts: PostRef[] };
    setConfigured(data.configured);
    setPosts(data.posts ?? []);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openPost(path: string) {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/work/api/content?path=${encodeURIComponent(path)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`could not open (${response.status})`);
      const { post } = (await response.json()) as { post: { text: string; sha: string } };
      setOpen({ path, sha: post.sha });
      setText(post.text);
      setDirty(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not open it.');
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    if (dirty && !confirm('Discard the unsaved changes?')) return;
    setOpen({ path: null });
    setText(TEMPLATE(new Date().toISOString().slice(0, 10)));
    setDirty(false);
    setStatus(null);
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      // A new post is named from its title, which is read out of the
      // frontmatter rather than asked for twice.
      const title = text.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? '';
      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          open.path ? { path: open.path, sha: open.sha, text } : { title, text },
        ),
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
      // Reopen by path so the new sha is the one a second save will carry.
      if (data.path) await openPost(data.path);
      await loadList();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  if (posts === null) return <p className={styles.status}>Reading the repo…</p>;

  if (!configured) {
    return (
      <p className={styles.status}>
        Not connected. Set <code>GITHUB_TOKEN</code> as a Worker secret — a
        fine-grained token for this repository, Contents: read and write.
      </p>
    );
  }

  return (
    <div className={styles.editor}>
      <aside className={styles.list}>
        <button type="button" className={styles.new} onClick={startNew}>
          New post
        </button>
        <ul>
          {posts.map((post) => (
            <li key={post.path}>
              <button
                type="button"
                className={open.path === post.path ? styles.current : undefined}
                onClick={() => void openPost(post.path)}
              >
                {name(post.path)}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className={styles.pane}>
        {open.path === null && text === '' ? (
          <p className={styles.status}>Pick a post, or start a new one.</p>
        ) : (
          <>
            <p className={styles.status}>
              {open.path ? name(open.path) : 'New post'}
              {dirty && <span className={styles.dirty}>unsaved</span>}
              <button type="button" onClick={() => void save()} disabled={busy || !dirty}>
                {busy ? 'Working…' : 'Save and publish'}
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
