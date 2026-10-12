// Reading Trello from the edge.
//
// One account: the personal one, which holds Command and the three game
// boards. SensusAir is deliberately not here — it lives on a separate Trello
// login, and this site holding a token for the day job's board was a step too
// far. It arrives as a list written by the morning check-in instead. See
// SensusList in lib/work-hub.ts.
//
// This runs in the Worker and not in the page because a Trello token is a
// bearer credential for an entire account. In a static export every byte of
// the page is public, so a token in the client would be a token published on
// masterroachi.com. The page therefore gets JSON and never a credential.

import {
  bucketFor,
  isHiddenBoard,
  isWorkBoard,
  type WorkBoard,
  type WorkCard,
} from '../lib/work-hub';

const API = 'https://api.trello.com/1';

export interface TrelloCreds {
  key: string;
  token: string;
}

/** What Trello returns for a board when lists and cards are asked for inline. */
interface RawBoard {
  id: string;
  name: string;
  url: string;
  lists?: { id: string; name: string }[];
  cards?: {
    id: string;
    name: string;
    url: string;
    idList: string;
    due: string | null;
    dateLastActivity: string | null;
    labels?: { name: string }[];
  }[];
}

function qs(creds: TrelloCreds, extra: Record<string, string>): string {
  return new URLSearchParams({ key: creds.key, token: creds.token, ...extra }).toString();
}

/**
 * One request per board, not one per list.
 *
 * Asking for `lists` and `cards` inline turns what would be 1 + 6 requests per
 * board into one. With five boards across two accounts that is the difference
 * between about forty round trips and six, which matters when the whole thing
 * happens while he waits for a page.
 */
async function fetchBoard(id: string, creds: TrelloCreds): Promise<RawBoard> {
  const url =
    `${API}/boards/${id}?` +
    qs(creds, {
      fields: 'name,url',
      lists: 'open',
      list_fields: 'name',
      cards: 'open',
      card_fields: 'name,url,idList,due,dateLastActivity,labels',
    });

  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`board ${id}: ${response.status}`);
  }
  return (await response.json()) as RawBoard;
}

/** Every open board the token's owner can see. */
async function fetchBoardList(creds: TrelloCreds): Promise<{ id: string; name: string }[]> {
  const url = `${API}/members/me/boards?` + qs(creds, { fields: 'id,name', filter: 'open' });
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`board list: ${response.status}`);
  }
  return (await response.json()) as { id: string; name: string }[];
}

/**
 * Turn one raw board into the hub's shape.
 *
 * His own boards are read by bucket list, because that is where he files what
 * he is doing. A day-job board is read whole — he runs it, so every card on it
 * counts, and the lists are the team's own language rather than his three.
 */
function shape(raw: RawBoard, scope: 'mine' | 'day-job'): WorkBoard {
  const listName = new Map<string, string>();
  const listBucket = new Map<string, ReturnType<typeof bucketFor>>();

  for (const list of raw.lists ?? []) {
    listName.set(list.id, list.name);
    listBucket.set(list.id, bucketFor(list.name));
  }

  const cards: WorkCard[] = [];
  for (const card of raw.cards ?? []) {
    const bucket = listBucket.get(card.idList) ?? null;

    // On his own boards the bucket is the filter. On a day-job board there is
    // no filter at all.
    if (scope === 'mine' && !bucket) continue;

    cards.push({
      id: card.id,
      name: card.name,
      url: card.url,
      list: listName.get(card.idList) ?? '',
      bucket,
      // Unnamed colour labels are noise, so only named ones survive.
      labels: (card.labels ?? []).map((l) => l.name).filter(Boolean),
      due: card.due ?? null,
      lastActivity: card.dateLastActivity ?? null,
    });
  }

  return {
    id: raw.id,
    name: raw.name,
    url: raw.url,
    scope,
    cards,
    // Every list, bucket or not: moving a card to Done needs Done's id, and
    // Done is deliberately not a bucket.
    lists: (raw.lists ?? []).map((list) => ({
      id: list.id,
      name: list.name,
      bucket: bucketFor(list.name),
    })),
  };
}

/** Whether any list on the board is a bucket at all. */
function hasBuckets(raw: RawBoard): boolean {
  return (raw.lists ?? []).some((l) => bucketFor(l.name) !== null);
}

/**
 * Every board on the account, shaped for the hub.
 *
 * Board fetches run together rather than in sequence: they do not depend on
 * each other, and a Worker waiting on five serial Trello calls is a page that
 * takes a second to paint for no reason. A board that fails is reported by
 * name — a board that errored must never render as a board with no work on it.
 */
export async function readAccount(
  creds: TrelloCreds,
): Promise<{ boards: WorkBoard[]; unmatched: string[]; errors: string[]; seen: string[] }> {
  const errors: string[] = [];

  const list = await fetchBoardList(creds).catch((error) => {
    errors.push(`Trello unreachable (${String(error)})`);
    return null;
  });

  if (!list) return { boards: [], unmatched: [], errors, seen: [] };

  const unmatched: string[] = [];

  const settled = await Promise.all(
    list.map(async (entry) => {
      // Dropped before it is even fetched: a hidden board costs no request.
      if (isHiddenBoard(entry.name)) return null;
      try {
        const raw = await fetchBoard(entry.id, creds);
        const scope = isWorkBoard(raw.name) ? 'day-job' : 'mine';
        // Bucket names only matter on his own boards; a team board is read by
        // membership and has no reason to use them.
        if (scope === 'mine' && !hasBuckets(raw)) {
          unmatched.push(raw.name);
          return null;
        }
        return shape(raw, scope);
      } catch (error) {
        errors.push(`${entry.name}: ${String(error)}`);
        return null;
      }
    }),
  );

  // A board that uses the bucket names and has nothing in them today is a
  // clear day, and says so. A board that has never heard of them is somebody
  // else's filing and only gets its name mentioned.
  return {
    boards: settled.filter((b): b is WorkBoard => b !== null),
    unmatched: unmatched.sort(),
    errors,
    // Every board the token can reach, named — including the hidden ones and
    // the ones with no bucket list. Without it there is no way to tell "the
    // account has no such board" from "the board was filtered out".
    seen: list.map((entry) => entry.name).sort(),
  };
}

/**
 * Move a card to another list.
 *
 * The one write this hub does, and the reason it exists: the page is opened in
 * the morning to decide what today is, and deciding meant going to Trello to
 * drag three cards and coming back. "Move and finish" — This week to Today to
 * Doing to Waiting to Done — is that whole shuffle, and finishing is just a
 * move to Done.
 *
 * `pos: 'top'` because a card moved deliberately is the one being thought
 * about, and dropping it at the bottom of a list of twenty is how you move a
 * card and then cannot find it.
 *
 * Nothing else is written. No creating, no labels, no comments, no archiving:
 * Trello is still where the work is written down, and a second half-complete
 * editor for it would be a thing to keep in step with their API for no gain.
 */
export async function moveCard(
  cardId: string,
  listId: string,
  creds: TrelloCreds,
): Promise<void> {
  const url = `${API}/cards/${cardId}?` + qs(creds, { idList: listId, pos: 'top' });
  const response = await fetch(url, { method: 'PUT', headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`move: ${response.status}`);
  }
}

/**
 * Who the token actually is.
 *
 * Added because of a question nobody could answer by reading the code: North
 * Star showed cards that looked like Trello's own sample data, and the obvious
 * explanation — that this token belongs to a different Trello login than the
 * one he thinks — could not be checked from either side. The page said which
 * BOARDS it found and never which ACCOUNT it was looking at.
 *
 * One request, and it turns an argument into a fact on screen.
 */
export async function whoAmI(
  creds: TrelloCreds,
): Promise<{ username: string; fullName: string; email: string | null } | null> {
  const url = `${API}/members/me?` + qs(creds, { fields: 'username,fullName,email' });
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) return null;
  const me = (await response.json()) as {
    username?: string;
    fullName?: string;
    email?: string | null;
  };
  return {
    username: me.username ?? '?',
    fullName: me.fullName ?? '?',
    email: me.email ?? null,
  };
}
