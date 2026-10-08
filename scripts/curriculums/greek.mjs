// Builds the Modern Greek curriculum from its own document.
//
// Source: Media/Courses/Languages/Greek/Greek-Language-Curriculum-2026-2029.md,
// which carries a complete unit-by-unit page map for all three Basic Course
// volumes — printed pages, PDF pages, and the topic of every unit. All of that
// is transcribed here; none of it is invented.
//
// TANDEM, ON HIS WORD, AND AGAINST THE DOCUMENT'S LETTER. It says "work
// through the resources below in order" and never mentions concurrency —
// unlike the Japanese path, which says explicitly that kana runs alongside.
// Read strictly, that means 60 Pimsleur lessons, about thirty hours, before
// Unit 1 introduces the alphabet. So Pimsleur sets the cadence and the Basic
// Course runs alongside from session 1, which puts the writing system at the
// start where it belongs.
//
// The rate is set by what a unit actually is: a Pimsleur lesson is half an
// hour of audio, a GBC unit is eight to twenty-five printed pages with drills.
// So roughly three GBC units per five sessions rather than one each.
//
// Prints SQL. Nothing is executed here.

const SOURCE =
  'Media/Courses/Languages/Greek/Greek-Language-Curriculum-2026-2029.md';

/** Pimsleur level and lesson for a session. Two levels of thirty. */
function pimsleur(session) {
  return `Pimsleur ${session <= 30 ? 1 : 2}-${((session - 1) % 30) + 1}`;
}

// Volume 1, Units 1-25. Printed pages and focus, from the document's table.
const VOL1 = [
  [1, '1-12', 'writing system, vowels, consonants'],
  [2, '13-20', 'copula, palatalisation, definite article'],
  [3, '21-29', 'gender, agreement, articles'],
  [4, '30-40', 'pronouns, verb classes, present, to be'],
  [5, '41-65', 'accusative, stress, plurals, Class II · Review 1-5'],
  [6, '66-80', 'future, perfective stems, subjunctive, time'],
  [7, '81-96', 'genitive, noun and adjective declension'],
  [8, '97-112', 'possessive, object and demonstrative pronouns'],
  [9, '113-120', 'third-declension neuters'],
  [10, '121-139', 'past tense, simple past · Review 6-10'],
  [11, '140-150', 'continuous past, irregular pasts'],
  [12, '151-160', 'vocative and imperatives'],
  [13, '161-168', 'Class II present, future, subjunctive'],
  [14, '169-180', 'declension, numerals, early formal cases'],
  [15, '181-201', 'Class II perfective and past, irregulars · Review 11-15'],
  [16, '202-211', 'adverbs, comparison, superlative, conditional'],
  [17, '212-219', 'Class II imperative, declinable numerals'],
  [18, '220-229', 'present perfect, prefixes, past augment'],
  [19, '230-240', 'past perfect, Class III verbs'],
  [20, '241-258', 'perfective stems, Class III past · Review 16-20'],
  [21, '259-266', 'third-declension neuters, Class III imperative'],
  [22, '267-273', 'adjectives, prohibitive imperative, existence'],
  [23, '274-281', 'past participle, mixed conjugation'],
  [24, '282-290', 'prefixes, present active participle'],
  [25, '291-305', 'ordinals, telling time · Review 21-25'],
];

// Volume 2, Units 26-50. Topic and printed pages.
const VOL2 = [
  [26, '329-337', 'buying things'],
  [27, '338-346', 'hotel reservations by phone'],
  [28, '347-359', 'in the hotel'],
  [29, '360-367', 'weather report'],
  [30, '368-382', 'a party · Review 26-30'],
  [31, '383-390', 'in a cafe'],
  [32, '391-396', 'driving'],
  [33, '397-406', 'driving, continued'],
  [34, '407-414', 'in the harbour'],
  [35, '415-429', 'at the airport · Review 31-35'],
  [36, '430-436', 'at the consulate'],
  [37, '437-439', 'applying for a visa'],
  [38, '440-441', 'visa, continued'],
  [39, '442-443', "in the Vice Consul's office"],
  [40, '444-452', 'Greek islands · Review 36-40'],
  [41, '453-457', 'in the courtroom'],
  [42, '458-461', 'courtroom, continued'],
  [43, '462-469', 'courtroom, continued'],
  [44, '470-473', 'a political discussion'],
  [45, '474-484', 'political discussion · Review 41-45'],
  [46, '485-486', 'fine arts'],
  [47, '487-488', 'fine arts, continued'],
  [48, '489-490', 'fine arts, continued'],
  [49, '491-495', 'fine arts, continued'],
  [50, '496-505', 'the Greek theatre'],
];

// Volume 3, Units 51-75a. The register matters here: the document warns that
// this volume predates the modern standard and that katharevousa and
// monarchy-era material should be recognised rather than adopted, so every
// lesson carries its register from the document's own column.
const VOL3 = [
  ['51', '529-544', 'Olympic Games', 'mixed'],
  ['52', '545-551', 'the former Royal House', 'historical'],
  ['53', '552-559', 'demotic songs', 'cultural'],
  ['54', '560-567', 'tobacco in Greece', 'mixed'],
  ['55', '568-586', 'modern and ancient Greeks', 'mixed'],
  ['56', '587-594', 'music in Greece', 'mixed'],
  ['57', '595-604', 'the Greek flag', 'mixed'],
  ['58', '605-611', 'handicraft of Greek women', 'historical'],
  ['59', '612-620', 'proclamation for 28 October 1940', 'historical'],
  ['60', '621-627', 'Greek history', 'historical'],
  ['61', '628-634', 'Naval Battle of Navarino', 'historical'],
  ['62', '635-639', 'modern Greek literature', 'cultural'],
  ['63', '640-642', 'literature, continued', 'cultural'],
  ['64', '643-646', 'Greek diglossia', 'language history'],
  ['65', '647-651', 'diglossia, continued', 'language history'],
  ['66', '652-655', "Vlakhos's letter to Hitler", 'historical'],
  ['67', '656-659', 'letter, continued', 'historical'],
  ['68', '660-662', 'letter, continued', 'historical'],
  ['69', '663-666', 'letter, continued', 'historical'],
  ['70', '667-671', 'letter, continued', 'historical'],
  ['71', '672-675', 'a newspaper article', 'mixed'],
  ['72', '676-679', 'article, continued', 'mixed'],
  ['73', '680-683', 'article, continued', 'mixed'],
  ['74', '684-689', 'soccer in Greece', 'mixed'],
  ['75', '690-696', 'television', 'mixed'],
  ['75a', '697-710', 'Treaty of Lausanne', 'historical'],
];

const unit1 = ([n, pp, focus]) => `GBC1 U${n} · pp. ${pp} · ${focus}`;
const unit2 = ([n, pp, focus]) => `GBC2 U${n} · pp. ${pp} · ${focus}`;
const unit3 = ([n, pp, focus, reg]) => `GBC3 U${n} · pp. ${pp} · ${focus} (${reg})`;

/** Place items evenly across a span of sessions, in order. */
function place(into, items, from, to) {
  const span = to - from + 1;
  items.forEach((item, i) => {
    const at = from + Math.floor((i * span) / items.length);
    if (!into.has(at)) into.set(at, []);
    into.get(at).push(item);
  });
}

const parts = new Map();

// Volume 1 alongside Pimsleur from session 1 — the whole point of going
// tandem, since Unit 1 IS the alphabet.
place(parts, VOL1.map(unit1), 1, 40);

// Volume 2 begins once Volume 1 is through, and reaches Unit 38 inside the
// sixty. The rest follows after, because a unit a session is faster than a
// unit of this size is actually read.
place(parts, VOL2.slice(0, 13).map(unit2), 41, 60);

const STAGES = [
  { name: 'Stage 1 · Sound and script', from: 1, to: 30 },
  { name: 'Stage 2 · Grammar and situations', from: 31, to: 60 },
];

const modules = STAGES.map((stage) => ({
  name: stage.name,
  lessons: Array.from({ length: stage.to - stage.from + 1 }, (_, i) => {
    const session = stage.from + i;
    return [`${session} · ${pimsleur(session)}`, ...(parts.get(session) ?? [])].join(' · ');
  }),
}));

// What does not fit inside the sixty: the back half of Volume 2, and the whole
// of Volume 3 — which the document treats as a reading volume rather than a
// spoken one, and warns is dated.
modules.push({
  name: 'Beyond the sixty · Volume 2, the rest',
  lessons: VOL2.slice(13).map(unit2),
});
modules.push({
  name: 'Volume 3 · Reading, formal and historical',
  lessons: VOL3.map(unit3),
});

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/greek.mjs. Read before running.',
  `delete from curriculums where name = 'Greek';`,
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  values ('Greek', ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())});`,
];

modules.forEach((module, m) => {
  out.push(
    `insert into modules (curriculum_id, name, position)\n` +
      `  values ((select max(id) from curriculums), ${q(module.name)}, ${m + 1});`,
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
  `modules: ${modules.length}  lessons: ${modules.reduce((n, m) => n + m.lessons.length, 0)}`,
);
