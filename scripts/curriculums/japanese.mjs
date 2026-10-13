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
    name: 'Kanji 1 · The first forty',
    lessons: [
    ['Kanji 1 · 日 一 人 大 年 国 中 本', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 2 · 二 三 四 五 六 七 八 九', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 3 · 十 百 千 万 円 時 分 半', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 4 · 月 火 水 木 金 土 曜', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
    ['Kanji 5 · 上 下 前 後 左 右 外 行', [{ title: 'Jisho — stroke order animations', url: 'https://jisho.org', note: 'Search a character; the stroke order plays on its page.' }]],
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
