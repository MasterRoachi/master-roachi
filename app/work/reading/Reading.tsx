'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { spineFor } from '@/lib/book-spine';
import BookSketch from './BookSketch';
import styles from './reading.module.css';

// A bookcase.
//
// The shelves are the four states — open now, next, finished, put down — and a
// book stands on one as a spine whose thickness comes from its page count and
// whose colour is derived from it, so the same book always looks the same and
// is findable by shape before it is read. See lib/book-spine.ts.
//
// Clicking one pulls it off the shelf: the spine itself animates from where it
// stood to the middle of the screen, where it opens into two pages. That is a
// FLIP — the open book starts life transformed back onto the spine's measured
// position and is then released — which is the only way to make the movement
// start from the book that was actually clicked rather than from the centre of
// the window.

type Status = 'reading' | 'want' | 'read' | 'abandoned';

interface Book {
  id: number;
  title: string;
  author: string | null;
  status: Status;
  pages: number | null;
  page: number | null;
  started_on: string | null;
  finished_on: string | null;
  rating: number | null;
  notes: string | null;
  /** The post this book became, if it became one. Null is the normal state. */
  post_path: string | null;
  /** Which row of the Calibre library this is. Null for a hand-typed book. */
  calibre_id: number | null;
  series: string | null;
  series_index: number | null;
  genre: string | null;
  language: string | null;
  translator: string | null;
  /** 1 once the four facts are settled; the inputs then retire. */
  details_done: number;
}

interface Quote {
  id: number;
  book_id: number;
  text: string;
  page: number | null;
}

/** A sketchpad page kept against a book. The drawing is a file in the repo. */
interface Note {
  path: string;
  book_id: number;
  title: string;
}

/** A row of the Calibre index, from /work/api/library (D1 `library_books`). */
interface LibraryBook {
  id: number;
  title: string;
  authors: string | null;
  series: string | null;
  seriesIndex: number | null;
  genre: string | null;
  language: string | null;
  cover: number;
}

/** The shelves, as cards. Finished is the odd one: it opens into years. */
const SHELF_CARDS: { status: Status; label: string }[] = [
  { status: 'reading', label: 'Open now' },
  { status: 'want', label: 'Next' },
  { status: 'read', label: 'Finished' },
  { status: 'abandoned', label: 'Put down' },
];

/** How many library matches to draw. Three and a half thousand is a scroll. */
const MATCHES = 60;

/**
 * A face for the title, chosen by what the book is.
 *
 * Only the two faces the site already loads (Archivo and Reggae One) plus the
 * system serif and mono stacks — a per-genre webfont would be a network
 * request per book opened, for decoration. Matched on the first tag that
 * hits, because Calibre tags are a list and the first match is the one the
 * library sorted it under.
 */
const GENRE_FONTS: { test: RegExp; font: string }[] = [
  { test: /fantasy|sci|fiction|adventure|horror|comic|graphic|game/i, font: 'var(--font-display)' },
  { test: /histor|philosoph|relig|theolog|politic|classic|poetry|essay|biograph|war/i,
    font: 'ui-serif, Georgia, "Times New Roman", serif' },
  { test: /program|comput|software|technic|engineer|math|science|reference/i,
    font: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];

/** The first tag, which is the one Calibre sorted it under. */
function mainGenre(genre: string | null): string | null {
  const first = (genre ?? '').split(',')[0]?.trim();
  return first || null;
}

function fontFor(genre: string | null): string {
  if (!genre) return 'var(--font-sans)';
  return GENRE_FONTS.find(({ test }) => test.test(genre))?.font ?? 'var(--font-sans)';
}

/** '2026-10-08' -> ['8', 'oct'], for the little date dot. */
function dayDot(day: string): [string, string] {
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  return [String(Number(day.slice(8))), months[Number(day.slice(5, 7)) - 1] ?? ''];
}

/** The four facts, in the order they are asked. `send` is the API's name. */
const FACTS = [
  { key: 'series' as const, label: 'Series', send: 'series' },
  { key: 'genre' as const, label: 'Genre', send: 'genre' },
  { key: 'language' as const, label: 'Language', send: 'language' },
  { key: 'translator' as const, label: 'Translator', send: 'translator' },
];

const SHELF_PILLS: { status: Status; label: string }[] = [
  { status: 'reading', label: 'Open now' },
  { status: 'want', label: 'Next' },
  { status: 'read', label: 'Finished' },
  { status: 'abandoned', label: 'Put down' },
];

/** Days from start to finish, when both are known. The reason both are stored. */
function took(book: Book): number | null {
  if (!book.started_on || !book.finished_on) return null;
  const days = Math.round(
    (Date.parse(`${book.finished_on}T00:00:00Z`) - Date.parse(`${book.started_on}T00:00:00Z`)) /
      86_400_000,
  );
  return days >= 0 ? days : null;
}

export default function Reading() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [today, setToday] = useState('');

  const [quotes, setQuotes] = useState<Record<string, Quote[]>>({});
  const [notes, setNotes] = useState<Record<string, Note[]>>({});

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [addAs, setAddAs] = useState<Status>('want');
  const [adding, setAdding] = useState(false);
  /** The library index, fetched once and only when the card is opened. */
  const [library, setLibrary] = useState<LibraryBook[] | null>(null);
  const [picked, setPicked] = useState<LibraryBook | null>(null);
  /** Which shelf cards are open. None by default: the page is a row of spines
   *  that have not been pulled out yet. */
  const [openShelves, setOpenShelves] = useState<Set<Status>>(new Set(['reading']));
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');

  const [open, setOpen] = useState<number | null>(null);
  /** Where the clicked spine was, so the open book can start there. */
  const [from, setFrom] = useState<DOMRect | null>(null);
  const [settled, setSettled] = useState(false);
  const [draft, setDraft] = useState('');
  const [openYears, setOpenYears] = useState<Set<string>>(new Set());
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState<string | null>(null);

  const sheet = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/work/api/reading', { cache: 'no-store' });
      if (!response.ok) throw new Error(`could not read them (${response.status})`);
      const data = (await response.json()) as {
        configured: boolean;
        books: Book[];
        quotes?: Record<string, Quote[]>;
        notes?: Record<string, Note[]>;
        today: string;
      };
      setConfigured(data.configured);
      setBooks(data.books ?? []);
      setQuotes(data.quotes ?? {});
      setNotes(data.notes ?? {});
      setToday(data.today ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read them.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* The Calibre index — 3,623 books and about 600 kB, so it is fetched when
     the add card is first opened and never on page load.

     It comes from D1 through /work/api/library, not from a file. It was
     public/work/library.json until 2026-10-14: Access gated it when served,
     and the public GitHub repository published a listing of everything he
     owns anyway, so it was never committed and this fetch 404ed in
     production. Written by `npm run library` from ~/Media/Books/metadata.db;
     see migration 0014. */
  useEffect(() => {
    if (!adding || library) return;
    let live = true;
    (async () => {
      try {
        const response = await fetch('/work/api/library', { cache: 'force-cache' });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { books: LibraryBook[] };
        if (live) setLibrary(data.books ?? []);
      } catch {
        // Not an error worth a banner: the library is a convenience, and
        // typing a title in by hand still works without it.
        if (live) setLibrary([]);
      }
    })();
    return () => {
      live = false;
    };
  }, [adding, library]);

  // Released on the frame after mount, so the browser has a start position to
  // animate FROM. Setting both in one frame would show no movement at all.
  useEffect(() => {
    if (open === null) return;
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function act(body: Record<string, unknown>) {
    const response = await fetch('/work/api/reading', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const { error: why } = (await response.json().catch(() => ({}))) as { error?: string };
      setError(why ?? `Failed (${response.status}).`);
      return;
    }
    setError(null);
    await load();
  }

  function pull(book: Book, element: HTMLElement) {
    setFrom(element.getBoundingClientRect());
    setDraft(book.notes ?? '');
    setSettled(false);
    setPosted(null);
    setOpen(book.id);
  }

  /**
   * The notes, as a draft post on the site.
   *
   * The note is saved first. Otherwise the post is built from whatever was
   * last stored rather than from what is on the screen, and the two would
   * differ by exactly the paragraph just typed.
   */
  async function makePost(book: Book) {
    setPosting(true);
    try {
      if (draft !== (book.notes ?? '')) {
        await act({ action: 'update', id: book.id, notes: draft });
      }
      const response = await fetch('/work/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'post', id: book.id }),
      });
      const data = (await response.json()) as {
        posted?: boolean;
        already?: boolean;
        path?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? `Failed (${response.status}).`);
        return;
      }
      setPosted(data.path ?? null);
      await load();
    } finally {
      setPosting(false);
    }
  }

  function close() {
    // The note is kept on the way out rather than behind a button: it was
    // typed, which is intent enough, and losing a paragraph to a stray Escape
    // is the only real way to be annoyed by this screen.
    const book = books?.find((b) => b.id === open);
    if (book && draft !== (book.notes ?? '')) {
      void act({ action: 'update', id: book.id, notes: draft });
    }
    setSettled(false);
    setOpen(null);
  }

  if (error && !books) return <p className={styles.status}>{error}</p>;
  if (!books) return <p className={styles.status}>Reading…</p>;
  if (!configured) {
    return (
      <p className={styles.status}>
        Not set up — the <code>DB</code> binding is missing.
      </p>
    );
  }

  const opened = books.find((book) => book.id === open) ?? null;
  const bannerArt =
    opened?.calibre_id != null ? `/work/api/book-cover?id=${opened.calibre_id}` : null;
  const thisYear = today.slice(0, 4);
  const done = books.filter((b) => b.status === 'read');
  const finishedThisYear = done.filter((b) => b.finished_on?.startsWith(thisYear)).length;
  const reading = books.filter((b) => b.status === 'reading');

  // Finished, by the year it was finished in — newest first, since the recent
  // year is the one being added to and the rest is a wall of older shelves.
  const byYear = new Map<string, Book[]>();
  for (const book of done) {
    const year = book.finished_on?.slice(0, 4) ?? 'undated';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(book);
  }
  const years = [...byYear.keys()].sort().reverse();

  function Cover({ book }: { book: Book }) {
    const [failed, setFailed] = useState(false);
    const spine = spineFor(book);
    // Cover art comes out of the Calibre library at build time — see
    // scripts/book-covers.mjs. A book typed in by hand has none, and so does
    // one whose cover has not been generated yet, so the fallback is not an
    // edge case: it is what The Odyssey looks like.
    const art = book.calibre_id !== null && !failed
      ? `/work/api/book-cover?id=${book.calibre_id}`
      : null;
    // A book's proportions, so the cover that swings out is the width the
    // spine's height implies rather than an arbitrary rectangle.
    const coverWidth = Math.round(spine.height * 0.66);

    return (
      <button
        type="button"
        className={`${styles.slot} ${open === book.id ? styles.slotGone : ''}`}
        style={
          {
            width: spine.width,
            height: spine.height,
            '--spine-w': `${spine.width}px`,
            '--cover-w': `${coverWidth}px`,
          } as React.CSSProperties
        }
        title={`${book.title}${book.author ? ` — ${book.author}` : ''}`}
        onClick={(event) => pull(book, event.currentTarget)}
      >
        {/* Two faces of one object, turned together. transform-origin is the
            left edge, so the book pivots on its spine the way it would if you
            hooked a finger over the top and tipped it out.
            The cover lies back into the shelf, where the body of the book
            actually is, so its face points right — which is the front cover.
            The CSS turns it minus ninety and shifts it left, so it lands
            centred over where the book stood. */}
        <span className={styles.book3d}>
          <span
            className={`${styles.spineFace} ${spine.light ? styles.spineLight : ''}`}
            style={{ background: spine.colour, borderColor: spine.edge }}
          >
            <span className={styles.band} />
            <span className={styles.spineText}>
              <span className={styles.spineTitle}>{book.title}</span>
              {book.author && <span className={styles.spineAuthor}>{book.author}</span>}
            </span>
            <span className={styles.band} />
          </span>

          <span
            className={`${styles.coverFace} ${spine.light ? styles.blankLight : ''}`}
            style={art ? undefined : { background: spine.colour, borderColor: spine.edge }}
          >
            {art ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={art} alt="" loading="lazy" onError={() => setFailed(true)} />
            ) : (
              <>
                <span className={styles.blankTitle}>{book.title}</span>
                {book.author && <span className={styles.blankAuthor}>{book.author}</span>}
              </>
            )}
          </span>
        </span>
      </button>
    );
  }

  /* A grid of books. The grey board is gone (14 Oct): with cover art the
     books are the thing, and a shelf drawn under them was furniture. */
  function Grid({ list }: { list: Book[] }) {
    if (list.length === 0) return <p className={styles.bare}>Nothing here.</p>;
    return (
      <div className={styles.grid}>
        {list.map((book) => (
          <Cover key={book.id} book={book} />
        ))}
      </div>
    );
  }

  /** Library matches for what has been typed. Empty query browses the lot. */
  const matches = (() => {
    if (!library) return [];
    const q = title.trim().toLowerCase();
    const shelved = new Set(books!.map((b) => b.calibre_id).filter((id) => id !== null));
    const pool = library.filter((b) => !shelved.has(b.id));
    if (!q) return pool.slice(0, MATCHES);
    return pool
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.authors ?? '').toLowerCase().includes(q),
      )
      .slice(0, MATCHES);
  })();

  function take(book: LibraryBook) {
    setPicked(book);
    setTitle(book.title);
    setAuthor(book.authors ?? '');
  }

  /**
   * Save one of the four facts, and offer to retire them once all four hold
   * something.
   *
   * The prompt is the point: hiding the inputs is one-way (migration 0013
   * only ever sets the flag), so it is asked for rather than inferred from
   * the last field happening to be filled.
   */
  function settle(book: Book, send: string, value: string) {
    const was = ((book as unknown as Record<string, string | null>)[send] ?? '');
    if (value.trim() === was.trim()) return;

    const after = { ...book, [send]: value.trim() } as unknown as Record<string, string | null>;
    const all = FACTS.every((fact) => (after[fact.send] ?? '').trim());

    if (all && book.details_done !== 1) {
      if (confirm('All four are filled. Settle them and put the inputs away?')) {
        void act({ action: 'update', id: book.id, [send]: value, detailsDone: true });
        return;
      }
    }
    void act({ action: 'update', id: book.id, [send]: value });
  }

  function clearPick() {
    setPicked(null);
    setTitle('');
    setAuthor('');
  }

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {/* Adding, as the round + the habits page uses — one control, shut
          until it is wanted, rather than a form standing open under a page
          that is read far more often than it is added to. */}
      <section className={styles.addSection}>
        <button
          type="button"
          className={adding ? styles.addToggleOn : styles.addToggle}
          aria-expanded={adding}
          aria-label={adding ? 'Close' : 'Add a book'}
          title={adding ? 'Close' : 'Add a book'}
          onClick={() => setAdding((was) => !was)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {adding && (
          <form
            className={styles.addCard}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setAdding(false);
            }}
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) return;
              void act({
                action: 'add',
                title,
                author,
                status: addAs,
                // Everything the library knows travels with the book. A
                // hand-typed one sends none of it and that is normal.
                calibreId: picked?.id ?? null,
                series: picked?.series ?? null,
                seriesIndex: picked?.seriesIndex ?? null,
                genre: picked?.genre ?? null,
                language: picked?.language ?? null,
              }).then(() => {
                clearPick();
                setAdding(false);
              });
            }}
          >
            <div className={styles.addRow}>
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  // Typing after picking means the pick no longer describes
                  // what is in the box, so the library metadata goes with it.
                  if (picked) setPicked(null);
                }}
                placeholder="Search the library, or type a title"
                aria-label="Title, or a library search"
                autoFocus
              />
              <select
                value={addAs}
                aria-label="Shelf"
                onChange={(event) => setAddAs(event.target.value as Status)}
              >
                <option value="want">Next</option>
                <option value="reading">Open now</option>
                <option value="read">Finished</option>
              </select>
            </div>

            <input
              className={styles.addAuthor}
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Author"
              aria-label="Author"
            />

            {picked ? (
              /* What was taken from the library, said plainly — the fields
                 behind it (series, genre, language) are not on the form, so
                 without this the extra data would arrive invisibly. */
              <p className={styles.picked}>
                From the library
                {picked.series && <> · {picked.series} {picked.seriesIndex ?? ''}</>}
                {picked.genre && <> · {picked.genre.split(', ')[0]}</>}
                {picked.language && <> · {picked.language}</>}
                <button type="button" onClick={clearPick}>
                  clear
                </button>
              </p>
            ) : (
              <div className={styles.results}>
                {library === null && <p className={styles.bare}>Reading the library…</p>}
                {library?.length === 0 && (
                  <p className={styles.bare}>
                    No library index. Run <code>npm run library</code>.
                  </p>
                )}
                {matches.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className={styles.result}
                    onClick={() => take(book)}
                  >
                    <span className={styles.resultTitle}>{book.title}</span>
                    {book.authors && (
                      <span className={styles.resultAuthor}>{book.authors}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button type="submit" className={styles.addGo} disabled={!title.trim()}>
              Add
            </button>
          </form>
        )}
      </section>

      {/* One card per shelf, shut. The bookcase used to put every shelf on
          screen at once, which made the page as long as the collection. */}
      {SHELF_CARDS.map(({ status, label }) => {
        const list = books!.filter((book) => book.status === status);
        const isOpen = openShelves.has(status);

        return (
          <section key={status} className={isOpen ? styles.shelfOpen : styles.shelfCard}>
            <button
              type="button"
              className={styles.shelfPill}
              aria-expanded={isOpen}
              onClick={() => {
                const next = new Set(openShelves);
                if (next.has(status)) next.delete(status);
                else next.add(status);
                setOpenShelves(next);
              }}
            >
              <span>{label}</span>
            </button>

            {isOpen && (
              <div className={styles.shelfBody}>
                {status === 'read' && years.length > 0 ? (
                  /* Finished is the one shelf with a shape of its own: it
                     only grows, so it is grouped by the year it grew in. */
                  years.map((year) => (
                    <div key={year} className={styles.yearGroup}>
                      <h3 className={styles.yearName}>
                        {year === 'undated' ? 'No date' : year}
                        <span className={styles.count}>{byYear.get(year)!.length}</span>
                      </h3>
                      <Grid list={byYear.get(year)!} />
                    </div>
                  ))
                ) : (
                  <Grid list={list} />
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* --- the book, off the shelf and open ------------------------- */}
      {opened && (
        <div className={styles.overlay} onClick={close} role="presentation">
          <div
            ref={sheet}
            className={settled ? styles.bookOpen : styles.bookClosed}
            // The spine's measured position, as a transform away from where
            // the open book sits. Released a frame later, so the browser has
            // something to animate from.
            //
            // Scaled against the PANEL'S OWN size, which is the window less
            // the 25px gutter on each side. It used to be scaled against a
            // hardcoded 640x440 — the panel's size when this was a small
            // spread — so once the panel grew, the book started the animation
            // several times too large and snapped down into place.
            style={
              settled || !from
                ? undefined
                : {
                    transform: `translate(${from.left + from.width / 2 - window.innerWidth / 2}px, ${
                      from.top + from.height / 2 - window.innerHeight / 2
                    }px) scaleX(${Math.max(from.width / (window.innerWidth - 50), 0.02)}) scaleY(${Math.max(
                      from.height / (window.innerHeight - 50),
                      0.02,
                    )})`,
                  }
            }
            onClick={(event) => event.stopPropagation()}
          >
            {/* The head of the page: what the book IS. One block, no rule
                under it and nothing of its own to scroll — it runs straight
                into the work below it, because it is one page.
                The banner runs the whole height of it, so the controls sit
                on the book's own cover rather than on grey. */}
            <div className={styles.topMatter}>
              <span
                className={styles.bannerBed}
                style={{ background: spineFor(opened).colour }}
                aria-hidden="true"
              >
                {bannerArt && (
                  /* The cover, blurred and bled out. A cover is the only art
                     a book reliably has. */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img className={styles.bannerArt} src={bannerArt} alt="" />
                )}
                <span className={styles.bannerShade} />
              </span>

              {mainGenre(opened.genre) && (
                /* The genre, as a mark in the corner — it earns a place once
                   the input that set it has retired. */
                <span className={styles.genreMark} title={opened.genre ?? ''}>
                  {mainGenre(opened.genre)}
                </span>
              )}

              {opened.started_on && (
                /* Small, and a dot rather than a line of prose: when it was
                   started is worth a glance and never a sentence. */
                <span className={styles.started} title={`Started ${opened.started_on}`}>
                  <span className={styles.startedDay}>{dayDot(opened.started_on)[0]}</span>
                  <span className={styles.startedMonth}>{dayDot(opened.started_on)[1]}</span>
                </span>
              )}

              <div className={styles.bannerText}>
                <h3
                  className={styles.bookTitle}
                  style={{ fontFamily: fontFor(opened.genre) }}
                >
                  {opened.title}
                </h3>
                {opened.author && <p className={styles.bookAuthor}>{opened.author}</p>}
                {opened.series && (
                  <p className={styles.bookSeries}>
                    {opened.series}
                    {opened.series_index ? ` · ${opened.series_index}` : ''}
                  </p>
                )}
              </div>

              {/* A narrow column down the middle. The controls are small and
                  few; run full width they read as a form, which is what this
                  deliberately is not. */}
              <div className={styles.controls}>
                {opened.details_done !== 1 && (
                  /* Setup, once. Filling all four and confirming retires them
                     for this book — see migration 0013. */
                  <div className={styles.fields}>
                    {FACTS.map(({ key, label, send }) => (
                      <label key={key}>
                        <span>{label}</span>
                        <input
                          defaultValue={(opened[key] as string | null) ?? ''}
                          placeholder="—"
                          onBlur={(event) => settle(opened, send, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                )}

                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={(opened.rating ?? 0) >= n ? styles.starOn : styles.starOff}
                      aria-label={`${n} out of 5`}
                      onClick={() =>
                        void act({
                          action: 'update',
                          id: opened.id,
                          rating: opened.rating === n ? null : n,
                        })
                      }
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* The shelf, as four pills. A dropdown hid three of the four
                    answers behind a click; this says what the choices are. */}
                <div className={styles.shelfPills}>
                  {SHELF_PILLS.map(({ status, label }) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={opened.status === status}
                      className={opened.status === status ? styles.shelfOn : styles.shelfOff}
                      onClick={() =>
                        opened.status !== status &&
                        void act({ action: 'update', id: opened.id, status })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* The work: what was kept, and the page it was kept on.
                Quotes on the left, the sketch in the middle taking whatever
                is left, its tools down the right. */}
            <div className={styles.workArea}>
              <div className={styles.quoteColumn}>
                <ul className={styles.quotes}>
                  {(quotes[String(opened.id)] ?? []).map((quote) => (
                    <li key={quote.id}>
                      <blockquote>{quote.text}</blockquote>
                      <span className={styles.quoteFoot}>
                        {quote.page !== null && <span>p.{quote.page}</span>}
                        <button
                          type="button"
                          aria-label="Remove this quote"
                          title="Remove"
                          onClick={() => void act({ action: 'quote-remove', quoteId: quote.id })}
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))}

                  {/* The last entry is the next quote. Type it, press Enter,
                      and it asks the page — one field rather than a form,
                      because a quote is one thing. */}
                  <li className={styles.quoteNew}>
                    <input
                      value={quoteText}
                      placeholder="A quote…"
                      aria-label="A quote"
                      onChange={(event) => setQuoteText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' || !quoteText.trim()) return;
                        event.preventDefault();
                        const page = prompt('Page?');
                        // Cancel means cancel the page, not the quote: the
                        // page is the optional half of this.
                        const n = page && Number(page) > 0 ? Number(page) : null;
                        void act({
                          action: 'quote-add',
                          id: opened.id,
                          text: quoteText,
                          page: n,
                        }).then(() => setQuoteText(''));
                      }}
                    />
                  </li>
                </ul>
              </div>

              <BookSketch
                key={opened.id}
                bookId={opened.id}
                bookTitle={opened.title}
                notePath={(notes[String(opened.id)] ?? [])[0]?.path ?? null}
                onSaved={() => void load()}
              />
            </div>

            <button
              type="button"
              className={styles.removeBook}
              onClick={() => {
                if (confirm(`Remove "${opened.title}" entirely?`)) {
                  setOpen(null);
                  void act({ action: 'remove', id: opened.id });
                }
              }}
            >
              Remove this book
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
