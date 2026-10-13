// Gets a curriculum from this directory into D1 — the step that was never
// written down.
//
//   npm run curriculum japanese            # the live database
//   npm run curriculum all
//   npm run curriculum godot -- --dry-run  # write the SQL, execute nothing
//   npm run curriculum godot -- --local    # the wrangler dev database
//
// Every scripts/curriculums/<name>.mjs prints SQL and executes nothing, which
// is the right call — the SQL is worth reading before it runs. But what to do
// with the output was in no npm script, no line of DEPLOY.md and no curriculum
// document, and the cost of that showed up in the database: Odin sat finished
// in the repo and absent from the site for three days, and Drawing's 64
// lessons were live with every `detail` null, a week after the detail was
// written and committed. Work that is generated and never applied is work that
// did not happen.
//
// WHY A SCRIPT AND NOT A LINE IN DEPLOY.MD. A rebuild is `delete from lessons`
// + `delete from modules` + re-insert, so it throws away everything the
// dashboard writes and the script cannot know: ticks, route changes, detail
// typed into the editor, modules and lessons added by hand. Writing down
// `wrangler d1 execute --file` would have been writing down a way to lose
// them, and it would have stayed safe exactly as long as nothing was ticked.
// So the order here is: read what the database knows, rebuild, put it back.
//
// What survives a rebuild, and why:
//
//   done_on   always restored. The script has no business owning a date it
//             cannot know. Matched on module name + lesson name, because ids
//             are new after a rebuild and names are the only stable identity.
//   on_route  always restored, same reasoning — taking a fork off the route
//             is a decision made at the dashboard, not here.
//   detail    the repo wins where it has any, because `<name>-detail.json` is
//             the source of truth and editing it has to be able to change a
//             lesson. Where the rebuild leaves detail null, anything typed at
//             the dashboard is kept. Overwrites are counted and reported
//             rather than done quietly.
//   sources   a build script owns the rows that name a lesson and deletes its
//             own on a rebuild. It does NOT own the rows where `lesson_id` is
//             null: those are the curriculum's own reading list, the sixteen
//             rows for Japanese, Greek and Odin exist in no script and nothing
//             could regenerate them, so a rebuild leaves them alone. See
//             migration 0009.
//
// LESSON NAMES MUST BE UNIQUE WITHIN A CURRICULUM, and this script refuses to
// apply one where they are not. `<name>-detail.json` is keyed by lesson name
// alone — not module plus name — so two lessons called "Review" are one entry:
// they would show identical material, and editing either at the dashboard
// would rewrite both. That was harmless while the curriculums were small and
// is not while they are being written out to teach a subject from nothing,
// where "Review" and "Shadowing" and "Drills" want to appear in every module.
//
// Not atomic, and it cannot be: D1 rejects an explicit BEGIN inside execute.
// The mitigation is that the SQL is rehearsed in full against a throwaway
// SQLite database built from migrations/ before the remote is touched, so it
// fails here rather than half way through the real one. The composed file is
// left on disk either way, so a half-applied rebuild can be re-run.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const MIGRATIONS = join(ROOT, 'migrations');
const DATABASE = 'master-roachi';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
const dryRun = flags.has('--dry-run');
const local = flags.has('--local');
const where = local ? '--local' : '--remote';

const q = (value) => `'${String(value).replace(/'/g, "''")}'`;
/** module name + lesson name, the only identity that survives a rebuild. */
const key = (module, lesson) => `${module}\u0000${lesson}`;

const scripts = readdirSync(HERE)
  .filter((f) => f.endsWith('.mjs') && f !== 'apply.mjs')
  .map((f) => f.replace(/\.mjs$/, ''))
  .sort();

if (targets.length === 0) {
  console.error('Which curriculum? One of:\n');
  for (const s of scripts) console.error(`  ${s}`);
  console.error('\n…or `all`. Add --dry-run to compose the SQL without executing it.');
  process.exit(1);
}

const wanted = targets.includes('all') ? scripts : targets;
const unknown = wanted.filter((w) => !scripts.includes(w));
if (unknown.length) {
  console.error(`No such curriculum: ${unknown.join(', ')}`);
  console.error(`Have: ${scripts.join(', ')}`);
  process.exit(1);
}

/** Run wrangler and hand back the rows, or die loudly. */
function d1(sql) {
  let out;
  try {
    out = execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', DATABASE, where, '--json', '--command', sql],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    // A SQL error comes back on STDOUT as {"error":{"text":…}} with exit 1 and
    // an empty stderr, so reporting only stderr reports nothing at all. Found
    // by pointing this at a database with no tables in it.
    console.error('\nwrangler could not read the database.\n');
    console.error(String(error.stdout || '').trim() || String(error.stderr || error.message).trim());
    process.exit(1);
  }
  // --json still prints a banner on some versions, so find the payload rather
  // than trusting the whole of stdout to be JSON.
  const at = out.indexOf('[');
  if (at === -1) {
    console.error('\nwrangler returned no JSON:\n');
    console.error(out.trim());
    process.exit(1);
  }
  try {
    return JSON.parse(out.slice(at))[0]?.results ?? [];
  } catch {
    console.error('\nCould not parse what wrangler returned:\n');
    console.error(out.slice(at, at + 2000));
    process.exit(1);
  }
}

/* 1. Generate, and rehearse against a throwaway database.
 *
 * The rehearsal is not only a syntax check. It is also how the new module and
 * lesson set is known exactly — reading it back out of SQLite rather than
 * regex-parsing the script's own output, which would break on the first
 * lesson whose detail contains `');`. The curriculum's own name comes from
 * here too, so this file holds no mapping of script to curriculum that could
 * drift from the scripts. */
function prepare(name) {
  const script = join(HERE, `${name}.mjs`);
  let sql;
  try {
    sql = execFileSync('node', [script], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      // The script's own counts and its "no detail for:" warnings are the
      // first thing worth seeing, so they go straight to the terminal.
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  } catch (error) {
    console.error(`\n${name}.mjs failed. Nothing applied.`);
    process.exit(1);
  }

  const db = new DatabaseSync(':memory:');
  try {
    for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
      db.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
    }
    db.exec(sql);
  } catch (error) {
    console.error(`\n${name}.mjs printed SQL that does not run: ${error.message}`);
    console.error('Nothing applied.');
    process.exit(1);
  }

  const curriculums = db.prepare('select name from curriculums').all();
  if (curriculums.length !== 1) {
    console.error(`\n${name}.mjs built ${curriculums.length} curriculums; expected exactly one.`);
    process.exit(1);
  }
  // The detail text itself, not just whether there is any: an overwrite is
  // only worth reporting when the text actually differs, and comparing here
  // costs nothing.
  const rows = db
    .prepare(
      `select m.name as module, l.name as lesson, l.detail
         from modules m join lessons l on l.module_id = m.id
        order by m.position, l.position`,
    )
    .all();
  db.close();

  const built = new Map();
  const twice = [];
  for (const row of rows) {
    const k = key(row.module, row.lesson);
    if (built.has(k)) twice.push(row);
    built.set(k, row);
  }

  /* A name used twice anywhere in the curriculum, which the detail file cannot
   * represent. Refused rather than warned about: the damage is silent in both
   * directions — two lessons showing one lesson's material, and a dashboard
   * edit to either rewriting both — and renaming one of them is a two-second
   * fix in the script that is about to be run again anyway. */
  const seenName = new Map();
  for (const row of rows) {
    seenName.set(row.lesson, (seenName.get(row.lesson) ?? 0) + 1);
  }
  const repeated = [...seenName].filter(([, n]) => n > 1);
  if (repeated.length && existsSync(join(HERE, `${name}-detail.json`))) {
    console.error(`\n${name}.mjs uses ${repeated.length} lesson name(s) more than once:`);
    for (const [lesson, n] of repeated.slice(0, 12)) {
      console.error(`  · ${JSON.stringify(lesson)} ×${n}`);
    }
    if (repeated.length > 12) console.error(`  … and ${repeated.length - 12} more`);
    console.error(
      `\n${name}-detail.json is keyed by lesson name, so those share one entry.` +
        `\nMake the names distinct. Nothing applied.`,
    );
    process.exit(1);
  }

  return { name, curriculum: curriculums[0].name, sql, built, twice, repeated };
}

console.error(`Reading ${wanted.length === 1 ? wanted[0] : `${wanted.length} curriculums`}…\n`);
const plans = wanted.map(prepare);

/* 2. Apply in the order they already sit in, so a rebuild cannot reorder the
 *    route. A curriculum the database has never seen takes max(position) + 1,
 *    which is the one case where applying order decides it. */
if (plans.length > 1) {
  const live = new Map(d1('select name, position from curriculums').map((r) => [r.name, r.position]));
  plans.sort(
    (a, b) =>
      (live.get(a.curriculum) ?? Number.MAX_SAFE_INTEGER) -
        (live.get(b.curriculum) ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name),
  );
}

const scratch = mkdtempSync(join(tmpdir(), 'curriculum-'));
let failed = 0;

for (const plan of plans) {
  const { name, curriculum, built, twice, repeated } = plan;
  console.error(`\n── ${curriculum}  (${name}.mjs)`);

  /* Reached only where there is no detail file — prepare() refuses outright
   * where there is one. Still worth saying: the day this curriculum grows a
   * detail file is the day it stops applying, and finding that out then is
   * finding it out at the worst moment. */
  if (repeated.length) {
    console.error(
      `  ! ${repeated.length} lesson name(s) used more than once. No detail file yet,` +
        ` so nothing breaks today; one cannot be added until they are distinct.`,
    );
  }

  for (const row of twice) {
    console.error(`  ! two lessons named ${JSON.stringify(row.lesson)} in ${JSON.stringify(row.module)};`);
    console.error(`    a tick on either cannot be told apart and will not be carried over`);
  }

  /* 3. What the database knows and the script cannot. Names and flags only —
   *    detail text is fetched afterwards, and only for the rows that need it,
   *    rather than pulling every lesson's Markdown over the wire. */
  const live = d1(
    `select m.name as module, l.name as lesson, l.done_on,
            l.on_route, case when l.detail is null then 0 else 1 end as detailed
       from curriculums c
       join modules m on m.curriculum_id = c.id
       join lessons l on l.module_id = m.id
      where c.name = ${q(curriculum)}`,
  );

  /* The Markdown of any detail the database is holding, fetched only when
   * there is some. This is what makes the overwrite warning mean something:
   * re-applying a curriculum writes the same text back over all 64 of its
   * lessons, and a warning that fires on every rebuild hides the one case it
   * exists for — a dashboard edit about to be clobbered. */
  const liveDetail = new Map();
  if (live.some((row) => row.detailed)) {
    for (const row of d1(
      `select m.name as module, l.name as lesson, l.detail
         from curriculums c
         join modules m on m.curriculum_id = c.id
         join lessons l on l.module_id = m.id
        where c.name = ${q(curriculum)} and l.detail is not null`,
    )) {
      liveDetail.set(key(row.module, row.lesson), row.detail);
    }
  }

  const ticks = [];
  const offRoute = [];
  const keepDetail = [];
  const orphans = [];
  const overwritten = [];
  const seen = new Set();
  const ambiguous = new Set();

  for (const row of live) {
    const k = key(row.module, row.lesson);
    if (seen.has(k)) ambiguous.add(k);
    seen.add(k);

    const match = built.get(k);
    if (!match) {
      orphans.push(row);
      continue;
    }
    if (row.done_on) ticks.push(row);
    if (row.on_route === 0) offRoute.push(row);
    if (row.detailed) {
      // The repo wins where it has detail; the dashboard keeps the gaps.
      if (match.detail === null) keepDetail.push(row);
      else if (liveDetail.get(k) !== match.detail) overwritten.push(row);
    }
  }

  // A tick on a name that appears twice cannot be put back on the right row.
  const carried = (list) => list.filter((row) => !ambiguous.has(key(row.module, row.lesson)));
  const dropped = ticks.length - carried(ticks).length;

  if (live.length === 0) {
    console.error(`  new to the database — ${built.size} lessons`);
  } else {
    console.error(
      `  live: ${live.length} lessons · ` +
        `${ticks.length} ticked · ${offRoute.length} off route · ` +
        `rebuilding to ${built.size}`,
    );
  }

  /* 4. Rows that exist only in the database. A rebuild deletes them and no
   *    script can put them back, so they are listed and the SQL that would
   *    re-create them is written out beside the apply file. Warn and carry on
   *    is the chosen behaviour; losing them silently is not. */
  if (orphans.length) {
    console.error(`\n  ${orphans.length} row(s) exist only in the database and will be deleted:`);
    for (const row of orphans.slice(0, 12)) {
      const marks = [row.done_on && `done ${row.done_on}`, row.on_route === 0 && 'off route', row.detailed && 'has detail']
        .filter(Boolean)
        .join(', ');
      console.error(`    · ${row.module} › ${row.lesson}${marks ? `  (${marks})` : ''}`);
    }
    if (orphans.length > 12) console.error(`    … and ${orphans.length - 12} more`);
  }

  if (overwritten.length) {
    console.error(
      `\n  ${overwritten.length} lesson(s) carry detail that differs from the script's;` +
        ` the repo's wins. Edit ${name}-detail.json to keep a change:`,
    );
    for (const row of overwritten.slice(0, 12)) {
      console.error(`    · ${row.module} › ${row.lesson}`);
    }
    if (overwritten.length > 12) console.error(`    … and ${overwritten.length - 12} more`);
  }
  if (dropped) {
    console.error(`\n  ${dropped} tick(s) sit on an ambiguous name and cannot be carried over.`);
  }

  /* 5. Compose: the rebuild, then everything being put back. */
  const restore = [];
  const target = (row) =>
    `name = ${q(row.lesson)} and module_id = (select m.id from modules m ` +
    `join curriculums c on c.id = m.curriculum_id ` +
    `where c.name = ${q(curriculum)} and m.name = ${q(row.module)})`;

  if (carried(ticks).length) {
    restore.push(`-- ${carried(ticks).length} tick(s), carried across the rebuild.`);
    for (const row of carried(ticks)) {
      restore.push(`update lessons set done_on = ${q(row.done_on)} where ${target(row)};`);
    }
  }
  if (carried(offRoute).length) {
    restore.push(`-- ${carried(offRoute).length} lesson(s) taken off the route at the dashboard.`);
    for (const row of carried(offRoute)) {
      restore.push(`update lessons set on_route = 0 where ${target(row)};`);
    }
  }
  if (carried(keepDetail).length) {
    const rows = carried(keepDetail);
    restore.push(`-- ${rows.length} lesson(s) whose detail was typed at the dashboard, where the`);
    restore.push(`-- script supplies none. See the detail rule in migrations/0007.`);
    for (const row of rows) {
      const text = liveDetail.get(key(row.module, row.lesson));
      if (text === undefined) continue;
      restore.push(`update lessons set detail = ${q(text)} where ${target(row)};`);
    }
  }

  const header = [
    `-- ${curriculum}, composed by scripts/curriculums/apply.mjs on ${new Date().toISOString()}.`,
    `-- Rebuilt from scripts/curriculums/${name}.mjs, then ${restore.length ? 'with' : 'with no'}`,
    `-- dashboard state put back. Do not hand-edit; re-run the script instead.`,
    '',
  ].join('\n');

  const file = join(scratch, `${name}.sql`);
  writeFileSync(file, `${header}${plan.sql}\n${restore.length ? `\n${restore.join('\n')}\n` : ''}`);

  if (orphans.length) {
    const recovery = join(scratch, `${name}-deleted.sql`);
    writeFileSync(
      recovery,
      `-- Rows that existed only in the database before this rebuild, as the\n` +
        `-- statements that would put them back. Nothing runs this; it is here so\n` +
        `-- that "warn and continue" does not mean "gone".\n\n` +
        orphans
          .map(
            (row) =>
              `-- ${row.module} › ${row.lesson}\n` +
              `insert into lessons (module_id, name, position, on_route, detail)\n` +
              `  select m.id, ${q(row.lesson)}, (select coalesce(max(position), 0) + 1 from lessons where module_id = m.id),\n` +
              `         ${row.on_route}, null\n` +
              `    from modules m join curriculums c on c.id = m.curriculum_id\n` +
              `   where c.name = ${q(curriculum)} and m.name = ${q(row.module)};` +
              (row.done_on ? `\nupdate lessons set done_on = ${q(row.done_on)} where ${target(row)};` : ''),
          )
          .join('\n\n') +
        '\n',
    );
    console.error(`  recovery for those rows: ${recovery}`);
  }

  console.error(`  SQL: ${file}`);

  if (dryRun) {
    console.error('  --dry-run, so nothing was executed.');
    continue;
  }

  /* 6. Execute. */
  try {
    execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', DATABASE, where, '--yes', '--file', file],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    failed += 1;
    console.error(`\n  FAILED against ${local ? 'the local database' : 'the live database'}.`);
    const said = String(error.stdout || '').trim() || String(error.stderr || error.message).trim();
    console.error(said.split('\n').slice(-12).join('\n'));
    console.error(`\n  The composed SQL is still at ${file} — it can be re-run.`);
    continue;
  }

  /* 7. Read it back. A rebuild that reports success and leaves the wrong
   *    number of rows is the failure worth catching, and it costs one query. */
  const after = d1(
    `select count(distinct m.id) as modules, count(l.id) as lessons,
            sum(case when l.done_on is not null then 1 else 0 end) as ticked,
            sum(case when l.on_route = 0 then 1 else 0 end) as off_route,
            sum(case when l.detail is not null then 1 else 0 end) as detailed,
            (select count(*) from sources s
              where s.curriculum_id = c.id and s.lesson_id is not null) as lesson_sources,
            (select count(*) from sources s
              where s.curriculum_id = c.id and s.lesson_id is null) as list
       from curriculums c
       join modules m on m.curriculum_id = c.id
       join lessons l on l.module_id = m.id
      where c.name = ${q(curriculum)}`,
  )[0];

  const ok = Number(after.lessons) === built.size;
  console.error(
    `  ${ok ? 'applied' : 'APPLIED, BUT'}: ${after.modules} modules · ${after.lessons} lessons · ` +
      `${after.detailed ?? 0} with detail · ${after.ticked ?? 0} ticked · ` +
      `${after.lesson_sources ?? 0} lesson sources · ${after.list ?? 0} on the curriculum's list`,
  );
  if (!ok) {
    failed += 1;
    console.error(`  expected ${built.size} lessons and the database has ${after.lessons}.`);
  }
}

console.error(
  `\n${failed ? `${failed} curriculum(s) need looking at.` : dryRun ? 'Composed, nothing executed.' : 'Done.'}`,
);
process.exit(failed ? 1 : 0);
