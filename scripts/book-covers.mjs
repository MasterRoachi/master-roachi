// Cover art for the books on the reading shelves, out of the Calibre library.
//
// Calibre already holds a cover.jpg beside every book, so there is no cover
// API to call and no image to upload: the art is on the rig. Only the books
// actually on a shelf get one — 3,623 covers is a library, and shipping it
// would be a few hundred megabytes of books he is not reading.
//
// Run by hand (`npm run book-covers`) like `npm run library`, and for the
// same reason: the library is on the rig and the deploy build runs in CI.
//
// WHERE THEY GO, AND WHY THEY MOVED. These were public/work/books/<id>.webp
// until 2026-10-14, committed so that CI could deploy them. The repository is
// public, so that published the cover of every book he was reading — the same
// fault the index had, and worse, because a cover says what he is reading now
// rather than what he owns. They are rows in library_covers (migration 0014)
// now, served from /work/api/book-cover behind Access.
//
// Keyed on the Calibre id, not on books.id: the art belongs to the library
// row, so a shelf entry can be deleted and re-added without re-encoding.

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const LIBRARY = process.env.CALIBRE_LIBRARY ?? path.join(homedir(), 'Media', 'Books');
const DB = path.join(LIBRARY, 'metadata.db');
const DATABASE = 'master-roachi';
const where = process.argv.includes('--local') ? '--local' : '--remote';

// 320px wide: the grid draws them at about 150 CSS px, so this covers a
// 2x screen and no more.
const WIDTH = 320;

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('book-covers: sharp is not available — covers left as they are');
  process.exit(0);
}

if (!fs.existsSync(DB)) {
  console.log(`book-covers: no metadata.db at ${DB} — the covers in D1 are left as they are.`);
  process.exit(0);
}

/** Which books are on a shelf. Same wrangler shape as curriculums/apply.mjs. */
function d1(sql) {
  let out;
  try {
    out = execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', DATABASE, where, '--json', '--command', sql],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    // A SQL error arrives on STDOUT with an empty stderr and exit 1.
    console.error('\nwrangler could not read the database.\n');
    console.error(String(error.stdout || '').trim() || String(error.stderr || error.message).trim());
    process.exit(1);
  }
  const at = out.indexOf('[');
  if (at === -1) {
    console.error('\nwrangler returned no JSON:\n');
    console.error(out.trim());
    process.exit(1);
  }
  return JSON.parse(out.slice(at))[0]?.results ?? [];
}

const shelved = d1('select distinct calibre_id from books where calibre_id is not null');
if (shelved.length === 0) {
  console.log('book-covers: no shelved book came from the library — nothing to do.');
  process.exit(0);
}

const { DatabaseSync } = require('node:sqlite');
const calibre = new DatabaseSync(`file:${DB}?mode=ro`, { readOnly: true });
const find = calibre.prepare('select path, has_cover from books where id = ?');

/** Which covers D1 already holds, so an unchanged jpg is not re-encoded. */
const have = new Set(d1('select calibre_id from library_covers').map((r) => r.calibre_id));

let written = 0;
const missing = [];
for (const { calibre_id: id } of shelved) {
  const row = find.get(id);
  if (!row || !row.has_cover) {
    missing.push(id);
    continue;
  }
  const source = path.join(LIBRARY, row.path, 'cover.jpg');
  if (!fs.existsSync(source)) {
    missing.push(id);
    continue;
  }
  // Already held, and the source has not been re-encoded since. There is no
  // mtime to compare against in D1, so --force is how a changed cover is
  // replaced; without it this is cheap to run repeatedly.
  if (have.has(id) && !process.argv.includes('--force')) continue;

  const webp = await sharp(source)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // x'..' is SQLite's blob literal, and the only way to put bytes through
  // `wrangler d1 execute`. Twice the size as hex, for a 320px webp — tens of
  // kilobytes, for the handful of books actually on a shelf.
  d1(
    `insert into library_covers (calibre_id, webp, bytes, made_at)
       values (${id}, x'${webp.toString('hex')}', ${webp.byteLength}, '${new Date().toISOString()}')
     on conflict(calibre_id) do update set
       webp = excluded.webp, bytes = excluded.bytes, made_at = excluded.made_at`,
  );
  written += 1;
}

console.log(
  `book-covers: ${shelved.length} shelved from the library, ${written} written to D1 ` +
    `library_covers (${where.replace('--', '')})` +
    (missing.length ? `, ${missing.length} with no cover (${missing.join(', ')})` : ''),
);
