// The Calibre library, indexed for the reading page's book browser.
//
// ~/Media/Books is a Calibre library: a metadata.db holding 3,600+ books with
// their authors, series, tags and languages, and one folder per book with a
// cover.jpg in it. That is a LIBRARY and not a reading list — see the reading
// page for the difference — so none of it is imported. It is indexed, so that
// adding a book can be a search rather than retyping what is already known.
//
// Run by hand (`npm run library`), NOT from prebuild. The library lives on
// the rig and the deploy build runs in CI, where this path does not exist —
// so the index is committed, and a run without the library leaves the
// committed copy alone rather than writing an empty one.
//
// The output goes under public/work/ on purpose: Cloudflare Access matches
// the /work prefix, so the index is gated with the rest of the backend. In
// public/ it would be a listing of everything he owns, served to anyone.

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const require = createRequire(import.meta.url);
const LIBRARY = process.env.CALIBRE_LIBRARY ?? join(homedir(), 'Media', 'Books');
const DB = join(LIBRARY, 'metadata.db');
const OUT = 'public/work/library.json';

if (!existsSync(DB)) {
  console.log(`library: no metadata.db at ${DB} — leaving ${OUT} as committed.`);
  process.exit(0);
}

const { DatabaseSync } = require('node:sqlite');
// Read-only: this is his Calibre library and nothing here may write to it.
const db = new DatabaseSync(`file:${DB}?mode=ro`, { readOnly: true });

// group_concat over the link tables rather than four queries and a join in
// JS: Calibre's schema is already normalised exactly this way.
const rows = db
  .prepare(
    `select b.id,
            b.title,
            b.series_index as seriesIndex,
            b.has_cover    as hasCover,
            (select group_concat(a.name, ' & ')
               from books_authors_link bal join authors a on a.id = bal.author
              where bal.book = b.id)                        as authors,
            (select s.name
               from books_series_link bsl join series s on s.id = bsl.series
              where bsl.book = b.id limit 1)                as series,
            (select group_concat(t.name, ', ')
               from books_tags_link btl join tags t on t.id = btl.tag
              where btl.book = b.id)                        as tags,
            (select l.lang_code
               from books_languages_link bll join languages l on l.id = bll.lang_code
              where bll.book = b.id limit 1)                as language
       from books b
      order by b.author_sort, b.series_index, b.title`,
  )
  .all();

// The book's folder is NOT shipped. Covers are resolved at build time from
// metadata.db by id (see book-covers.mjs), so a path in the client index
// would be bytes nobody reads — and this file is fetched whole.
const books = rows.map((r) => ({
  id: r.id,
  title: r.title,
  authors: r.authors ?? null,
  series: r.series ?? null,
  // Calibre stores 1.0 for a book that is not in a series. Only meaningful
  // alongside a series, so it travels with one or not at all.
  seriesIndex: r.series ? r.seriesIndex : null,
  genre: r.tags ?? null,
  language: r.language ?? null,
  cover: r.hasCover ? 1 : 0,
}));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), books }));
const kb = Math.round(Buffer.byteLength(JSON.stringify({ books })) / 1024);
console.log(
  `library: ${books.length} books -> ${OUT} (${kb} kB), ` +
    `${books.filter((b) => b.series).length} in series, ` +
    `${books.filter((b) => b.cover).length} with covers`,
);
