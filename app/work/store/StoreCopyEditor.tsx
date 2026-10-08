'use client';

import { useEffect, useState } from 'react';
import styles from '../editor.module.css';

// A box per product, rather than the raw JSON.
//
// content/store/copy.json is a machine-shaped file — an object keyed by
// Printful id — and hand-editing JSON is how you commit a missing comma that
// fails the build two minutes later. Here the JSON is rebuilt from the boxes
// on save, so it cannot be malformed by typing in it.
//
// Two things are preserved that are not on screen: the file's $comment, which
// documents why it exists, and any id with copy that is no longer a listed
// product — a design pulled from Printful should not have its words deleted as
// a side effect of saving something else.

const PATH = 'content/store/copy.json';

interface Product {
  id: string;
  name: string;
}

export default function StoreCopyEditor({ products }: { products: Product[] }) {
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  const [sha, setSha] = useState<string | undefined>();
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const response = await fetch(
          `/work/api/content?collection=store-copy&path=${encodeURIComponent(PATH)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'Not switched on — GITHUB_TOKEN is not set.'
              : `Could not read the file (${response.status}).`,
          );
        }
        const { file } = (await response.json()) as {
          file: { text: string; sha: string };
        };
        const parsed = JSON.parse(file.text) as Record<string, unknown>;
        if (!live) return;

        setRaw(parsed);
        setSha(file.sha);
        setCopy(
          Object.fromEntries(
            Object.entries(parsed)
              .filter(([key, value]) => key !== '$comment' && Array.isArray(value))
              .map(([key, value]) => [key, (value as string[]).join('\n\n')]),
          ),
        );
      } catch (error) {
        if (live) setStatus(error instanceof Error ? error.message : 'Could not load it.');
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  async function save() {
    if (!raw) return;
    setBusy(true);
    setStatus(null);
    try {
      // Rebuilt from raw, so $comment and any unlisted product's copy survive.
      const next: Record<string, unknown> = { ...raw };
      for (const [id, text] of Object.entries(copy)) {
        const paragraphs = text
          .split(/\n{2,}|\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        if (paragraphs.length) next[id] = paragraphs;
        else delete next[id];
      }

      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collection: 'store-copy',
          path: PATH,
          sha,
          text: JSON.stringify(next, null, 2) + '\n',
        }),
      });
      const data = (await response.json()) as { saved?: boolean; error?: string };

      if (response.status === 409) {
        setStatus('The file changed since you opened it. Reload before saving.');
        return;
      }
      if (!response.ok || !data.saved) {
        setStatus(data.error ?? `Save failed (${response.status}).`);
        return;
      }
      setDirty(false);
      setStatus('Saved. The deploy takes about two minutes.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  if (raw === null) {
    return <p className={styles.status}>{status ?? 'Reading the repo…'}</p>;
  }

  return (
    <div className={styles.pane}>
      <p className={styles.status}>
        {products.length} product{products.length === 1 ? '' : 's'}
        {dirty && <span className={styles.dirty}>unsaved</span>}
        <button type="button" onClick={() => void save()} disabled={busy || !dirty}>
          {busy ? 'Working…' : 'Save'}
        </button>
      </p>

      {products.map((product) => (
        <div key={product.id} className={styles.product}>
          <label htmlFor={`copy-${product.id}`}>
            {product.name} <span className={styles.id}>{product.id}</span>
          </label>
          <textarea
            id={`copy-${product.id}`}
            className={styles.productText}
            spellCheck
            value={copy[product.id] ?? ''}
            placeholder="No copy yet — this product shows no description at all."
            onChange={(event) => {
              setCopy({ ...copy, [product.id]: event.target.value });
              setDirty(true);
            }}
          />
        </div>
      ))}

      {status && <p className={styles.message}>{status}</p>}
    </div>
  );
}
