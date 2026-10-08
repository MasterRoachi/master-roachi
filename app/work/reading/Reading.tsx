'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { spineFor } from '@/lib/book-spine';
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
}

const SHELVES: { status: Status; label: string }[] = [
  { status: 'reading', label: 'Open now' },
  { status: 'want', label: 'Next' },
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

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [addAs, setAddAs] = useState<Status>('want');

  const [open, setOpen] = useState<number | null>(null);
  /** Where the clicked spine was, so the open book can start there. */
  const [from, setFrom] = useState<DOMRect | null>(null);
  const [settled, setSettled] = useState(false);
  const [draft, setDraft] = useState('');
  const [openYears, setOpenYears] = useState<Set<string>>(new Set());

  const sheet = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/work/api/reading', { cache: 'no-store' });
      if (!response.ok) throw new Error(`could not read them (${response.status})`);
      const data = (await response.json()) as {
        configured: boolean;
        books: Book[];
        today: string;
      };
      setConfigured(data.configured);
      setBooks(data.books ?? []);
      setToday(data.today ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read them.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    setOpen(book.id);
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

  function Spine({ book }: { book: Book }) {
    const spine = spineFor(book);
    return (
      <button
        type="button"
        className={`${styles.spine} ${spine.light ? styles.spineLight : ''} ${
          open === book.id ? styles.spineGone : ''
        }`}
        style={{
          width: spine.width,
          height: spine.height,
          background: spine.colour,
          borderColor: spine.edge,
        }}
        title={`${book.title}${book.author ? ` — ${book.author}` : ''}`}
        onClick={(event) => pull(book, event.currentTarget)}
      >
        {/* Binding bands, which are most of what says "book" rather than
            "coloured rectangle". */}
        <span className={styles.band} />
        <span className={styles.spineText}>
          <span className={styles.spineTitle}>{book.title}</span>
          {book.author && <span className={styles.spineAuthor}>{book.author}</span>}
        </span>
        <span className={styles.band} />
      </button>
    );
  }

  function Shelf({ list, label }: { list: Book[]; label: string }) {
    return (
      <section className={styles.shelfBlock}>
        <h2>
          {label}
          <span className={styles.count}>{list.length}</span>
        </h2>
        <div className={styles.shelf}>
          <div className={styles.books}>
            {list.map((book) => (
              <Spine key={book.id} book={book} />
            ))}
          </div>
          {/* The board. Without it the spines are floating rectangles. */}
          <div className={styles.board} />
        </div>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {books.length > 0 && (
        <p className={styles.tally}>
          <strong>{finishedThisYear}</strong> finished in {thisYear}
          {reading.length > 0 && (
            <>
              {' · '}
              <strong>{reading.length}</strong> open
            </>
          )}
        </p>
      )}

      {SHELVES.map(({ status, label }) => {
        const list = books.filter((book) => book.status === status);
        // An empty Put down shelf is just a reminder of nothing. Open now and
        // Next stay, because an empty shelf there is a prompt.
        if (list.length === 0 && status === 'abandoned') return null;
        return <Shelf key={status} list={list} label={label} />;
      })}

      {years.map((year) => {
        const isOpen = openYears.has(year) || (openYears.size === 0 && year === thisYear);
        const group = byYear.get(year)!;
        return (
          <div key={year}>
            <button
              type="button"
              className={styles.yearPill}
              aria-expanded={isOpen}
              onClick={() => {
                const next = new Set(openYears.size === 0 ? [thisYear] : openYears);
                if (next.has(year)) next.delete(year);
                else next.add(year);
                setOpenYears(next.size === 0 ? new Set(['none']) : next);
              }}
            >
              <span>Finished {year === 'undated' ? '(no date)' : year}</span>
              <span className={styles.count}>{group.length}</span>
              <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <Shelf list={group} label="" />}
          </div>
        );
      })}

      {books.length === 0 && (
        <p className={styles.empty}>
          An empty bookcase. Add a book below — <em>Next</em> if it is waiting, or{' '}
          <em>Open now</em> if you have started it, which records today as the day you did.
        </p>
      )}

      <form
        className={styles.add}
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          void act({ action: 'add', title, author, status: addAs }).then(() => {
            setTitle('');
            setAuthor('');
          });
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" aria-label="Author" />
        <select value={addAs} aria-label="Shelf" onChange={(e) => setAddAs(e.target.value as Status)}>
          <option value="want">Next</option>
          <option value="reading">Open now</option>
          <option value="read">Finished</option>
        </select>
        <button type="submit" disabled={!title.trim()}>
          Add
        </button>
      </form>

      {/* --- the book, off the shelf and open ------------------------- */}
      {opened && (
        <div className={styles.overlay} onClick={close} role="presentation">
          <div
            ref={sheet}
            className={settled ? styles.bookOpen : styles.bookClosed}
            // The spine's measured position, as a transform away from where
            // the open book sits. Released a frame later, so the browser has
            // something to animate from.
            style={
              settled || !from
                ? undefined
                : {
                    transform: `translate(${from.left + from.width / 2 - window.innerWidth / 2}px, ${
                      from.top + from.height / 2 - window.innerHeight / 2
                    }px) scaleX(${Math.max(from.width / 640, 0.04)}) scaleY(${from.height / 440})`,
                  }
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.leftPage}>
              <h3>{opened.title}</h3>
              {opened.author && <p className={styles.byline}>{opened.author}</p>}

              <dl className={styles.facts}>
                {opened.started_on && (
                  <>
                    <dt>Started</dt>
                    <dd>{opened.started_on}</dd>
                  </>
                )}
                {opened.finished_on && (
                  <>
                    <dt>Finished</dt>
                    <dd>
                      {opened.finished_on}
                      {took(opened) !== null && (
                        <span className={styles.took}>
                          {took(opened) === 0 ? ' · in a day' : ` · in ${took(opened)}d`}
                        </span>
                      )}
                    </dd>
                  </>
                )}
                <dt>Pages</dt>
                <dd className={styles.pageInputs}>
                  <input
                    type="number"
                    min={0}
                    defaultValue={opened.page ?? ''}
                    aria-label="Current page"
                    onBlur={(event) => {
                      const value = Number(event.target.value);
                      if (value && value !== opened.page) {
                        void act({ action: 'update', id: opened.id, page: value });
                      }
                    }}
                  />
                  <span>of</span>
                  <input
                    type="number"
                    min={0}
                    defaultValue={opened.pages ?? ''}
                    aria-label="Total pages"
                    onBlur={(event) => {
                      const value = Number(event.target.value);
                      if (value && value !== opened.pages) {
                        void act({ action: 'update', id: opened.id, pages: value });
                      }
                    }}
                  />
                </dd>
                <dt>Rating</dt>
                <dd>
                  <span className={styles.stars}>
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
                  </span>
                </dd>
                <dt>Shelf</dt>
                <dd>
                  <select
                    value={opened.status}
                    aria-label="Shelf"
                    onChange={(event) =>
                      void act({ action: 'update', id: opened.id, status: event.target.value })
                    }
                  >
                    <option value="want">Next</option>
                    <option value="reading">Open now</option>
                    <option value="read">Finished</option>
                    <option value="abandoned">Put down</option>
                  </select>
                </dd>
              </dl>

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

            <div className={styles.rightPage}>
              <label htmlFor="thoughts">Thoughts</label>
              {/* Markdown, and said so, because this is meant to become a post
                  on the site later — see the note in page.tsx. Writing it as
                  prose now means there is nothing to convert then. */}
              <textarea
                id="thoughts"
                value={draft}
                placeholder="What it was like. Markdown."
                onChange={(event) => setDraft(event.target.value)}
              />
              <p className={styles.hint}>Kept when you close. Escape closes.</p>
            </div>

            <button type="button" className={styles.shut} onClick={close} aria-label="Close">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
