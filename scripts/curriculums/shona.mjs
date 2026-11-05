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
// is which. Stage 11 reads Biblica's Shona Bible instead, quoted unaltered.
// Built a stage at a time; only what is written is here.

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

// Stage 11 reads the Bible. The Shona is Biblica's, CC BY-SA 4.0, quoted
// unaltered; the English beside it is the Berean Standard Bible, public domain.
const BIBLICA = {
  title: 'Bhaibheri Dzvene Rakasununguka MuChiShona Chanhasi (Open Shona Contemporary Bible)',
  url: 'https://ebible.org/find/details.php?id=sna',
  note: 'Copyright © 2005, 2018 Biblica, Inc. CC BY-SA 4.0. Untoned, standard Shona. Quoted without alteration.',
};
const BSB = {
  title: 'Berean Standard Bible',
  url: 'https://ebible.org/find/details.php?id=engbsb',
  note: 'Public domain. The English set beside each verse.',
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
  {
    name: 'Stage 4 · Commands, having, and him, her, it',
    lessons: [
      ['Shona for the lesson itself', [FSI_TEXT, fsiUnit(13)]],
      ['Didn\'t: the past negative', [FSI_TEXT, fsiUnit(13)]],
      ['Commands', [FSI_TEXT, fsiUnit(13)]],
      ['Again: -zve', [FSI_TEXT, fsiUnit(13)]],
      ['What do you have? At the vegetable stall', [FSI_TEXT, fsiUnit(14)]],
      ['And, with: na', [FSI_TEXT, fsiUnit(14)]],
      ['Having: -ne', [FSI_TEXT, fsiUnit(14)]],
      ['Friends are coming', [FSI_TEXT, fsiUnit(15)]],
      ['Me, you, him, them: object prefixes', [FSI_TEXT, fsiUnit(15)]],
      ['Object prefixes and tone', [FSI_TEXT, fsiUnit(15)]],
      ['Do you know me?', [FSI_TEXT, fsiUnit(15)]],
      ['Not, with an object', [FSI_TEXT, fsiUnit(15), fsiUnit(16)]],
      ['My house is small', [FSI_TEXT, fsiUnit(16)]],
      ['It is small: the independent form', [FSI_TEXT, fsiUnit(16)]],
      ['About to: the -o- form, and beginning', [FSI_TEXT, fsiUnit(16)]],
      ['Stage 4 in conversation', [FSI_TEXT, fsiUnit(13), fsiUnit(16)]],
    ],
  },
  {
    name: 'Stage 5 · In and at, ever, too, and all',
    lessons: [
      ['Going to the hospital', [FSI_TEXT, fsiUnit(17)]],
      ['Pa-, ku-, mu-: the place classes', [FSI_TEXT, fsiUnit(17)]],
      ['There are many: a place as the subject', [FSI_TEXT, fsiUnit(17)]],
      ['At our place, at whose place: kwa-', [FSI_TEXT, fsiUnit(17), fsiUnit(19)]],
      ['Just, for a while, ever: -mbo-', [FSI_TEXT, fsiUnit(17)]],
      ['The first sign, the second town: ordinals', [FSI_TEXT, fsiUnit(17)]],
      ['Are you enjoying the sadza?', [FSI_TEXT, fsiUnit(18)]],
      ['Too, also: -wo', [FSI_TEXT, fsiUnit(18)]],
      ['With me, with him: na and the pronouns', [FSI_TEXT, fsiUnit(18)]],
      ['Put it on the table, take it out of the pot', [FSI_TEXT, fsiUnit(18)]],
      ['All of us, every one: -ose', [FSI_TEXT, fsiUnit(18)]],
      ['Yes and no in every tense', [FSI_TEXT, fsiUnit(18)]],
      ['Groundnuts by the sack', [FSI_TEXT, fsiUnit(19)]],
      ['With it, with them: na and the class pronouns', [FSI_TEXT, fsiUnit(19)]],
      ['Of millet, of rice: the linking prefix', [FSI_TEXT, fsiUnit(19)]],
      ['Sentences without a verb', [FSI_TEXT, fsiUnit(19), fsiUnit(20)]],
      ['Peanut butter soup', [FSI_TEXT, fsiUnit(20)]],
      ['What is it like? -dini again', [FSI_TEXT, fsiUnit(20)]],
      ['Stage 5 in conversation', [FSI_TEXT, fsiUnit(17), fsiUnit(18), fsiUnit(19), fsiUnit(20)]],
    ],
  },
  {
    name: "Stage 6 · For and by, if and why, now, and mine",
    lessons: [
      ["Six shillings of sugar", [FSI_TEXT, fsiUnit(21)]],
      ["For you, for us: the applicative -ir-, -er-", [FSI_TEXT, fsiUnit(21)]],
      ["Where did you get the firewood?", [FSI_TEXT, fsiUnit(21)]],
      ["Stop, must, do well, refuse", [FSI_TEXT, fsiUnit(21)]],
      ["With what? The prefix nge-", [FSI_TEXT, fsiUnit(21)]],
      ["An axe for cutting trees", [FSI_TEXT, fsiUnit(21)]],
      ["I come from another state", [FSI_TEXT, fsiUnit(22)]],
      ["Zezuru, Manyika, Ndau: peoples and customs", [FSI_TEXT, fsiUnit(22)]],
      ["Alike and different: -fanana and -siyana", [FSI_TEXT, fsiUnit(22)]],
      ["For ourselves: the reflexive -zvi-", [FSI_TEXT, fsiUnit(22)]],
      ["Like a child: sa-", [FSI_TEXT, fsiUnit(22)]],
      ["A letter from Bulawayo", [FSI_TEXT, fsiUnit(23)]],
      ["Brothers, sisters, grandfathers", [FSI_TEXT, fsiUnit(23)]],
      ["Was eaten: the passive -w-", [FSI_TEXT, fsiUnit(23)]],
      ["By whom? The doer after a passive", [FSI_TEXT, fsiUnit(23)]],
      ["If you wish: the -chi- form", [FSI_TEXT, fsiUnit(23)]],
      ["By bus, by train: getting about", [FSI_TEXT, fsiUnit(23)]],
      ["My flowers have grown", [FSI_TEXT, fsiUnit(24)]],
      ["Why? Ngenyi and the -chi- form", [FSI_TEXT, fsiUnit(24)]],
      ["Visible, edible, drinkable: -ik-, -ek-", [FSI_TEXT, fsiUnit(24)]],
      ["Cuttable, or cut by Father", [FSI_TEXT, fsiUnit(24)]],
      ["The seeds are coming up", [FSI_TEXT, fsiUnit(25)]],
      ["Now it is: the -aya tense of -va", [FSI_TEXT, fsiUnit(25)]],
      ["Go on, or refuse: -ramba", [FSI_TEXT, fsiUnit(25)]],
      ["Really: -bvira", [FSI_TEXT, fsiUnit(25)]],
      ["Are these children yours?", [FSI_TEXT, fsiUnit(26)]],
      ["We have it: -na- with -o", [FSI_TEXT, fsiUnit(26)]],
      ["Mine, yours, theirs: nde- with possessives", [FSI_TEXT, fsiUnit(26)]],
      ["There, in there: -po, -ko, -mwo", [FSI_TEXT, fsiUnit(26)]],
      ["Stage 6 in conversation", [FSI_TEXT, fsiUnit(21), fsiUnit(22), fsiUnit(23), fsiUnit(24), fsiUnit(25), fsiUnit(26)]],
    ],
  },
  {
    name: "Stage 7 · When, without, one another, and let's",
    lessons: [
      ["Planting flowers", [FSI_TEXT, fsiUnit(27)]],
      ["Cooking sadza, step by step", [FSI_TEXT, fsiUnit(27)]],
      ["When I've finished: tonal participials", [FSI_TEXT, fsiUnit(27)]],
      ["I saw him at home: -ri as a participial", [FSI_TEXT, fsiUnit(27)]],
      ["What will you do when …?", [FSI_TEXT, fsiUnit(27)]],
      ["Picking stones, ploughing, sowing", [FSI_TEXT, fsiUnit(27)]],
      ["Which way to Muradzikwa?", [FSI_TEXT, fsiUnit(28)]],
      ["Planting maize", [FSI_TEXT, fsiUnit(28)]],
      ["Bear left: participials with -na", [FSI_TEXT, fsiUnit(28)]],
      ["The school itself: chaipo, chaizvo", [FSI_TEXT, fsiUnit(28)]],
      ["Without stopping: the negative participial", [FSI_TEXT, fsiUnit(28)]],
      ["Why are there no trees? -sina", [FSI_TEXT, fsiUnit(28)]],
      ["The one who doesn't: negative relatives", [FSI_TEXT, fsiUnit(28)]],
      ["A trip to America", [FSI_TEXT, fsiUnit(29)]],
      ["Its buildings: possessives with two concords", [FSI_TEXT, fsiUnit(29)]],
      ["It is a road: independent nouns", [FSI_TEXT, fsiUnit(29)]],
      ["Seeing one another: -ana", [FSI_TEXT, fsiUnit(29)]],
      ["The road to Nyanga", [FSI_TEXT, fsiUnit(29)]],
      ["I lost my money", [FSI_TEXT, fsiUnit(30)]],
      ["Starting a new school", [FSI_TEXT, fsiUnit(30)]],
      ["That we may go: the subjunctive", [FSI_TEXT, fsiUnit(30)]],
      ["Let's go: the hortative", [FSI_TEXT, fsiUnit(30)]],
      ["The field that they ploughed", [FSI_TEXT, fsiUnit(30)]],
      ["The money that was lost", [FSI_TEXT, fsiUnit(30)]],
      ["At the headman's council", [FSI_TEXT, fsiUnit(31)]],
      ["We left him without speaking", [FSI_TEXT, fsiUnit(31)]],
      ["A letter I can't read", [FSI_TEXT, fsiUnit(31)]],
      ["Go and water the seeds", [FSI_TEXT, fsiUnit(31)]],
      ["Stage 7 in conversation", [FSI_TEXT, fsiUnit(27), fsiUnit(28), fsiUnit(29), fsiUnit(30), fsiUnit(31)]],
    ],
  },
  {
    name: "Stage 8 · Don't, must, still, had, and if",
    lessons: [
      ["An invitation to a wedding", [FSI_TEXT, fsiUnit(32)]],
      ["Singer and singing: nouns made from verbs", [FSI_TEXT, fsiUnit(32)]],
      ["Don't: usa- and the negative command", [FSI_TEXT, fsiUnit(32)]],
      ["They told us not to: tisa-, with and without an object", [FSI_TEXT, fsiUnit(32)]],
      ["Who finished it? The causative answer", [FSI_TEXT, fsiUnit(32)]],
      ["Not yet: -sati and the -a- tense", [FSI_TEXT, fsiUnit(32)]],
      ["Bathing the baby", [FSI_TEXT, fsiUnit(33)]],
      ["Like what? Like soap: -dai", [FSI_TEXT, fsiUnit(33)]],
      ["You must: the prefix -na-", [FSI_TEXT, fsiUnit(33)]],
      ["On the bus to Mutambara", [FSI_TEXT, fsiUnit(33)]],
      ["Lotion, a shirt, and to bed", [FSI_TEXT, fsiUnit(34)]],
      ["Give it to Father: -pa, -mwa, -dya with an object", [FSI_TEXT, fsiUnit(34)]],
      ["Not on the bed, where it is dry", [FSI_TEXT, fsiUnit(34)]],
      ["Give us axes so we can split wood", [FSI_TEXT, fsiUnit(34)]],
      ["Minding the children", [FSI_TEXT, fsiUnit(35)]],
      ["Ka- and tu-: little things", [FSI_TEXT, fsiUnit(35)]],
      ["So you have one, have you? -su", [FSI_TEXT, fsiUnit(35)]],
      ["Chi- before a command", [FSI_TEXT, fsiUnit(35)]],
      ["Do it well: -natsa", [FSI_TEXT, fsiUnit(35)]],
      ["A girl to help in the house", [FSI_TEXT]],
      ["Still at it: -chi(ri) and -ndo-", [FSI_TEXT]],
      ["Had arrived, will have arrived: -nga", [FSI_TEXT]],
      ["Who had been ploughing? -nga in questions and relatives", [FSI_TEXT]],
      ["A bright boy and no money", [FSI_TEXT]],
      ["If it were possible: dai", [FSI_TEXT]],
      ["Whose is it? Nde- before \"of\", and something to do", [FSI_TEXT]],
      ["Three times a week: ka- for how often", [FSI_TEXT]],
      ["Stage 8 in conversation", [FSI_TEXT, fsiUnit(32), fsiUnit(34), fsiUnit(35)]],
    ],
  },
  {
    name: "Stage 9 · If and when, the one we both know, and the first stories",
    lessons: [
      ["Writing home: stamps and the post office", [FSI_TEXT]],
      ["Paying the car tax, and a meeting in town", [FSI_TEXT]],
      ["Potatoes for Penhalonga, and a burned dress", [FSI_TEXT]],
      ["Gogogo: coming in, and visiting the sick", [FSI_TEXT]],
      ["Zv- with no noun: a little, well, come in", [FSI_TEXT]],
      ["That one we both know: -ya", [FSI_TEXT]],
      ["She slept a little better: the ideophonic form", [FSI_TEXT]],
      ["If he goes: the dependent -ka- tense", [FSI_TEXT]],
      ["When it is over: -kange, and -ka- beside -cha-", [FSI_TEXT]],
      ["The rains, the heat, the harvest: the seasons", [FSI_TEXT]],
      ["The time for fertilizing: a farmer's dialogue", [FSI_TEXT]],
      ["We've read enough: the classroom, and greeting travellers", [FSI_TEXT]],
      ["We move constantly: moving house, and seasons abroad", [FSI_TEXT]],
      ["Some, other: -mwe", [FSI_TEXT]],
      ["Nouns made from verbs", [FSI_TEXT]],
      ["Dug a little: crops, participials and ideophones", [FSI_TEXT]],
      ["The time of sowing: the linking prefix before a verb", [FSI_TEXT]],
      ["Still hot, cool now: -chi- and -ya-", [FSI_TEXT]],
      ["Congratulations on the new dress", [FSI_TEXT]],
      ["Two-line conversations: at home and on the farm", [FSI_TEXT]],
      ["Two-line conversations: in town and on the road", [FSI_TEXT]],
      ["Tsuro and Diro steal sweet potatoes", [FSI_TEXT]],
      ["Asking about the story: here?, ndiani?, -nyi?", [FSI_TEXT]],
      ["Tsuro and Diro in Zvanyanya's field", [FSI_TEXT]],
      ["Hyena breaks a leg", [FSI_TEXT]],
      ["Chuma and Chibharo, and the manyana", [FSI_TEXT]],
      ["The kudu hunt", [FSI_TEXT]],
      ["The forgotten axe", [FSI_TEXT]],
      ["Stage 9 in conversation", [FSI_TEXT]],
    ],
  },
  {
    name: "Stage 10 · Reading alone: three tales, a country, and the news",
    lessons: [
      ["Reading on your own: how FSI's last units work", [FSI_TEXT]],
      ["The monkey and the gourd", [FSI_TEXT]],
      ["Being, while: the tilde forms", [FSI_TEXT]],
      ["Without: -sina, and not: -sika-", [FSI_TEXT]],
      ["Nge-: by, because of, with", [FSI_TEXT]],
      ["The drought and the well", [FSI_TEXT]],
      ["The hare ties the guard", [FSI_TEXT]],
      ["Was tied, was given: the passive -wa", [FSI_TEXT]],
      ["Ka-: how the hare is spoken of", [FSI_TEXT]],
      ["W for v: the Manyika spellings", [FSI_TEXT]],
      ["The hyena and the hare", [FSI_TEXT]],
      ["The hyena in the anthill", [FSI_TEXT]],
      ["Let's go, tie me: the subjunctive in the texts", [FSI_TEXT]],
      ["Saying, thinking, running: -chi- in a story", [FSI_TEXT]],
      ["Had been, had already: -kange and -nga", [FSI_TEXT]],
      ["Already, now: -a-, -aa- and -ava", [FSI_TEXT]],
      ["Then, so, afterwards: how the stories join", [FSI_TEXT]],
      ["Southern Rhodesia: what the land yields", [FSI_TEXT]],
      ["Bounded by rivers: north, south, east and west", [FSI_TEXT]],
      ["Rhodesia in the news, 1965", [FSI_TEXT]],
      ["Printed every day: the newspapers", [FSI_TEXT]],
      ["Women's clubs: misono", [FSI_TEXT]],
      ["Each and every: rimwe narimwe", [FSI_TEXT]],
      ["A cough that spreads", [FSI_TEXT]],
      ["Totems: mitupo", [FSI_TEXT]],
      ["Here? Who? Why? FSI's four questions", [FSI_TEXT]],
      ["Stage 10 in conversation", [FSI_TEXT]],
    ],
  },
  {
    name: "Stage 11 · Reading the Shona Bible",
    lessons: [
      ["Let there be light: the Shona Bible", [BIBLICA, BSB]],
      ["Our Father: Baba vedu", [BIBLICA, BSB]],
      ["God, have mercy on me: the publican", [BIBLICA, BSB]],
      ["Lord, now you dismiss your servant: Simeon", [BIBLICA, BSB]],
      ["Blessed are the poor in spirit: the Beatitudes", [BIBLICA, BSB]],
      ["Have mercy on me, O God: Psalm 51 (50), verses 1–9", [BIBLICA, BSB]],
      ["Create in me a clean heart: Psalm 51 (50), verses 10–19", [BIBLICA, BSB]],
      ["Bless the Lord, O my soul: Psalm 103 (102), verses 1–11", [BIBLICA, BSB]],
      ["As far as the east is from the west: Psalm 103 (102), verses 12–22", [BIBLICA, BSB]],
      ["Rejoice, highly favoured: the Annunciation", [BIBLICA, BSB]],
      ["My soul magnifies the Lord: the Magnificat", [BIBLICA, BSB]],
      ["No room at the inn: the Nativity", [BIBLICA, BSB]],
      ["Glory to God in the highest: the shepherds", [BIBLICA, BSB]],
      ["In the beginning was the Word", [BIBLICA, BSB]],
      ["Every knee shall bow: Philippians 2", [BIBLICA, BSB]],
      ["Who is my neighbour? The Good Samaritan", [BIBLICA, BSB]],
      ["The younger son: the Prodigal, verses 11–24", [BIBLICA, BSB]],
      ["The older brother: the Prodigal, verses 25–32", [BIBLICA, BSB]],
      ["The greatest of these is love: 1 Corinthians 13", [BIBLICA, BSB]],
      ["He is not here: the myrrh-bearers", [BIBLICA, BSB]],
      ["My Lord and my God: Thomas", [BIBLICA, BSB]],
      ["Were not our hearts burning? Emmaus, verses 13–24", [BIBLICA, BSB]],
      ["Known in the breaking of the bread: Emmaus, verses 25–35", [BIBLICA, BSB]],
      ["Stage 11 in conversation", [BIBLICA, BSB]],
    ],
  },
  {
    name: "Stage 12 · Ad astra",
    lessons: [
      ["What comes after the course"],
      ["A Shona shelf, and Shona on the air"],
      ["Keeping Shona, year on year"],
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
