import { upNext } from './pursuits';

// The "what should I play next" poll.
//
// Deliberately free of node: imports — this module is shared between the
// Next.js page and the Cloudflare Worker in worker/, and the Worker has no
// filesystem.
//
// The options are not a separate list to maintain. They are the queue in
// lib/pursuits.ts, which is the honest framing: these are games actually lined
// up, and visitors choose the order. Inventing a second list would mean
// promising to play things that were never on it.

/**
 * Changing this starts a fresh poll and abandons the old tally, since votes
 * are stored under it. Bump it when the queue changes enough that old votes
 * no longer mean anything.
 */
export const POLL_ID = 'play-next-1';

export interface Candidate {
  id: string;
  title: string;
}

/**
 * A stable key for a title. Votes are stored under this, so it must not drift:
 * renaming a game in the queue starts its count over, which is correct — it is
 * a different entry — but retitling the same game loses its votes.
 */
export function candidateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const pollCandidates: Candidate[] = upNext.map((game) => ({
  id: candidateId(game.title),
  title: game.title,
}));

export interface PollState {
  /** False when no KV namespace is bound, so the page can hide the vote UI. */
  configured: boolean;
  counts: Record<string, number>;
  /** The current visitor's choice, if they have one. */
  yours: string | null;
}
