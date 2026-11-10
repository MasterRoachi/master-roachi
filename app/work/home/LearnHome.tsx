'use client';

import { useState } from 'react';
import Link from 'next/link';
import { spineFor } from '@/lib/book-spine';
import WorkDoors, { OtherApps } from '../WorkDoors';
import { useLive } from './live';
import { decks, nextLessons, openBooks, waitingIn, type Book } from './sources';
import styles from './home.module.css';
import dash from './dash.module.css';

// The learn home: pick up where you left off (his pick, 2026-11-10, redesign
// page, Learn doors: B).
//
//   Continue   the next lesson of the curriculum being studied, one tap away
//   Cards      how many are due, and Review, which goes into the review
//   Open now   the books being read
//   doors      the three tools, smaller and dark, for everything else
//
// Each card appears when its numbers do and is simply absent until then, or if
// they cannot be read: a home never shows an error (see live.ts). The doors
// are always there, so the page is never empty.

/** A book's cover from Calibre, or its derived spine colour where there is none. */
function Cover({ book }: { book: Book }) {
  const [failed, setFailed] = useState(false);
  const spine = spineFor(book);
  const art = book.calibre_id != null && !failed ? `/work/api/book-cover?id=${book.calibre_id}` : null;
  return (
    <span className={styles.cover} style={{ background: spine.colour, borderColor: spine.edge }} aria-hidden="true">
      {art && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={art} alt="" loading="lazy" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

export default function LearnHome() {
  const [steps] = useLive(nextLessons);
  const [deckList] = useLive(decks);
  const [books] = useLive(openBooks);

  // The one lesson to continue with on a phone: the curriculum worked on most
  // recently (nextLessons() puts it first). A computer lists them all.
  const step = steps?.[0] ?? null;
  // Review takes every deck at once (Cards' ?deck=all), oldest due first.
  const due = (deckList ?? []).reduce((sum, deck) => sum + waitingIn(deck), 0);

  return (
    <>
    <div className={dash.phone}>
    <div className={styles.home}>
      {step && (
        <Link className={`${styles.continue} card-link`} href={`/work/curriculums/?open=${step.curriculum.id}`}>
          <span className={styles.eyebrow}>Continue</span>
          <span className={styles.curriculum}>{step.curriculum.name}</span>
          <span className={styles.lesson}>
            {step.module.name} · Lesson {step.lessonAt}
          </span>
          <span className={styles.lessonName}>{step.lesson.name}</span>
          <span className={styles.openLesson}>Open the lesson</span>
        </Link>
      )}

      {deckList && deckList.length > 0 && (
        <section className={due > 0 ? styles.cardWaiting : styles.card} aria-label="Cards">
          <div className={styles.cardRow}>
            <b>{due > 0 ? `${due} ${due === 1 ? 'card' : 'cards'} due` : 'No cards due'}</b>
            {due > 0 ? (
              <Link className={styles.gold} href="/work/cards/?deck=all">
                Review
              </Link>
            ) : (
              <span className={styles.muted}>Come back tomorrow</span>
            )}
          </div>
        </section>
      )}

      {books && books.length > 0 && (
        <section className={styles.card}>
          <Link className={styles.eyebrow} href="/work/reading/">
            Open now
          </Link>
          <ul className={styles.books}>
            {books.map((book) => (
              <li key={book.id}>
                {/* Straight to the open book (Reading's ?book=). */}
                <Link className={styles.book} href={`/work/reading/?book=${book.id}`}>
                <Cover book={book} />
                <span className={styles.bookText}>
                  <b>{book.title}</b>
                  <span className={styles.muted}>
                    {[
                      book.author,
                      book.page && book.pages ? `page ${book.page} of ${book.pages}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.grow} />

      <WorkDoors app="learn" small apps={false} />
      <OtherApps app="learn" />
    </div>
    </div>

    <LearnDash steps={steps} deckList={deckList} books={books} due={due} />
    </>
  );
}

/**
 * The learn home on a computer (his call, 2026-11-10, after the CRM): tiles
 * for the cards due, the courses running and the books open; then every
 * course's next lesson and the decks on the left, the books on the right.
 */
function LearnDash({
  steps,
  deckList,
  books,
  due,
}: {
  steps: Awaited<ReturnType<typeof nextLessons>>;
  deckList: Awaited<ReturnType<typeof decks>>;
  books: Book[] | null;
  due: number;
}) {
  const most = Math.max(1, ...(deckList ?? []).map(waitingIn));
  return (
    <div className={dash.dash}>
      <ul className={dash.tiles}>
        <li>
          <Link className={`${dash.tile} card-link`} href={due > 0 ? '/work/cards/?deck=all' : '/work/cards/'}>
            <span className={dash.tileK}>
              <i className={due > 0 ? dash.dotGold : dash.dot} /> Cards due
            </span>
            <span className={dash.tileV}>{deckList ? due : '–'}</span>
            <span className={dash.tileS}>
              {deckList ? `across ${deckList.length} ${deckList.length === 1 ? 'deck' : 'decks'}` : 'the decks'}
            </span>
          </Link>
        </li>
        <li>
          <Link className={`${dash.tile} card-link`} href="/work/curriculums/">
            <span className={dash.tileK}>
              <i className={dash.dot} /> Courses running
            </span>
            <span className={dash.tileV}>{steps ? steps.length : '–'}</span>
            <span className={dash.tileS}>each with a next lesson</span>
          </Link>
        </li>
        <li>
          <Link className={`${dash.tile} card-link`} href="/work/reading/">
            <span className={dash.tileK}>
              <i className={dash.dot} /> Open now
            </span>
            <span className={dash.tileV}>{books ? books.length : '–'}</span>
            <span className={dash.tileS}>{books?.length === 1 ? 'book being read' : 'books being read'}</span>
          </Link>
        </li>
      </ul>

      <div className={dash.grid}>
        <div className={dash.col}>
          <section className={dash.panel} aria-label="Continue">
            <h2 className={dash.head}>
              Continue <Link href="/work/curriculums/">Curriculums ›</Link>
            </h2>
            {steps && steps.length === 0 && <p className={dash.empty}>No course is running.</p>}
            <ul className={dash.rows}>
              {(steps ?? []).map((one, at) => (
                <li key={one.curriculum.id}>
                  <Link className={dash.row} href={`/work/curriculums/?open=${one.curriculum.id}`}>
                    <i className={at === 0 ? dash.dotGold : dash.dot} />
                    <span className={dash.rowText}>
                      <b>{one.lesson.name}</b>
                      <span>
                        {one.curriculum.name} · {one.module.name} · Lesson {one.lessonAt}
                      </span>
                    </span>
                    <span className={at === 0 ? dash.noteGold : dash.note}>{at === 0 ? 'Where you left off' : 'Next'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={dash.panel} aria-label="Cards">
            <h2 className={dash.head}>
              Cards <span>{deckList ? `${due} due` : ''}</span>
            </h2>
            {deckList && deckList.length === 0 && <p className={dash.empty}>No decks yet.</p>}
            <ul className={dash.bars}>
              {(deckList ?? []).map((deck) => (
                <li key={deck.id} className={dash.bar}>
                  <Link href={`/work/cards/?deck=${deck.id}`}>{deck.name}</Link>
                  <span className={dash.track}>
                    <i style={{ width: `${(waitingIn(deck) / most) * 100}%` }} />
                  </span>
                  <span className={dash.barN}>{waitingIn(deck)}</span>
                </li>
              ))}
            </ul>
            {due > 0 && (
              <Link className={dash.gold} href="/work/cards/?deck=all">
                Review all {due}
              </Link>
            )}
          </section>
        </div>

        <div className={dash.col}>
          <section className={dash.panel} aria-label="Open now">
            <h2 className={dash.head}>
              Open now <Link href="/work/reading/">Reading ›</Link>
            </h2>
            {books && books.length === 0 && <p className={dash.empty}>Nothing open. Pick one from Next.</p>}
            <ul className={dash.rows}>
              {(books ?? []).map((book) => (
                <li key={book.id}>
                  <Link className={dash.row} href={`/work/reading/?book=${book.id}`}>
                    <Cover book={book} />
                    <span className={dash.rowText}>
                      <b>{book.title}</b>
                      <span>{book.author ?? ''}</span>
                    </span>
                    <span className={dash.note}>
                      {book.page && book.pages ? `${Math.round((book.page / book.pages) * 100)}%` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
