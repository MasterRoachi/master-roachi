// A live SEO checklist for the pages that become public.
//
// Shared on purpose: product copy, writing and projects all publish prose
// through the backend and all want the same questions asked, so the checks
// live here and each editor supplies what its page renders. Curriculums,
// boards, habits and reading never leave /work, so none of this applies to
// them — "only required for things that eventually become public facing like
// the shop or blog", which is also why `kind` has three values and not seven.
//
// WHAT THIS IS NOT. It is not a prediction of how a page will rank. Nothing
// that runs in a browser can know that, and a number claiming to would be a
// lie with a progress bar on it. It is a checklist of the things that are
// known to matter and are knowable from the text in front of you — length,
// the focus term landing where it should, alt text, a description that is
// actually a description — plus a weighted score so the list has an order and
// progress is visible while typing. Treat the checks as the product and the
// number as the summary, which is why every check carries its own `fix`.
//
// Pure, synchronous and DOM-free, so the editor can run it on every keystroke
// and the Worker test suite can run it without a browser.

export type CheckState = 'pass' | 'warn' | 'fail' | 'skip';

export interface SeoCheck {
  id: string;
  /** What is being asked, phrased as the goal rather than the failure. */
  label: string;
  state: CheckState;
  /** The measurement, in his own units: "142 characters", "3 paragraphs". */
  detail: string;
  /** What to do about it, present only when there is something to do. */
  fix?: string;
  /** How much it counts toward the score. */
  weight: number;
}

export interface SeoReport {
  /** 0–100, weighted. A warn counts half. */
  score: number;
  /** Rounded band, for colour and for a word. */
  grade: 'good' | 'fair' | 'poor';
  checks: SeoCheck[];
  /** Everything not passing, worst first — the to-do list. */
  todo: SeoCheck[];
  words: number;
  paragraphs: number;
}

export interface SeoInput {
  /** Decides the length targets: a product description is not a blog post. */
  kind: 'product' | 'post' | 'project';
  /** The <title> as the page will render it, site suffix included. */
  title: string;
  /** The meta description as the page will render it. */
  description: string;
  /** The prose being edited, as plain text with blank lines between paragraphs. */
  body: string;
  /**
   * The term this page should be found by. Defaults to the title's own words,
   * because a product called "Roachi Shirt" is the thing it is about and
   * asking him to restate that for every product is friction with no payoff.
   */
  focus?: string;
  /** Every image the page will render, so a missing alt is visible here. */
  images?: { alt?: string | null }[];
  /** Internal links in the prose. Only asked of posts. */
  internalLinks?: number;
}

/* Targets.
 *
 * Title and description ranges are what the search engines actually truncate
 * at, give or take the font: roughly 60 characters of title and 160 of
 * description get shown, and well under that wastes the slot. Body lengths are
 * per kind and deliberately modest — the shortest product copy on this site is
 * four sentences and reads better than most of the padding written to hit a
 * word count. */
const TITLE = { min: 25, max: 60 };
const DESCRIPTION = { min: 70, max: 160 };
const BODY_MIN: Record<SeoInput['kind'], number> = {
  product: 40,
  project: 80,
  // 500 rather than the 300 this started at, his call. The two finished posts
  // on the site are 1,601 and 989 words, so 300 was a bar they clear without
  // telling him anything; 500 is where one of his actually starts.
  post: 500,
};
/** Above this a paragraph is a wall and gets skimmed instead of read. */
const PARAGRAPH_MAX_WORDS = 90;
/** Repetition that reads as stuffing rather than as writing, as a percentage. */
const DENSITY = { min: 0.4, max: 3.5 };
/**
 * Below this many words, density is not a measurement.
 *
 * It was 20, and it made the check actively wrong on exactly the copy this
 * site is written in: one mention of a two-word product name in a 39-word
 * description is 5.1%, which was reported as stuffing. One mention is never
 * stuffing. Density only means something once there is enough text for a
 * proportion to be about the writing rather than about the arithmetic.
 */
const DENSITY_FLOOR = 80;
/** And however long the text, this few mentions cannot be stuffing. */
const STUFFING_MINIMUM = 3;

const WORD = /[\p{L}\p{N}']+/gu;

/** Words, counted the way a person would. */
export function wordsIn(text: string): string[] {
  return String(text ?? '').toLowerCase().match(WORD) ?? [];
}

/**
 * Paragraphs, split the way the product-copy editor saves them.
 *
 * Every newline is a paragraph there, single or double — see the split in
 * StoreCopyEditor — so counting only double newlines here would report a
 * different number from the one that ends up in the JSON, and the panel would
 * disagree with the page about what was written.
 */
export function paragraphsIn(text: string): string[] {
  return String(text ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The words worth matching on, with the obvious glue dropped. */
const STOP = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is',
  'it', 'its', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'with', 'you',
  'your',
]);

function focusTerms(input: SeoInput): string[] {
  const source = input.focus?.trim() || input.title;
  // The site suffix is on every title and is nobody's focus term.
  const cleaned = source.split('—')[0];
  return [...new Set(wordsIn(cleaned).filter((w) => w.length > 2 && !STOP.has(w)))];
}

/** How many of the focus terms appear in a piece of text. */
function covered(terms: string[], text: string): number {
  if (terms.length === 0) return 0;
  const words = new Set(wordsIn(text));
  return terms.filter((term) => words.has(term)).length;
}

/** The focus as an ordered phrase, for counting what was actually said. */
function focusPhrase(input: SeoInput): string[] {
  const source = input.focus?.trim() || input.title;
  return wordsIn(source.split('—')[0]).filter((w) => !STOP.has(w));
}

/** How many times the phrase appears, in order, in a run of words. */
function countPhrase(words: string[], phrase: string[]): number {
  if (phrase.length === 0) return 0;
  let found = 0;
  for (let at = 0; at <= words.length - phrase.length; at += 1) {
    if (phrase.every((word, offset) => words[at + offset] === word)) found += 1;
  }
  return found;
}

export function scoreSeo(input: SeoInput): SeoReport {
  const checks: SeoCheck[] = [];
  const words = wordsIn(input.body);
  const paragraphs = paragraphsIn(input.body);
  const terms = focusTerms(input);
  const title = String(input.title ?? '');
  const description = String(input.description ?? '');

  const add = (check: SeoCheck) => checks.push(check);

  // --- the two fields a search result is actually made of --------------------
  add({
    id: 'title-length',
    label: 'Title fits the result',
    weight: 3,
    state:
      title.length >= TITLE.min && title.length <= TITLE.max
        ? 'pass'
        : title.length === 0
          ? 'fail'
          : 'warn',
    detail: `${title.length} characters`,
    fix:
      title.length > TITLE.max
        ? `Over ${TITLE.max} and it gets cut off mid-word in the result.`
        : title.length < TITLE.min
          ? `Under ${TITLE.min} wastes the headline of the only advert you get for free.`
          : undefined,
  });

  const descState =
    description.length === 0
      ? 'fail'
      : description.length >= DESCRIPTION.min && description.length <= DESCRIPTION.max
        ? 'pass'
        : 'warn';
  add({
    id: 'description-length',
    label: 'Description fills the snippet',
    weight: 3,
    state: descState,
    detail: `${description.length} characters`,
    fix:
      description.length > DESCRIPTION.max
        ? `Over ${DESCRIPTION.max} and the end is replaced with an ellipsis.`
        : description.length < DESCRIPTION.min
          ? `Under ${DESCRIPTION.min} leaves most of the snippet to be filled in by the search engine, from whatever it picks off the page.`
          : undefined,
  });

  add({
    id: 'description-term',
    label: 'Description names the thing',
    weight: 2,
    state: terms.length === 0 ? 'skip' : covered(terms, description) > 0 ? 'pass' : 'fail',
    detail:
      terms.length === 0
        ? 'no focus term'
        : `${covered(terms, description)} of ${terms.length} focus words`,
    fix:
      terms.length > 0 && covered(terms, description) === 0
        ? `None of "${terms.join(', ')}" appear in the description, so the snippet does not say what the page is.`
        : undefined,
  });

  // --- the prose -------------------------------------------------------------
  const min = BODY_MIN[input.kind];
  add({
    id: 'body-length',
    label: 'Enough of your own words',
    weight: 3,
    state: words.length === 0 ? 'fail' : words.length >= min ? 'pass' : 'warn',
    detail: `${words.length} words`,
    fix:
      words.length === 0
        ? 'Nothing written, so this page is whatever the supplier said about the blank.'
        : words.length < min
          ? `Around ${min} is where a ${input.kind} page stops looking thinner than every other listing of the same product.`
          : undefined,
  });

  add({
    id: 'paragraphs',
    label: 'Broken into paragraphs',
    weight: 1,
    state: paragraphs.length === 0 ? 'fail' : paragraphs.length >= 2 ? 'pass' : 'warn',
    detail: `${paragraphs.length} paragraph${paragraphs.length === 1 ? '' : 's'}`,
    fix: paragraphs.length === 1 ? 'One block gets skimmed. Two or three get read.' : undefined,
  });

  const longest = paragraphs.reduce(
    (worst, p) => Math.max(worst, wordsIn(p).length),
    0,
  );
  add({
    id: 'paragraph-length',
    label: 'No wall of text',
    weight: 1,
    state: paragraphs.length === 0 ? 'skip' : longest <= PARAGRAPH_MAX_WORDS ? 'pass' : 'warn',
    detail: `longest is ${longest} words`,
    fix:
      longest > PARAGRAPH_MAX_WORDS
        ? `Split anything past ${PARAGRAPH_MAX_WORDS} words — on a phone that is most of a screen with no landing place for the eye.`
        : undefined,
  });

  add({
    id: 'opening-term',
    label: 'Opens on the subject',
    weight: 2,
    state:
      terms.length === 0 || paragraphs.length === 0
        ? 'skip'
        : covered(terms, paragraphs[0]) > 0
          ? 'pass'
          : 'warn',
    detail:
      paragraphs.length === 0
        ? 'nothing written'
        : `${covered(terms, paragraphs[0])} of ${terms.length} focus words in the first paragraph`,
    fix:
      terms.length > 0 && paragraphs.length > 0 && covered(terms, paragraphs[0]) === 0
        ? 'The first paragraph is what gets quoted and what gets read. Name the thing in it.'
        : undefined,
  });

  /* Density, which is the one check that can fail in both directions.
   *
   * Counted as occurrences of the whole focus PHRASE rather than of its
   * separate words. Counting words meant a single "Roachi Shirt" scored two
   * hits and a two-word name was permanently twice as dense as a one-word
   * name, for writing that had said the thing exactly once.
   *
   * Too low is invisible to a search engine, too high reads as written for
   * one — and has done more harm than good since about 2012. */
  const phrase = focusPhrase(input);
  const hits = countPhrase(words, phrase);
  const density = words.length === 0 ? 0 : ((hits * phrase.length) / words.length) * 100;
  const tooMany = density > DENSITY.max && hits >= STUFFING_MINIMUM;
  const tooFew = density < DENSITY.min;
  add({
    id: 'density',
    label: 'Reads like writing, not stuffing',
    weight: 2,
    state:
      phrase.length === 0 || words.length < DENSITY_FLOOR
        ? 'skip'
        : tooMany || tooFew
          ? 'warn'
          : 'pass',
    detail:
      words.length < DENSITY_FLOOR
        ? `${words.length} words — too short to measure`
        : `${hits} mention${hits === 1 ? '' : 's'}, ${density.toFixed(1)}% of the words`,
    fix:
      words.length >= DENSITY_FLOOR
        ? tooMany
          ? 'The name is repeated often enough to notice. Use "it" and let the page breathe.'
          : tooFew
            ? 'The subject is barely named in the body, so nothing connects the prose to the title.'
            : undefined
        : undefined,
  });

  // --- images ----------------------------------------------------------------
  const images = input.images ?? [];
  const missingAlt = images.filter((image) => !image.alt || !image.alt.trim()).length;
  add({
    id: 'alt-text',
    label: 'Every image describes itself',
    weight: 2,
    state: images.length === 0 ? 'skip' : missingAlt === 0 ? 'pass' : 'fail',
    detail:
      images.length === 0
        ? 'no images'
        : `${images.length - missingAlt} of ${images.length} have alt text`,
    fix: missingAlt > 0 ? `${missingAlt} image(s) have no alt text — invisible to a screen reader and to image search.` : undefined,
  });

  // --- links, which only a post is really asked about ------------------------
  if (input.kind === 'post') {
    const links = input.internalLinks ?? 0;
    add({
      id: 'internal-links',
      label: 'Links somewhere else on the site',
      weight: 1,
      state: links > 0 ? 'pass' : 'warn',
      detail: `${links} internal link${links === 1 ? '' : 's'}`,
      fix: links === 0 ? 'A post that links nowhere is a dead end for a reader and for a crawler.' : undefined,
    });
  }

  /* The number.
   *
   * A warn is worth half rather than nothing, because the difference between
   * "no description at all" and "a description eight characters short" is the
   * whole point of having three states — and a score that treated them alike
   * would send him to fix the wrong thing first. Skipped checks leave the
   * denominator, so a product with no images is not marked down for it. */
  const counted = checks.filter((check) => check.state !== 'skip');
  const total = counted.reduce((sum, check) => sum + check.weight, 0);
  const earned = counted.reduce(
    (sum, check) => sum + (check.state === 'pass' ? check.weight : check.state === 'warn' ? check.weight / 2 : 0),
    0,
  );
  const score = total === 0 ? 0 : Math.round((earned / total) * 100);

  const order: Record<CheckState, number> = { fail: 0, warn: 1, pass: 2, skip: 3 };
  const todo = counted
    .filter((check) => check.state === 'fail' || check.state === 'warn')
    .sort((a, b) => order[a.state] - order[b.state] || b.weight - a.weight);

  return {
    score,
    grade: score >= 85 ? 'good' : score >= 60 ? 'fair' : 'poor',
    checks,
    todo,
    words: words.length,
    paragraphs: paragraphs.length,
  };
}
