// The Sketchpad's sketches, kept in D1 (his call, 2026-11-11).
//
// They were files in notes/, committed to the repository through the content
// API like any post. The repository is public, so a sketch was published the
// moment it was saved. Now they live in the `sketches` table (migration 0022)
// and never reach GitHub.
//
// THE API DID NOT CHANGE. The Sketchpad, the book sketches in Reading and the
// tools home all still call /work/api/content with collection=notes, by path
// (notes/<slug>.svg), and get back the same shapes the GitHub path gave them:
// a list of { path, sha, updated }, a file of { path, sha, text }, and
// { saved, path } on a save. So none of them needed changing, and book_notes
// still links a book to a path. This answers before the GitHub code is
// reached, and only for that one collection.
//
// `sha` is a SHA-256 of the text, standing in for the blob sha: sent back on
// save, it must match what is stored, so a save over a newer version is
// refused with 409 exactly as GitHub refused it.

import { collectionFor, newPath, pathAllowed } from '../lib/collections';
import { slugify } from './github';
import type { D1Database } from './db';

/** Generous for a page of strokes; the largest real sketch so far is about 4 KB. */
const LIMIT = 2_000_000;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function hash(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The answer for a content-API request about sketches, or null when the
 * request is about any other collection (and goes on to GitHub as before).
 * The caller has already checked Access.
 */
export async function sketchesApi(request: Request, url: URL, db: D1Database | undefined): Promise<Response | null> {
  let body: { collection?: unknown; path?: unknown; title?: unknown; text?: unknown; sha?: unknown } | null = null;
  if (request.method === 'POST') {
    body = await request.clone().json().catch(() => null);
    if (body?.collection !== 'notes') return null;
  } else if (url.searchParams.get('collection') !== 'notes') {
    return null;
  }

  const collection = collectionFor('notes');
  if (!collection) return null;
  if (!db) return json({ configured: false, files: [] }, 200);

  if (request.method === 'GET') {
    const wanted = url.searchParams.get('path');
    if (wanted === null) {
      // Newest first, with the date the list always asked GitHub for.
      const { results } = await db
        .prepare('select path, sha, updated_at from sketches order by updated_at desc, path')
        .all<{ path: string; sha: string; updated_at: string }>();
      return json(
        { configured: true, files: results.map((row) => ({ path: row.path, sha: row.sha, updated: row.updated_at })) },
        200,
      );
    }
    const path = pathAllowed(collection, wanted);
    if (!path) return json({ error: 'not a path in this collection' }, 400);
    const row = await db
      .prepare('select path, sha, svg from sketches where path = ?1')
      .bind(path)
      .first<{ path: string; sha: string; svg: string }>();
    if (!row) return json({ error: 'no such sketch' }, 404);
    return json({ configured: true, file: { path: row.path, sha: row.sha, text: row.svg } }, 200);
  }

  if (request.method === 'POST') {
    if (!body) return json({ error: 'malformed body' }, 400);
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text.trim()) return json({ error: 'nothing to save' }, 400);
    if (text.length > LIMIT) return json({ error: 'too big to save' }, 400);

    const path =
      pathAllowed(collection, body.path) ?? pathAllowed(collection, newPath(collection, slugify(String(body.title ?? ''))));
    if (!path) return json({ error: 'need a usable title' }, 400);

    const stored = await db
      .prepare('select sha from sketches where path = ?1')
      .bind(path)
      .first<{ sha: string }>();
    const sent = typeof body.sha === 'string' && body.sha ? body.sha : null;
    // As GitHub had it: a new sketch must not land on an old one, and an
    // edit must be of the version that is stored.
    if (stored ? sent !== stored.sha : sent !== null) {
      return json({ error: 'conflict: it changed since it was opened' }, 409);
    }

    const sha = await hash(text);
    const now = new Date().toISOString();
    await db
      .prepare(
        `insert into sketches (path, svg, sha, created_at, updated_at) values (?1, ?2, ?3, ?4, ?4)
         on conflict(path) do update set svg = ?2, sha = ?3, updated_at = ?4`,
      )
      .bind(path, text, sha, now)
      .run();
    return json({ saved: true, path, sha }, 200);
  }

  return json({ error: 'method not allowed' }, 405);
}
