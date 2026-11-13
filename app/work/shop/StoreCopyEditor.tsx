'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SeoPanel from '@/components/SeoPanel';
import { productMetaDescription } from '@/lib/product-meta';
import { paragraphsIn } from '@/lib/seo-score';
import {
  CATEGORIES_KEY,
  emptyTags,
  inOrder,
  ORDER_KEY,
  PIECES_KEY,
  readCategories,
  readCopy,
  readOrder,
  readPieces,
  readTags,
  writeCopy,
  writeEntry,
  type Piece,
  type ProductCopy,
  type ProductTags,
  type Shelf,
} from '@/lib/product-copy';
import PagePreview from './PagePreview';
import ShelvesPanel from './ShelvesPanel';
import { PREVIEW_MESSAGE } from '@/components/LiveCopy';
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
// Five fields per product since 2026-10-19 (Shop step 4): a tagline, the
// description, the story behind the design, a fit-and-care note, and alt text
// for the art. All optional; lib/product-copy.ts owns the file's shape.
// `$order` is the order the public store shows; it is set by dragging a tile,
// or by the arrows in an open product.
//
// Laid out as his pick, 2026-11-10 (redesign page, Shop products: A): the
// products as tiles with their picture, in the store's order, with a gold !
// on any without a description; opening one shows the editor in place of the
// grid. On a computer that is the writing on the left and, on the right, what
// the page will actually say plus how it scores; on a phone the right column
// is behind a toggle below the fields. Save sits in a bar stuck to the foot
// of the pane, so it is in reach from anywhere. That pairing is the reason the meta
// description now prefers his own words (lib/product-meta.ts): while it was
// built only from the supplier's facts, nothing typed here could move a single
// SEO field, and a live score would have been a decoration.
//
// Dressed as the public site, his call, 2026-11-10 (design pass: the public
// site's styling, the CRM's desktop layout): the tiles are translucent panels
// with a hairline all round, in the app's accent where one needs words, and
// wider on a computer; the open product's fields and its preview are two
// panels side by side. The look is all in store.module.css. Per DESIGN.md
// (his rulings, 11 Nov 2026) a tile is a `card-link`, for the site's hover.
//
// Shelving since 2026-11-12, for Timon's pieces: each product also has a
// shelf, an artwork collection, an artist and the artist's share of the
// profit, and the shelves and collections themselves are edited from the
// toolbar. With a hundred-odd products the grid filters by either.

const PATH = 'content/store/copy.json';
/** Converted before upload, so the cap is about the WebP and not the source. */
const UPLOAD_LIMIT = 2_000_000;
/** Beyond this nothing on a product page gets better, and the file gets worse. */
const MAX_EDGE = 1600;
/** A catalogue older than this is flagged: prices and stock may have moved. */
const STALE_DAYS = 14;

/** One product's copy as the boxes hold it: paragraphs as one text each. */
interface Draft {
  tagline: string;
  description: string;
  story: string;
  care: string;
  alt: string;
}

const BLANK: Draft = { tagline: '', description: '', story: '', care: '', alt: '' };

function toDraft(copy: ProductCopy): Draft {
  return {
    tagline: copy.tagline,
    description: copy.description.join('\n\n'),
    story: copy.story.join('\n\n'),
    care: copy.care,
    alt: copy.alt,
  };
}

function fromDraft(draft: Draft | undefined): ProductCopy {
  return {
    tagline: draft?.tagline ?? '',
    description: paragraphsIn(draft?.description ?? ''),
    story: paragraphsIn(draft?.story ?? ''),
    care: draft?.care ?? '',
    alt: draft?.alt ?? '',
  };
}

export interface EditorProduct {
  id: string;
  name: string;
  href?: string;
  price?: string | null;
  garment?: string | null;
  variantCount: number;
  images: { key: string; label: string; src: string }[];
}

interface Loaded {
  raw: Record<string, unknown>;
  sha?: string;
}

/** Timon's share unless set otherwise: his 50/50, 12 Nov 2026. */
const DEFAULT_SHARE = 0.5;

/** What the grid shows: everything, one shelf or piece, or what is untagged. */
type Filter = { kind: 'all' } | { kind: 'shelf' | 'piece'; id: string } | { kind: 'untagged' };

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
  const [copy, setCopy] = useState<Record<string, Draft>>({});
  /** Shelf, collection, artist and share, per product id. */
  const [tags, setTags] = useState<Record<string, ProductTags>>({});
  const [categories, setCategories] = useState<Shelf[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  /** Whether the shelves-and-collections panel is out. */
  const [showShelves, setShowShelves] = useState(false);
  /** The saved store order, as ids. Products not in it follow, in Printful's order. */
  const [order, setOrder] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** The one product open in the editor. None by default: the page opens on the tiles. */
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  /** On a phone, whether the preview and SEO column under the fields is out. */
  const [showAside, setShowAside] = useState(false);
  /** The tile being dragged to a new place in the store, if any. */
  const [dragging, setDragging] = useState<string | null>(null);
  const editorRef = useRef<HTMLElement>(null);

  // An opened product starts at its top, not wherever the grid was scrolled.
  useEffect(() => {
    if (openProduct) editorRef.current?.scrollIntoView({ block: 'start' });
  }, [openProduct]);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  /** Which product's real page is open in the preview frame, if any. */
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  /** When Sync last ran, from D1. Later than fetchedAt whenever a sync found nothing new. */
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/work/api/store-sync', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { checkedAt?: string | null } | null) => {
        if (live && data?.checkedAt) setCheckedAt(data.checkedAt);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  /** Uploads made in this session, so a tile appears before the deploy lands. */
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
        const { file, configured } = (await response.json()) as {
          file?: { text: string; sha: string };
          configured?: boolean;
        };
        // No token answers 200 with { configured: false } and no file.
        if (configured === false || !file) throw new Error('Not connected. Set GITHUB_TOKEN as a Worker secret.');
        const parsed = JSON.parse(file.text) as Record<string, unknown>;
        if (!live) return;

        setLoaded({ raw: parsed, sha: file.sha });
        setCopy(
          Object.fromEntries(
            Object.entries(parsed)
              .filter(([key]) => !key.startsWith('$'))
              .map(([key, value]) => [key, toDraft(readCopy(value))]),
          ),
        );
        setTags(
          Object.fromEntries(
            Object.entries(parsed)
              .filter(([key]) => !key.startsWith('$'))
              .map(([key, value]) => [key, readTags(value)]),
          ),
        );
        setCategories(readCategories(parsed));
        setPieces(readPieces(parsed));
        setOrder(readOrder(parsed));
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

  /* Which products still need words — a description, which is the one field
   * the page is thin without. */
  const stats = useMemo(() => {
    const written = products.filter((p) => fromDraft(copy[p.id]).description.length > 0).length;
    return {
      total: products.length,
      written,
      needWriting: products.length - written,
    };
  }, [products, copy]);

  /* How long since the catalogue was last checked against Printful. The later
   * of the baked fetchedAt and the last sync: a sync that finds nothing new
   * commits nothing, so fetchedAt alone never moved and the warning never
   * cleared. */
  const staleDays = useMemo(() => {
    const times = [fetchedAt, checkedAt].filter(Boolean).map((t) => new Date(t as string).getTime());
    if (times.length === 0) return null;
    // eslint-disable-next-line react-hooks/purity -- an age is relative to now by definition
    const age = Math.floor((Date.now() - Math.max(...times)) / 86_400_000);
    return age > STALE_DAYS ? age : null;
  }, [fetchedAt, checkedAt]);

  /* Copy belonging to no listed product.
   *
   * Preserved on save and, until now, never shown. An id here means a product
   * was pulled from Printful or re-created with a new id, and its words are
   * sitting in the file doing nothing — worth knowing about, and not worth a
   * dialog. $comment is documentation, not copy. */
  const orphans = useMemo(() => {
    if (!loaded) return [];
    const listed = new Set(products.map((p) => p.id));
    return Object.entries(loaded.raw)
      .filter(([key]) => !key.startsWith('$') && !listed.has(key))
      .map(([key, value]) => {
        // Words only: the shelving keys are not anything he wrote.
        const words = Object.values(writeCopy(readCopy(value)) ?? {}).flat().join(' ').trim();
        return { id: key, words: words ? words.split(/\s+/).length : 0 };
      });
  }, [loaded, products]);

  /* In the store's own order, so a drag and the arrows move what they appear to move.
   *
   * This replaced "no copy first" (his earlier call) on 2026-10-19, when the
   * order became something this page sets: a list sorted by one rule cannot
   * also be the list you reorder. What still needs words is in the counts. */
  const ordered = useMemo(() => inOrder(products, (p) => p.id, order), [products, order]);

  /** The grid's tiles: the store's order, narrowed by the filter. */
  const shown = useMemo(() => {
    const tagsOf = (id: string) => tags[id] ?? emptyTags();
    if (filter.kind === 'all') return ordered;
    if (filter.kind === 'untagged') return ordered.filter((p) => !tagsOf(p.id).category || !tagsOf(p.id).piece);
    if (filter.kind === 'shelf') return ordered.filter((p) => tagsOf(p.id).category === filter.id);
    return ordered.filter((p) => tagsOf(p.id).piece === filter.id);
  }, [ordered, tags, filter]);

  /** How many products point at each shelf and each collection. */
  const uses = useMemo(() => {
    const shelf: Record<string, number> = {};
    const piece: Record<string, number> = {};
    for (const product of products) {
      const t = tags[product.id];
      if (t?.category) shelf[t.category] = (shelf[t.category] ?? 0) + 1;
      if (t?.piece) piece[t.piece] = (piece[t.piece] ?? 0) + 1;
    }
    return { shelf, piece };
  }, [products, tags]);

  /** One product's copy as the save will write it, which is what the page shows. */
  const copyFor = useCallback((id: string) => fromDraft(copy[id]), [copy]);

  function edit(id: string, field: keyof Draft, value: string) {
    setCopy({ ...copy, [id]: { ...BLANK, ...copy[id], [field]: value } });
    setDirty(true);
  }

  /**
   * Change one product's shelving.
   *
   * Choosing a collection whose piece has an artist fills the artist, and the
   * share where none is set, because a product of Timon's with no share is a
   * payout that silently comes to nothing. Both stay editable afterwards.
   */
  function tag(id: string, patch: Partial<ProductTags>) {
    const before = tags[id] ?? emptyTags();
    const next = { ...before, ...patch };
    if (patch.piece !== undefined) {
      const artist = pieces.find((p) => p.id === patch.piece)?.artist;
      if (artist && !before.artist) next.artist = artist;
    }
    // Not on an edit of the share itself, or clearing the box to retype it
    // would put 50 straight back.
    if (patch.artistShare === undefined && next.artist && next.artistShare === null) {
      next.artistShare = DEFAULT_SHARE;
    }
    setTags({ ...tags, [id]: next });
    setDirty(true);
  }

  /** Move one product up or down, and keep the whole order — every id. */
  function move(id: string, by: -1 | 1) {
    const ids = ordered.map((p) => p.id);
    const from = ids.indexOf(id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setOrder(ids);
    setDirty(true);
  }

  /** Put one product where another is, as a drag passes over it. */
  function place(id: string, over: string) {
    const ids = ordered.map((p) => p.id);
    const from = ids.indexOf(id);
    const to = ids.indexOf(over);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(from, 1);
    ids.splice(to, 0, id);
    setOrder(ids);
    setDirty(true);
  }

  /** Exactly what the product page's meta description will be. */
  const descriptionFor = useCallback(
    (product: EditorProduct) =>
      productMetaDescription({
        name: product.name,
        storeName,
        garment: product.garment,
        price: product.price,
        blurb: [copyFor(product.id).tagline, ...copyFor(product.id).description].filter(Boolean),
      }),
    [copyFor, storeName],
  );

  async function save() {
    if (!loaded) return;
    setBusy(true);
    setStatus(null);
    try {
      // Rebuilt from raw, so $comment and any unlisted product's copy survive.
      const next: Record<string, unknown> = { ...loaded.raw };
      // Every id with copy or with tags: a product tagged and never written
      // about is still an entry, and its copy is kept with its tags.
      for (const id of new Set([...Object.keys(copy), ...Object.keys(tags)])) {
        const written = writeEntry(fromDraft(copy[id]), tags[id] ?? emptyTags());
        if (written) next[id] = written;
        else delete next[id];
      }
      if (order.length) next[ORDER_KEY] = order;
      else delete next[ORDER_KEY];
      if (categories.length) next[CATEGORIES_KEY] = categories;
      else delete next[CATEGORIES_KEY];
      if (pieces.length) next[PIECES_KEY] = pieces.map((p) => (p.artist?.trim() ? p : { id: p.id, name: p.name }));
      else delete next[PIECES_KEY];

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
        checkedAt?: string;
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
      if (data.checkedAt) setCheckedAt(data.checkedAt);
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

  const current = openProduct ? ordered.find((p) => p.id === openProduct) ?? null : null;

  /** Every image a product has, with this session's upload in front. */
  function imagesOf(product: EditorProduct) {
    return uploads[product.id]
      ? [
          { key: 'pending', label: 'Uploaded (pending deploy)', src: uploads[product.id] },
          ...product.images.filter((image) => image.key !== 'artwork'),
        ]
      : product.images;
  }

  function wordsOf(id: string) {
    const draft = copy[id] ?? BLANK;
    return [draft.tagline, draft.description, draft.story, draft.care]
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function openOne(id: string) {
    setOpenProduct(id);
    setShowAside(false);
  }

  function backToAll() {
    const was = openProduct;
    setOpenProduct(null);
    // Back to its tile, so the keyboard and the eye both land where they left.
    if (was) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLButtonElement>(`[data-tile="${CSS.escape(was)}"] button`)?.focus(),
      );
    }
  }

  return (
    <div className={styles.products}>
      {current ? editor(current) : grid()}

      {/* Save, always in reach: stuck to the foot of the pane on the grid and
          in the editor alike, with what the last action said beside it. */}
      <div className={styles.saveBar}>
        <p className={styles.saveNote} role="status">
          {dirty && <span className={styles.dirty}>Unsaved</span>}
          {status ?? (dirty ? null : 'Everything is saved.')}
        </p>
        <button type="button" className={styles.save} onClick={() => void save()} disabled={busy || !dirty}>
          {busy ? 'Working…' : 'Save'}
        </button>
      </div>

      {previewing && (() => {
        const product = products.find((p) => p.id === previewing);
        return product?.href ? (
          <PagePreview
            href={product.href}
            name={product.name}
            type={PREVIEW_MESSAGE}
            payload={copyFor(product.id)}
            onClose={() => setPreviewing(null)}
          />
        ) : null;
      })()}

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
    </div>
  );

  /* The store as tiles, in its own order — his pick, 2026-11-10 (redesign
   * page, Shop products: A). Dragged by the grip to reorder, with pointer
   * events rather than HTML drag and drop, which a phone's browser does not
   * do reliably. The keyboard's way is the arrows in the open product. */
  function grid() {
    return (
      <>
        <div className={styles.toolbar}>
          <p className={styles.counts}>
            {stats.needWriting > 0 ? (
              <span className={styles.warn}>
                {stats.needWriting} need{stats.needWriting === 1 ? 's' : ''} a description
              </span>
            ) : (
              <span>Every product has its words</span>
            )}
            <span className={styles.sep}>·</span>
            <strong>{stats.total}</strong> product{stats.total === 1 ? '' : 's'}
          </p>
          <span className={styles.toolbarActions}>
            <select
              className={styles.filter}
              aria-label="Show"
              value={filter.kind === 'shelf' || filter.kind === 'piece' ? `${filter.kind}:${filter.id}` : filter.kind}
              onChange={(event) => {
                const [kind, id] = event.target.value.split(':');
                setFilter(
                  kind === 'shelf' || kind === 'piece'
                    ? { kind, id }
                    : kind === 'untagged'
                      ? { kind: 'untagged' }
                      : { kind: 'all' },
                );
              }}
            >
              <option value="all">Every product</option>
              <option value="untagged">Not shelved yet</option>
              <optgroup label="Shelf">
                {categories.map((c) => (
                  <option key={c.id} value={`shelf:${c.id}`}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Artwork">
                {pieces.map((p) => (
                  <option key={p.id} value={`piece:${p.id}`}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              type="button"
              className={styles.pill}
              aria-expanded={showShelves}
              onClick={() => setShowShelves(!showShelves)}
            >
              Shelves &amp; artworks
            </button>
            <button type="button" className={styles.pill} onClick={() => void sync()} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync Printful'}
            </button>
          </span>
        </div>

        {showShelves && (
          <div className={styles.shelvesWrap}>
            <ShelvesPanel
              title="Shelves"
              noun="shelf"
              items={categories}
              uses={uses.shelf}
              onChange={(next) => {
                setCategories(next);
                setDirty(true);
              }}
            />
            <ShelvesPanel
              title="Artworks"
              noun="artwork"
              items={pieces}
              uses={uses.piece}
              withArtist
              onChange={(next) => {
                setPieces(next);
                setDirty(true);
              }}
            />
          </div>
        )}

        {staleDays !== null && (
          <p className={styles.stale}>
            The catalogue is {staleDays} days old. Prices, sizes and stock on the store are as Printful had them
            then — sync before trusting them.
          </p>
        )}
        {syncNote && <p className={styles.message}>{syncNote}</p>}

        <ul className={styles.tiles}>
          {shown.map((product) => {
            const picture = imagesOf(product)[0];
            const shelf = categories.find((c) => c.id === tags[product.id]?.category)?.name;
            const piece = pieces.find((p) => p.id === tags[product.id]?.piece)?.name;
            // Gold where it waits on him: a product with no description.
            const needsWords = copyFor(product.id).description.length === 0;
            const words = wordsOf(product.id);
            return (
              <li
                key={product.id}
                data-tile={product.id}
                className={styles.tileItem}
                data-dragging={dragging === product.id || undefined}
              >
                <button
                  type="button"
                  className={`${styles.product} card-link`}
                  data-waiting={needsWords || undefined}
                  onClick={() => openOne(product.id)}
                >
                  <span className={styles.thumb}>
                    {picture ? (
                      <img src={picture.src} alt="" loading="lazy" />
                    ) : (
                      <span className={styles.thumbEmpty}>No picture</span>
                    )}
                  </span>
                  <span className={styles.productName}>
                    <span>{product.name}</span>
                    {needsWords ? (
                      <span className={styles.bang} aria-label="Needs words">
                        !
                      </span>
                    ) : (
                      <span className={styles.tick} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className={styles.productFacts}>
                    {product.price ?? 'no price'} · {product.variantCount} size
                    {product.variantCount === 1 ? '' : 's'}
                  </span>
                  <span className={styles.productFacts}>
                    {[shelf ?? 'No shelf', piece].filter(Boolean).join(' · ')}
                  </span>
                  <span className={needsWords ? styles.productStateGold : styles.productState}>
                    {needsWords ? 'Needs a description' : `${words} words`}
                  </span>
                </button>
                {shown.length > 1 && (
                  <span
                    className={styles.grip}
                    aria-hidden="true"
                    title="Drag to reorder"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDragging(product.id);
                    }}
                    onPointerMove={(event) => {
                      if (dragging !== product.id) return;
                      const over = document
                        .elementFromPoint(event.clientX, event.clientY)
                        ?.closest('[data-tile]')
                        ?.getAttribute('data-tile');
                      if (over && over !== product.id) place(product.id, over);
                    }}
                    onPointerUp={() => setDragging(null)}
                    onPointerCancel={() => setDragging(null)}
                  >
                    <svg viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" />
                      <circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" />
                      <circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {shown.length === 0 && <p className={styles.hint}>Nothing here.</p>}
        {ordered.length > 1 && (
          <p className={styles.hint}>Drag a tile by its handle to reorder the store, or open it and use the arrows.</p>
        )}

        {orphans.length > 0 && (
          <p className={styles.orphans}>
            {orphans.length} description{orphans.length === 1 ? '' : 's'} belong to products no longer
            in Printful and {orphans.length === 1 ? 'is' : 'are'} kept, not shown:{' '}
            {orphans.map((orphan) => `${orphan.id} (${orphan.words} words)`).join(', ')}. Saving
            never deletes them.
          </p>
        )}
      </>
    );
  }

  /* Where it sits, and who drew it. Above the words, because with a hundred
   * products the shelf is the first thing a new one needs. */
  function shelving(id: string) {
    const t = tags[id] ?? emptyTags();
    return (
      <fieldset className={styles.tags}>
        <legend className={styles.fieldName}>Shelf and artist</legend>
        <label className={styles.field}>
          <span className={styles.fieldName}>Shelf</span>
          <select className={styles.line} value={t.category} onChange={(event) => tag(id, { category: event.target.value })}>
            <option value="">— guessed from the name —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldName}>Artwork</span>
          <select className={styles.line} value={t.piece} onChange={(event) => tag(id, { piece: event.target.value })}>
            <option value="">— none —</option>
            {pieces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldName}>Artist</span>
          <input
            type="text"
            className={styles.line}
            value={t.artist}
            placeholder="None: your own work"
            onChange={(event) => tag(id, { artist: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldName}>Artist&rsquo;s share of the profit</span>
          <span className={styles.percent}>
            <input
              type="number"
              className={styles.line}
              min={0}
              max={100}
              step={1}
              disabled={!t.artist}
              value={t.artist && t.artistShare !== null ? Math.round(t.artistShare * 100) : ''}
              onChange={(event) => {
                const n = Number(event.target.value);
                tag(id, { artistShare: event.target.value === '' ? null : Math.min(100, Math.max(0, n)) / 100 });
              }}
            />
            %
          </span>
        </label>
      </fieldset>
    );
  }

  /* One product: today's editor, tidied for a phone (his pick, 2026-11-10,
   * Shop products: A). One column on a phone, with what the page will say and
   * how it scores behind a toggle; beside the fields from 900px up, as
   * before. */
  function editor(product: EditorProduct) {
    const draft = copy[product.id] ?? BLANK;
    const written = copyFor(product.id);
    const words = wordsOf(product.id);
    const images = imagesOf(product);
    const index = ordered.findIndex((p) => p.id === product.id);

    return (
      <section className={styles.editor} ref={editorRef} aria-label={product.name}>
        <div className={styles.editorHead}>
          <button type="button" className={styles.back} onClick={backToAll}>
            <span aria-hidden="true">‹</span> Products
          </button>
          <h2 className={styles.editorName}>{product.name}</h2>
          {/* The store's order, by keyboard as well as by dragging a tile. */}
          {ordered.length > 1 && (
            <div className={styles.move}>
              <span className={styles.moveAt}>
                {index + 1} of {ordered.length}
              </span>
              <button
                type="button"
                aria-label={`Move ${product.name} earlier in the store`}
                disabled={index === 0}
                onClick={() => move(product.id, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${product.name} later in the store`}
                disabled={index === ordered.length - 1}
                onClick={() => move(product.id, 1)}
              >
                ↓
              </button>
            </div>
          )}
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardMain}>
            <p className={styles.facts}>
              Printful {product.id}
              <span className={styles.sep}>·</span>
              {product.price ?? 'no price'} · {product.variantCount} size{product.variantCount === 1 ? '' : 's'}
              {product.href && (
                <>
                  <span className={styles.sep}>·</span>
                  <a href={product.href} target="_blank" rel="noreferrer">
                    the live page
                  </a>
                </>
              )}
            </p>

            {/* Every image this product has, and a tile to add one. */}
            <div className={styles.grid}>
              {images.map((image) => (
                <button
                  key={image.key}
                  type="button"
                  className={styles.tile}
                  onClick={() => setViewing({ src: image.src, label: image.label, product: product.name })}
                  title={`${image.label} — click to inspect`}
                >
                  <img src={image.src} alt={`${product.name} — ${image.label}`} loading="lazy" />
                  <span className={styles.tileLabel}>{image.label}</span>
                </button>
              ))}

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
                {uploadingId === product.id ? (
                  <span className={styles.uploadBusy}>Converting…</span>
                ) : (
                  <>
                    <span className={styles.plus} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                    <span className={styles.uploadLabel}>Upload art</span>
                  </>
                )}
              </label>
            </div>

            {shelving(product.id)}

            <label className={styles.field}>
              <span className={styles.fieldName}>Tagline</span>
              <input
                type="text"
                className={styles.line}
                spellCheck
                maxLength={140}
                value={draft.tagline}
                placeholder="One line under the name."
                onChange={(event) => edit(product.id, 'tagline', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldName}>Description</span>
              <textarea
                id={`copy-${product.id}`}
                className={styles.productText}
                spellCheck
                value={draft.description}
                placeholder="What the design is. Without it, the description falls back to the supplier's words about the blank."
                onChange={(event) => edit(product.id, 'description', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldName}>The story</span>
              <textarea
                className={`${styles.productText} ${styles.medium}`}
                spellCheck
                value={draft.story}
                placeholder="Where it came from. Its own section on the page; none at all if empty."
                onChange={(event) => edit(product.id, 'story', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldName}>Fit and care</span>
              <textarea
                className={`${styles.productText} ${styles.short}`}
                spellCheck
                value={draft.care}
                placeholder="How it fits and how to wash it. Shown above the size guide."
                onChange={(event) => edit(product.id, 'care', event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldName}>Alt text</span>
              <input
                type="text"
                className={styles.line}
                spellCheck
                maxLength={250}
                value={draft.alt}
                placeholder={`What the art shows. Falls back to "${product.name}".`}
                onChange={(event) => edit(product.id, 'alt', event.target.value)}
              />
            </label>

            <p className={styles.meta}>
              {words} word{words === 1 ? '' : 's'}
              <span className={styles.sep}>·</span>
              {written.description.length} description paragraph
              {written.description.length === 1 ? '' : 's'}
              {written.story.length > 0 && (
                <>
                  <span className={styles.sep}>·</span>
                  {written.story.length} story paragraph{written.story.length === 1 ? '' : 's'}
                </>
              )}
            </p>

            {product.href && (
              <button type="button" className={styles.previewOpen} onClick={() => setPreviewing(product.id)}>
                Preview the page
              </button>
            )}

            {/* Only on a phone: the column below is behind this. */}
            <button
              type="button"
              className={styles.asideToggle}
              aria-expanded={showAside}
              aria-controls={`aside-${product.id}`}
              onClick={() => setShowAside(!showAside)}
            >
              {showAside ? 'Hide how it will read' : 'How it will read, and its search score'}
            </button>
          </div>

          {/* What the page will say, and how it scores. Sticky beside the
              fields on a computer, because the fields column is long and this
              is the reason to look right; behind the toggle on a phone. */}
          <aside id={`aside-${product.id}`} className={styles.aside} data-shown={showAside || undefined}>
            <section className={styles.preview}>
              <h2 className={styles.previewHead}>How it will read</h2>
              <p className={styles.previewTitle}>
                {product.name} — {siteName}
              </p>
              <p className={styles.previewUrl}>masterroachi.com{product.href ?? `/store/${product.id}/`}</p>
              <p className={styles.previewDesc}>{descriptionFor(product)}</p>
              <p className={styles.previewNote}>
                The search result. The description is your first paragraphs where you have written any, and the
                supplier&rsquo;s facts where you have not.
              </p>

              <h3 className={styles.previewHead}>On the page</h3>
              {written.tagline && <p className={styles.previewTagline}>{written.tagline}</p>}
              {written.description.length > 0 ? (
                <div className={styles.previewBody}>
                  {written.description.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className={styles.previewEmpty}>
                  No description — the product page shows the garment and the price, and nothing in your own
                  words about the design.
                </p>
              )}
              {written.story.length > 0 && (
                <>
                  <h3 className={styles.previewHead}>The story</h3>
                  <div className={styles.previewBody}>
                    {written.story.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </>
              )}
              {written.care && (
                <>
                  <h3 className={styles.previewHead}>Fit and care</h3>
                  <div className={styles.previewBody}>
                    <p>{written.care}</p>
                  </div>
                </>
              )}
            </section>

            <SeoPanel
              input={{
                kind: 'product',
                title: `${product.name} — ${siteName}`,
                description: descriptionFor(product),
                body: [written.tagline, ...written.description, ...written.story, written.care]
                  .filter(Boolean)
                  .join('\n\n'),
                focus: product.name,
                // The product image's alt is his alt text where written and
                // the name otherwise, so it is never missing — reported as
                // what the page will actually carry.
                images: [{ alt: written.alt || product.name }],
              }}
            />
          </aside>
        </div>
      </section>
    );
  }
}
