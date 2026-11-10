'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { spineFor } from '@/lib/book-spine';
import BookSketch from './BookSketch';
import styles from './reading.module.css';

// The open books in front — his pick, 2026-11-10 (redesign page, Reading: A).
//
// The four states are open now, next, finished and put down, but they are not
// four equal shelves any more. What is being read comes first as cards with
// big covers, when it was started and what has been kept from it. Next stays a
// shelf of spines, so the bookcase look survives: a spine's thickness comes
// from its page count and its colour is derived from it, so the same book
// always looks the same and is findable by shape (lib/book-spine.ts).
// Finished (by year) and Put down fold away at the foot of the page, and open
// to their own spines.
//
// A spine tips out to show its cover on hover. A phone has no hover, so there
// the first tap tips it out and the second opens it.
//
// Clicking a book pulls it out: the book itself animates from where it
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

/** The two shelves folded away at the foot. Finished opens into years. */
const FOLDS: { status: Status; label: string }[] = [
  { status: 'read', label: 'Finished' },
  { status: 'abandoned', label: 'Put down' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-02' -> '2 Nov', with the year only when it is not this one. */
function shortDate(day: string): string {
  const text = `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1] ?? ''}`;
  return day.slice(0, 4) === String(new Date().getFullYear()) ? text : `${text} ${day.slice(0, 4)}`;
}

/** '4 quotes · 1 sketch', or nothing when nothing has been kept. */
function keptLine(quoteCount: number, sketchCount: number): string | null {
  const parts: string[] = [];
  if (quoteCount) parts.push(`${quoteCount} ${quoteCount === 1 ? 'quote' : 'quotes'}`);
  if (sketchCount) parts.push(`${sketchCount} ${sketchCount === 1 ? 'sketch' : 'sketches'}`);
  return parts.length ? parts.join(' · ') : null;
}

/** Cover art for a Calibre book. A hand-typed book has none. */
function coverUrl(book: Book): string | null {
  return book.calibre_id !== null ? `/work/api/book-cover?id=${book.calibre_id}` : null;
}

/**
 * A spine on a shelf, which tips out to show its cover.
 *
 * Top level rather than inside Reading, so a re-render keeps the same element
 * and the tip-out animates instead of the spine being rebuilt already turned.
 */
function Spine({
  book,
  gone,
  tipped,
  onTip,
  onOpen,
}: {
  book: Book;
  gone: boolean;
  tipped: boolean;
  onTip: (id: number) => void;
  onOpen: (book: Book, element: HTMLElement) => void;
}) {
  const [failed, setFailed] = useState(false);
  /** How the last press came, because only a touch needs the extra tap. */
  const pointer = useRef<string>('mouse');
  const spine = spineFor(book);
  // Cover art comes out of the Calibre library — see scripts/book-covers.mjs.
  // A book typed in by hand has none, and so does one whose cover has not been
  // generated yet, so the fallback is not an edge case: it is what The Odyssey
  // looks like.
  const art = failed ? null : coverUrl(book);
  // A book's proportions, so the cover that swings out is the width the
  // spine's height implies rather than an arbitrary rectangle.
  const coverWidth = Math.round(spine.height * 0.66);

  return (
    <button
      type="button"
      className={`${styles.slot} ${tipped ? styles.slotTipped : ''} ${gone ? styles.slotGone : ''}`}
      style={
        {
          width: spine.width,
          height: spine.height,
          '--spine-w': `${spine.width}px`,
          '--cover-w': `${coverWidth}px`,
        } as React.CSSProperties
      }
      title={`${book.title}${book.author ? ` — ${book.author}` : ''}`}
      aria-label={`${book.title}${book.author ? `, ${book.author}` : ''}`}
      onPointerDown={(event) => {
        pointer.current = event.pointerType;
      }}
      onClick={(event) => {
        // The tap equivalent of hover: a touch on a spine that is still
        // standing tips it out, and a touch on a tipped one opens it.
        if (pointer.current === 'touch' && !tipped) {
          onTip(book.id);
          return;
        }
        onOpen(book, event.currentTarget);
      }}
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

/**
 * A book being read, as a card with its cover face on: what it is, when it
 * was started, and what has been kept from it so far.
 */
function OpenCard({
  book,
  gone,
  quoteCount,
  sketchCount,
  onOpen,
}: {
  book: Book;
  gone: boolean;
  quoteCount: number;
  sketchCount: number;
  onOpen: (book: Book, element: HTMLElement) => void;
}) {
  const [failed, setFailed] = useState(false);
  const spine = spineFor(book);
  const art = failed ? null : coverUrl(book);
  const kept = keptLine(quoteCount, sketchCount);

  return (
    <button
      type="button"
      className={`${styles.openCard} ${gone ? styles.slotGone : ''}`}
      onClick={(event) => onOpen(book, event.currentTarget)}
    >
      <span
        className={`${styles.openCover} ${spine.light ? styles.blankLight : ''}`}
        style={art ? undefined : { background: spine.colour, borderColor: spine.edge }}
      >
        {art ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={art} alt="" loading="lazy" onError={() => setFailed(true)} />
        ) : (
          /* The generated blank cover: the derived colour and the title. */
          <>
            <span className={styles.blankTitle}>{book.title}</span>
            {book.author && <span className={styles.blankAuthor}>{book.author}</span>}
          </>
        )}
      </span>
      <span className={styles.openText}>
        <span className={styles.openTitle}>{book.title}</span>
        {book.author && <span className={styles.openAuthor}>{book.author}</span>}
        {book.started_on && (
          <span className={styles.openMeta}>Started {shortDate(book.started_on)}</span>
        )}
        {kept && <span className={styles.openMeta}>{kept}</span>}
      </span>
    </button>
  );
}

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

export default function Reading() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  const [quotes, setQuotes] = useState<Record<string, Quote[]>>({});
  const [notes, setNotes] = useState<Record<string, Note[]>>({});

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [addAs, setAddAs] = useState<Status>('want');
  const [adding, setAdding] = useState(false);
  /** The library index, fetched once and only when the card is opened. */
  const [library, setLibrary] = useState<LibraryBook[] | null>(null);
  const [picked, setPicked] = useState<LibraryBook | null>(null);
  /** Which of the folded shelves (Finished, Put down) are open. Both shut by
   *  default: they are the long ones, and the least looked at. */
  const [openShelves, setOpenShelves] = useState<Set<Status>>(new Set());
  /** The spine a touch has tipped out, waiting for the second tap. */
  const [tipped, setTipped] = useState<number | null>(null);
  const [quoteText, setQuoteText] = useState('');

  const [open, setOpen] = useState<number | null>(null);
  /** Where the clicked spine was, so the open book can start there. */
  const [from, setFrom] = useState<DOMRect | null>(null);
  const [settled, setSettled] = useState(false);
  const [draft, setDraft] = useState('');
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
      // The API still returns `today` (the server's date, not the browser's).
      // Nothing reads it since the per-year count came out on 2026-10-16; it is
      // two lines to put back when something needs a server-authoritative date.
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
  // NOTE: nothing calls this yet — it is waiting on a button, not on work. The
  // server half is live (`action: 'post'` in worker/index.ts), so this is a
  // finished feature with no trigger. Deliberately kept when the page's other
  // unused bindings were deleted on 2026-10-16.
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
    setTipped(null);
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
  const done = books.filter((b) => b.status === 'read');

  // Finished, by the year it was finished in — newest first, since the recent
  // year is the one being added to and the rest is a wall of older shelves.
  const byYear = new Map<string, Book[]>();
  for (const book of done) {
    const year = book.finished_on?.slice(0, 4) ?? 'undated';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(book);
  }
  const years = [...byYear.keys()].sort().reverse();

  /* A shelf of spines, bottoms aligned — they are not all the same height,
     which is most of what stops a row of them reading as a chart. */
  function shelf(list: Book[], empty: string) {
    if (list.length === 0) return <p className={styles.bare}>{empty}</p>;
    return (
      <div className={styles.grid}>
        {list.map((book) => (
          <Spine
            key={book.id}
            book={book}
            gone={open === book.id}
            tipped={tipped === book.id}
            onTip={setTipped}
            onOpen={pull}
          />
        ))}
      </div>
    );
  }

  const reading = books.filter((b) => b.status === 'reading');
  const next = books.filter((b) => b.status === 'want');

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

      {/* Open now's heading carries the round +, as the habits page uses —
          one control, shut until it is wanted, rather than a form standing
          open over a page that is read far more often than it is added to. */}
      <section className={styles.addSection}>
        <div className={styles.headRow}>
          <h2 className={styles.sectionNameGold}>
            Open now<span className={styles.count}>{reading.length}</span>
          </h2>
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
        </div>

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

      {/* What is being read, in front, with its cover face on. */}
      {reading.length === 0 ? (
        <p className={styles.bare}>Nothing open. Add a book with +, or open one from Next.</p>
      ) : (
        <div className={styles.openGrid}>
          {reading.map((book) => (
            <OpenCard
              key={book.id}
              book={book}
              gone={open === book.id}
              quoteCount={(quotes[String(book.id)] ?? []).length}
              sketchCount={(notes[String(book.id)] ?? []).length}
              onOpen={pull}
            />
          ))}
        </div>
      )}

      {/* Next stays a shelf of spines, so the bookcase look survives. */}
      <section className={styles.nextSection}>
        <h2 className={styles.sectionName}>
          Next<span className={styles.countMuted}>{next.length}</span>
        </h2>
        {shelf(next, 'Nothing next.')}
      </section>

      {/* Finished and Put down, folded away at the foot of the page. They are
          the long shelves and the least looked at, so each is a row that
          opens to its spines. */}
      <div className={styles.folds}>
        <div className={styles.foldRow}>
          {FOLDS.map(({ status, label }) => {
            const isOpen = openShelves.has(status);
            return (
              <button
                key={status}
                type="button"
                className={isOpen ? styles.foldOn : styles.fold}
                aria-expanded={isOpen}
                aria-controls={`shelf-${status}`}
                onClick={() => {
                  const after = new Set(openShelves);
                  if (after.has(status)) after.delete(status);
                  else after.add(status);
                  setOpenShelves(after);
                }}
              >
                <span>{label}</span>
                <span className={styles.countMuted}>
                  {books!.filter((book) => book.status === status).length}
                </span>
                <span className={styles.chevron} aria-hidden="true">
                  ›
                </span>
              </button>
            );
          })}
        </div>

        {FOLDS.map(({ status, label }) => {
          if (!openShelves.has(status)) return null;
          const list = books!.filter((book) => book.status === status);
          return (
            <section key={status} id={`shelf-${status}`} className={styles.foldBody}>
              <h2 className={styles.sectionName}>{label}</h2>
              {status === 'read' && years.length > 0
                ? /* Finished is the one shelf with a shape of its own: it
                     only grows, so it is grouped by the year it grew in. */
                  years.map((year) => (
                    <div key={year} className={styles.yearGroup}>
                      <h3 className={styles.yearName}>
                        {year === 'undated' ? 'No date' : year}
                        <span className={styles.countMuted}>{byYear.get(year)!.length}</span>
                      </h3>
                      {shelf(byYear.get(year)!, 'Nothing here.')}
                    </div>
                  ))
                : shelf(list, 'Nothing here.')}
            </section>
          );
        })}
      </div>

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
            // the 25px gutter on each side — or the whole window on a phone,
            // where the book fills the screen (the 720px breakpoint in the
            // CSS). It used to be scaled against a hardcoded 640x440 — the
            // panel's size when this was a small spread — so once the panel
            // grew, the book started the animation several times too large
            // and snapped down into place.
            style={
              settled || !from
                ? undefined
                : (() => {
                    const gutter = window.innerWidth <= 720 ? 0 : 50;
                    return {
                      transform: `translate(${from.left + from.width / 2 - window.innerWidth / 2}px, ${
                        from.top + from.height / 2 - window.innerHeight / 2
                      }px) scaleX(${Math.max(from.width / (window.innerWidth - gutter), 0.02)}) scaleY(${Math.max(
                        from.height / (window.innerHeight - gutter),
                        0.02,
                      )})`,
                    };
                  })()
            }
            role="dialog"
            aria-modal="true"
            aria-label={opened.title}
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

              {/* The two marks share the left corner, so the right one is
                  free for the close button — on a phone the book fills the
                  screen, there is no window round it to tap, and no Esc. */}
              <div className={styles.corner}>
                {mainGenre(opened.genre) && (
                  /* The genre, as a mark in the corner — it earns a place
                     once the input that set it has retired. */
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
              </div>

              <button
                type="button"
                className={styles.closeBook}
                aria-label="Close the book"
                title="Close (Esc)"
                onClick={close}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

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
                is left, its tools down the right. On a phone the pages stack:
                quotes, then the sketch, then its tools in a row under it. */}
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
