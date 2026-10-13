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
  {
    name: 'Stage 2 · First grammar, first words',
    lessons: [
    ['The shape of a sentence: what comes last, and what particles do', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['XはYです', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['The topic particle は, and what topic means', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Questions with か', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['じゃないです — saying it is not', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['でした and じゃなかった — the past', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['これ それ あれ, and この その あの', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['だれ なに どこ どれ いつ — the question words', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['の, and how it links two nouns', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['も — too, also', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['ね and よ — what the end of a sentence does', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Numbers 1 to 10'],
    ['Numbers past ten, and the readings that change'],
    ['Counters, and why Japanese has them', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['つ and 個 — the general counters'],
    ['人, 本, 枚, 匹 — the common specific ones'],
    ['Telling the time'],
    ['Days, months and dates'],
    ['Verbs: the three groups, and how to tell them apart', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['ます — the polite form', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['ません, ました, ませんでした', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['を — the object particle', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['に — the particle of destination, time and existence', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['で — where something happens, and what with', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['へ — direction', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['と — with, and', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['から and まで', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['あります and います — there is', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Where things are: 上 下 中 前 後'],
    ['ましょう and ませんか — suggesting', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['い-adjectives', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['な-adjectives, and the words that lie about being い', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Adjectives in the past and the negative', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Adjectives before a noun, and joining two of them', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['好き, 嫌い, 上手, 下手 — and why they take が', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['が — the subject particle, and a first look at は versus が', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['The て-form, and how to build it', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['～てください', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['～ています — happening now', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['～てもいいです and ～てはいけません', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['The dictionary form, and when it is used', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['The ない form', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['The た form', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Plain and polite: which to use when', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['～たい — wanting to do something', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['～が ほしい — wanting a thing', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['The first hundred words, and how the deck works'],
    ['Greetings and set phrases', [{ title: 'Irodori Starter', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Family: the two sets of words'],
    ['Irodori Starter: your first functional Japanese', [{ title: 'Irodori Starter', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Shadowing, and how to do it properly', [{ title: 'Irodori Starter', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }, { title: 'Pimsleur Japanese I–III', note: 'Owned. Built to be spoken along with.' }]],
    ['Writing three sentences a day'],
    ['Reading: Tadoku level 1', [{ title: 'Tadoku graded readers', url: 'https://archive.org/details/japanese-graded-readers-level-0-5-tadoku-ask', note: 'Level 1 is 34 booklets.' }]],
    ['Listening: when to move up a level', [{ title: 'Nihongo con Teppei for Beginners', url: 'https://nihongoconteppei.com/' }]],
    ['自己紹介 — introducing yourself', [{ title: 'Irodori Starter', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ],
  },
  {
    name: 'Stage 3 · The core sentence',
    lessons: [
    ['The potential form — being able to do', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['ことができる — the other can', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['The volitional form — ～よう', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～つもり — intending to', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～なければならない, and the contractions you will actually hear', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～たことがある — having done before', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～たり～たり — doing things like', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～ながら — while doing', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['前に and 後で — before and after', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～とき — when', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～ために — in order to, and for', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～ので and ～から — because, and the difference', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～のに — although', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～けど and ～が — but', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～と — the automatic consequence', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～たら — if, and when', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～ば — the conditional form', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～なら — if it is the case that', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['The four conditionals compared', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['Transitive and intransitive pairs', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～てある — a state someone created', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～ておく — doing in advance', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～てしまう — finishing, and regret', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～ていく and ～てくる', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['The passive', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['The causative', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['あげる, くれる, もらう', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～てあげる, ～てくれる, ～てもらう', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['Relative clauses in full', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['の and こと as nominalisers', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～んです — the explanatory ending', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['という — called, and that', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～そうです — it looks like, and I hear', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～ようです and ～みたいです — it seems', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['より and ほう — comparing two things', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['一番 — the superlative', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['ほど and くらい — degree and approximation', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['だけ, しか～ない, ばかり', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['もう and まだ', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['Frequency: いつも, よく, ときどき, あまり, 全然', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['でしょう and だろう — probably, and seeking agreement', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['Conjunctions: そして, それから, でも, しかし', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['は versus が, second pass', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～になる and ～くなる — becoming', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['Adverbs: making them from adjectives', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～すぎる — too much', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['～やすい and ～にくい — easy and hard to do', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Basic Japanese Grammar', note: 'Owned. The reference for every point in this stage.' }]],
    ['Counters, extended'],
    ['Keigo: a first look', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Irodori Elementary 1', [{ title: 'Irodori Elementary 1', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Mining: making your own cards'],
    ['Reading: NHK News Web Easy', [{ title: 'NHK News Web Easy', url: 'https://www3.nhk.or.jp/news/easy/', note: 'Free, daily, furigana you can switch off.' }]],
    ['Reading: Tadoku level 2', [{ title: 'Tadoku graded readers', url: 'https://archive.org/details/japanese-graded-readers-level-0-5-tadoku-ask', note: 'Level 2 is 28 booklets.' }]],
    ['Writing: a paragraph a day', [{ title: 'HelloTalk', url: 'https://www.hellotalk.com/', note: 'Free tier covers text, voice messages and corrections.' }]],
    ['Speaking: your first conversation', [{ title: 'HelloTalk', url: 'https://www.hellotalk.com/', note: 'Free tier covers text, voice messages and corrections.' }]],
    ['Listening: Teppei\'s main series', [{ title: 'Nihongo con Teppei', url: 'https://nihongoconteppei.com/', note: 'The main series, not the beginner one.' }]],
    ['Review: the grammar of stages 1 to 3'],
    ],
  },
  /* The kanji track is its own run of modules rather than lessons dissolved
   * into the stages — his word was "track". Frequency-ordered: the first 500
   * characters are about 80% of running text, so the reading payoff is
   * front-loaded and the tail is honestly a tail. Each set is taught through
   * the words its readings actually appear in, because a character alone has a
   * meaning and no pronunciation. */
  {
    name: 'Stage 4 · Everyday Japanese',
    lessons: [
    ['In a shop: asking for things', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Prices, and asking how much'],
    ['Paying: cash, card, and point cards'],
    ['Sizes, colours and trying things on'],
    ['At the convenience store'],
    ['At the supermarket: the food words'],
    ['When something is wrong: returns and problems'],
    ['Machines: tickets, vending and self-checkout'],
    ['Entering a restaurant', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Ordering', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Reading a menu, and set meals'],
    ['Allergies and what you cannot eat'],
    ['Paying and leaving a restaurant'],
    ['At an izakaya'],
    ['Coffee shops and fast food'],
    ['Food vocabulary: the staples'],
    ['Trains: buying a ticket'],
    ['Trains: reading the signs'],
    ['IC cards'],
    ['Asking for directions', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Giving directions'],
    ['Taxis and buses'],
    ['Long distance: shinkansen and airports'],
    ['Reading signs: the kanji you must know', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['At the clinic: describing symptoms', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['The body'],
    ['At the pharmacy'],
    ['Making an appointment', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Emergencies'],
    ['Renting a flat'],
    ['Utilities, bills and the paperwork'],
    ['Rubbish, recycling and the neighbours'],
    ['The post office and the bank'],
    ['Phones, contracts and the internet'],
    ['Job interviews and first meetings', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['In the office', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Email and messages'],
    ['Telephone Japanese', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Making plans and invitations', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Small talk: weather and seasons'],
    ['Compliments, and how to accept one'],
    ['Apologising'],
    ['Giving and receiving gifts'],
    ['Visiting someone\'s home'],
    ['Holidays and the calendar'],
    ['Talking about what you did'],
    ['Talking about what you will do'],
    ['Asking for time off, and sick days'],
    ['Hobbies and free time'],
    ['Hair, nails and the barber'],
    ['Set phrases you will hear constantly'],
    ['Numbers in the wild: phones, addresses and dates'],
    ['Irodori Elementary 2', [{ title: 'Irodori Elementary 2', url: 'https://www.irodori.jpf.go.jp/en/', note: 'Free PDFs and audio from the Japan Foundation.' }]],
    ['Reading: Tadoku level 3', [{ title: 'Tadoku graded readers', url: 'https://archive.org/details/japanese-graded-readers-level-0-5-tadoku-ask', note: 'Level 3 is 39 booklets.' }]],
    ['Listening: real news', [{ title: 'NHK News Web Easy', url: 'https://www3.nhk.or.jp/news/easy/', note: 'Articles with slow audio.' }, { title: 'NHK radio news', url: 'https://www.nhk.or.jp/radionews/', note: 'The real thing, five minutes, updated hourly.' }]],
    ['Writing: a longer text', [{ title: 'HiNative', url: 'https://hinative.com/', note: 'Native speakers correct longer texts, free.' }]],
    ['Speaking: a transaction from start to finish', [{ title: 'HelloTalk', url: 'https://www.hellotalk.com/' }]],
    ['Review: the everyday can-do list'],
    ],
  },
  {
    name: 'Stage 5 · Intermediate grammar',
    lessons: [
    ['～ところ — the point in time', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～はじめる, ～だす, ～つづける, ～おわる', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～きる, ～きれない, ～かける', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～なおす, ～あう, ～こむ', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～がち, ～ぎみ, ～っぽい', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～はずだ and ～はずがない', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～に違いない and ～おそれがある', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～わけだ, ～わけではない, ～わけがない', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～べきだ and ～ものだ', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～しかない and ～ざるを得ない', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ば～ほど — the more, the more', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ても and ～でも — even if', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ないで and ～なくて — the two negative te-forms', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ように — manner, purpose and indirect speech', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～かどうか and embedded questions', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ばよかった and ～ところだった', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～たらいい, ～ばいい, ～たらどう', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ようとする and ～たがる', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～がする, 見える, 聞こえる', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～について, ～に関して, ～に対して', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～によって and ～として', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～せいで and ～おかげで', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～うちに and ～間に', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～たとたん, ～次第, ～たびに', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～一方で, ～反面, ～ものの', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ばかりか, ～だけでなく, ～上に', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ようがない and ～きれない', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～こそ, ～さえ, ～でも as emphasis', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ということ and ～というのは', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～まま — leaving something as it is', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～限り, ～上で, ～次第で', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～向け, ～向き, ～だらけ, ～ばかり', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～を通じて, ～に基づいて, ～をもとに', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['以上, 以下, 未満, 以内 — bounds'],
    ['The causative-passive, in full', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～させていただく — the humble request', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ていただく and the ladder of requests', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['自分, and the words for I and you', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['Male and female speech'],
    ['Dialects, and Kansai-ben', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }]],
    ['Contractions in speech'],
    ['Onomatopoeia: 擬音語 and 擬態語'],
    ['Loanwords, and 和製英語'],
    ['話し言葉 and 書き言葉'],
    ['Reporting what someone said', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～と思われる and the impersonal voice', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'The grammar reference underneath this stage.' }, { title: 'Makino & Tsutsui, A Dictionary of Intermediate Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['Giving an opinion, and softening it'],
    ['Aizuchi: how to listen out loud'],
    ['Fillers and buying time'],
    ['Reading kanji you have not met: on\'yomi patterns', [{ title: 'Jisho', url: 'https://jisho.org', note: 'Radical search and handwriting input.' }]],
    ['Radicals, and looking a kanji up', [{ title: 'Jisho', url: 'https://jisho.org', note: 'Radical search and handwriting input.' }, { title: 'Yomitan', url: 'https://yomitan.wiki/', note: 'Hover-to-read dictionary for the browser. Free.' }]],
    ['Irodori Pre-Intermediate', [{ title: 'Irodori Pre-Intermediate', url: 'https://www.irodori.jpf.go.jp/en/' }]],
    ['Reading: native material for children', [{ title: 'Aozora Bunko', url: 'https://www.aozora.gr.jp/' }]],
    ['Reading: manga, and why it is harder than it looks', [{ title: 'Yomitan', url: 'https://yomitan.wiki/', note: 'Hover-to-read dictionary for the browser. Free.' }]],
    ['Listening: drama, variety and anime', [{ title: 'asbplayer', url: 'https://github.com/killergerbah/asbplayer', note: 'Syncs subtitles to video and mines directly from it. Free.' }]],
    ['Listening: podcasts made for Japanese people'],
    ['Writing: an opinion piece', [{ title: 'HiNative', url: 'https://hinative.com/' }, { title: 'italki', url: 'https://www.italki.com/', note: 'Paid, but the cheapest way to get conversation and written corrections.' }]],
    ['Speaking: holding a longer conversation', [{ title: 'italki', url: 'https://www.italki.com/', note: 'Paid, but the cheapest way to get conversation and written corrections.' }]],
    ['JLPT: what it is, and whether to take it', [{ title: 'JLPT official site', url: 'https://www.jlpt.jp/e/', note: 'Level descriptions and free official practice papers.' }]],
    ['Review: the intermediate grammar'],
    ],
  },
  {
    name: 'Stage 6 · Reading real Japanese',
    lessons: [
    ['The transition to native material'],
    ['Yomitan, and reading on a screen', [{ title: 'Yomitan', url: 'https://yomitan.wiki/', note: 'Hover-to-read dictionary for the browser. Free.' }]],
    ['Intensive and extensive reading'],
    ['Your first novel: choosing one'],
    ['Reading a novel: the method'],
    ['Reading speed, and how it grows'],
    ['Furigana, and reading without it'],
    ['Monolingual dictionaries', [{ title: 'Weblio 辞書', url: 'https://www.weblio.jp/', note: 'Free monolingual dictionaries, aggregated.' }, { title: 'Yomitan', url: 'https://yomitan.wiki/', note: 'Hover-to-read dictionary for the browser. Free.' }]],
    ['News: the structure of an article', [{ title: 'NHK News', url: 'https://www3.nhk.or.jp/news/', note: 'The real version, not Easy.' }]],
    ['News vocabulary: the recurring set', [{ title: 'NHK News', url: 'https://www3.nhk.or.jp/news/', note: 'The real version, not Easy.' }]],
    ['Blogs, forums and short-form Japanese'],
    ['Official documents and forms'],
    ['Technical and academic writing'],
    ['Literary Japanese: what changes', [{ title: 'Aozora Bunko', url: 'https://www.aozora.gr.jp/', note: '17,700+ works, free. Mostly pre-1970, so harder language.' }]],
    ['Classical traces in modern Japanese', [{ title: 'Imabi', url: 'https://imabi.org/' }]],
    ['Grammar you meet only in reading', [{ title: 'Imabi', url: 'https://imabi.org/' }, { title: 'Makino & Tsutsui, Dictionaries of Intermediate and Advanced Japanese Grammar', note: 'Owned.' }]],
    ['和語 and 漢語: the two vocabularies'],
    ['Compound nouns, prefixes and suffixes'],
    ['Reading names', [{ title: 'Yomitan', url: 'https://yomitan.wiki/', note: 'Hover-to-read dictionary for the browser. Free.' }]],
    ['Abbreviations, acronyms and numbers in text'],
    ['Counters, and the rest of them'],
    ['Sentence mining at scale', [{ title: 'Yomitan', url: 'https://yomitan.wiki/', note: 'Hover-to-read dictionary for the browser. Free.' }, { title: 'jpdb.io', url: 'https://jpdb.io/', note: 'Frequency data and a vocabulary-size test.' }]],
    ['Vocabulary: the 10,000 word mark', [{ title: 'jpdb.io', url: 'https://jpdb.io/', note: 'Frequency data and a vocabulary-size test.' }]],
    ['Listening: drama, and the method', [{ title: 'asbplayer', url: 'https://github.com/killergerbah/asbplayer', note: 'Syncs subtitles and mines from video. Free.' }]],
    ['Films, YouTube and the rest'],
    ['Listening without subtitles'],
    ['Shadowing native material'],
    ['Writing: summarising what you read', [{ title: 'HiNative', url: 'https://hinative.com/' }, { title: 'italki', url: 'https://www.italki.com/' }]],
    ['Writing: a review', [{ title: 'HiNative', url: 'https://hinative.com/' }]],
    ['Speaking: explaining something complex', [{ title: 'italki', url: 'https://www.italki.com/' }]],
    ['Speaking: discussing what you read', [{ title: 'italki', url: 'https://www.italki.com/' }]],
    ['Review: reading real Japanese'],
    ],
  },
  {
    name: 'Stage 7 · Advanced grammar',
    lessons: [
    ['～における and ～にあたって', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～をめぐって and ～に先立って', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～を問わず and ～にかかわらず', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～はもとより and ～はおろか', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ならでは and ～ずにはいられない', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～べく, ～べからず, ～んがため', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～たる and ～なる — the classical attributives', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～なりに, ～ばかりに, ～あまり', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ないまでも, ～までだ, ～たりとも', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～ともなると, ～とあって, ～こそあれ', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～に相違ない, ～とみえる, ～んばかり', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['～やら, ～だの, ～なり, ～であれ', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['Parsing a long sentence'],
    ['Ellipsis: what Japanese leaves out'],
    ['～のである, and emphasis in writing', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Advanced and Veteran sections.' }, { title: 'Makino & Tsutsui, A Dictionary of Advanced Japanese Grammar', note: 'Owned. The reference for this stage.' }]],
    ['四字熟語 — four-character compounds'],
    ['ことわざ and 慣用句'],
    ['同音異義語 and 送り仮名'],
    ['Register: 硬い and 柔らかい'],
    ['Reading: essays and criticism', [{ title: '天声人語 (Asahi)', url: 'https://www.asahi.com/rensai/list.html?id=1', note: '600 characters daily. The standard exercise.' }]],
    ['Listening: lectures and talks', [{ title: 'NHK高校講座', url: 'https://www.nhk.or.jp/kokokoza/', note: 'School lectures on every subject, free.' }]],
    ['Writing: a formal essay', [{ title: 'italki', url: 'https://www.italki.com/', note: 'For written corrections at essay length.' }]],
    ['Speaking: the formal register', [{ title: 'italki', url: 'https://www.italki.com/', note: 'For written corrections at essay length.' }]],
    ['Review: the advanced grammar'],
    ],
  },
  {
    name: 'Stage 8 · Keigo',
    lessons: [
    ['The three systems of keigo', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Seven lessons on keigo.' }, { title: '敬語の指針 (Agency for Cultural Affairs)', url: 'https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/keigo_tosin.pdf', note: 'The official guidance. Free, and the source for the five-category split.' }]],
    ['尊敬語: the special verbs', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Seven lessons on keigo.' }]],
    ['尊敬語: the regular patterns', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Seven lessons on keigo.' }]],
    ['謙譲語: the special verbs', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Seven lessons on keigo.' }]],
    ['謙譲語: the regular patterns', [{ title: 'Imabi', url: 'https://imabi.org/', note: 'Seven lessons on keigo.' }, { title: '敬語の指針 (Agency for Cultural Affairs)', url: 'https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/keigo_tosin.pdf', note: 'The official guidance. Free, and the source for the five-category split.' }]],
    ['ございます, でございます and 美化語', [{ title: '敬語の指針 (Agency for Cultural Affairs)', url: 'https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/keigo_tosin.pdf', note: 'The official guidance. Free, and the source for the five-category split.' }]],
    ['内 and 外: who counts as your group'],
    ['二重敬語 and over-politeness', [{ title: '敬語の指針 (Agency for Cultural Affairs)', url: 'https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/keigo_tosin.pdf', note: 'The official guidance. Free, and the source for the five-category split.' }]],
    ['Keigo on the telephone'],
    ['Keigo in email'],
    ['Asking, refusing and apologising in keigo'],
    ['Keigo mistakes, and when not to use it', [{ title: '敬語の指針 (Agency for Cultural Affairs)', url: 'https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/keigo_tosin.pdf', note: 'The official guidance. Free, and the source for the five-category split.' }]],
    ['A full business exchange'],
    ['Review: keigo'],
    ],
  },
  {
    name: 'Stage 9 · Living in Japanese',
    lessons: [
    ['Making Japanese the default'],
    ['Japanese for programming', [{ title: 'Qiita', url: 'https://qiita.com/', note: 'Japanese developer articles.' }]],
    ['Games in Japanese'],
    ['Novels: building the habit', [{ title: '読書メーター', url: 'https://bookmeter.com/', note: 'Book logging, in Japanese.' }]],
    ['Literature: the canon', [{ title: 'Aozora Bunko', url: 'https://www.aozora.gr.jp/', note: 'Every classical text, free. Historical kana in many editions.' }]],
    ['Poetry: 俳句 and 短歌'],
    ['The intermediate plateau'],
    ['Measuring progress when it is invisible', [{ title: 'jpdb.io', url: 'https://jpdb.io/' }]],
    ['Vocabulary past 10,000, and kanji past the jōyō', [{ title: '漢検 — Kanji Kentei', url: 'https://www.kanken.or.jp/kanken/', note: 'Past papers published free.' }, { title: 'jpdb.io', url: 'https://jpdb.io/' }]],
    ['Specialised vocabulary: your own field'],
    ['Teaching, translating and explaining'],
    ['Review: living in Japanese'],
    ],
  },
  {
    name: 'Stage 10 · Classical Japanese',
    lessons: [
    ['Classical Japanese: why bother', [{ title: 'Imabi — Classical Japanese', url: 'https://imabi.org/', note: '36 lessons on 古文.' }, { title: 'NHK高校講座 古典', url: 'https://www.nhk.or.jp/kokokoza/', note: 'The school course, with video. Free.' }]],
    ['歴史的仮名遣い — historical kana', [{ title: 'Imabi — Classical Japanese', url: 'https://imabi.org/', note: '36 lessons on 古文.' }]],
    ['Classical verbs: the conjugation classes', [{ title: 'Imabi — Classical Japanese', url: 'https://imabi.org/', note: '36 lessons on 古文.' }]],
    ['Classical auxiliaries: き, けり, つ, ぬ, たり, り', [{ title: 'Imabi — Classical Japanese', url: 'https://imabi.org/', note: '36 lessons on 古文.' }]],
    ['Classical auxiliaries: む, べし, らむ, まし', [{ title: 'Imabi — Classical Japanese', url: 'https://imabi.org/', note: '36 lessons on 古文.' }]],
    ['係り結び — the bound ending', [{ title: 'Imabi — Classical Japanese', url: 'https://imabi.org/', note: '36 lessons on 古文.' }]],
    ['Reading 枕草子 and 徒然草', [{ title: 'Aozora Bunko', url: 'https://www.aozora.gr.jp/', note: 'Every classical text, free. Historical kana in many editions.' }, { title: 'NHK高校講座 古典', url: 'https://www.nhk.or.jp/kokokoza/', note: 'The school course, with video. Free.' }]],
    ['平家物語 and the war tales', [{ title: 'Aozora Bunko', url: 'https://www.aozora.gr.jp/', note: 'Every classical text, free. Historical kana in many editions.' }]],
    ['和歌 and 百人一首', [{ title: '百人一首', url: 'https://www.ogurasanso.co.jp/site/hyakunin/', note: 'All hundred poems with notes.' }]],
    ['漢文 and 訓読', [{ title: 'NHK高校講座 古典', url: 'https://www.nhk.or.jp/kokokoza/', note: 'The school course, with video. Free.' }]],
    ['Review: classical Japanese'],
    ],
  },
  /* No end, by instruction: "we never stop if possible, ad astra". */
  {
    name: 'Stage 11 · Ad astra',
    lessons: [
    ['What finished would mean'],
    ['A hundred books', [{ title: '読書メーター', url: 'https://bookmeter.com/', note: 'Book logging, in Japanese.' }]],
    ['Keeping it, over years'],
    ],
  },
  {
    name: 'Kanji 1 · The commonest characters',
    lessons: [
    ['Kanji 1 · 日 一 人 大 年 国 中 本', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 2 · 二 三 四 五 六 七 八 九', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 3 · 十 百 千 万 円 時 分 半', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 4 · 月 火 水 木 金 土 曜', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 5 · 上 下 前 後 左 右 外 行', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ],
  },
  {
    name: 'Kanji 2 · Time, people and the common verbs',
    lessons: [
    ['Kanji 6 · 今 先 来 毎 週 午 間 何', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 7 · 口 目 耳 手 足 力 心 体', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 8 · 子 女 男 父 母 友 名 私', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 9 · 学 校 生 字 読 書 聞 語', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 10 · 見 言 話 食 飲 買 出 入', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ],
  },
  {
    name: 'Kanji 3 · Describing, places and more verbs',
    lessons: [
    ['Kanji 11 · 高 安 新 古 多 少 長 短', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 12 · 東 西 南 北 山 川 田 町', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 13 · 天 気 雨 風 空 海 花 色', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 14 · 立 休 待 持 作 使 住 知', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 15 · 店 駅 道 車 電 社 事 方', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ],
  },
  {
    name: 'Kanji 4 · Doing, going and the abstract',
    lessons: [
    ['Kanji 16 · 思 考 変 動 働 遊 泳 走', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 17 · 乗 降 着 送 受 返 貸 借', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 18 · 楽 悲 強 弱 近 遠 広 早', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 19 · 肉 魚 米 茶 酒 薬 服 物', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 20 · 問 題 答 意 味 用 理 由', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
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
for (const key of strayDetail) console.error(`! japanese-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! japanese-cards.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const cardCount = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, [name]) => k + (cards[name]?.length ?? 0), 0),
  0,
);
console.error(`modules: ${stages.length}  lessons: ${lessons}  cards: ${cardCount}`);
