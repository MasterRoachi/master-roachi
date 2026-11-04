// /share/ohana — the curriculums, read and studied from Ohana.
//
// Ohana is the household app. A curriculum marked his, hers or both
// (`curriculums.audience`, migration 0021) is shown there, and can be ticked and
// reviewed there. "Both" is one shared progress, by his ruling: there is no
// per-person state.
//
// Everything that changes state goes through worker/curriculum-ops.ts, the same
// functions the /work dashboard uses, so ticking a lesson or answering a card
// means exactly the same thing from either app. FSRS stays here; Ohana never
// schedules a card. Dates are stamped here in localDay(); Ohana sends none.
//
// Reached with an Access service token. The token is VERIFIED (worker/access.ts),
// not merely looked for, and an unverified request gets the 404 page, the same
// answer as a path that was never there.

import { BUTTONS, type Card } from '../lib/cards';
import { accessTokenValid } from './access';
import { answerWrites, deckCounts, setLessonDone, studyQueue } from './curriculum-ops';
import { localDay, type D1Database } from './db';

export interface ShareEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB?: D1Database;
  /** Access team domain, e.g. `example.cloudflareaccess.com`. Worker secret. */
  OHANA_ACCESS_TEAM?: string;
  /** The Audience tag of the Access application covering /share/ohana. Worker secret. */
  OHANA_ACCESS_AUD?: string;
}

const PREFIX = '/share/ohana';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const fail = (status: number, error: string) => json({ error }, status);

interface Shared {
  id: number;
  name: string;
  audience: 'his' | 'hers' | 'both';
  status: string;
  new_per_day: number | null;
}

async function sharedCurriculum(db: D1Database, id: unknown): Promise<Shared | null> {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  return db
    .prepare(
      `select id, name, audience, status, new_per_day from curriculums
        where id = ?1 and audience is not null`,
    )
    .bind(n)
    .first<Shared>();
}

/** One curriculum in the shape Ohana reads. */
async function payload(db: D1Database, c: Shared) {
  const [modules, lessons, sources, counts] = await Promise.all([
    db
      .prepare(`select id, name, position from modules where curriculum_id = ?1 order by position, id`)
      .bind(c.id)
      .all<{ id: number; name: string; position: number }>(),
    db
      .prepare(
        `select l.module_id, l.name, l.position, l.done_on, l.on_route, l.detail
           from lessons l join modules m on m.id = l.module_id
          where m.curriculum_id = ?1 order by l.position, l.id`,
      )
      .bind(c.id)
      .all<{
        module_id: number;
        name: string;
        position: number;
        done_on: string | null;
        on_route: number;
        detail: string | null;
      }>(),
    db
      .prepare(
        `select title, url, note from sources
          where curriculum_id = ?1 and lesson_id is null order by position, id`,
      )
      .bind(c.id)
      .all<{ title: string; url: string | null; note: string | null }>(),
    deckCounts(db, c.id),
  ]);

  const byModule = new Map<number, unknown[]>();
  for (const { module_id, ...lesson } of lessons.results) {
    if (!byModule.has(module_id)) byModule.set(module_id, []);
    byModule.get(module_id)!.push(lesson);
  }

  return {
    id: c.id,
    name: c.name,
    audience: c.audience,
    status: c.status,
    new_per_day: c.new_per_day,
    due_cards: counts.due,
    new_cards: counts.fresh,
    modules: modules.results.map((m) => ({
      name: m.name,
      position: m.position,
      lessons: byModule.get(m.id) ?? [],
    })),
    sources: sources.results.map((s) => ({ title: s.title, url: s.url ?? '', note: s.note ?? '' })),
  };
}

/** Handles /share/ohana/*, or returns null for any other path. */
export async function shareOhana(
  request: Request,
  env: ShareEnv,
  route: string,
  fetcher: typeof fetch = fetch,
): Promise<Response | null> {
  if (route !== PREFIX && !route.startsWith(`${PREFIX}/`)) return null;

  if (!(await accessTokenValid(request, env.OHANA_ACCESS_TEAM, env.OHANA_ACCESS_AUD, fetcher))) {
    return env.ASSETS.fetch(request);
  }
  const db = env.DB;
  if (!db) return fail(503, 'no database');

  const url = new URL(request.url);
  const path = route.slice(PREFIX.length);

  try {
    if (path === '/curriculums' && request.method === 'GET') {
      const rows = await db
        .prepare(
          `select id, name, audience, status, new_per_day from curriculums
            where audience is not null order by position, id`,
        )
        .all<Shared>();
      return json({ curriculums: await Promise.all(rows.results.map((c) => payload(db, c))) });
    }

    if (path === '/lessons/done' && request.method === 'POST') {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body) return fail(400, 'malformed body');
      const c = await sharedCurriculum(db, body.curriculum_id);
      if (!c) return fail(404, 'no such shared curriculum');
      if (typeof body.done !== 'boolean') return fail(400, 'done must be true or false');

      // Names, not ids: a rebuild re-creates every lesson with a new id, and
      // module + lesson name is the identity that survives one.
      const lesson = await db
        .prepare(
          `select l.id, l.done_on from lessons l join modules m on m.id = l.module_id
            where m.curriculum_id = ?1 and m.name = ?2 and l.name = ?3`,
        )
        .bind(c.id, String(body.module ?? ''), String(body.lesson ?? ''))
        .first<{ id: number; done_on: string | null }>();
      if (!lesson) return fail(404, 'no such lesson');

      // Idempotent: asking for the state it is already in changes nothing, so
      // a retried request cannot move a done date.
      if (Boolean(lesson.done_on) !== body.done) {
        await setLessonDone(db, lesson.id, body.done, localDay());
      }
      return json(await payload(db, c));
    }

    if (path === '/cards/due' && request.method === 'GET') {
      const c = await sharedCurriculum(db, url.searchParams.get('curriculum_id'));
      if (!c) return fail(404, 'no such shared curriculum');
      const asked = Number(url.searchParams.get('limit') ?? 20);
      const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, 100) : 20;
      const cards = await studyQueue(db, c.id, limit);
      return json({
        cards: cards.map((k) => ({
          id: k.id,
          kind: k.kind,
          front: k.front,
          back: k.back,
          reading: k.reading,
          extra: k.extra,
        })),
      });
    }

    if (path === '/cards/review' && request.method === 'POST') {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body) return fail(400, 'malformed body');
      // Two buttons, his ruling: Again (1) and Good (3), nothing between.
      const button = BUTTONS.find((b) => b.rating === body.rating);
      if (!button) return fail(400, 'rating must be 1 (again) or 3 (good)');

      const id = Number(body.card_id);
      if (!Number.isInteger(id)) return fail(400, 'which card');
      const card = await db
        .prepare(
          `select k.* from cards k join curriculums c on c.id = k.curriculum_id
            where k.id = ?1 and c.audience is not null`,
        )
        .bind(id)
        .first<Card>();
      if (!card) return fail(404, 'no such card');
      if (card.unlocked_on === null) return fail(409, 'that card is still locked');

      const now = new Date();
      await db.batch(answerWrites(db, card, button.rating, now, localDay(now)));
      return json({ ok: true });
    }

    return fail(404, 'no such endpoint');
  } catch (error) {
    return fail(500, error instanceof Error ? error.message : 'failed');
  }
}
