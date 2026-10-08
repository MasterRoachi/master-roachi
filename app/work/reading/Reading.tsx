'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './reading.module.css';

// Four groups, in the order they matter: what is open now, what is next, what
// was finished, and what was put down.
//
// Abandoned is deliberately last but present. A book given up on at page 80 is
// the most interesting row in the table, and the usual design — delete it and
// pretend it never happened — throws it away.

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

const GROUPS: { status: Status; label: string; empty: string }[] = [
  { status: 'reading', label: 'Open now', empty: 'Nothing open.' },
  { status: 'want', label: 'Next', empty: 'Nothing queued.' },
  { status: 'read', label: 'Finished', empty: 'Nothing finished yet.' },
  { status: 'abandoned', label: 'Put down', empty: '' },
];

export default function Reading() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/work/api/reading', { cache: 'no-store' });
      if (!response.ok) throw new Error(`could not read them (${response.status})`);
      const data = (await response.json()) as { configured: boolean; books: Book[] };
      setConfigured(data.configured);
      setBooks(data.books ?? []);
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

  return (
    <>
      {error && <p className={styles.warn}>{error}</p>}

      <form
        className={styles.add}
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          void act({ action: 'add', title, author }).then(() => {
            setTitle('');
            setAuthor('');
          });
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          aria-label="Title"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          aria-label="Author"
        />
        <button type="submit" disabled={!title.trim()}>
          Add
        </button>
      </form>

      {GROUPS.map(({ status, label, empty }) => {
        const group = books.filter((book) => book.status === status);
        // Put down stays hidden until there is something in it, rather than
        // greeting him with an empty shelf of failures.
        if (group.length === 0 && !empty) return null;

        return (
          <section key={status} className={styles.group}>
            <h2>
              {label}
              {group.length > 0 && <span className={styles.count}>{group.length}</span>}
            </h2>

            {group.length === 0 ? (
              <p className={styles.status}>{empty}</p>
            ) : (
              <ul className={styles.books}>
                {group.map((book) => (
                  <li key={book.id} className={styles.book}>
                    <div className={styles.what}>
                      <strong>{book.title}</strong>
                      {book.author && <span className={styles.author}>{book.author}</span>}

                      <span className={styles.dates}>
                        {book.started_on && `started ${book.started_on}`}
                        {book.finished_on && ` · finished ${book.finished_on}`}
                        {book.page !== null &&
                          status === 'reading' &&
                          ` · p.${book.page}${book.pages ? `/${book.pages}` : ''}`}
                      </span>
                    </div>

                    <div className={styles.controls}>
                      {status === 'reading' && (
                        <input
                          type="number"
                          min={0}
                          className={styles.pageInput}
                          defaultValue={book.page ?? ''}
                          placeholder="page"
                          aria-label={`Page in ${book.title}`}
                          onBlur={(event) => {
                            const value = Number(event.target.value);
                            if (value && value !== book.page) {
                              void act({ action: 'update', id: book.id, page: value });
                            }
                          }}
                        />
                      )}

                      {status === 'read' && (
                        <span className={styles.stars}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={(book.rating ?? 0) >= n ? styles.starOn : styles.starOff}
                              aria-label={`${n} out of 5`}
                              onClick={() =>
                                void act({
                                  action: 'update',
                                  id: book.id,
                                  // Clicking the current rating clears it, so a
                                  // mis-tap is undoable.
                                  rating: book.rating === n ? null : n,
                                })
                              }
                            >
                              ★
                            </button>
                          ))}
                        </span>
                      )}

                      <select
                        value={status}
                        aria-label={`Status of ${book.title}`}
                        onChange={(event) =>
                          void act({ action: 'update', id: book.id, status: event.target.value })
                        }
                      >
                        <option value="want">Next</option>
                        <option value="reading">Open now</option>
                        <option value="read">Finished</option>
                        <option value="abandoned">Put down</option>
                      </select>

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
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
