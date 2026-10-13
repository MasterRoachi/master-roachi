// Flashcards: the scheduler, and what a card of each kind asks.
//
// Shared between the Worker, which schedules, and the page, which draws. Pure
// and dependency-light for the same reason lib/printful.ts is: Node imports it
// from .mjs natively, so a build script can seed cards without a second copy
// of these rules.
//
// WHY ts-fsrs AND NOT AN INTERVAL TABLE. FSRS is the scheduler Anki itself
// moved to, it is a pure function of the card and the rating, and it has an
// optimiser that can be pointed at a real review history later. Writing
// "double the interval on a correct answer" would have been fifteen lines and
// would have had to be replaced by this the first time the intervals felt
// wrong.

import {
  createEmptyCard,
  fsrs,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs';

/**
 * How many new cards a day, where a curriculum has not said.
 *
 * Ten, which is 2,136 kanji in roughly seven months if nothing else is
 * running. The number exists to be changed per deck — Japanese and Greek want
 * different ones — and this is only the value for a deck nobody has thought
 * about yet.
 */
export const NEW_PER_DAY = 10;

/**
 * The kinds of card, and what each one asks.
 *
 * Typed rather than a free front and back, his call. A kanji card already
 * knows it wants readings and a stroke count; asking the author to remember
 * that every time is how a deck ends up half-filled.
 *
 * `prompt` is what is printed above the front, and it is the whole reason
 * `kanji` and `word` are different kinds rather than one: a kanji card asks
 * for the hand as well as the memory, because handwriting stayed a goal.
 */
export const CARD_KINDS = {
  kanji: {
    label: 'Kanji',
    prompt: 'Read it, then write it from memory.',
  },
  word: {
    label: 'Word',
    prompt: 'Read it.',
  },
  grammar: {
    label: 'Grammar',
    prompt: 'Answer, then check.',
  },
  sentence: {
    label: 'Sentence',
    prompt: 'Read it, then check.',
  },
} as const;

export type CardKind = keyof typeof CARD_KINDS;

export function isCardKind(value: unknown): value is CardKind {
  return typeof value === 'string' && value in CARD_KINDS;
}

/** A card as the database holds it, and as the page receives it. */
export interface Card {
  id: number;
  curriculum_id: number;
  lesson_id: number | null;
  kind: CardKind;
  front: string;
  back: string;
  reading: string | null;
  extra: string | null;
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  unlocked_on: string | null;
}

/** The scheduling half of a card — what FSRS reads and writes, nothing else. */
export type Scheduling = Pick<
  Card,
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'scheduled_days'
  | 'learning_steps'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'last_review'
>;

/**
 * TWO BUTTONS, and this is where that decision lives.
 *
 * FSRS takes four ratings and schedules better with all of them. It gets two,
 * because deciding between Hard and Good is the micro-judgement that turns
 * reviewing into admin — "learning it takes as long as learning godot" was the
 * complaint, and a fourth of it was the buttons.
 *
 * Stored as the library's numbers (Again 1, Hard 2, Good 3, Easy 4) so that
 * adding a third button later is a change to this map and to the page, and not
 * a migration over a year of history.
 */
export const BUTTONS = [
  { key: 'again', label: 'Again', rating: Rating.Again },
  { key: 'good', label: 'Good', rating: Rating.Good },
] as const;

export type ButtonKey = (typeof BUTTONS)[number]['key'];

export function ratingFor(key: unknown): Grade | null {
  const button = BUTTONS.find((one) => one.key === key);
  return button ? button.rating : null;
}

/** A brand new card's scheduling, due immediately. */
export function freshScheduling(now: Date): Scheduling {
  return toScheduling(createEmptyCard(now));
}

function toScheduling(card: FsrsCard): Scheduling {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

/**
 * Schedule the next review.
 *
 * The library is handed the row as it stands and hands back the row as it
 * should be, which is why the column names match its field names exactly —
 * there is no mapping to get wrong in either direction.
 */
export function review(card: Scheduling, rating: Grade, now: Date): Scheduling {
  const scheduler = fsrs();
  const current: FsrsCard = {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    // Deprecated in the library and removed in 6.0. Derived rather than
    // stored: it is the gap between the last review and now, which the two
    // dates already say.
    elapsed_days: card.last_review
      ? Math.max(0, Math.round((now.getTime() - new Date(card.last_review).getTime()) / 86_400_000))
      : 0,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    ...(card.last_review ? { last_review: new Date(card.last_review) } : {}),
  };

  return toScheduling(scheduler.next(current, now, rating).card);
}

/** A deck is a curriculum. There is no decks table, and this is why. */
export interface Deck {
  id: number;
  name: string;
  status: 'active' | 'paused' | 'done';
  position: number;
  new_per_day: number | null;
  /** Unlocked, due now, and not new. */
  due: number;
  /** Unlocked and never seen — capped by the allowance before it is offered. */
  fresh: number;
  /** Still waiting on the lesson that teaches them. */
  locked: number;
  total: number;
}

/**
 * How many new cards this deck may still offer today.
 *
 * Counts reviews of cards that were new at the time, not cards whose state is
 * new now: a card introduced this morning is in learning by the afternoon, so
 * counting the pile would let the allowance refill itself all day.
 */
export function allowance(deck: { new_per_day: number | null }, introducedToday: number): number {
  const cap = deck.new_per_day ?? NEW_PER_DAY;
  return Math.max(0, cap - introducedToday);
}
