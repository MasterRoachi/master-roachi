// Cover art for the books on the reading shelves, out of the Calibre library.
//
// Calibre already holds a cover.jpg beside every book, so there is no cover
// API to call and no image to upload: the art is on the rig. Only the books
// actually on a shelf get one — 3,623 covers is a library, and shipping it
// would be a few hundred megabytes of books he is not reading.
//
// Run by hand (`npm run book-covers`) like `npm run library`, and for the
// same reason: the library is on the rig and the deploy build runs in CI.
// Both the index and these webps are committed.
//
// GENERATED FILENAMES ARE RESERVED. public/work/books/<calibre id>.webp is
// rewritten by this script — same rule as covers.mjs and store-art.mjs, so
// nothing else may write there.

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const LIBRARY = process.env.CALIBRE_LIBRARY ?? path.join(homedir(), 'Media', 'Books');
const DB = path.join(LIBRARY, 'metadata.db');
const OUT = 'public/work/books';
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
  console.log(`book-covers: no metadata.db at ${DB} — covers left as committed.`);
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

fs.mkdirSync(OUT, { recursive: true });

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
  const target = path.join(OUT, `${id}.webp`);
  // Skip a cover that is already current: this runs on every deploy and
  // re-encoding an unchanged jpg churns the repo for nothing.
  const src = fs.statSync(source);
  if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= src.mtimeMs) continue;

  await sharp(source).resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(target);
  written += 1;
}

console.log(
  `book-covers: ${shelved.length} shelved from the library, ${written} written to ${OUT}` +
    (missing.length ? `, ${missing.length} with no cover (${missing.join(', ')})` : ''),
);
