// Builds the rest of Japanese's kanji track from the EDRDG dictionaries.
//
//   node scripts/curriculums/kanji-track.mjs <dir with the three JSON files>
//
// writes scripts/curriculums/japanese-kanji.json, which japanese.mjs reads
// beside its hand-written lessons. His ruling, 2026-10-19: all of the
// remaining jōyō kanji at once, every fact in them checkable, with the words
// in kana rather than romaji.
//
// WHY GENERATED. Twenty lessons, 159 characters, were written by hand. The
// other 1,977 are 247 lessons, and a reading or a word invented from memory at
// that scale would be learned wrong and reviewed for months. So every
// character's readings, meanings, stroke count, frequency and radical, and
// every example word with its reading and gloss, come from:
//
//   KANJIDIC2   readings, meanings, strokes, newspaper frequency, radical
//   JMdict      the common-word list, for the words a reading appears in
//
// both © the Electronic Dictionary Research and Development Group, CC BY-SA
// 4.0 (https://www.edrdg.org/edrdg/licence.html), here as the JSON builds from
// scriptin/jmdict-simplified (kanjidic2-en, jmdict-eng-common). The generated
// file carries that attribution, and its share-alike licence, with it.
//
// THE ORDER is newspaper frequency (KANJIDIC2's rank, 1–2,500), then the jōyō
// characters with no rank by school grade. The track's own plan: the first 500
// characters are about 80% of running text, so the payoff front-loads and the
// tail is honestly a tail. Modules are cut at those milestones — to 500, to
// 1,000, 1,500, 2,000, and the tail — because a module is a card on the
// curriculum page and five cards fit where fifty would not.
//
// THE WORDS. For each character, up to three common words: one where it takes
// its native (kun) reading if there is one, then compounds — preferring words
// whose other kanji are already taught, so a lesson's examples are readable on
// the day, and then the more frequent kanji.

import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/curriculums/kanji-track.mjs <dir with kanjidic2-en, jmdict-eng-common JSON>');
  process.exit(1);
}
const find = (prefix) => {
  const file = fs.readdirSync(dir).find((f) => f.startsWith(prefix) && f.endsWith('.json'));
  if (!file) throw new Error(`no ${prefix}*.json in ${dir}`);
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
};
const kanjidic = find('kanjidic2-en');
const jmdict = find('jmdict-eng-common');

/* Radicals by their classical (Kangxi) number, as KANJIDIC2 files each kanji.
   The form a radical takes inside a character where it differs, and what it
   most often means. Checked against real kanji from the data before use. A
   radical is the index a dictionary files the kanji under: it carries the
   meaning often, not always, and the notes say "filed under" for that reason.
   Where a radical has a second form inside characters, both are given — 会 is
   filed under 人 (as 𠆢 on top), 休 under the same radical as 亻. */
const RADICALS = {
  1: ['一', 'one'], 9: ['人 / 亻', 'person'], 10: ['儿', 'legs'], 12: ['八', 'eight'], 15: ['冫', 'ice'],
  18: ['刀 / 刂', 'knife'], 19: ['力', 'power'], 24: ['十', 'ten'], 29: ['又', 'again, a hand'], 30: ['口', 'mouth'],
  31: ['囗', 'enclosure'], 32: ['土', 'earth'], 37: ['大', 'big'], 38: ['女', 'woman'], 39: ['子', 'child'],
  40: ['宀', 'roof'], 41: ['寸', 'inch'], 44: ['尸', 'body'], 46: ['山', 'mountain'], 50: ['巾', 'cloth'],
  53: ['广', 'building'], 57: ['弓', 'bow'], 60: ['彳', 'step, going'], 61: ['心 / 忄', 'heart'],
  62: ['戈', 'halberd'], 64: ['手 / 扌', 'hand'], 66: ['攴 / 攵', 'strike, action'], 72: ['日', 'sun, day'],
  73: ['曰', 'say'], 74: ['月', 'moon'], 75: ['木', 'tree, wood'], 76: ['欠', 'lack, yawn'], 77: ['止', 'stop'],
  85: ['水 / 氵', 'water'], 86: ['火 / 灬', 'fire'], 94: ['犬 / 犭', 'dog, beast'], 96: ['玉 / 王', 'jewel, king'],
  102: ['田', 'field'], 104: ['疒', 'sickness'], 108: ['皿', 'dish'], 109: ['目', 'eye'], 112: ['石', 'stone'],
  113: ['示 / 礻', 'altar, spirit'], 115: ['禾', 'grain'], 116: ['穴', 'hole'], 118: ['竹', 'bamboo'],
  119: ['米', 'rice'], 120: ['糸', 'thread'], 122: ['网 / 罒', 'net'], 130: ['肉 / 月', 'flesh, the body'],
  137: ['舟', 'boat'], 140: ['艸 / 艹', 'grass, plant'], 142: ['虫', 'insect'], 145: ['衣 / 衤', 'clothing'],
  147: ['見', 'see'], 149: ['言', 'words, speech'], 154: ['貝', 'shell, money'], 157: ['足', 'foot'],
  159: ['車', 'vehicle'], 162: ['辵 / 辶', 'moving, a road'], 163: ['邑 / 阝', 'town (阝 on the right)'],
  164: ['酉', 'wine jar'], 167: ['金', 'metal'], 169: ['門', 'gate'], 170: ['阜 / 阝', 'hill (阝 on the left)'],
  172: ['隹', 'bird'], 173: ['雨', 'rain, weather'], 181: ['頁', 'head'], 184: ['食', 'food, eating'],
  187: ['馬', 'horse'],
};

/* The track as it stands: every character in a hand-written kanji lesson. */
const handLessons = Object.keys(
  JSON.parse(fs.readFileSync(new URL('./japanese-detail.json', import.meta.url), 'utf8')),
).filter((name) => /^Kanji \d+ · /.test(name));
const taught = new Set(handLessons.flatMap((name) => name.replace(/^Kanji \d+ · /, '').split(' ')));
const handCount = handLessons.length;

/* --- the characters --------------------------------------------------------- */

const JOYO = new Set([1, 2, 3, 4, 5, 6, 8]);
const chars = new Map();
for (const c of kanjidic.characters) {
  if (!JOYO.has(c.misc.grade)) continue;
  const readings = (c.readingMeaning?.groups ?? []).flatMap((g) => g.readings);
  const meanings = (c.readingMeaning?.groups ?? []).flatMap((g) => g.meanings).filter((m) => m.lang === 'en');
  chars.set(c.literal, {
    literal: c.literal,
    grade: c.misc.grade,
    frequency: c.misc.frequency ?? null,
    strokes: c.misc.strokeCounts[0],
    radical: c.radicals.find((r) => r.type === 'classical')?.value ?? null,
    on: readings.filter((r) => r.type === 'ja_on').map((r) => r.value),
    kun: readings.filter((r) => r.type === 'ja_kun').map((r) => r.value),
    meanings: meanings.map((m) => m.value),
  });
}

const remaining = [...chars.values()]
  .filter((c) => !taught.has(c.literal))
  .sort(
    (a, b) =>
      (a.frequency ?? 9999) - (b.frequency ?? 9999) ||
      (a.grade === 8 ? 7 : a.grade) - (b.grade === 8 ? 7 : b.grade) ||
      a.strokes - b.strokes,
  );

/* --- the words -------------------------------------------------------------- */

const KANA = /^[぀-ヿ]+$/;
const HIRAGANA = /[぀-ゟ]/;
const isKanji = (ch) => chars.has(ch) || /[一-鿿]/.test(ch);

/** Every common written form, with its reading and a short gloss. A second
 *  list holds the forms passed over — usually written in kana, or a less
 *  common spelling — for characters that would otherwise have no word. */
const words = [];
const fallback = [];
for (const entry of jmdict.words) {
  const sense = entry.sense?.[0];
  if (!sense) continue;
  const usuallyKana = sense.misc?.includes('uk');
  let gloss = sense.gloss?.[0]?.text ?? '';
  gloss = gloss.replace(/\s*\([^)]*\)/g, '').split(';')[0].trim();
  if (!gloss) continue;
  if (gloss.length > 34) gloss = `${gloss.slice(0, 32).replace(/\s+\S*$/, '')}…`;
  for (const form of entry.kanji ?? []) {
    // Irregular, outdated, rare or sound-borrowed spellings (串戯 for
    // じょうだん) are not how anyone meets the character.
    if (form.tags?.some((tag) => ['ateji', 'iK', 'oK', 'rK', 'sK', 'ik', 'ok'].includes(tag))) continue;
    const reading = (entry.kana ?? []).find(
      (k) => k.appliesToKanji.includes('*') || k.appliesToKanji.includes(form.text),
    )?.text;
    if (!reading || !KANA.test(reading)) continue;
    const word = { text: form.text, reading, gloss: gloss.replace(/\|/g, '/') };
    (form.common && !usuallyKana ? words : fallback).push(word);
  }
}

/* Prefectures and the cities named for them. Proper nouns live in JMnedict,
   not JMdict, so several jōyō kanji — admitted to the list for these names —
   have no common word there. The readings are the official ones. */
const PLACES = [
  ['茨城', 'いばらき'], ['栃木', 'とちぎ'], ['群馬', 'ぐんま'], ['埼玉', 'さいたま'], ['新潟', 'にいがた'],
  ['山梨', 'やまなし'], ['岐阜', 'ぎふ'], ['奈良', 'なら'], ['愛媛', 'えひめ'], ['熊本', 'くまもと'],
  ['鹿児島', 'かごしま'], ['沖縄', 'おきなわ'], ['大阪', 'おおさか'], ['神奈川', 'かながわ'], ['富山', 'とやま'],
  ['岡山', 'おかやま'], ['香川', 'かがわ'], ['徳島', 'とくしま'], ['宮崎', 'みやざき'], ['長崎', 'ながさき'],
  ['滋賀', 'しが'], ['佐賀', 'さが'], ['静岡', 'しずおか'], ['福岡', 'ふくおか'], ['宮城', 'みやぎ'],
  ['鳥取', 'とっとり'], ['島根', 'しまね'], ['広島', 'ひろしま'], ['山口', 'やまぐち'], ['高知', 'こうち'],
].map(([text, reading]) => ({ text, reading, gloss: `${text === '大阪' ? 'Osaka' : 'a prefecture'}` }));
const placeGloss = { 大阪: 'Osaka (city and prefecture)', 奈良: 'Nara (city and prefecture)' };
for (const place of PLACES) place.gloss = placeGloss[place.text] ?? 'prefecture';
fallback.push(...PLACES);
const index = (list) => {
  const map = new Map();
  for (const word of list) {
    for (const ch of new Set(word.text)) {
      if (!chars.has(ch)) continue;
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch).push(word);
    }
  }
  return map;
};
const wordsByChar = index(words);
const fallbackByChar = index(fallback);

/** Up to three words for one character, given what is already known. */
function wordsFor(ch, known) {
  let candidates = (wordsByChar.get(ch) ?? []).filter((w) => w.text.length <= 4);
  if (candidates.length === 0) candidates = (fallbackByChar.get(ch) ?? []).filter((w) => w.text.length <= 5);
  const score = (w) => {
    const others = [...w.text].filter((c) => isKanji(c) && c !== ch);
    const unknown = others.filter((c) => !known.has(c)).length;
    // Katakana in a word is usually a name or a loan (ソ連, Soviet Union):
    // common in newspapers, a poor example for learning the kanji.
    const katakana = /[\u30a0-\u30ff]/.test(w.text) ? 5000 : 0;
    const rarity = others.reduce((sum, c) => sum + (chars.get(c)?.frequency ?? 3000), 0);
    return unknown * 10000 + katakana + rarity + w.text.length * 50;
  };
  const sorted = [...candidates].sort((a, b) => score(a) - score(b));
  const chosen = [];
  // A native reading first: the character alone, or with kana after it.
  const native = sorted.find((w) => w.text === ch || (w.text.startsWith(ch) && HIRAGANA.test(w.text)));
  if (native) chosen.push(native);
  for (const w of sorted) {
    if (chosen.length >= 3) break;
    if (chosen.some((c) => c.text === w.text || c.reading === w.reading)) continue;
    chosen.push(w);
  }
  return chosen;
}

/* --- lessons and modules ------------------------------------------------------ */

const sets = [];
for (let i = 0; i < remaining.length; i += 8) sets.push(remaining.slice(i, i + 8));
// A last set of one is folded into the one before it.
if (sets.length > 1 && sets.at(-1).length < 5) sets.at(-2).push(...sets.pop());

const MODULES = [
  {
    to: 500,
    name: 'Kanji 5 · To 500: four fifths of what you read',
    intro:
      'From here the track is in frequency order, the commonest first: by the end of this module the first 500 characters are known, and those make up about four fifths of running newspaper text.',
  },
  {
    to: 1000,
    name: 'Kanji 6 · To 1,000',
    intro:
      'Characters 501 to 1,000 by newspaper frequency. By the end of this module, a thousand characters carry over nine tenths of running text: the rest of the track is about the remaining tenth.',
  },
  { to: 1500, name: 'Kanji 7 · To 1,500', intro: 'Characters 1,001 to 1,500 by frequency. Rarer, but still met every week in anything written for adults.' },
  { to: 2000, name: 'Kanji 8 · To 2,000', intro: 'Characters 1,501 to 2,000 by frequency: the long tail, in which each character is met less often but a missing one still stops a sentence.' },
  { to: Infinity, name: 'Kanji 9 · The tail, to all 2,136', intro: 'The rest of the jōyō list: characters with no newspaper rank, ordered by school grade. Finishing this module is every jōyō kanji.' },
];

const SOURCE = [
  { title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' },
];

const known = new Set(taught);
let count = taught.size;
let lessonNumber = handCount;
const modules = MODULES.map((m) => ({ ...m, lessons: [] }));
let moduleIndex = 0;

for (const set of sets) {
  while (count >= modules[moduleIndex].to) moduleIndex += 1;
  const module = modules[moduleIndex];
  lessonNumber += 1;
  for (const c of set) known.add(c.literal);

  const rows = set.map((c) => {
    const on = c.on.slice(0, 2);
    // Two of each: KANJIDIC2 lists rare readings too, and the first are the common ones.
    const kun = c.kun.slice(0, 2).map((k) => k.replace(/\./g, '-'));
    const readings = [on.join('・'), kun.join('・')].filter(Boolean).join(' / ');
    const meaning = c.meanings.slice(0, 2).join(', ');
    const examples = wordsFor(c.literal, known);
    return { c, readings, meaning, examples };
  });

  const byRadical = new Map();
  for (const { c } of rows) {
    const r = RADICALS[c.radical];
    if (!r) continue;
    const key = `${r[0]} (${r[1]})`;
    if (!byRadical.has(key)) byRadical.set(key, []);
    byRadical.get(key).push(c.literal);
  }

  const first = module.lessons.length === 0;
  const firstRank = count + 1;
  const lastRank = count + set.length;
  const lines = [
    first ? `**Kanji track, ${module.name.replace(/^Kanji \d+ · /, '').toLowerCase()}.** ${module.intro}` : null,
    first ? '' : null,
    `Characters ${firstRank} to ${lastRank} of the jōyō list, by how often they appear in text — with the readings they take and the words those readings appear in. Readings: on'yomi in katakana / kun'yomi in hiragana, with the okurigana after a hyphen.`,
    '',
    '| Kanji | Strokes | Meaning | Readings | In words |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(
      ({ c, readings, meaning, examples }) =>
        `| ${c.literal} | ${c.strokes} | ${meaning.replace(/\|/g, '/')} | ${readings || '—'} | ${
          examples.map((w) => `${w.text} ${w.reading} — ${w.gloss}`).join(' · ') || '—'
        } |`,
    ),
    '',
    byRadical.size
      ? `**Radicals.** Each kanji is filed under one radical, which often — not always — carries its meaning: ${[
          ...byRadical,
        ]
          .map(([radical, list]) => `${radical}: ${list.join(' ')}`)
          .join(' · ')}.`
      : null,
    byRadical.size ? '' : null,
    '**Writing.** Watch each on Jisho once, trace it, then write it from memory before checking.',
    '',
    '**Practice.** Write every word in the table by hand, then cover the readings and read them back.',
  ].filter((line) => line !== null);

  const cards = rows.map(({ c, readings, meaning, examples }) => {
    const r = RADICALS[c.radical];
    return {
      kind: 'kanji',
      front: c.literal,
      back: c.meanings.slice(0, 2).join(' · ') || meaning,
      reading: readings || null,
      extra: [
        examples.map((w) => `[${w.text}]{${w.reading}} ${w.gloss}`).join(' · '),
        `${c.strokes} strokes.${r ? ` Filed under ${r[0]}, ${r[1]}.` : ''}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    };
  });

  module.lessons.push({
    name: `Kanji ${lessonNumber} · ${set.map((c) => c.literal).join(' ')}`,
    sources: SOURCE,
    detail: lines.join('\n'),
    cards,
  });
  count += set.length;
}

const output = {
  $comment: [
    'GENERATED by scripts/curriculums/kanji-track.mjs — do not edit by hand; edit the generator and rerun.',
    'Character data from KANJIDIC2 and example words from JMdict, both © the Electronic Dictionary Research',
    'and Development Group, licensed CC BY-SA 4.0 (https://www.edrdg.org/edrdg/licence.html). This file is',
    'derived from them and is shared under the same licence.',
  ],
  modules: modules.filter((m) => m.lessons.length).map(({ name, lessons }) => ({ name, lessons })),
};

fs.writeFileSync(new URL('./japanese-kanji.json', import.meta.url), JSON.stringify(output, null, 1) + '\n');
const lessons = output.modules.flatMap((m) => m.lessons);
console.log(
  `kanji-track: ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.cards.length, 0)} characters, ` +
    `${output.modules.length} modules (${output.modules.map((m) => m.lessons.length).join(', ')}); ` +
    `track total ${taught.size + lessons.reduce((n, l) => n + l.cards.length, 0)} of ${chars.size}`,
);
