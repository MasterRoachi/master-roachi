'use client';

import { isDraft } from '@/lib/collections';
import { NEW_PER_DAY, type Deck } from '@/lib/cards';
import { nextPerCurriculum, type Curriculum, type Step } from '@/lib/curriculum';
import { fieldsFor, warningsFor } from '@/lib/editor-fields';
import { readScalar, splitFile } from '@/lib/frontmatter';
import { isOklch } from '@/lib/oklch';
import { orderWaiting, type OrderState } from '@/lib/order-waiting';
import { HIDDEN_LISTS, type WorkHubPayload } from '@/lib/work-hub';
import type { ToolKey } from '@/lib/work-tools';
import { getJson } from './live';

// What the homes and the desktop sidebar read: one loader per thing that can
// be waiting, each worked out exactly as the tool behind it works it out, so
// the home, the sidebar's count and the page it opens never disagree.
//
// SHARED, AND HELD FOR A MINUTE. The sidebar is on every page and the home
// reads the same things, so each loader's promise is kept for 60 seconds:
// the home and the sidebar make one request between them, and moving between
// pages does not ask GitHub again for every count. A failed read is not kept.

const HOLD_MS = 60_000;
const held = new Map<string, { at: number; promise: Promise<unknown> }>();

function hold<T>(key: string, load: () => Promise<T | null>): () => Promise<T | null> {
  return () => {
    const kept = held.get(key);
    if (kept && Date.now() - kept.at < HOLD_MS) return kept.promise as Promise<T | null>;
    const promise = load().then((value) => {
      if (value === null) held.delete(key);
      return value;
    });
    held.set(key, { at: Date.now(), promise });
    return promise;
  };
}

/** Forget what is held, after a change made from a home (a habit ticked). */
export function release(key: string) {
  held.delete(key);
}

/* --- Admin ---------------------------------------------------------------- */

export interface WaitingOrder extends OrderState {
  ref: string;
  created_at: string;
  product: string;
  size: string;
  name: string;
}

/** The orders waiting on him: the gold rows on the Shop page. */
export const waitingOrders = hold('orders', async () => {
  const data = await getJson<{ configured: boolean; orders: WaitingOrder[] }>('/work/api/orders');
  if (!data?.configured) return null;
  return data.orders.filter(orderWaiting);
});

export interface Entry {
  path: string;
  title: string;
  /** How many things the editor would flag on it. */
  warnings: number;
  draft: boolean;
}

/** A collection's entries, read in one call (?texts=1). */
async function entries(collection: string, images?: string[]): Promise<Entry[] | null> {
  const list = await getJson<{ configured: boolean; files: { path: string; text: string }[] }>(
    `/work/api/content?collection=${collection}&texts=1`,
  );
  if (!list?.configured) return null;
  const fields = fieldsFor(collection);
  return (list.files ?? []).map((file) => {
    const lines = splitFile(file.text)?.frontmatter ?? [];
    const values = Object.fromEntries(fields.map((field) => [field.key, readScalar(lines, field.key) ?? '']));
    return {
      path: file.path,
      title: readScalar(lines, 'title') || file.path.split('/').pop() || file.path,
      warnings: images ? warningsFor(collection, values, { images, isOklch }).length : 0,
      draft: isDraft(file.text),
    };
  });
}

/**
 * Projects with something the editor would flag: the "N to fix" on a shut
 * card there. The same warningsFor(), fed the same image list; Projects
 * passes no `projects` list to its editor, so neither does this.
 */
export const projectsToFix = hold('projects', async () => {
  const art = await getJson<{ files?: { path: string }[] }>('/work/api/content?collection=project-art');
  if (!art) return null;
  const images = (art.files ?? []).map((file) => file.path.replace(/^public/, ''));
  const all = await entries('projects', images);
  return all ? all.filter((entry) => entry.warnings > 0) : null;
});

export const writingDrafts = hold('writing', async () => {
  const all = await entries('writing');
  return all ? all.filter((entry) => entry.draft) : null;
});

export interface LateCard {
  id: string;
  name: string;
  url: string;
  board: string;
  due: string;
}

/** Cards past their due date on every board, skipping the lists Boards hides. */
export const lateCards = hold('boards', async () => {
  const data = await getJson<WorkHubPayload>('/api/work/');
  if (!data?.configured) return null;
  const now = Date.now();
  return data.boards
    .flatMap((board) => board.cards.map((card) => ({ card, board: board.name })))
    .filter(({ card }) => !HIDDEN_LISTS.test(card.list.trim()))
    .filter(({ card }) => card.due !== null && Date.parse(card.due) < now)
    .map(({ card, board }) => ({ id: card.id, name: card.name, url: card.url, board, due: card.due as string }))
    .sort((a, b) => a.due.localeCompare(b.due));
});

/* --- Learn ---------------------------------------------------------------- */

/** What a deck has waiting, by the Cards page's own sum: due, plus today's new. */
export const waitingIn = (deck: Deck) => deck.due + Math.min(deck.fresh, deck.new_per_day ?? NEW_PER_DAY);

export const decks = hold('decks', async () => {
  const data = await getJson<{ configured: boolean; decks: Deck[] }>('/work/api/cards');
  if (!data?.configured) return null;
  return data.decks ?? [];
});

/** The latest day any lesson of a curriculum was done, or '' for never. */
export function lastWorked(curriculum: Curriculum): string {
  let latest = '';
  for (const module of curriculum.modules) {
    for (const lesson of module.lessons) {
      if (lesson.done_on && lesson.done_on > latest) latest = lesson.done_on;
    }
  }
  return latest;
}

/**
 * The next lesson of every active curriculum, the one worked on most recently
 * first: "where you left off" leads, and a curriculum never started comes in
 * the Curriculums page's own order after the rest.
 */
export const nextLessons = hold('curriculums', async () => {
  const data = await getJson<{ configured: boolean; curriculums: Curriculum[] }>('/work/api/curriculums');
  if (!data?.configured) return null;
  const steps: Step[] = nextPerCurriculum(data.curriculums ?? []);
  return [...steps].sort((a, b) => lastWorked(b.curriculum).localeCompare(lastWorked(a.curriculum)));
});

export interface Book {
  id: number;
  title: string;
  author: string | null;
  status: string;
  pages: number | null;
  page: number | null;
  calibre_id: number | null;
}

export const openBooks = hold('books', async () => {
  const data = await getJson<{ configured: boolean; books: Book[] }>('/work/api/reading');
  if (!data?.configured) return null;
  return (data.books ?? []).filter((book) => book.status === 'reading');
});

/* --- Tools ---------------------------------------------------------------- */

export interface Habit {
  id: number;
  name: string;
  cadence: 'daily' | 'weekly';
  target: number | null;
  icon: string | null;
}

export interface HabitsPayload {
  configured: boolean;
  habits: Habit[];
  /** Habit id -> run. Days for a daily habit, WEEKS for a weekly one. */
  streaks: Record<string, number>;
  /** Habit id -> every day ever ticked. */
  history: Record<string, string[]>;
  today: string;
}

export const habits = hold('habits', async () => {
  const data = await getJson<HabitsPayload>('/work/api/habits');
  return data?.configured ? data : null;
});

export interface Sketch {
  path: string;
  sha: string;
  updated?: string | null;
}

/** The sketches, newest first (?dates=1). */
export const sketches = hold('sketches', async () => {
  const data = await getJson<{ configured: boolean; files: Sketch[] }>(
    '/work/api/content?collection=notes&dates=1',
  );
  if (!data?.configured) return null;
  return [...(data.files ?? [])].sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''));
});

/* --- the sidebar's counts -------------------------------------------------- */

/**
 * The number beside a tool in the desktop sidebar: what is waiting behind it,
 * or null for nothing to show. Only tools with a "needs you" number have one.
 */
export const COUNTS: Partial<Record<ToolKey, () => Promise<number | null>>> = {
  shop: async () => (await waitingOrders())?.length ?? null,
  projects: async () => (await projectsToFix())?.length ?? null,
  writing: async () => (await writingDrafts())?.length ?? null,
  boards: async () => (await lateCards())?.length ?? null,
  cards: async () => {
    const list = await decks();
    return list ? list.reduce((sum, deck) => sum + waitingIn(deck), 0) : null;
  },
  habits: async () => {
    const data = await habits();
    if (!data) return null;
    return data.habits.filter(
      (habit) => habit.cadence === 'daily' && !(data.history[String(habit.id)] ?? []).includes(data.today),
    ).length;
  },
};
