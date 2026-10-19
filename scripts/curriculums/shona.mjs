// Shona — zero to mastery, Standard Shona. The plan, and every ruling, is in
// scripts/curriculums/shona.md; this file is the structure. The material is
// in shona-detail.json and the cards in shona-cards.json, keyed by lesson name.
//
//   npm run curriculum shona            # the live database
//
// THE RULE FOR THIS ONE: every Shona form, tone and gloss in a lesson is taken
// from the FSI Shona Basic Course or Hazel Carter's Shona Language Course,
// read from the page images — never from memory. FSI is Manyika-based (its
// foreword says so) and the standard is Zezuru-based, so a lesson says which
// is which. Built a stage at a time; only what is written is here.

import detail from './shona-detail.json' with { type: 'json' };
import cards from './shona-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/shona.md';
const NAME = 'Shona';

const q = (value) =>
  value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`;

const NOW = new Date().toISOString();
const CURRICULUM = `(select id from curriculums where name = ${q(NAME)})`;
/** The lesson just inserted. The other scripts use the same trick. */
const LESSON = '(select max(id) from lessons)';

/** Every key asked for, so a stray one in a data file can be found. */
const askedDetail = new Set();
const askedCards = new Set();
const missing = [];

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

/**
 * A card's natural key, which is what the database matches on: curriculum,
 * kind and front. Two lessons claiming the same one is a silent bug -- the
 * insert is `where not exists`, so the second claim does not fail, it just
 * quietly re-points the card at the later lesson. Caught here instead.
 */
const claimed = new Map();
const twiceClaimed = [];

function cardsFor(name) {
  askedCards.add(name);
  const list = cards[name] ?? [];
  for (const card of list) {
    const key = `${card.kind}\u0000${card.front}`;
    if (claimed.has(key)) twiceClaimed.push([card.front, claimed.get(key), name]);
    else claimed.set(key, name);
  }
  return list;
}

/**
 * A lesson is either a bare name or [name, sources]. Sources are per-lesson
 * rows in `sources`; the curriculum's OWN list (lesson_id is null) is
 * dashboard-owned and no script regenerates it.
 */
const nameOf = (lesson) => (Array.isArray(lesson) ? lesson[0] : lesson);
const sourcesOf = (lesson) => (Array.isArray(lesson) ? (lesson[1] ?? []) : []);

const FSI_TEXT = {
  title: 'FSI Shona Basic Course — student text',
  url: 'https://fsi-language-courses-media.nyc3.cdn.digitaloceanspaces.com/languages/Shona/Basic/FSI%20-%20Shona%20Basic%20Course%20-%20Student%20Text.pdf',
  note: 'Stevick, with Mr and Mrs Mataranyika, 1965. Public domain. Manyika-based.',
};
const fsiUnit = (n) => ({
  title: `FSI Shona Basic Course — Unit ${n} recording`,
  url: `https://fsi-language-courses-media.nyc3.cdn.digitaloceanspaces.com/languages/Shona/Basic/FSI%20-%20Shona%20Basic%20Course%20-%20Unit%20${String(n).padStart(2, '0')}.mp3`,
  note: 'The recording for this unit. Listen before reading.',
});
const CARTER = {
  title: 'Hazel Carter, Shona Language Course, Books I–III (1986)',
  url: 'https://digital.library.wisc.edu/1711.dl/B75BIG2GUDWCL8G',
  note: 'Zezuru, tone-marked: the standard forms. Free to read online; in copyright.',
};

const stages = [
  {
    name: 'Stage 1 · The sounds, tone, and greeting someone',
    lessons: [
      ['How this curriculum works', [FSI_TEXT, fsiUnit(1), CARTER]],
      ['Stress: the next-to-last syllable', [FSI_TEXT, fsiUnit(1)]],
      ['High and low tone', [FSI_TEXT, fsiUnit(1), CARTER]],
      ['Reading the tone marks', [FSI_TEXT, fsiUnit(1), CARTER]],
      ['The w-sounds: ngw, mw, pw', [FSI_TEXT, fsiUnit(1)]],
      ['The letter v, and vh and w', [FSI_TEXT, fsiUnit(1)]],
      ['The whistled sounds: zv and sv', [FSI_TEXT, fsiUnit(1), CARTER]],
      ['The heavy h, and mh and nh', [FSI_TEXT, fsiUnit(1), fsiUnit(2)]],
      ['The dialect marks in FSI', [FSI_TEXT, fsiUnit(1), CARTER]],
      ['Good morning', [FSI_TEXT, fsiUnit(1), CARTER]],
      ['A tone that changes in the sentence', [FSI_TEXT, fsiUnit(1), fsiUnit(2)]],
      ['Asking after the children', [FSI_TEXT, fsiUnit(1), fsiUnit(2)]],
      ['Forms of address', [FSI_TEXT, fsiUnit(2)]],
      ['A low raised after a high', [FSI_TEXT, fsiUnit(2)]],
      ['I slept, you slept, they slept', [FSI_TEXT, fsiUnit(2)]],
      ['Saying it gently: zvangu, zvavo, zvayo', [FSI_TEXT, fsiUnit(2)]],
      ['Concord: the first look', [FSI_TEXT, fsiUnit(2)]],
      ['Drilling: substitution, and the notched card', [FSI_TEXT, fsiUnit(2)]],
      ['Good afternoon: spending the day', [FSI_TEXT, fsiUnit(3), CARTER]],
      ['High verbs and low verbs', [FSI_TEXT, fsiUnit(3)]],
      ['"If you also": the polite return', [FSI_TEXT, fsiUnit(3), CARTER]],
      ['The plural of respect', [FSI_TEXT, fsiUnit(3)]],
      ['Sons, daughters, girls and boys', [FSI_TEXT, fsiUnit(4)]],
      ['Noun classes: the table', [FSI_TEXT, fsiUnit(4)]],
      ['Which "they slept"?', [FSI_TEXT, fsiUnit(4)]],
      ['The pro-verbs: how, like that, like this', [FSI_TEXT, fsiUnit(4)]],
      ['Leaving, thanks, and getting by', [FSI_TEXT, CARTER]],
      ['Greeting for real: practice conversations', [FSI_TEXT, fsiUnit(4)]],
    ],
  },
  {
    name: 'Stage 2 · Who, where, when, and how many',
    lessons: [
      ['Meeting on the road: who are you?', [FSI_TEXT, fsiUnit(5)]],
      ['Where do you live?', [FSI_TEXT, fsiUnit(5)]],
      ['The -no- tense: now, usually, or later', [FSI_TEXT, fsiUnit(5)]],
      ['Subject prefixes for every class', [FSI_TEXT, fsiUnit(5)]],
      ['The tones of the -no- tense', [FSI_TEXT, fsiUnit(5)]],
      ['What do you do? Work and its verbs', [FSI_TEXT, fsiUnit(5)]],
      ['Places: in, at, to', [FSI_TEXT, fsiUnit(5)]],
      ['"Where?" questions', [FSI_TEXT, fsiUnit(5)]],
      ['When did you come?', [FSI_TEXT, fsiUnit(6)]],
      ['The -ka- tense: yesterday or before', [FSI_TEXT, fsiUnit(6)]],
      ['The days of the week', [FSI_TEXT, fsiUnit(6)]],
      ['Numbers from one to ten', [FSI_TEXT, fsiUnit(6)]],
      ['Numbers agree with what they count', [FSI_TEXT, fsiUnit(6), fsiUnit(8)]],
      ['Weeks, months and years', [FSI_TEXT, fsiUnit(6)]],
      ['"Ago": the time that has ended', [FSI_TEXT, fsiUnit(6)]],
      ['-ndo- and -zo-: go and do, and do later', [FSI_TEXT, fsiUnit(6)]],
      ['A large family', [FSI_TEXT, fsiUnit(7)]],
      ['The -cha- tense: will, and still', [FSI_TEXT, fsiUnit(7)]],
      ['One-syllable verbs', [FSI_TEXT, fsiUnit(7)]],
      ['My, your, his: possessives', [FSI_TEXT, fsiUnit(7)]],
      ['Its, of it: possessives for every class', [FSI_TEXT, fsiUnit(7)]],
      ['At the store: what would you like?', [FSI_TEXT, fsiUnit(8)]],
      ['The -nga- tense: can, may, would like', [FSI_TEXT, fsiUnit(8)]],
      ['I, you, he, we, they', [FSI_TEXT, fsiUnit(8)]],
      ['Places one might go', [FSI_TEXT, fsiUnit(8)]],
      ['Big, small, narrow, white: strong adjectives', [FSI_TEXT, fsiUnit(7), fsiUnit(8)]],
      ['He said "I will go": reported speech', [FSI_TEXT, fsiUnit(8)]],
      ['Stage 2 in conversation', [FSI_TEXT, fsiUnit(6), fsiUnit(8)]],
    ],
  },
  {
    name: 'Stage 3 · Being, doing, this and that, and not',
    lessons: [
      ['Selling bananas', [FSI_TEXT, fsiUnit(9)]],
      ['-ri: am, is, are', [FSI_TEXT, fsiUnit(9)]],
      ['I am doing: -ri with the infinitive', [FSI_TEXT, fsiUnit(9)]],
      ['What? The ending -nyi', [FSI_TEXT, fsiUnit(9)]],
      ['This and that: the demonstratives', [FSI_TEXT, fsiUnit(9)]],
      ['How much is this one?', [FSI_TEXT, fsiUnit(9)]],
      ['Looking for someone', [FSI_TEXT, fsiUnit(10)]],
      ['The past of today', [FSI_TEXT, fsiUnit(10)]],
      ['What did you do today?', [FSI_TEXT, fsiUnit(10)]],
      ['The -i- tense: used to, and would like', [FSI_TEXT, fsiUnit(10)]],
      ['Which path goes to town?', [FSI_TEXT, fsiUnit(11)]],
      ['Relative verbs: the one that …', [FSI_TEXT, fsiUnit(11)]],
      ['Adjectives that are verbs', [FSI_TEXT, fsiUnit(11)]],
      ['It is, that is the one: ndi-', [FSI_TEXT, fsiUnit(11)]],
      ['Who is doing it?', [FSI_TEXT, fsiUnit(11)]],
      ['I don\'t speak Shona well', [FSI_TEXT, fsiUnit(12)]],
      ['Not: the negative of -no-', [FSI_TEXT, fsiUnit(12)]],
      ['Can\'t, and don\'t want to', [FSI_TEXT, fsiUnit(12)]],
      ['Stage 3 in conversation', [FSI_TEXT, fsiUnit(10), fsiUnit(11), fsiUnit(12)]],
    ],
  },
];

const out = [
  '-- Generated by scripts/curriculums/shona.mjs. Read before running.',
  '-- Apply it with `npm run curriculum shona`, which carries ticks,',
  "-- detail typed at the dashboard and every card's review history across the",
  '-- rebuild below. Running this file through wrangler by hand discards them.',
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
  // ON DELETE CASCADE would cover it wherever foreign keys are enforced -- D1
  // enforces them, node:sqlite does not -- so it is written out rather than
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

  stage.lessons.forEach((lesson, l) => {
    const name = nameOf(lesson);
    out.push(
      `insert into lessons (module_id, name, position, on_route, detail)\n` +
        `  values ((select max(id) from modules), ${q(name)}, ${l + 1}, 1, ${q(detailFor(name))});`,
    );

    sourcesOf(lesson).forEach((source, s) => {
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

if (twiceClaimed.length) {
  console.error(`\n${twiceClaimed.length} card(s) are claimed by two lessons:`);
  for (const [front, first, second] of twiceClaimed) {
    console.error(`  · ${front}  —  ${first}  and  ${second}`);
  }
  console.error('\nA card belongs to one lesson. Nothing printed.');
  process.exit(1);
}

if (missing.length) {
  console.error(`\nNo material for ${missing.length} lesson(s):`);
  for (const name of missing) console.error(`  · ${name}`);
  console.error('\nEvery lesson teaches its point in full. Nothing printed.');
  process.exit(1);
}
for (const key of strayDetail) console.error(`! shona-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! shona-cards.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const sources = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, lesson) => k + sourcesOf(lesson).length, 0),
  0,
);
const cardCount = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, lesson) => k + (cards[nameOf(lesson)]?.length ?? 0), 0),
  0,
);
console.error(
  `modules: ${stages.length}  lessons: ${lessons}  cards: ${cardCount}  lesson sources: ${sources}`,
);
