// Builds the Modern Greek curriculum.
//
// Source: scripts/curriculums/greek.md, which is the plan and the argument.
// The material is in greek-detail.json and the cards are in greek-cards.json,
// for the reasons japanese.mjs gives: prose full of tables does not belong
// inside a JS template literal, and cards are data rather than prose.
//
// A REWRITE, NOT A REVISION. The first Greek curriculum (2026-10-09) was 98
// lessons transcribed off the FSI Basic Course and Pimsleur with no material
// in the lessons at all, on migration 0007's rule that a transcribed
// curriculum keeps its substance in its resource. That rule is overturned:
// every lesson here teaches its point in full and then directs practice.
//
// WHAT IT IS FOR, IN HIS WORDS: "liturgy and also the greek people at church".
// The second half is Modern Greek. The first half is mostly NOT — the Divine
// Liturgy is Koine and Byzantine Greek — and by his ruling that is a separate
// curriculum later: classical Greek moving into theological and liturgical
// Greek. So the learned register is deliberately skipped here, and greek.md
// says so where a reader would otherwise think it an omission.
//
// FSI IS DEMOTED, PIMSLEUR IS KEPT, both at his word. FSI is free, owned, and
// from the 1960s — drachmas, the monarchy, katharevousa as a living register —
// so it stays as drills and audio and stops being the spine. Language Transfer
// plus the Centre for the Greek Language's free material is the spine instead.
//
// SCRIPT FROM LESSON ONE, and handwriting taught. SPELLING IS DRILLED — "drills
// bruh" — which is why orthography is a track rather than a remark.
//
// STANDARD AND CYPRIOT, his answer, so Cyprus gets a stage rather than a
// footnote. VOCABULARY IS OPEN-ENDED: no target number, no core list.
//
// Prints SQL. Nothing is executed here — `npm run curriculum greek`.

import detail from './greek-detail.json' with { type: 'json' };
import cards from './greek-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/greek.md';
const NAME = 'Greek';

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

/**
 * A card's natural key, which is what the database matches on: curriculum,
 * kind and front. Two lessons claiming the same one is a silent bug — the
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

const missing = [];

/* The stages. A lesson is [name, sources?] — the material is looked up by
 * name, and so are the cards. */
const stages = [
  {
    name: 'Stage 1 · The alphabet, the sounds and the hand',
    lessons: [
    ['How this curriculum works'],
    ['What this curriculum is for, and what it is not'],
    ['The alphabet: twenty-four letters', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars. Free.' }, { title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Α α, Β β, Γ γ, Δ δ', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Ε ε, Ζ ζ, Η η, Θ θ', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Ι ι, Κ κ, Λ λ, Μ μ', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Ν ν, Ξ ξ, Ο ο, Π π', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Ρ ρ, Σ σ ς, Τ τ, Υ υ', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Φ φ, Χ χ, Ψ ψ, Ω ω', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['The two sigmas, and the shapes that catch you out'],
    ['The five vowel sounds, and the many ways to write them', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars. Free.' }]],
    ['The vowel digraphs: αι ει οι ου υι', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['αυ and ευ — where the υ turns into a consonant', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['The consonant digraphs: μπ ντ γκ γγ', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['τσ and τζ', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['γ before ε and ι, and the γι sound', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }, { title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['The stress accent: what it marks, and why it is compulsory', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars. Free.' }]],
    ['Where the stress falls: the last three syllables', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars. Free.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free — including the official grammar and the readers.' }]],
    ['Reading your first sentences aloud', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. 60 lessons, half an hour each. Answer out loud.' }, { title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['Handwriting: the lowercase letters', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free — including the official grammar and the readers.' }]],
    ['Handwriting: the capitals, and when Greek uses them', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free — including the official grammar and the readers.' }]],
    ['Typing Greek'],
    ['Double consonants, and what they do not do', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars. Free.' }]],
    ['The sounds Greek has, and the ones it has not', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Punctuation, and the question mark that is not a semicolon', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free — including the official grammar and the readers.' }]],
    ['Numbers 0 to 20', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words, free.' }]],
    ['Greek letters as numbers'],
    ['Listening from day one', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. 60 lessons, half an hour each. Answer out loud.' }, { title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews with Greek and English subtitles. Start with the Super Easy tier.' }, { title: 'Kypros.org — Learn Greek', url: 'http://www.kypros.org/', note: '105 free audio lessons, Cyprus-based.' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'The lyrics of essentially every Greek song.' }]],
    ['Reading from day one: signs, labels and menus', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free — including the official grammar and the readers.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars. Free.' }]],
    ['Review: the script and the sounds'],
    ],
  },
  {
    name: 'Stage 2 · First Greek: being, having, and the noun',
    lessons: [
    ['The shape of a Greek sentence', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['είμαι — I am', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }, { title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words.' }]],
    ['The three genders', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['The definite article', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['ένας, μία, ένα — a and an'],
    ['Nominative and accusative', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['Masculine nouns in -ος', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word. Free, capped daily.' }]],
    ['Masculine nouns in -ας and -ης', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word. Free, capped daily.' }]],
    ['Feminine nouns in -α and -η', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word. Free, capped daily.' }]],
    ['Neuter nouns in -ο, -ι and -μα', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word. Free, capped daily.' }]],
    ['The noun system, in one table', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['έχω — I have', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }]],
    ['Verbs in -ω: the present tense', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word. Free, capped daily.' }]],
    ['Verbs in -άω and -ώ: the second class', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word. Free, capped daily.' }]],
    ['δεν — how Greek says not', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['Questions, and the question words', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }]],
    ['Adjectives, and agreement', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The personal pronouns, and when Greek uses them', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['αυτός and εκείνος — this and that'],
    ['υπάρχει — there is'],
    ['μου, σου, του — saying whose', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['με, σε, τον — the object pronouns', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['μου αρέσει — liking things', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }, { title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }]],
    ['Prepositions: σε, από, για, με', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons. The grammar by reasoning rather than drilling.' }]],
    ['στον, στη, στο — σε plus the article', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['Where things are', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }]],
    ['Politeness: εσύ and εσείς', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }]],
    ['Numbers 20 to 100, and prices', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words.' }]],
    ['Telling the time', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }]],
    ['Days, months and the church year', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/', note: 'Native recordings of individual words.' }]],
    ['At church: the words you will hear first'],
    ['Ordering a coffee: your first real exchange', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews with dual subtitles. Start with Super Easy Greek.' }]],
    ['Shadowing, and how to do it', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud — it is for the mouth, not the grammar.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews with dual subtitles. Start with Super Easy Greek.' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'The lyrics of essentially every Greek song.' }]],
    ['Writing, from the first week', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word. Free, capped daily.' }]],
    ['Reading: the school readers', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['Review: stage 2'],
    ],
  },
  {
    name: 'Spelling 1 · The sounds and the endings',
    lessons: [
    ['What the Spelling track is for', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The i sounds: ι η υ ει οι', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['The e sounds: ε and αι', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The o sounds: ο and ω', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The endings, drilled', [{ title: 'FSI Greek Basic Course', note: 'Owned, with audio. Demoted to drills — the pattern practice is still good.' }]],
    ['Final -ν: when to write it', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['The accent rules in full', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['Diaeresis, apostrophe and syllables', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ],
  },
];


const out = [
  '-- Generated by scripts/curriculums/greek.mjs. Read before running.',
  '-- Apply it with `npm run curriculum greek`, which carries ticks, detail',
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
for (const key of strayDetail) console.error(`! piano-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! piano-cards.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const cardCount = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, [name]) => k + (cards[name]?.length ?? 0), 0),
  0,
);
console.error(`modules: ${stages.length}  lessons: ${lessons}  cards: ${cardCount}`);
