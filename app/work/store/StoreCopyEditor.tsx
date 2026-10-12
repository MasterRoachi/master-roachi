'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SeoPanel from '@/components/SeoPanel';
import { productMetaDescription } from '@/lib/product-meta';
import { paragraphsIn } from '@/lib/seo-score';
import styles from './store.module.css';

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
// a side effect of saving something else. That second case is now also
// REPORTED at the foot of the page, because preserving something invisibly
// and never mentioning it is how it sits there for a year.
//
// The layout is the writing on the left and, on the right, what the page will
// actually say plus how it scores. That pairing is the reason the meta
// description now prefers his own words (lib/product-meta.ts): while it was
// built only from the supplier's facts, nothing typed here could move a single
// SEO field, and a live score would have been a decoration.

const PATH = 'content/store/copy.json';
/** Converted before upload, so the cap is about the WebP and not the source. */
const UPLOAD_LIMIT = 2_000_000;
/** Beyond this nothing on a product page gets better, and the file gets worse. */
const MAX_EDGE = 1600;

export interface EditorProduct {
  id: string;
  name: string;
  /** False for a design that exists in site.ts and not yet in Printful. */
  synced: boolean;
  href?: string;
  price?: string | null;
  garment?: string | null;
  category?: string;
  variantCount: number;
  images: { key: string; label: string; src: string }[];
}

interface Loaded {
  raw: Record<string, unknown>;
  sha?: string;
}

/** What the fullscreen inspector is showing, if anything. */
interface Viewing {
  src: string;
  label: string;
  product: string;
}

export default function StoreCopyEditor({
  products,
  fetchedAt,
  storeName,
  siteName,
}: {
  products: EditorProduct[];
  fetchedAt: string | null;
  storeName: string;
  /* Passed in rather than imported: lib/site.ts carries the payment-link map
     and the whole nav, and none of it belongs in this page's bundle. */
  siteName: string;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  /** Uploads made in this session, so a tile appears before the deploy lands. */
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const synced = useMemo(() => products.filter((p) => p.synced), [products]);

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
        const { file } = (await response.json()) as { file: { text: string; sha: string } };
        const parsed = JSON.parse(file.text) as Record<string, unknown>;
        if (!live) return;

        setLoaded({ raw: parsed, sha: file.sha });
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

  /* Esc closes the inspector.
   *
   * Bound on the window rather than on the overlay, because the overlay is
   * what has focus only if something in it is focusable, and a picture is
   * not — so a keydown handler on the div would never fire. */
  useEffect(() => {
    if (!viewing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewing(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewing]);

  /* Which products still need words, and which cannot have them.
   *
   * Counted over everything rather than over the synced ones, because the
   * question being answered is "what is left to do", and nine designs that
   * are not in Printful yet are nine things left to do. */
  const stats = useMemo(() => {
    const written = synced.filter((p) => (copy[p.id] ?? '').trim().length > 0).length;
    return {
      total: products.length,
      synced: synced.length,
      unsynced: products.length - synced.length,
      written,
      needWriting: synced.length - written,
    };
  }, [products, synced, copy]);

  /* Copy belonging to no listed product.
   *
   * Preserved on save and, until now, never shown. An id here means a product
   * was pulled from Printful or re-created with a new id, and its words are
   * sitting in the file doing nothing — worth knowing about, and not worth a
   * dialog. $comment is documentation, not copy. */
  const orphans = useMemo(() => {
    if (!loaded) return [];
    const listed = new Set(synced.map((p) => p.id));
    return Object.entries(loaded.raw)
      .filter(([key, value]) => key !== '$comment' && Array.isArray(value) && !listed.has(key))
      .map(([key, value]) => ({ id: key, words: (value as string[]).join(' ').split(/\s+/).length }));
  }, [loaded, synced]);

  /* No-copy first, his call: the page's job is to find what still needs words.
   *
   * Then written products, then the unsynced designs — which stay last
   * whatever else happens, because nothing can be done about them here. The
   * sort is stable within each band, so Printful's own order survives. */
  const ordered = useMemo(() => {
    const rank = (product: EditorProduct) => {
      if (!product.synced) return 2;
      return (copy[product.id] ?? '').trim() ? 1 : 0;
    };
    return [...products].sort((a, b) => rank(a) - rank(b));
  }, [products, copy]);

  const current = useMemo(
    () => synced.find((p) => p.id === active) ?? synced[0] ?? null,
    [synced, active],
  );

  /** The paragraphs as the save will split them, which is what the page shows. */
  const paragraphsFor = useCallback((id: string) => paragraphsIn(copy[id] ?? ''), [copy]);

  /** Exactly what the product page's meta description will be. */
  const descriptionFor = useCallback(
    (product: EditorProduct) =>
      productMetaDescription({
        name: product.name,
        storeName,
        garment: product.garment,
        price: product.price,
        blurb: paragraphsIn(copy[product.id] ?? ''),
      }),
    [copy, storeName],
  );

  async function save() {
    if (!loaded) return;
    setBusy(true);
    setStatus(null);
    try {
      // Rebuilt from raw, so $comment and any unlisted product's copy survive.
      const next: Record<string, unknown> = { ...loaded.raw };
      for (const [id, text] of Object.entries(copy)) {
        const paragraphs = paragraphsIn(text);
        if (paragraphs.length) next[id] = paragraphs;
        else delete next[id];
      }

      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collection: 'store-copy',
          path: PATH,
          sha: loaded.sha,
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

  /**
   * Fetch Printful from the Worker and commit the catalogue.
   *
   * The product list on this page is baked at build time, so a sync that
   * changed something needs a deploy before the new product appears — which
   * is said out loud rather than left as a page that looks unchanged.
   */
  async function sync() {
    setSyncing(true);
    setSyncNote(null);
    try {
      const response = await fetch('/work/api/store-sync', { method: 'POST' });
      const data = (await response.json()) as {
        configured?: boolean;
        needs?: string[];
        synced?: boolean;
        changed?: boolean;
        products?: number;
        error?: string;
      };

      if (data.configured === false) {
        setSyncNote(`Not switched on — ${(data.needs ?? []).join(' and ')} not set.`);
        return;
      }
      if (!response.ok || !data.synced) {
        setSyncNote(data.error ?? `Sync failed (${response.status}).`);
        return;
      }
      setSyncNote(
        data.changed
          ? `Synced ${data.products} products and committed. Reload once the deploy lands, in about two minutes.`
          : `Synced — ${data.products} products, unchanged since the last sync.`,
      );
    } catch (error) {
      setSyncNote(error instanceof Error ? error.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  /**
   * Convert in the browser, then upload.
   *
   * Converted here rather than in the Worker for two reasons: a Worker has no
   * image decoder worth the name, and the thing that should be capped is what
   * lands in the repository — git keeps every version of a binary at full
   * size, so uploading a 9MB PNG twice is 18MB in the history for a picture
   * nobody sees at more than 1600px.
   */
  async function upload(product: EditorProduct, file: File) {
    setUploadingId(product.id);
    setStatus(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('no canvas context');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) =>
        // Alpha is kept: the store page draws art on a dark ground, and a
        // flattened white box is the exact problem store-art.mjs exists to fix.
        canvas.toBlob(resolve, 'image/webp', 0.9),
      );
      if (!blob) throw new Error('could not convert that image');
      if (blob.size > UPLOAD_LIMIT) {
        throw new Error(`still ${(blob.size / 1e6).toFixed(1)}MB after conversion — try a smaller source`);
      }

      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const content = btoa(binary);

      const path = `public/store/${product.id}-art.webp`;
      // Replacing needs the sha of what is there; a first upload has none.
      const head = await fetch(
        `/work/api/content?collection=store-art&path=${encodeURIComponent(path)}`,
        { cache: 'no-store' },
      );
      const existing = head.ok
        ? ((await head.json()) as { file?: { sha: string } | null }).file?.sha
        : undefined;

      const response = await fetch('/work/api/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ collection: 'store-art', path, content, sha: existing }),
      });
      const data = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) {
        throw new Error(data.error ?? `Upload failed (${response.status}).`);
      }

      // Shown from the local blob straight away. The committed file is not
      // served until the deploy finishes, and a broken tile for two minutes
      // would read as a failed upload.
      setUploads((before) => ({ ...before, [product.id]: URL.createObjectURL(blob) }));
      setStatus(`Uploaded art for ${product.name}. It reaches the site with the next deploy.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploadingId(null);
    }
  }

  if (loaded === null) {
    return <p className={styles.status}>{status ?? 'Reading the repo…'}</p>;
  }

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.counts}>
          <strong>{stats.total}</strong> products
          <span className={styles.sep}>·</span>
          {stats.written} written
          {stats.needWriting > 0 && (
            <>
              <span className={styles.sep}>·</span>
              <span className={styles.warn}>{stats.needWriting} need writing</span>
            </>
          )}
          {stats.unsynced > 0 && (
            <>
              <span className={styles.sep}>·</span>
              <span className={styles.muted}>{stats.unsynced} not synced</span>
            </>
          )}
          {dirty && <span className={styles.dirty}>unsaved</span>}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={() => void sync()} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync Printful'}
          </button>
          <button type="button" onClick={() => void save()} disabled={busy || !dirty}>
            {busy ? 'Working…' : 'Save'}
          </button>
        </div>
      </div>

      {/* A product synced into Printful today is not here until a rebuild, and
          an absence with no explanation reads as a bug. */}
      <p className={styles.fetched}>
        Product list baked at build time
        {fetchedAt ? `, from a catalogue fetched ${new Date(fetchedAt).toISOString().slice(0, 10)}` : ''}.
        Syncing commits a new one; the list here changes once that deploy lands.
      </p>
      {syncNote && <p className={styles.message}>{syncNote}</p>}

      <div className={styles.split}>
        <div className={styles.column}>
          {ordered.map((product) => {
            const paragraphs = paragraphsFor(product.id);
            const words = (copy[product.id] ?? '').trim()
              ? (copy[product.id] ?? '').trim().split(/\s+/).length
              : 0;
            const images = uploads[product.id]
              ? [
                  { key: 'pending', label: 'Uploaded (pending deploy)', src: uploads[product.id] },
                  ...product.images.filter((image) => image.key !== 'artwork'),
                ]
              : product.images;

            return (
              <article
                key={product.id}
                className={`${styles.product} ${product.id === current?.id ? styles.current : ''} ${
                  product.synced ? '' : styles.unsynced
                }`}
                onFocusCapture={() => product.synced && setActive(product.id)}
                onClick={() => product.synced && setActive(product.id)}
              >
                <header className={styles.productHead}>
                  <h2 className={styles.name}>
                    {product.name}
                    {product.synced ? (
                      <span className={styles.id}>{product.id}</span>
                    ) : (
                      <span className={styles.badge}>not synced</span>
                    )}
                  </h2>
                  <p className={styles.facts}>
                    {product.synced ? (
                      <>
                        {product.price ?? 'no price'}
                        <span className={styles.sep}>·</span>
                        {product.variantCount} variant{product.variantCount === 1 ? '' : 's'}
                        {product.href && (
                          <>
                            <span className={styles.sep}>·</span>
                            <a href={product.href} target="_blank" rel="noreferrer">
                              view page
                            </a>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {product.category}
                        <span className={styles.sep}>·</span>
                        <span className={styles.muted}>
                          a design, not a product yet — sync to write copy for it
                        </span>
                      </>
                    )}
                  </p>
                </header>

                {/* Every image this product has, and a tile to add one. */}
                <div className={styles.grid}>
                  {images.map((image) => (
                    <button
                      key={image.key}
                      type="button"
                      className={styles.tile}
                      onClick={() =>
                        setViewing({ src: image.src, label: image.label, product: product.name })
                      }
                      title={`${image.label} — click to inspect`}
                    >
                      <img src={image.src} alt={`${product.name} — ${image.label}`} loading="lazy" />
                      <span className={styles.tileLabel}>{image.label}</span>
                    </button>
                  ))}

                  {product.synced && (
                    <label className={styles.uploadTile}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          // Cleared so choosing the same file twice fires again.
                          event.target.value = '';
                          if (file) void upload(product, file);
                        }}
                      />
                      <span>{uploadingId === product.id ? 'Converting…' : '+ Upload art'}</span>
                    </label>
                  )}

                  {images.length === 0 && !product.synced && (
                    <p className={styles.noArt}>No art until it is synced.</p>
                  )}
                </div>

                {product.synced && (
                  <>
                    <textarea
                      id={`copy-${product.id}`}
                      className={styles.productText}
                      spellCheck
                      value={copy[product.id] ?? ''}
                      placeholder="No copy yet — the description falls back to the supplier's words about the blank."
                      onFocus={() => setActive(product.id)}
                      onChange={(event) => {
                        setCopy({ ...copy, [product.id]: event.target.value });
                        setDirty(true);
                      }}
                    />

                    <p className={styles.meta}>
                      {words} word{words === 1 ? '' : 's'}
                      <span className={styles.sep}>·</span>
                      {paragraphs.length} paragraph{paragraphs.length === 1 ? '' : 's'}
                    </p>

                    {/* Every line break becomes a paragraph on save, single or
                        double, so the splits are shown rather than left to be
                        discovered on the live page. */}
                    {paragraphs.length > 0 && (
                      <ol className={styles.splits}>
                        {paragraphs.map((paragraph, index) => (
                          <li key={index}>
                            <span className={styles.splitNumber}>{index + 1}</span>
                            {paragraph}
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </article>
            );
          })}

          {orphans.length > 0 && (
            <p className={styles.orphans}>
              {orphans.length} description{orphans.length === 1 ? '' : 's'} belong to products no longer
              in Printful and {orphans.length === 1 ? 'is' : 'are'} kept, not shown:{' '}
              {orphans.map((orphan) => `${orphan.id} (${orphan.words} words)`).join(', ')}. Saving
              never deletes them.
            </p>
          )}
        </div>

        {/* What the page will say, and how it scores. Sticky, because the
            writing column is long and this is the reason to look right. */}
        <aside className={styles.aside}>
          {current ? (
            <>
              <section className={styles.preview}>
                <h2 className={styles.previewHead}>How it will read</h2>
                <p className={styles.previewTitle}>
                  {current.name} — {siteName}
                </p>
                <p className={styles.previewUrl}>
                  masterroachi.com{current.href ?? `/store/${current.id}/`}
                </p>
                <p className={styles.previewDesc}>{descriptionFor(current)}</p>
                <p className={styles.previewNote}>
                  The search result. The description is your first paragraphs where you have written
                  any, and the supplier&rsquo;s facts where you have not.
                </p>

                <h3 className={styles.previewHead}>On the page</h3>
                {paragraphsFor(current.id).length > 0 ? (
                  <div className={styles.previewBody}>
                    {paragraphsFor(current.id).map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className={styles.previewEmpty}>
                    No section at all — the product page shows the garment and the price, and nothing
                    in your own words.
                  </p>
                )}
              </section>

              <SeoPanel
                input={{
                  kind: 'product',
                  title: `${current.name} — ${siteName}`,
                  description: descriptionFor(current),
                  body: copy[current.id] ?? '',
                  focus: current.name,
                  // Alt text on a product page is generated from the name, so
                  // it is never missing — reported honestly rather than
                  // omitted, so the check is visibly passing instead of absent.
                  images: current.images.map((image) => ({
                    alt: `${current.name} — ${image.label}`,
                  })),
                }}
              />
            </>
          ) : (
            <p className={styles.status}>Nothing synced yet, so there is nothing to preview.</p>
          )}
        </aside>
      </div>

      {status && <p className={styles.message}>{status}</p>}

      {viewing && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${viewing.product} — ${viewing.label}`}
          onClick={() => setViewing(null)}
        >
          <img src={viewing.src} alt={`${viewing.product} — ${viewing.label}`} />
          <p>
            {viewing.product} — {viewing.label}
            <span className={styles.dismiss}>click anywhere, or Esc</span>
          </p>
        </div>
      )}
    </>
  );
}
