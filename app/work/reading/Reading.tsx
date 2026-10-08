'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './reading.module.css';

// What is open, what is next, what was finished, and what was put down.
//
// The four are not four of the same thing. Open now is one or two books being
// actively read and wants room — the page number, the progress, a thought
// about it. Next is a queue and wants to be compact. Finished is an archive
// that grows for years, so it is grouped by the year it was finished in, the
// way the habit grid is grouped by month. Put down is small and stays shut
// until there is something in it.

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

/** Days from start to finish, when both are known. The reason both are stored. */
function took(book: Book): number | null {
  if (!book.started_on || !book.finished_on) return null;
  const days = Math.round(
    (Date.parse(`${book.finished_on}T00:00:00Z`) - Date.parse(`${book.started_on}T00:00:00Z`)) /
      86_400_000,
  );
  return days >= 0 ? days : null;
}

function Stars({
  rating,
  onPick,
}: {
  rating: number | null;
  onPick: (value: number | null) => void;
}) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={(rating ?? 0) >= n ? styles.starOn : styles.starOff}
          aria-label={`${n} out of 5`}
          // Clicking the current rating clears it, so a mis-tap is undoable.
          onClick={() => onPick(rating === n ? null : n)}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export default function Reading() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [today, setToday] = useState('');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [addAs, setAddAs] = useState<Status>('want');

  const [noting, setNoting] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [openYears, setOpenYears] = useState<Set<string>>(new Set());
  const [showPutDown, setShowPutDown] = useState(false);

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

  if (error && !books) return <p className={styles.status}>{error}</p>;
  if (!books) return <p className={styles.status}>Reading…</p>;
  if (!configured) {
    return (
      <p className={styles.status}>
        Not set up — the <code>DB</code> binding is missing.
      </p>
    );
  }

  const open = books.filter((b) => b.status === 'reading');
  const next = books.filter((b) => b.status === 'want');
  const done = books.filter((b) => b.status === 'read');
  const putDown = books.filter((b) => b.status === 'abandoned');

  const thisYear = today.slice(0, 4);
  const finishedThisYear = done.filter((b) => b.finished_on?.startsWith(thisYear)).length;

  // Finished, by the year it was finished in. Newest first, because the recent
  // year is the one being added to and the rest is archive.
  const byYear = new Map<string, Book[]>();
  for (const book of done) {
    const year = book.finished_on?.slice(0, 4) ?? 'undated';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(book);
  }
  const years = [...byYear.keys()].sort().reverse();

  const statusSelect = (book: Book) => (
    <select
      value={book.status}
      aria-label={`Shelf for ${book.title}`}
      className={styles.shelf}
      onChange={(event) => void act({ action: 'update', id: book.id, status: event.target.value })}
    >
      <option value="want">Next</option>
      <option value="reading">Open now</option>
      <option value="read">Finished</option>
      <option value="abandoned">Put down</option>
    </select>
  );

  const remove = (book: Book) => (
    <button
      type="button"
      className={styles.remove}
      title="Remove — for a mistyped entry. Giving up on it is Put down."
      onClick={() => {
        if (confirm(`Remove "${book.title}" entirely?`)) {
          void act({ action: 'remove', id: book.id });
        }
      }}
    >
      ×
    </button>
  );

  const notes = (book: Book) =>
    noting === book.id ? (
      <div className={styles.noteBox}>
        <textarea
          autoFocus
          value={draft}
          placeholder="A thought about it."
          aria-label={`Notes on ${book.title}`}
          onChange={(event) => setDraft(event.target.value)}
        />
        <p>
          <button
            type="button"
            onClick={() => {
              void act({ action: 'update', id: book.id, notes: draft });
              setNoting(null);
            }}
          >
            Keep
          </button>
          <button type="button" onClick={() => setNoting(null)}>
            Cancel
          </button>
        </p>
      </div>
    ) : (
      <button
        type="button"
        className={book.notes ? styles.noteShown : styles.noteAdd}
        onClick={() => {
          setDraft(book.notes ?? '');
          setNoting(book.id);
        }}
      >
        {book.notes ? book.notes : 'Add a note'}
      </button>
    );

  return (
    <div className={styles.page}>
      {error && <p className={styles.warn}>{error}</p>}

      {books.length > 0 && (
        <p className={styles.tally}>
          <strong>{finishedThisYear}</strong> finished in {thisYear}
          {open.length > 0 && (
            <>
              {' · '}
              <strong>{open.length}</strong> open
            </>
          )}
          {next.length > 0 && (
            <>
              {' · '}
              {next.length} queued
            </>
          )}
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

      {/* --- open now: the only shelf that gets room ------------------- */}
      <section className={styles.group}>
        <h2>Open now</h2>
        {open.length === 0 ? (
          <p className={styles.status}>Nothing open.</p>
        ) : (
          <ul className={styles.openList}>
            {open.map((book) => {
              const through =
                book.pages && book.page ? Math.min(100, Math.round((book.page / book.pages) * 100)) : null;
              return (
                <li key={book.id} className={styles.openCard}>
                  <div className={styles.openHead}>
                    <div>
                      <strong>{book.title}</strong>
                      {book.author && <span className={styles.author}>{book.author}</span>}
                    </div>
                    <div className={styles.controls}>
                      {statusSelect(book)}
                      {remove(book)}
                    </div>
                  </div>

                  {/* The page total was storable and displayable but never
                      settable, so "of 320" could not exist. Both halves are
                      inputs now. */}
                  <div className={styles.progress}>
                    <label>
                      p.
                      <input
                        type="number"
                        min={0}
                        defaultValue={book.page ?? ''}
                        aria-label={`Page in ${book.title}`}
                        onBlur={(event) => {
                          const value = Number(event.target.value);
                          if (value && value !== book.page) {
                            void act({ action: 'update', id: book.id, page: value });
                          }
                        }}
                      />
                    </label>
                    <label>
                      of
                      <input
                        type="number"
                        min={0}
                        defaultValue={book.pages ?? ''}
                        aria-label={`Total pages in ${book.title}`}
                        onBlur={(event) => {
                          const value = Number(event.target.value);
                          if (value && value !== book.pages) {
                            void act({ action: 'update', id: book.id, pages: value });
                          }
                        }}
                      />
                    </label>

                    {through !== null && (
                      <span className={styles.bar} aria-label={`${through} per cent`}>
                        <span style={{ width: `${through}%` }} />
                      </span>
                    )}
                    {through !== null && <span className={styles.pct}>{through}%</span>}

                    {book.started_on && (
                      <span className={styles.since}>since {book.started_on}</span>
                    )}
                  </div>

                  {notes(book)}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --- next: a queue, so compact -------------------------------- */}
      {next.length > 0 && (
        <section className={styles.group}>
          <h2>
            Next<span className={styles.count}>{next.length}</span>
          </h2>
          <ul className={styles.rows}>
            {next.map((book) => (
              <li key={book.id} className={styles.row}>
                <span className={styles.what}>
                  <strong>{book.title}</strong>
                  {book.author && <span className={styles.author}>{book.author}</span>}
                </span>
                <span className={styles.controls}>
                  {statusSelect(book)}
                  {remove(book)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- finished: an archive, so by year ------------------------- */}
      {done.length > 0 && (
        <section className={styles.group}>
          <h2>
            Finished<span className={styles.count}>{done.length}</span>
          </h2>
          {years.map((year) => {
            // The current year starts open; older years are archive and start
            // shut, so a decade of reading does not unroll down the page.
            const isOpen = openYears.has(year) || (openYears.size === 0 && year === thisYear);
            const group = byYear.get(year)!;
            return (
              <div key={year} className={styles.yearBlock}>
                <button
                  type="button"
                  className={styles.yearPill}
                  aria-expanded={isOpen}
                  onClick={() => {
                    const nextOpen = new Set(openYears.size === 0 ? [thisYear] : openYears);
                    if (nextOpen.has(year)) nextOpen.delete(year);
                    else nextOpen.add(year);
                    // Never empty, or the "current year open by default" rule
                    // would silently come back and reopen it.
                    setOpenYears(nextOpen.size === 0 ? new Set(['none']) : nextOpen);
                  }}
                >
                  <span>{year === 'undated' ? 'No date' : year}</span>
                  <span className={styles.count}>{group.length}</span>
                  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <ul className={styles.rows}>
                    {group.map((book) => {
                      const days = took(book);
                      return (
                        <li key={book.id} className={styles.row}>
                          <span className={styles.what}>
                            <strong>{book.title}</strong>
                            {book.author && <span className={styles.author}>{book.author}</span>}
                            {notes(book)}
                          </span>
                          <span className={styles.controls}>
                            {/* Both dates are stored so this can be said. */}
                            {days !== null && (
                              <span className={styles.took}>
                                {days === 0 ? 'in a day' : `in ${days}d`}
                              </span>
                            )}
                            {book.finished_on && (
                              <span className={styles.since}>{book.finished_on}</span>
                            )}
                            <Stars
                              rating={book.rating}
                              onPick={(value) =>
                                void act({ action: 'update', id: book.id, rating: value })
                              }
                            />
                            {statusSelect(book)}
                            {remove(book)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* --- put down: present, but not in the way -------------------- */}
      {putDown.length > 0 && (
        <section className={styles.group}>
          <button
            type="button"
            className={styles.yearPill}
            aria-expanded={showPutDown}
            onClick={() => setShowPutDown(!showPutDown)}
          >
            <span>Put down</span>
            <span className={styles.count}>{putDown.length}</span>
            <span aria-hidden="true">{showPutDown ? '−' : '+'}</span>
          </button>
          {showPutDown && (
            <ul className={styles.rows}>
              {putDown.map((book) => (
                <li key={book.id} className={styles.row}>
                  <span className={styles.what}>
                    <strong>{book.title}</strong>
                    {book.author && <span className={styles.author}>{book.author}</span>}
                    {book.page && <span className={styles.since}>stopped at p.{book.page}</span>}
                    {notes(book)}
                  </span>
                  <span className={styles.controls}>
                    {statusSelect(book)}
                    {remove(book)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {books.length === 0 && (
        <p className={styles.empty}>
          Nothing here yet. Add a book above — put it on <em>Next</em> if it is waiting, or{' '}
          <em>Open now</em> if you have started it, which records today as the day you did.
        </p>
      )}
    </div>
  );
}
