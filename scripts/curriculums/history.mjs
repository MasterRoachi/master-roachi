// History — a world survey, from the first humans to now, in the order it
// happened and every region in each age. The plan and every ruling are in
// scripts/curriculums/history.md; this file is the structure. The material is
// in history-detail.json and the cards in history-cards.json, keyed by lesson
// name.
//
//   npm run curriculum history          # the live database
//
// THE RULE FOR THIS ONE: OpenStax World History is the order followed and the
// further reading, never text adapted (CC BY-NC-SA, and OpenStax asks that it
// not be used with AI). Lessons are written fresh. Where historians disagree,
// the lesson gives the strongest form of each reading and what would settle
// it. Built a stage at a time; only what is written is here.

import detail from './history-detail.json' with { type: 'json' };
import cards from './history-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/history.md';
const NAME = 'History';

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

const OPENSTAX_1 = {
  title: 'OpenStax, World History Vol. 1, ch. 1: Understanding the Past',
  url: 'https://openstax.org/books/world-history-volume-1/pages/1-introduction',
  note: 'Free to read. CC BY-NC-SA 4.0 — further reading, not adapted.',
};
const OPENSTAX_2 = {
  title: 'OpenStax, World History Vol. 1, ch. 2: Early Humans',
  url: 'https://openstax.org/books/world-history-volume-1/pages/2-introduction',
  note: 'Free to read. CC BY-NC-SA 4.0 — further reading, not adapted.',
};
const SMITHSONIAN = {
  title: 'Smithsonian Human Origins Program',
  url: 'https://humanorigins.si.edu/',
  note: 'Free. The species, the fossils and the evidence, by the National Museum of Natural History.',
};
const HERODOTUS = {
  title: 'Herodotus, The History, tr. G. C. Macaulay (1890), vol. 1',
  url: 'https://www.gutenberg.org/ebooks/2707',
  note: 'Public domain, Project Gutenberg.',
};
const FORDHAM = {
  title: 'Internet Ancient History Sourcebook (Fordham)',
  url: 'https://sourcebooks.fordham.edu/ancient/asbook.asp',
  note: 'Free primary sources, by period.',
};
const KHAN = {
  title: 'Khan Academy, World History',
  url: 'https://www.khanacademy.org/humanities/world-history',
  note: 'Free overview videos.',
};

const stages = [
  {
    name: 'Stage 1 · How history is known, and the first humans',
    lessons: [
      ['What history is', [OPENSTAX_1, HERODOTUS]],
      ['The world at a glance', [OPENSTAX_1]],
      ['Evidence: primary and secondary sources', [OPENSTAX_1, FORDHAM]],
      ['Primary source: Herodotus says why he wrote', [HERODOTUS]],
      ['Counting years: BC, AD, BCE and CE', [OPENSTAX_1]],
      ['Dating without writing: layers, tree rings and radiocarbon', [OPENSTAX_2, SMITHSONIAN]],
      ['Why things happen: cause, consequence and chance', [OPENSTAX_1]],
      ['When historians disagree', [OPENSTAX_1]],
      ['Deep time: the Earth and the first hominins', [SMITHSONIAN, OPENSTAX_2]],
      ['Standing up: the australopithecines', [SMITHSONIAN, OPENSTAX_2]],
      ['The first tools', [SMITHSONIAN, OPENSTAX_2]],
      ['Homo erectus and the first journeys out of Africa', [SMITHSONIAN, OPENSTAX_2]],
      ['Fire', [SMITHSONIAN]],
      ['Our cousins: Neanderthals, Denisovans and the rest', [SMITHSONIAN, OPENSTAX_2]],
      ['Homo sapiens in Africa', [SMITHSONIAN, OPENSTAX_2]],
      ['The first symbols: Blombos and the beads', [SMITHSONIAN, OPENSTAX_2]],
      ['Out of Africa: the great dispersal', [SMITHSONIAN, OPENSTAX_2]],
      ['The Ice Age world', [OPENSTAX_2]],
      ['Into Australia and the Americas', [SMITHSONIAN, OPENSTAX_2]],
      ['How hunter-gatherers lived', [OPENSTAX_2, KHAN]],
      ['Cave art and the first figurines', [SMITHSONIAN, OPENSTAX_2]],
      ['Connections: the world at the end of the Ice Age', [OPENSTAX_2, KHAN]],
    ],
  },
];

const out = [
  '-- Generated by scripts/curriculums/history.mjs. Read before running.',
  '-- Apply it with `npm run curriculum history`, which carries ticks,',
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
for (const key of strayDetail) console.error(`! history-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! history-cards.json has no lesson: ${key}`);

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
