// Builds the Japanese curriculum from its own document, as combined sessions.
//
// Source: Media/Courses/Languages/Japanese/Japanese-Language-Curriculum-
// 2026-2029.md. The resources there are not a queue of fourteen books, they
// are concurrent tracks — kana "run alongside Pimsleur/JFZ from the start",
// EJV "alongside JFZ 2 onward", RTK 1 "once kana is solid and you're into
// JFZ 2". A session therefore bundles whatever is active at that point, and
// the first version of this script was wrong to flatten it into a sequence.
//
// PIMSLEUR SETS THE CADENCE. It is the one resource with a real rhythm — 90
// lessons of about half an hour — so there are 90 sessions, and everything
// else is "the next bit of", entering and leaving on the document's rules.
// The resource codes are the document's own (JFZ1-5, KANA, RTK1-3, EJV).
//
// What the document does NOT fix is the pacing: it says "no gates, just go".
// So the placements below are derived from its rules rather than quoted from
// it, and every one is a single number to move.
//
// NO DETAIL, DECIDED 2026-10-09 and not an omission. 0007_lesson_detail.sql
// draws the line between a transcribed curriculum, whose substance is in the
// resource, and a designed one, which has nowhere else to keep it — and it
// uses this curriculum as its own example: "a Japanese session pointing at
// JFZ1 pp. 68-88 does not need the grammar restated beside it". Godot,
// Drawing, Aseprite and Piano carry detail because they are designed; this,
// Greek and Odin do not.
//
// Prints SQL. Nothing is executed here — 400 inserts are not something to
// fire blind at a live database.

const SOURCE =
  'Media/Courses/Languages/Japanese/Japanese-Language-Curriculum-2026-2029.md';

const SESSIONS = 90;

/** Pimsleur level and lesson for a session. Three levels of thirty. */
function pimsleur(session) {
  const level = ['I', 'II', 'III'][Math.floor((session - 1) / 30)];
  return `Pimsleur ${level}-${((session - 1) % 30) + 1}`;
}

/**
 * Place items across a span of sessions, in order and evenly.
 *
 * Monotonic: item i lands at or after item i-1, so a book is never worked
 * backwards. Where there are more sessions than items the gaps fall between
 * them, which is the point — RTK 1's 56 lessons over 63 sessions should
 * breathe rather than stop early.
 */
function place(into, items, from, to) {
  const span = to - from + 1;
  items.forEach((item, i) => {
    const at = from + Math.floor((i * span) / items.length);
    if (!into.has(at)) into.set(at, []);
    into.get(at).push(item);
  });
}

const parts = new Map();

// KANA, from the very start. Hiragana first, then katakana, as the document
// says. Ten items over the first ten sessions.
place(
  parts,
  [
    'KANA: how to use the book · pp. 7-16',
    'KANA: hiragana a-ko · pp. 19-24',
    'KANA: hiragana sa-to · pp. 26-31',
    'KANA: hiragana na-ho · pp. 33-38',
    'KANA: hiragana ma-yo · pp. 40-44',
    'KANA: hiragana ra-n · pp. 46-50',
    'KANA: hiragana modifications · pp. 52-68',
    'KANA: katakana · pp. 71-96',
    'KANA: katakana modifications · pp. 98-108',
    'KANA: combined review · pp. 109-120',
  ],
  1,
  10,
);

// JFZ 1 begins once kana is done — the document's one hard rule is not to lean
// on romaji, so the book waits for the script.
place(
  parts,
  [
    'JFZ1 Pre-A · pp. 13-16',
    'JFZ1 Pre-B · pp. 17-21',
    'JFZ1 Pre-C · pp. 22-28',
    'JFZ1 Pre-D · pp. 29-33',
    ...[
      [34, 48], [49, 67], [68, 88], [89, 107], [108, 125], [126, 145],
      [146, 163], [164, 182], [183, 197], [198, 217], [218, 232],
      [233, 251], [252, 273],
    ].map(([a, b], i) => `JFZ1 L${i + 1} · pp. ${a}-${b}`),
  ],
  11,
  27,
);

// JFZ 2, and with it the two things the document gates on being "into JFZ 2":
// RTK 1 and the vocabulary book.
place(
  parts,
  [
    [17, 46], [47, 78], [79, 96], [97, 128], [129, 156], [157, 184],
    [185, 210], [211, 240], [241, 266], [267, 296], [297, 320], [321, 344],
  ].map(([a, b], i) => `JFZ2 L${i + 1} · pp. ${a}-${b}`),
  28,
  39,
);

place(parts, ['EJV: start dipping into it for usage questions'], 28, 28);

// RTK 1, from JFZ 2 to the end of the ninety. 56 lessons over 63 sessions.
place(
  parts,
  Array.from({ length: 56 }, (_, i) => `RTK1 L${i + 1}`),
  28,
  90,
);

// JFZ 3, 4 and 5, in order, book by book.
place(
  parts,
  [9, 33, 53, 75, 97, 117, 141, 159, 177, 201, 219, 239, 257].map(
    (p, i) => `JFZ3 L${i + 1} · from p. ${p}`,
  ),
  40,
  52,
);
place(
  parts,
  [7, 31, 61, 89, 117, 141, 165, 193, 221, 247, 273, 303, 329, 353].map(
    (p, i) => `JFZ4 L${i + 1} · from p. ${p}`,
  ),
  53,
  66,
);
place(
  parts,
  [34, 65, 96, 132, 161, 193, 227, 256, 286, 318, 343, 373, 401].map(
    (p, i) => `JFZ5 L${i + 1} · from p. ${p}`,
  ),
  67,
  79,
);

// The two simpler folktales, once past the JFZ beginner books — 1 and 2 are
// the beginner pair, so these sit comfortably after JFZ 2 rather than at the
// very end.
place(parts, ['STORIES: Urashima Taro · pp. 10-21'], 45, 45);
place(parts, ['STORIES: Snow Woman · pp. 22-35'], 55, 55);

/** The three stages, one per Pimsleur level, named for what happens in them. */
const STAGES = [
  {
    name: 'Stage 1 · Kana and the spoken foundation',
    from: 1,
    to: 30,
  },
  {
    name: 'Stage 2 · Grammar and kanji begin',
    from: 31,
    to: 60,
  },
  {
    name: 'Stage 3 · Intermediate',
    from: 61,
    to: 90,
  },
];

const modules = STAGES.map((stage) => ({
  name: stage.name,
  lessons: Array.from({ length: stage.to - stage.from + 1 }, (_, i) => {
    const session = stage.from + i;
    return [`${session} · ${pimsleur(session)}`, ...(parts.get(session) ?? [])].join(' · ');
  }),
}));

// After the ninety: what the document explicitly defers. RTK 2 waits on RTK 1
// feeling solid, RTK 3 is "later, whenever you get to it", and the three
// longer stories come after the two folktales.
modules.push({
  name: 'Beyond the ninety',
  lessons: [
    ...[11, 20, 76, 82, 86, 117, 146, 192, 219, 251, 289].map(
      (p, i) => `RTK2 chapter ${i + 1} · from p. ${p}`,
    ),
    ...[13, 24, 120, 134, 136, 138].map(
      (p, i) => `RTK3 writing chapter ${i + 1} · from p. ${p}`,
    ),
    ...[149, 171, 198, 221, 250, 288, 298, 301].map(
      (p, i) => `RTK3 reading chapter ${i + 1} · from p. ${p}`,
    ),
    "STORIES: The Spider's Thread · pp. 36-59",
    'STORIES: The Siblings Who Almost Drowned · pp. 60-109',
    'STORIES: Gauche the Cellist · pp. 110-188',
  ],
});

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/japanese.mjs. Read before running.',
  // Rebuildable without losing its place. The row is created only if it is
  // not already there, and its modules are cleared instead — deleting the
  // curriculum and reinserting it would take a new position at the end, and
  // curriculum order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select 'Japanese', ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())}\n` +
    `  where not exists (select 1 from curriculums where name = 'Japanese');`,
  `update curriculums set source = ${q(SOURCE)} where name = 'Japanese';`,
  // Lessons first, then modules. ON DELETE CASCADE covers this wherever foreign
  // keys are enforced — D1 enforces them — and silently does nothing where they
  // are not, orphaning every lesson instead of removing it so that a rebuild
  // quietly adds a second full set nobody can see, because every read joins
  // through modules. Written out rather than relied upon.
  `delete from lessons where module_id in\n` +
    `  (select id from modules where curriculum_id =\n` +
    `     (select id from curriculums where name = 'Japanese'));`,
  `delete from modules where curriculum_id =\n` +
    `  (select id from curriculums where name = 'Japanese');`,
];

modules.forEach((module, m) => {
  out.push(
    `insert into modules (curriculum_id, name, position)\n` +
      `  values ((select id from curriculums where name = 'Japanese'), ${q(module.name)}, ${m + 1});`,
  );
  module.lessons.forEach((lesson, l) => {
    out.push(
      `insert into lessons (module_id, name, position, on_route)\n` +
        `  values ((select max(id) from modules), ${q(lesson)}, ${l + 1}, 1);`,
    );
  });
});

console.log(out.join('\n'));
console.error(
  `modules: ${modules.length}  sessions: ${modules.reduce((n, m) => n + m.lessons.length, 0)}`,
);
