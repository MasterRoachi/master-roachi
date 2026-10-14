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
    name: 'Stage 3 · The cases, in use',
    lessons: [
    ['The genitive: what it is for', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons.' }]],
    ['The genitive of the article', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['The genitive: masculine nouns', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The genitive: feminine nouns', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The genitive: neuter nouns', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The genitive plural', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['Possession: the two ways', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons.' }]],
    ['Names in the genitive'],
    ['Dates', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['Age, and how long things last', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }]],
    ['The indirect object', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons.' }]],
    ['The vocative', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['κύριε, κυρία and how Greeks address each other'],
    ['The full adjective table', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['More adjective patterns', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['Comparatives', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons.' }]],
    ['Superlatives', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['The irregular comparatives'],
    ['The pronouns in full', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['που — the relative pronoun', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons.' }]],
    ['ο οποίος, and when it is needed', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['όλος, κάποιος, κανένας, τίποτα', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: '120 free audio lessons.' }]],
    ['Numbers in the other cases, and the ordinals', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['The neuter nouns in -ος, and other survivors', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['Word order, now that the cases do the work', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Dual subtitles, and two free podcasts.' }]],
    ['Quantities, containers and measures', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }]],
    ['Weather, and the impersonal verbs', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['Describing a person', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }]],
    ['Describing a place', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }]],
    ['The case system, in one place', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['Talking about your family and your parish'],
    ['Reading: moving up a level', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers — Γλώσσα Α΄ and Β΄ Δημοτικού.' }]],
    ['Listening: when to move up', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Dual subtitles, and two free podcasts.' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/' }]],
    ['Writing with cases', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['Review: stage 3'],
    ],
  },
  {
    name: 'Stage 4 · Verbs and aspect',
    lessons: [
    ['Aspect: the one thing to understand about Greek verbs', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['The two stems', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }]],
    ['Forming the perfective stem', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['Perfective stems to learn as pairs', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['Why Greek has no infinitive', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['να, and what it does', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['The subjunctive with the imperfective', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['The subjunctive with the perfective', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['The aspect decision, in practice', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }, { title: 'FSI Greek Basic Course', note: 'Owned, with audio. Its pattern drills are what it is still good for.' }]],
    ['θέλω να, μπορώ να, πρέπει να', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }]],
    ['The future with θα', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['The continuous future', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['The imperative: telling someone to do something', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }]],
    ['Negative commands, and ας', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }]],
    ['The past: Greek\'s two past tenses', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }]],
    ['The aorist: how it is formed', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['The augment, and where the stress goes', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The school grammar, and the Ανθολόγιο readers.' }]],
    ['The aorist of the irregular verbs', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['The imperfect', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }]],
    ['Aorist or imperfect', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }, { title: 'FSI Greek Basic Course', note: 'Owned, with audio. Its pattern drills are what it is still good for.' }]],
    ['ήμουν and είχα', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }]],
    ['The mediopassive: what it is', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }]],
    ['The mediopassive present', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['The past of the mediopassive verbs', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['έρχομαι, πάω, λέω, τρώω', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['Compound verbs and the prefixes', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }]],
    ['Verbs of motion', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }]],
    ['Time words for the past'],
    ['How often: the frequency words'],
    ['Asking about the past', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek' }]],
    ['Telling a story in the past', [{ title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Comprehensible-input stories, free.' }]],
    ['At church: talking about the service afterwards'],
    ['How to store a verb', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['The aspect drill', [{ title: 'FSI Greek Basic Course', note: 'Owned, with audio. Its pattern drills are what it is still good for.' }]],
    ['The hundred verbs', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary gives every verb its full conjugation.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['Reading: the narrative past', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The school grammar, and the Ανθολόγιο readers.' }, { title: 'Greek Wikisource', url: 'https://el.wikisource.org/', note: 'Aesop, folk tales and out-of-copyright texts, free.' }]],
    ['Listening: following a story', [{ title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Comprehensible-input stories, free.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek' }]],
    ['Writing: a paragraph in the past', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any verb form and gives the whole paradigm.' }]],
    ['Where you should be: Pimsleur, Language Transfer, and the deck', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Answer out loud.' }, { title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek', note: 'Its treatment of the two stems and of να is the best free explanation there is.' }, { title: 'FSI Greek Basic Course', note: 'Owned, with audio. Its pattern drills are what it is still good for.' }]],
    ['Review: stage 4'],
    ],
  },
  {
    name: 'Stage 5 · Everyday Greek',
    lessons: [
    ['What stage 5 is: use, not study'],
    ['The house and the rooms', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }]],
    ['Things in the house', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['The day: morning to night', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }]],
    ['Food: the basics', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['At the bakery and the butcher', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }]],
    ['At the supermarket'],
    ['Fruit and vegetables', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['At the taverna: the menu', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }]],
    ['Ordering a meal, in full', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }, { title: 'FSI Greek Basic Course', note: 'Owned. Volume 2 is situational and useful here.' }]],
    ['Greek food: what the dishes actually are', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }, { title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Comprehensible-input stories, and short culture pieces.' }]],
    ['The kafeneio, properly', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews on exactly these subjects.' }]],
    ['Clothes', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['Shopping for clothes', [{ title: 'FSI Greek Basic Course', note: 'Owned. Volume 2 is situational and useful here.' }]],
    ['The body', [{ title: 'Forvo — Greek', url: 'https://forvo.com/languages/el/' }]],
    ['At the doctor', [{ title: 'FSI Greek Basic Course', note: 'Owned. Volume 2 is situational and useful here.' }]],
    ['At the pharmacy'],
    ['Money and the bank', [{ title: 'FSI Greek Basic Course', note: 'Owned. Volume 2 is situational and useful here.' }]],
    ['The post office and deliveries'],
    ['The telephone', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }]],
    ['Making an appointment', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }]],
    ['Travel: buses, trains and boats', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }]],
    ['At the airport'],
    ['Booking a room', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }]],
    ['Directions, in full', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Its situations are exactly this stage.' }, { title: 'FSI Greek Basic Course', note: 'Owned. Volume 2 is situational and useful here.' }]],
    ['The city and its services'],
    ['Work and jobs', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews on exactly these subjects.' }]],
    ['School and studies', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/' }]],
    ['The family, in full', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }]],
    ['Feelings and opinions', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek' }]],
    ['Agreeing and disagreeing', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews on exactly these subjects.' }]],
    ['Small talk, Greek style', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews on exactly these subjects.' }, { title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }]],
    ['Invitations: accepting and refusing', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }]],
    ['At someone\'s house', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }]],
    ['The parish hall'],
    ['Name days, feasts and what to say', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, with audio. Free.' }]],
    ['Reading: menus, notices and messages', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Listening: the shop, the hall and the phone', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews on exactly these subjects.' }, { title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Comprehensible-input stories, and short culture pieces.' }]],
    ['Speaking: your first real conversations'],
    ['Review: stage 5'],
    ],
  },
  {
    name: 'Stage 6 · The perfect, the passive and the conditional',
    lessons: [
    ['What stage 6 adds'],
    ['The perfect: έχω γράψει', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['What the perfect is for', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek' }]],
    ['The pluperfect and the future perfect', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['The conditional: θα έγραφα', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek' }]],
    ['Real conditions: αν', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek' }]],
    ['Unreal conditions', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek' }, { title: 'FSI Greek Basic Course', note: 'Owned. Volume 2 drills exactly these constructions.' }]],
    ['The passive: how it is formed', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm' }]],
    ['Using the passive', [{ title: 'ΕΡΤ news', url: 'https://www.ert.gr/', note: 'The state broadcaster writes and reads plainly. Free.' }]],
    ['The participles: γράφοντας and γραμμένος', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Reported speech', [{ title: 'FSI Greek Basic Course', note: 'Owned. Volume 2 drills exactly these constructions.' }]],
    ['The modal system in full', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Level 2 reaches this grammar.' }]],
    ['Wishes, regrets and μακάρι'],
    ['Deponent verbs in full', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm' }]],
    ['The imperative in full', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Impersonal verbs and constructions', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Indirect questions and embedded clauses', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/' }]],
    ['The verb, consolidated', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm' }]],
    ['Written Greek: what it uses that speech does not', [{ title: 'ΕΡΤ news', url: 'https://www.ert.gr/', note: 'The state broadcaster writes and reads plainly. Free.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/' }]],
    ['Nominalisation: verbs as nouns', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['The verbs that carry everything: κάνω, βάζω, παίρνω, πάω'],
    ['Knowing, thinking and understanding', [{ title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek' }]],
    ['Politeness, in full', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Level 2 reaches this grammar.' }]],
    ['What English speakers get wrong'],
    ['The deck at this level'],
    ['The verbs of church life', [{ title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church news in modern Greek, about subjects he already knows.' }]],
    ['At church: death, memory and the words around them', [{ title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church news in modern Greek, about subjects he already knows.' }]],
    ['Reading: the news paragraph', [{ title: 'ΕΡΤ news', url: 'https://www.ert.gr/', note: 'The state broadcaster writes and reads plainly. Free.' }, { title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church news in modern Greek, about subjects he already knows.' }]],
    ['Reading: a story, and your first book', [{ title: 'Greek Wikisource', url: 'https://el.wikisource.org/', note: 'Aesop, folk tales and out-of-copyright texts.' }, { title: 'openbook.gr', url: 'https://www.openbook.gr/', note: 'Free legal Greek ebooks.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/' }]],
    ['Listening: the news and the sermon', [{ title: 'ΕΡΤ news', url: 'https://www.ert.gr/', note: 'The state broadcaster writes and reads plainly. Free.' }, { title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church news in modern Greek, about subjects he already knows.' }]],
    ['Listening at natural speed', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/' }]],
    ['Writing: letters and emails', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Speaking: narrating and explaining'],
    ['Where you should be at the end of stage 6', [{ title: 'Pimsleur Modern Greek 1–2', note: 'Owned. Level 2 reaches this grammar.' }, { title: 'Language Transfer — Complete Greek', url: 'https://www.languagetransfer.org/greek' }]],
    ['Review: stage 6'],
    ],
  },
  {
    name: 'Stage 7 · Connected speech and the natural register',
    lessons: [
    ['What stage 7 is: from correct to natural', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['The particles: λοιπόν, δηλαδή, βασικά', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['ρε, βρε, μωρέ', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['Emphasis: order, repetition and the doubled pronoun', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Fillers, hesitation and buying time', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['Interrupting, and holding the floor', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['Backchannelling: showing you are listening', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['Diminutives and augmentatives', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Idioms: the body', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }]],
    ['Idioms: food, drink and the table', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }]],
    ['Idioms: God, saints and the devil', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }, { title: 'Romfea — church news', url: 'https://www.romfea.gr/' }]],
    ['Idioms: animals, weather and the rest', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }]],
    ['Proverbs', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }, { title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Also does idiom, history and culture explainers.' }]],
    ['Gestures', [{ title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Also does idiom, history and culture explainers.' }]],
    ['The colloquial grammar', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'Every Greek lyric, searchable.' }]],
    ['Register: five ways to say one thing', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Loanwords: Turkish, Italian, English', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Slang, the internet and youth language', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['What you need to recognise and not say'],
    ['Regional accents and what varies', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }, { title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Also does idiom, history and culture explainers.' }]],
    ['The learned fossils in daily speech', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Loanwords in the other direction', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/' }]],
    ['Telling a joke, and being teased', [{ title: 'Αρκάς', url: 'https://arkas.gr/', note: 'The great Greek cartoonist. A few colloquial lines per strip, and every Greek knows them.' }]],
    ['Complaining, sympathising and arguing', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['Toasts, speeches and set pieces', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }]],
    ['Emphasis and intonation', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'Every Greek lyric, searchable.' }]],
    ['Keeping up at speed', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['Greek music, and why it matters', [{ title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'Every Greek lyric, searchable.' }]],
    ['The history everyone refers to', [{ title: 'Greek Wikipedia', url: 'https://el.wikipedia.org/', note: 'For the history, the regions and the names — in Greek.' }, { title: 'Helinika', url: 'https://www.youtube.com/@Helinika', note: 'Also does idiom, history and culture explainers.' }]],
    ['Politics and football, carefully', [{ title: 'ΕΡΤ', url: 'https://www.ert.gr/' }]],
    ['Where people are from: the village and the island', [{ title: 'Greek Wikipedia', url: 'https://el.wikipedia.org/', note: 'For the history, the regions and the names — in Greek.' }]],
    ['Names: what they mean and how they work', [{ title: 'Greek Wikipedia', url: 'https://el.wikipedia.org/', note: 'For the history, the regions and the names — in Greek.' }]],
    ['Hospitality: the whole system', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }]],
    ['Time, lateness and the Greek clock', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }]],
    ['Money, generosity and who pays'],
    ['Reading: dialogue and the way people talk', [{ title: 'Αρκάς', url: 'https://arkas.gr/', note: 'The great Greek cartoonist. A few colloquial lines per strip, and every Greek knows them.' }]],
    ['Listening: the parish hall at full speed'],
    ['Speaking: sounding Greek', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews — the register this whole stage is about.' }]],
    ['Where you should be at the end of stage 7'],
    ['Review: stage 7'],
    ],
  },
  {
    name: 'Stage 8 · Real Greek: listening and reading',
    lessons: [
    ['What stage 8 is: input at volume'],
    ['How comprehension builds'],
    ['Choosing material at the right level', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free: the grammar, the language books by year, the Ανθολόγιο readers.' }, { title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'Past papers with audio, A1–C2, free. A thermometer, not an exam.' }]],
    ['Intensive and extensive'],
    ['The news, daily', [{ title: 'ERT — the state broadcaster', url: 'https://www.ert.gr/', note: 'News in plain standard Greek, plus radio and the ERTFLIX archive.' }, { title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church news in moderate modern Greek, about the events your parish talks about.' }]],
    ['Podcasts and radio', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews with dual subtitles, and two podcasts with transcripts.' }, { title: 'ERT — the state broadcaster', url: 'https://www.ert.gr/', note: 'News in plain standard Greek, plus radio and the ERTFLIX archive.' }]],
    ['Television, film and subtitles', [{ title: 'ERT — the state broadcaster', url: 'https://www.ert.gr/', note: 'News in plain standard Greek, plus radio and the ERTFLIX archive.' }]],
    ['Greek on the internet', [{ title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews with dual subtitles, and two podcasts with transcripts.' }]],
    ['Reading your first novel', [{ title: 'Hellenic Bible Society — modern Greek New Testament', url: 'https://www.hbs.gr/', note: 'The New Testament in modern Greek, free online. Known content, moderate register.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free: the grammar, the language books by year, the Ανθολόγιο readers.' }]],
    ['Modern Greek literature: where to start', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of authors reading their own work.' }]],
    ['The Church\'s modern Greek', [{ title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church news in moderate modern Greek, about the events your parish talks about.' }, { title: 'Hellenic Bible Society — modern Greek New Testament', url: 'https://www.hbs.gr/', note: 'The New Testament in modern Greek, free online. Known content, moderate register.' }]],
    ['The lives of the saints, in modern Greek', [{ title: 'saint.gr — the daily saint', url: 'https://www.saint.gr/', note: 'Today\u2019s saint, every day, in short modern Greek. Four minutes.' }]],
    ['Non-fiction: history, politics, essays', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free: the grammar, the language books by year, the Ανθολόγιο readers.' }]],
    ['Children\'s and young-adult Greek', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free: the grammar, the language books by year, the Ανθολόγιο readers.' }]],
    ['Song as text', [{ title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'The lyrics of essentially every Greek song, usually with a translation.' }]],
    ['Audiobooks, and reading with your ears', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of authors reading their own work.' }, { title: 'Hellenic Bible Society — modern Greek New Testament', url: 'https://www.hbs.gr/', note: 'The New Testament in modern Greek, free online. Known content, moderate register.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Street interviews with dual subtitles, and two podcasts with transcripts.' }]],
    ['Reading aloud at length', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of authors reading their own work.' }]],
    ['Vocabulary mining: what to card, what to let go', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the corpora.' }]],
    ['The reading journal'],
    ['From input to speech'],
    ['Imitation as writing practice', [{ title: 'ERT — the state broadcaster', url: 'https://www.ert.gr/', note: 'News in plain standard Greek, plus radio and the ERTFLIX archive.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'Every Greek state school textbook, free: the grammar, the language books by year, the Ανθολόγιο readers.' }]],
    ['Plateaus, and what they are'],
    ['Making a Greek environment', [{ title: 'saint.gr — the daily saint', url: 'https://www.saint.gr/', note: 'Today\u2019s saint, every day, in short modern Greek. Four minutes.' }]],
    ['Dictionaries and tools, used properly', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the corpora.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word and names its forms. Free, capped daily.' }]],
    ['Keeping the spoken side alive', [{ title: 'Omilo — free articles and podcasts', url: 'https://omilo.com/for-free/', note: 'Short pieces on Greek customs, idiom and festivals, with audio.' }]],
    ['Measuring progress honestly'],
    ['A diagnostic: the Ellinomatheia paper', [{ title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'Past papers with audio, A1–C2, free. A thermometer, not an exam.' }]],
    ['A week of stage 8, written out', [{ title: 'saint.gr — the daily saint', url: 'https://www.saint.gr/', note: 'Today\u2019s saint, every day, in short modern Greek. Four minutes.' }]],
    ['The long game'],
    ['Review: stage 8', [{ title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'Past papers with audio, A1–C2, free. A thermometer, not an exam.' }]],
    ],
  },
  {
    name: 'Stage 9 · Writing, argument and register',
    lessons: [
    ['What stage 9 is: producing Greek', [{ title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'The writing papers and their marking criteria, which is what this stage is measured against.' }]],
    ['Handwriting at speed'],
    ['Spelling under pressure', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, the school grammars, and the corpora.' }]],
    ['Punctuation in full', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar and the language books by year, which teach written composition explicitly.' }]],
    ['The sentence: from short to long', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar and the language books by year, which teach written composition explicitly.' }, { title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The anthology, for the shapes of written Greek worth imitating.' }]],
    ['The connective inventory', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar and the language books by year, which teach written composition explicitly.' }]],
    ['Paragraphs, and how a Greek text is organised', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar and the language books by year, which teach written composition explicitly.' }, { title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'The writing papers and their marking criteria, which is what this stage is measured against.' }]],
    ['Register: the four levels', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, the school grammars, and the corpora.' }]],
    ['The passive and the impersonal in writing', [{ title: 'ERT — the state broadcaster', url: 'https://www.ert.gr/', note: 'News Greek: the passive, the nominalisation and the headline register.' }]],
    ['Nominalisation', [{ title: 'ERT — the state broadcaster', url: 'https://www.ert.gr/', note: 'News Greek: the passive, the nominalisation and the headline register.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, the school grammars, and the corpora.' }]],
    ['The participles in writing', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, the school grammars, and the corpora.' }]],
    ['The learned forms you cannot avoid', [{ title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church Greek in its written register, including encyclicals and notices.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, the school grammars, and the corpora.' }]],
    ['Messages, and the internet\'s Greek'],
    ['An email', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Inflects any Greek word — the vocative and the genitive included.' }]],
    ['A formal letter'],
    ['Forms, applications and officialdom'],
    ['A notice, a programme, an announcement', [{ title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church Greek in its written register, including encyclicals and notices.' }]],
    ['The CV and the covering letter'],
    ['Describing', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The anthology, for the shapes of written Greek worth imitating.' }]],
    ['Narrating', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The anthology, for the shapes of written Greek worth imitating.' }]],
    ['Explaining', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar and the language books by year, which teach written composition explicitly.' }]],
    ['Arguing: building a position', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar and the language books by year, which teach written composition explicitly.' }, { title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'The writing papers and their marking criteria, which is what this stage is measured against.' }]],
    ['Arguing: conceding and refuting', [{ title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'The writing papers and their marking criteria, which is what this stage is measured against.' }]],
    ['Summarising', [{ title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'The writing papers and their marking criteria, which is what this stage is measured against.' }]],
    ['A review, and an opinion piece'],
    ['Writing to the Church', [{ title: 'Romfea — church news', url: 'https://www.romfea.gr/', note: 'Church Greek in its written register, including encyclicals and notices.' }]],
    ['Editing your own Greek', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, the school grammars, and the corpora.' }]],
    ['Getting corrected'],
    ['Where you should be at the end of stage 9', [{ title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'The writing papers and their marking criteria, which is what this stage is measured against.' }]],
    ['Review: stage 9'],
    ],
  },
  {
    name: 'Stage 10 · Cypriot Greek',
    lessons: [
    ['What stage 10 is, and why Cyprus', [{ title: 'Kypros.org — Learn Greek', url: 'http://www.kypros.org/', note: '105 free audio lessons, Cyprus-based — the one course in this curriculum made in Cyprus.' }]],
    ['The sounds of Cypriot', [{ title: 'Kypros.org — Learn Greek', url: 'http://www.kypros.org/', note: '105 free audio lessons, Cyprus-based — the one course in this curriculum made in Cyprus.' }, { title: 'ΡΙΚ — Cyprus Broadcasting Corporation', url: 'https://www.rik.cy/', note: 'News in standard Greek, drama and comedy in dialect, and a large free archive.' }]],
    ['Writing Cypriot: there is no standard spelling', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary and the corpora — which record the dialect forms too.' }]],
    ['The grammar: pronouns and negation', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary and the corpora — which record the dialect forms too.' }]],
    ['The vocabulary that is genuinely different', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary and the corpora — which record the dialect forms too.' }]],
    ['The four foreign layers'],
    ['Food and the table in Cyprus'],
    ['Greetings and the Cypriot manner', [{ title: 'Kypros.org — Learn Greek', url: 'http://www.kypros.org/', note: '105 free audio lessons, Cyprus-based — the one course in this curriculum made in Cyprus.' }]],
    ['The Church of Cyprus', [{ title: 'saint.gr — the daily saint', url: 'https://www.saint.gr/', note: 'The daily saint, Cypriot ones included.' }]],
    ['Cypriot history, in brief'],
    ['1974, and what not to say'],
    ['The diaspora: Cypriot Greek in Britain'],
    ['Cypriot music', [{ title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'Lyrics, including the Cypriot repertoire, often with the dialect words glossed in the comments.' }]],
    ['Dialect poetry: Michaelides and Lipertis', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The anthology, which holds some of the Cypriot poets with recordings.' }]],
    ['Cypriot humour, and the sitcoms', [{ title: 'ΡΙΚ — Cyprus Broadcasting Corporation', url: 'https://www.rik.cy/', note: 'News in standard Greek, drama and comedy in dialect, and a large free archive.' }]],
    ['Where to find Cypriot', [{ title: 'ΡΙΚ — Cyprus Broadcasting Corporation', url: 'https://www.rik.cy/', note: 'News in standard Greek, drama and comedy in dialect, and a large free archive.' }, { title: 'Kypros.org — Learn Greek', url: 'http://www.kypros.org/', note: '105 free audio lessons, Cyprus-based — the one course in this curriculum made in Cyprus.' }]],
    ['The island itself: places and names'],
    ['Speaking with Cypriots'],
    ['Where you should be at the end of stage 10'],
    ['Review: stage 10'],
    ],
  },
  {
    name: 'Stage 11 · Literature, and ad astra',
    lessons: [
    ['What stage 11 is: no more course', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of the poets reading their own work.' }]],
    ['How to read a Greek poem', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of the poets reading their own work.' }]],
    ['Cavafy', [{ title: 'The Cavafy Archive', url: 'https://www.onassis.org/initiatives/cavafy-archive', note: 'The complete poems with manuscripts, variants and translations. Free.' }, { title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of the poets reading their own work.' }]],
    ['Seferis', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of the poets reading their own work.' }]],
    ['Elytis', [{ title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of the poets reading their own work.' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'The poems that became songs, with the texts.' }]],
    ['Ritsos, and the poems that became songs', [{ title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'The poems that became songs, with the texts.' }, { title: 'snhell.gr', url: 'http://www.snhell.gr/en/', note: 'The Centre for Neo-Hellenic Studies anthology, with recordings of the poets reading their own work.' }]],
    ['Solomos, Palamas and the nineteenth century', [{ title: 'Greek Wikisource', url: 'https://el.wikisource.org/', note: 'The out-of-copyright canon in full: Solomos, Palamas, Papadiamantis, the folk songs.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The Ανθολόγιο readers — the canon with school notes and glosses, free.' }]],
    ['The folk song, and Crete', [{ title: 'Greek Wikisource', url: 'https://el.wikisource.org/', note: 'The out-of-copyright canon in full: Solomos, Palamas, Papadiamantis, the folk songs.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The Ανθολόγιο readers — the canon with school notes and glosses, free.' }, { title: 'stixoi.info', url: 'https://www.stixoi.info/', note: 'The poems that became songs, with the texts.' }]],
    ['Papadiamantis', [{ title: 'Greek Wikisource', url: 'https://el.wikisource.org/', note: 'The out-of-copyright canon in full: Solomos, Palamas, Papadiamantis, the folk songs.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The Ανθολόγιο readers — the canon with school notes and glosses, free.' }]],
    ['Kazantzakis'],
    ['The Generation of the Thirties, and Asia Minor', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The Ανθολόγιο readers — the canon with school notes and glosses, free.' }]],
    ['The civil war, and the post-war novel', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The Ανθολόγιο readers — the canon with school notes and glosses, free.' }]],
    ['Contemporary Greek writing', [{ title: 'Χάρτης', url: 'https://www.hartismag.gr/', note: 'A free online literary monthly: current Greek poetry, prose and essays.' }]],
    ['Kontoglou and the Orthodox writers', [{ title: 'Pemptousia', url: 'https://www.pemptousia.gr/', note: 'Essays on theology, the Fathers and Greek culture, in modern Greek.' }]],
    ['Modern Greek theology', [{ title: 'Pemptousia', url: 'https://www.pemptousia.gr/', note: 'Essays on theology, the Fathers and Greek culture, in modern Greek.' }]],
    ['The essayists, and the lost centre', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The dictionary and corpora — and the literary anthologies the Centre publishes.' }]],
    ['How Greeks talk about their literature', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The Ανθολόγιο readers — the canon with school notes and glosses, free.' }]],
    ['Ad astra'],
    ['Review: stage 11, and the end of the route'],
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
  {
    name: 'Spelling 2 · The noun and adjective endings',
    lessons: [
    ['Why the endings carry the leverage', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The masculine endings', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The feminine endings', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The neuter endings', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The genitive, in all three genders', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The plurals, in all three genders', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['The adjective endings', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['Spelling drill: the noun in a sentence', [{ title: 'FSI Greek Basic Course', note: 'Owned, with audio. Demoted to drills — the pattern practice is still good.' }, { title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'Graded listening papers with audio and transcripts — the best dictation material there is.' }]],
    ],
  },
  {
    name: 'Spelling 3 · The verb endings and the stems',
    lessons: [
    ['The verb endings, and the -ει problem', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The present and the -άω verbs', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The past endings, and the augment', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['The perfective stems, spelt', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The passive endings', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The subjunctive, which has no spelling of its own', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['Spelling drill: the verb in a sentence', [{ title: 'FSI Greek Basic Course', note: 'Owned, with audio. Demoted to drills — the pattern practice is still good.' }, { title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'Graded listening papers with audio and transcripts — the best dictation material there is.' }]],
    ],
  },
  {
    name: 'Spelling 4 · Roots, prefixes and the hard words',
    lessons: [
    ['Double consonants', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The prefixes, and how they assimilate', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The root spellings, by pattern', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['Homophones, and spelling as meaning', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['Spelling drill: dictation', [{ title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'Graded listening papers with audio and transcripts — the best dictation material there is.' }, { title: 'Easy Greek', url: 'https://www.easy-languages.org/easy-greek', note: 'Podcasts with transcripts, at two speeds — usable for dictation.' }]],
    ],
  },
  {
    name: 'Spelling 5 · Punctuation, numerals and the hand',
    lessons: [
    ['Abbreviations, in full', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['The numerals, in full', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['Capitalisation, hyphens and syllables', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['Typing and writing Greek, as reference'],
    ['The spelling checklist, and self-testing', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Ellinomatheia — sample papers', url: 'https://www.ellinomatheia.gr/', note: 'Graded listening papers with audio and transcripts — the best dictation material there is.' }]],
    ],
  },
  {
    name: 'Forms 1 · The noun, the article and the adjective',
    lessons: [
    ['What the Forms track is for', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers — Γλώσσα Α΄ and Β΄ Δημοτικού.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The article and the pronouns, in full', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ['Masculine nouns: every pattern', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['Feminine nouns: every pattern', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['Neuter nouns: every pattern', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['Adjectives: every pattern', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['How to use a declension table', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'The Triantafyllidis dictionary gives every noun its full inflection.' }]],
    ],
  },
  {
    name: 'Forms 2 · The verb: present and imperfective',
    lessons: [
    ['How the Greek verb is organised', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The two conjugations, in full', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The imperfect, in full', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The imperfective future, subjunctive and imperative', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['είμαι, έχω, and the state verbs', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['How to use a conjugation table', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ],
  },
  {
    name: 'Forms 3 · The perfective stems and the aorist',
    lessons: [
    ['The perfective stem, formed', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The irregular perfectives', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The aorist, in full', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The perfective future, subjunctive and imperative', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['The aspect pairs: the hundred verbs', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['Drilling the pairs', [{ title: 'FSI Greek Basic Course', note: 'Owned, with audio. Demoted to drills — the pattern practice is still good.' }]],
    ],
  },
  {
    name: 'Forms 4 · The passive, the perfect and the participles',
    lessons: [
    ['The passive present and imperfect', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The aorist passive', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The perfect tenses', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }]],
    ['The participles', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The full verb, on one page', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['Deponents, and the verbs with no active', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ],
  },
  {
    name: 'Forms 5 · Numerals, the irregulars and the learned forms',
    lessons: [
    ['The numerals and the pronouns, as reference', [{ title: 'Interactive school books (ebooks.edu.gr)', url: 'http://ebooks.edu.gr/ebooks/', note: 'The official school grammar, and the readers. Free.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['The irregular nouns and adjectives', [{ title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }, { title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
    ['The irregular verbs, in one list', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }, { title: 'Portal for the Greek Language', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/', note: 'Triantafyllidis dictionary with full inflection tables, and the school grammars.' }]],
    ['When a form defeats you', [{ title: 'Neurolingo Lexiscope', url: 'http://www.neurolingo.gr/en/online_tools/lexiscope.htm', note: 'Takes any inflected form and gives its lemma and full paradigm.' }]],
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
for (const key of strayDetail) console.error(`! greek-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! greek-cards.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const cardCount = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, [name]) => k + (cards[name]?.length ?? 0), 0),
  0,
);
console.error(`modules: ${stages.length}  lessons: ${lessons}  cards: ${cardCount}`);
