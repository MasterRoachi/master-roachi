// Builds the Japanese curriculum.
//
// Source: scripts/curriculums/japanese.md, which is the plan and the argument.
// This file is the structure; the material is in japanese-detail.json and the
// cards are in japanese-cards.json.
//
// THREE FILES, AND WHY. The detail is Markdown full of kana, tables and ruby,
// and one unescaped backtick inside a JS template literal turns a whole script
// into a syntax error — Drawing taught that. The cards are data rather than
// prose. The sources are one or two lines each and live here, beside the
// lesson they belong to, where they can be read with it.
//
// EVERY LESSON TEACHES ITS POINT IN FULL. His rule for the whole rewrite: "the
// lesson should teach the point in full and then direct practice … the entire
// textbook doesn't need to be restated but the material should be taught
// fully". A lesson that says "see Imabi 23" is an index entry, and he does not
// want to open the sources — the material is here.
//
// WRITTEN IN STAGES. Stage 1 is written; the other ten are planned in the .md
// and are not in the database until they are written. A lesson with a name and
// no material would be exactly the index this curriculum exists to stop being.
//
// Prints SQL. Nothing is executed here — `npm run curriculum japanese`.

import detail from './japanese-detail.json' with { type: 'json' };
import cards from './japanese-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/japanese.md';
const NAME = 'Japanese';

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) =>
  value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`;

const NOW = new Date().toISOString();
const CURRICULUM = `(select id from curriculums where name = ${q(NAME)})`;
/** The lesson just inserted. The other scripts use the same trick. */
const LESSON = '(select max(id) from lessons)';

/** Every key asked for, so a stray one in a data file can be found. */
const askedDetail = new Set();
const askedCards = new Set();

function detailFor(name) {
  askedDetail.add(name);
  const text = detail[name];
  if (text === undefined) {
    // Loud rather than silent: a lesson renamed here and not in the data file
    // would otherwise quietly lose its material.
    missing.push(name);
    return null;
  }
  return text;
}

function cardsFor(name) {
  askedCards.add(name);
  return cards[name] ?? [];
}

const missing = [];

/* The stages. A lesson is [name, sources?] — the material is looked up by
 * name, and so are the cards. */
const stages = [
  {
    name: 'Stage 1 · The script and the sounds',
    lessons: [
    ['The three scripts, and what each one is for', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }]],
    ['Hiragana: あ い う え お', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: か き く け こ', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: さ し す せ そ', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: た ち つ て と', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: な に ぬ ね の', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: は ひ ふ へ ほ', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: ま み む め も', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: や ゆ よ', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: ら り る れ ろ', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Hiragana: わ を ん', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Dakuten and handakuten', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }]],
    ['Yōon: the small や ゆ よ', [{ title: 'Tofugu — Learn Hiragana', url: 'https://www.tofugu.com/japanese/learn-hiragana/' }]],
    ['The small っ, and the beat it takes'],
    ['Long vowels in hiragana'],
    ['Katakana: ア イ ウ エ オ カ キ ク ケ コ', [{ title: 'Tofugu — Learn Katakana', url: 'https://www.tofugu.com/japanese/learn-katakana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Katakana: サ シ ス セ ソ タ チ ツ テ ト', [{ title: 'Tofugu — Learn Katakana', url: 'https://www.tofugu.com/japanese/learn-katakana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Katakana: ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ', [{ title: 'Tofugu — Learn Katakana', url: 'https://www.tofugu.com/japanese/learn-katakana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Katakana: マ ミ ム メ モ ヤ ユ ヨ', [{ title: 'Tofugu — Learn Katakana', url: 'https://www.tofugu.com/japanese/learn-katakana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Katakana: ラ リ ル レ ロ ワ ヲ ン', [{ title: 'Tofugu — Learn Katakana', url: 'https://www.tofugu.com/japanese/learn-katakana/' }, { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ["Katakana's own marks: ー, and the pairs that look alike", [{ title: 'Tofugu — Learn Katakana', url: 'https://www.tofugu.com/japanese/learn-katakana/' }]],
    ['Katakana for sounds Japanese does not have', [{ title: 'Tofugu — Learn Katakana', url: 'https://www.tofugu.com/japanese/learn-katakana/' }]],
    ['The five vowels, and why they never glide'],
    ['ら行: not an L and not an R'],
    ['ふ, つ and し — where romaji lies'],
    ['Mora: every beat is the same length'],
    ['Devoiced vowels: です, した, ～ます'],
    ['Pitch accent: the four patterns', [{ title: 'OJAD — Online Japanese Accent Dictionary', url: 'https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home' }]],
    ['Heiban and odaka, and why a particle is needed to tell them apart', [{ title: 'OJAD — Online Japanese Accent Dictionary', url: 'https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home' }]],
    ['Looking up a pitch accent in OJAD', [{ title: 'OJAD — Online Japanese Accent Dictionary', url: 'https://www.gavo.t.u-tokyo.ac.jp/ojad/eng/pages/home' }, { title: 'JAccent', note: 'A free offline pitch-accent dictionary for the phone.' }]],
    ['Typing Japanese: installing and using an IME', [{ title: 'fcitx5 and mozc', url: 'https://wiki.archlinux.org/title/Fcitx5', note: 'The Arch wiki page, which is what this machine runs.' }]],
    ['Stroke order: the rules that apply to everything', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }, { title: 'WriteJapanese', url: 'https://www.writejapanese.com/', note: 'Stroke order for all 2,136 jōyō kanji.' }]],
    ['Writing kana by hand'],
    ['First listening: comprehensible input from day one', [{ title: 'Comprehensible Japanese (Yuki)', url: 'https://www.youtube.com/@cijapanese', note: 'Start at Complete Beginner.' }, { title: 'Nihongo con Teppei for Beginners', url: 'https://nihongoconteppei.com/', note: '1,400+ free episodes, three to five minutes each.' }]],
    ['First reading: Tadoku level 0', [{ title: 'Tadoku graded readers, levels 0–5', url: 'https://archive.org/details/japanese-graded-readers-level-0-5-tadoku-ask', note: 'Free, Creative Commons. Level 0 is 71 booklets.' }]],
    ],
  },
];

const out = [
  '-- Generated by scripts/curriculums/japanese.mjs. Read before running.',
  '-- Apply it with `npm run curriculum japanese`, which carries ticks, detail',
  '-- typed at the dashboard and every card\'s review history across the rebuild',
  '-- below. Running this file through wrangler by hand discards them.',
  // Rebuildable without losing its place: the row is created only if it is not
  // already there, and its modules are cleared instead. Deleting the curriculum
  // and reinserting it would take a new position at the end, and curriculum
  // order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select ${q(NAME)}, ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(NOW)}\n` +
    `  where not exists (select 1 from curriculums where name = ${q(NAME)});`,
  `update curriculums set source = ${q(SOURCE)} where name = ${q(NAME)};`,

  // Lesson-scoped sources are the script's own and go before the lessons do.
  // ON DELETE CASCADE would cover it wherever foreign keys are enforced — D1
  // enforces them, node:sqlite does not — so it is written out rather than
  // relied upon. The curriculum's own list, where lesson_id is null, is NOT
  // touched: nothing could regenerate it. See migration 0009.
  `delete from sources where lesson_id is not null and curriculum_id = ${CURRICULUM};`,

  // Lessons, then modules. Same reasoning.
  `delete from lessons where module_id in\n` +
    `  (select id from modules where curriculum_id = ${CURRICULUM});`,
  `delete from modules where curriculum_id = ${CURRICULUM};`,
  '',
  '-- CARDS ARE NEVER DELETED HERE. A card carries months of review history and',
  '-- no script can regenerate that, so the rebuild above sets lesson_id to null',
  '-- (migration 0010) and each card is matched again below by its natural key:',
  '-- curriculum, kind and front. Insert what is new, update what exists, and',
  '-- leave every scheduling column alone.',
];

stages.forEach((stage, m) => {
  out.push(
    '',
    `-- ${stage.name}`,
    `insert into modules (curriculum_id, name, position)\n` +
      `  values (${CURRICULUM}, ${q(stage.name)}, ${m + 1});`,
  );

  stage.lessons.forEach(([name, sources = []], l) => {
    out.push(
      `insert into lessons (module_id, name, position, on_route, detail)\n` +
        `  values ((select max(id) from modules), ${q(name)}, ${l + 1}, 1, ${q(detailFor(name))});`,
    );

    sources.forEach((source, s) => {
      out.push(
        `insert into sources (curriculum_id, lesson_id, title, url, note, position)\n` +
          `  values (${CURRICULUM}, ${LESSON}, ${q(source.title)}, ${q(source.url ?? null)},` +
          ` ${q(source.note ?? null)}, ${s + 1});`,
      );
    });

    for (const card of cardsFor(name)) {
      const identity =
        `curriculum_id = ${CURRICULUM} and kind = ${q(card.kind)} and front = ${q(card.front)}`;
      out.push(
        `insert into cards (curriculum_id, lesson_id, kind, front, back, reading, extra,\n` +
          `                   due, stability, difficulty, scheduled_days, learning_steps,\n` +
          `                   reps, lapses, state, last_review, unlocked_on, created_at)\n` +
          `  select ${CURRICULUM}, ${LESSON}, ${q(card.kind)}, ${q(card.front)}, ${q(card.back)},\n` +
          `         ${q(card.reading ?? null)}, ${q(card.extra ?? null)}, ${q(NOW)},\n` +
          `         0, 0, 0, 0, 0, 0, 0, null, null, ${q(NOW)}\n` +
          `  where not exists (select 1 from cards where ${identity});`,
        // Content and the lesson link are the script's; scheduling and
        // unlocked_on are the dashboard's and are not named here.
        `update cards set lesson_id = ${LESSON}, back = ${q(card.back)},\n` +
          `       reading = ${q(card.reading ?? null)}, extra = ${q(card.extra ?? null)}\n` +
          ` where ${identity};`,
      );
    }
  });
});

const strayDetail = Object.keys(detail).filter((key) => !askedDetail.has(key));
const strayCards = Object.keys(cards).filter((key) => !askedCards.has(key));

if (missing.length) {
  console.error(`\nNo material for ${missing.length} lesson(s):`);
  for (const name of missing) console.error(`  · ${name}`);
  console.error('\nEvery lesson teaches its point in full. Nothing printed.');
  process.exit(1);
}
for (const key of strayDetail) console.error(`! japanese-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! japanese-cards.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const cardCount = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, [name]) => k + (cards[name]?.length ?? 0), 0),
  0,
);
console.error(`modules: ${stages.length}  lessons: ${lessons}  cards: ${cardCount}`);
