'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NEW_PER_DAY, type Deck } from '@/lib/cards';
import { nextPerCurriculum, type Curriculum, type Step } from '@/lib/curriculum';
import { spineFor } from '@/lib/book-spine';
import WorkDoors, { OtherApps } from '../WorkDoors';
import { getJson, useLive } from './live';
import styles from './home.module.css';

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

/* --- Continue --------------------------------------------------------------- */

/** The latest day any lesson of a curriculum was done, or '' for never. */
function lastWorked(curriculum: Curriculum): string {
  let latest = '';
  for (const module of curriculum.modules) {
    for (const lesson of module.lessons) {
      if (lesson.done_on && lesson.done_on > latest) latest = lesson.done_on;
    }
  }
  return latest;
}

/**
 * The one lesson to continue with.
 *
 * Several curriculums can be active at once, and the Curriculums page shows
 * one next lesson for each. A home has room for one, so it is the next lesson
 * of the active curriculum worked on most recently — "where you left off" —
 * and, where none has been started, the first in the page's own order.
 */
async function nextLesson(): Promise<Step | null> {
  const data = await getJson<{ configured: boolean; curriculums: Curriculum[] }>('/work/api/curriculums');
  if (!data?.configured) return null;
  const steps = nextPerCurriculum(data.curriculums ?? []);
  if (steps.length === 0) return null;
  return steps.reduce((best, step) =>
    lastWorked(step.curriculum) > lastWorked(best.curriculum) ? step : best,
  );
}

/* --- Cards ------------------------------------------------------------------ */

/** What a deck has waiting, by the Cards page's own sum: due, plus today's new. */
const waitingIn = (deck: Deck) => deck.due + Math.min(deck.fresh, deck.new_per_day ?? NEW_PER_DAY);

async function decks(): Promise<Deck[] | null> {
  const data = await getJson<{ configured: boolean; decks: Deck[] }>('/work/api/cards');
  if (!data?.configured) return null;
  return data.decks ?? [];
}

/* --- Reading ---------------------------------------------------------------- */

interface Book {
  id: number;
  title: string;
  author: string | null;
  status: string;
  pages: number | null;
  page: number | null;
  calibre_id: number | null;
}

async function openBooks(): Promise<Book[] | null> {
  const data = await getJson<{ configured: boolean; books: Book[] }>('/work/api/reading');
  if (!data?.configured) return null;
  return (data.books ?? []).filter((book) => book.status === 'reading');
}

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
  const [step] = useLive(nextLesson);
  const [deckList] = useLive(decks);
  const [books] = useLive(openBooks);

  const due = (deckList ?? []).reduce((sum, deck) => sum + waitingIn(deck), 0);
  // Review opens one deck: the Cards page reviews a deck at a time, and the
  // first with anything waiting is the one its own list would put first.
  const firstDeck = (deckList ?? []).find((deck) => waitingIn(deck) > 0);

  return (
    <div className={styles.home}>
      {step && (
        <Link className={styles.continue} href={`/work/curriculums/?open=${step.curriculum.id}`}>
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
            {firstDeck ? (
              <Link className={styles.gold} href={`/work/cards/?deck=${firstDeck.id}`}>
                Review
              </Link>
            ) : (
              <span className={styles.muted}>Come back tomorrow</span>
            )}
          </div>
          {firstDeck && due > waitingIn(firstDeck) && (
            <span className={styles.muted}>
              {waitingIn(firstDeck)} in {firstDeck.name} first
            </span>
          )}
        </section>
      )}

      {books && books.length > 0 && (
        <Link className={styles.card} href="/work/reading/">
          <span className={styles.eyebrow}>Open now</span>
          <ul className={styles.books}>
            {books.map((book) => (
              <li key={book.id} className={styles.book}>
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
              </li>
            ))}
          </ul>
        </Link>
      )}

      <div className={styles.grow} />

      <WorkDoors app="learn" small apps={false} />
      <OtherApps app="learn" />
    </div>
  );
}
