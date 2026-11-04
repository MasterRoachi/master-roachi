// The curriculum and card operations, shared by every caller.
//
// The dashboard at /work and Ohana at /share/ohana both tick lessons and answer
// cards. They were written once, inline in the /work routes; moving them here
// means the two can never disagree about what ticking a lesson unlocks or how a
// review is scheduled and logged. Change the rule here and both follow.

import type { Grade } from 'ts-fsrs';
import { allowance, review, type Card } from '../lib/cards';
import { localDay, type D1Database } from './db';

export const CARD_COLUMNS = `id, curriculum_id, lesson_id, kind, front, back, reading, extra,
   due, stability, difficulty, scheduled_days, learning_steps, reps,
   lapses, state, last_review, unlocked_on`;

/**
 * Mark a lesson done on `day`, or not done.
 *
 * Ticking UNLOCKS the cards the lesson teaches, so finishing a lesson and
 * forgetting its cards is not possible. Unticking does NOT lock them again: a
 * card that has been answered has a review history, and hiding it because a
 * tick was clicked twice would be worse than leaving it in the pile.
 * `unlocked_on is null` also means a re-tick cannot move a date already set.
 */
export async function setLessonDone(
  db: D1Database,
  lessonId: number,
  done: boolean,
  day: string = localDay(),
): Promise<{ done: boolean; day: string | null; unlocked: number }> {
  const next = done ? day : null;
  await db.prepare(`update lessons set done_on = ?2 where id = ?1`).bind(lessonId, next).run();

  let unlocked = 0;
  if (next !== null) {
    const result = (await db
      .prepare(
        `update cards set unlocked_on = ?2
          where lesson_id = ?1 and unlocked_on is null`,
      )
      .bind(lessonId, next)
      .run()) as { meta?: { changes?: number } };
    unlocked = Number(result?.meta?.changes ?? 0);
  }
  return { done: next !== null, day: next, unlocked };
}

/**
 * How many new cards a deck has introduced today.
 *
 * Counted from the REVIEW LOG, on reviews where the card was new at the time,
 * not from the cards whose state is new now. A card introduced this morning is
 * in learning by lunchtime, so counting the pile would let the allowance refill
 * itself all day.
 */
export async function introducedToday(db: D1Database, deck: number, today = localDay()) {
  return Number(
    (
      await db
        .prepare(
          `select count(*) as n from card_reviews r
             join cards k on k.id = r.card_id
            where r.day = ?1 and r.state = 0 and k.curriculum_id = ?2`,
        )
        .bind(today, deck)
        .first<{ n: number }>()
    )?.n ?? 0,
  );
}

/** New cards this deck may still introduce today. */
export async function newLeftToday(db: D1Database, deck: number, today = localDay()) {
  const settings = await db
    .prepare(`select new_per_day from curriculums where id = ?1`)
    .bind(deck)
    .first<{ new_per_day: number | null }>();
  if (!settings) return 0;
  return Math.max(0, allowance(settings, await introducedToday(db, deck, today)));
}

/**
 * The cards to study next: everything due first, oldest due first, and only
 * then new cards, within today's allowance. Reviews come before new cards and
 * are not interleaved: a day's reviews are a debt already owed, and new cards
 * are a choice to take on more.
 */
export async function studyQueue(
  db: D1Database,
  deck: number,
  limit: number,
  nowIso = new Date().toISOString(),
): Promise<Card[]> {
  const due = (
    await db
      .prepare(
        `select ${CARD_COLUMNS} from cards
          where curriculum_id = ?1 and unlocked_on is not null
            and state != 0 and due <= ?2
          order by due, id limit ?3`,
      )
      .bind(deck, nowIso, limit)
      .all<Card>()
  ).results;
  if (due.length >= limit) return due;

  const room = Math.min(limit - due.length, await newLeftToday(db, deck));
  if (room <= 0) return due;

  const fresh = (
    await db
      .prepare(
        `select ${CARD_COLUMNS} from cards
          where curriculum_id = ?1 and unlocked_on is not null and state = 0
          order by id limit ?2`,
      )
      .bind(deck, room)
      .all<Card>()
  ).results;
  return [...due, ...fresh];
}

/** Due-now and new-today counts for one deck, as Ohana's list shows them. */
export async function deckCounts(
  db: D1Database,
  deck: number,
  nowIso = new Date().toISOString(),
): Promise<{ due: number; fresh: number }> {
  const row = await db
    .prepare(
      `select sum(case when unlocked_on is not null and state != 0 and due <= ?2
                       then 1 else 0 end) as due,
              sum(case when unlocked_on is not null and state = 0 then 1 else 0 end) as fresh
         from cards where curriculum_id = ?1`,
    )
    .bind(deck, nowIso)
    .first<{ due: number | null; fresh: number | null }>();
  const left = await newLeftToday(db, deck);
  return { due: Number(row?.due ?? 0), fresh: Math.min(Number(row?.fresh ?? 0), left) };
}

/**
 * The writes that answer a card: its new schedule, and the log row.
 *
 * Returned rather than run, so a caller can put other writes in the same batch.
 * The dashboard saves the card's note with the answer. The log is written even
 * though FSRS does not need it: it is what the scheduler can later be
 * re-optimised against, and a history not kept cannot be recovered. It records
 * `card.state`, the state BEFORE the answer, which is what an optimiser needs.
 */
export function answerWrites(
  db: D1Database,
  card: Card,
  rating: Grade,
  now: Date,
  today = localDay(now),
) {
  const next = review(card, rating, now);
  return [
    db
      .prepare(
        `update cards set due = ?2, stability = ?3, difficulty = ?4,
                scheduled_days = ?5, learning_steps = ?6, reps = ?7,
                lapses = ?8, state = ?9, last_review = ?10
          where id = ?1`,
      )
      .bind(
        card.id,
        next.due,
        next.stability,
        next.difficulty,
        next.scheduled_days,
        next.learning_steps,
        next.reps,
        next.lapses,
        next.state,
        next.last_review,
      ),
    db
      .prepare(
        `insert into card_reviews (card_id, rating, state, reviewed_at, day)
         values (?1, ?2, ?3, ?4, ?5)`,
      )
      .bind(card.id, rating, card.state, now.toISOString(), today),
  ];
}
