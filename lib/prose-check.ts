// Live style and grammar checks for a draft, done locally.
//
// WHAT IT IS AND IS NOT. It is not a parser and it is not a grammar engine: it
// will not catch subject-verb agreement or a dangling modifier, and anything
// claiming to do that in a browser without a model behind it is lying. It is a
// list of mechanical faults and house-style slips that are cheap to find and
// genuinely worth catching while typing — a doubled word, a straight quote in
// a site written with curly ones, a hyphen standing in for an em dash, a
// forty-word sentence, "in order to".
//
// Local on purpose, so it is instant, free, needs no key, and the backend
// stays self-contained. Fact checking is deliberately absent: it cannot be
// done offline and, done at all, it can only ever list claims worth checking
// rather than return verdicts.
//
// THE HARD PART IS NOT FIRING ON CODE. A fenced block uses straight quotes
// because that is what the language wants, an MDX attribute uses them for the
// same reason, and a URL is full of hyphens and double slashes. So everything
// that is not prose is masked out first — replaced with spaces of the same
// length, which keeps every offset pointing at the right character so an issue
// can still be selected in the textarea it came from.

export type Severity = 'error' | 'style';

export interface ProseIssue {
  id: string;
  /** What is wrong, in a few words. */
  label: string;
  severity: Severity;
  /** The offending text, trimmed for display. */
  snippet: string;
  /** Offsets into the ORIGINAL text, so a caller can select it. */
  start: number;
  end: number;
  /** 1-based, for a human. */
  line: number;
  /** What to do instead, where there is one obvious answer. */
  fix?: string;
}

/**
 * The character non-prose is replaced with.
 *
 * NOT a space, which is what this did first and it made the checker wrong in
 * five different ways at once: `[the guide](https://…).` masked to spaces
 * reads as a space before a full stop, a masked JSX attribute line reads as
 * trailing whitespace, and a masked URL reads as a double space. Every one of
 * those fired on real posts and none of them was in the prose.
 *
 * NUL is neither whitespace nor a word character, so `\s` rules do not match
 * it and `\b` boundaries still work around it — and it is one code unit, so
 * every offset still points where it did.
 */
const MASK = '\u0000';

/**
 * Blank out everything that is not prose, keeping the length identical.
 *
 * Offsets have to survive this or every issue would point at the wrong
 * character once there is a single code block above it.
 */
function maskNonProse(text: string): string {
  let masked = text;

  // Newlines are kept so that line numbers and line-anchored rules still work.
  const blank = (match: string) =>
    match.replace(/[^\n]/g, MASK);

  // Fenced code blocks, including the fences.
  masked = masked.replace(/```[\s\S]*?```/g, blank);
  // Indented code blocks: four spaces at the start of a line.
  masked = masked.replace(/^ {4}.*$/gm, blank);
  // Inline code.
  masked = masked.replace(/`[^`\n]*`/g, blank);
  // JSX/MDX tags and their attributes — <Callout kind="note">.
  masked = masked.replace(/<[^>\n]*>/g, blank);
  // Link and image targets, but not their visible text.
  masked = masked.replace(/\]\([^)\s]*(?:\s+"[^"]*")?\)/g, blank);
  // Bare URLs.
  masked = masked.replace(/https?:\/\/\S+/g, blank);
  // YAML-ish lines inside the body, which the editor does not have but a
  // pasted frontmatter block would.
  masked = masked.replace(/^---$/gm, blank);

  return masked;
}

/** Which line an offset is on, 1-based. */
function lineAt(text: string, at: number): number {
  let line = 1;
  for (let i = 0; i < at && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

/* Words that legitimately repeat in English, so the doubled-word check does
 * not cry wolf on correct prose. "That that" is the common one — "the thing
 * that that man said" — and "had had" is the past perfect. */
const MAY_REPEAT = new Set(['that', 'had', 'no', 'very']);

/** Things that are simply wrong, with the correction. */
const MISSPELLINGS: [RegExp, string, string][] = [
  [/\bcould of\b/gi, 'could of', 'could have'],
  [/\bshould of\b/gi, 'should of', 'should have'],
  [/\bwould of\b/gi, 'would of', 'would have'],
  [/\balot\b/gi, 'alot', 'a lot'],
  [/\bdefinately\b/gi, 'definately', 'definitely'],
  [/\bseperate\b/gi, 'seperate', 'separate'],
  [/\brecieve\b/gi, 'recieve', 'receive'],
  [/\boccured\b/gi, 'occured', 'occurred'],
  [/\bits'\b/g, "its'", 'its, or it is'],
  [/\bit's own\b/gi, "it's own", 'its own'],
  [/\byour welcome\b/gi, 'your welcome', 'you are welcome'],
  [/\bthere own\b/gi, 'there own', 'their own'],
  [/\bwould'nt\b/gi, "would'nt", 'wouldn’t'],
];

/** Padding that almost always reads better cut. */
const FILLER: [RegExp, string][] = [
  [/\bin order to\b/gi, 'to'],
  [/\bthe fact that\b/gi, 'that'],
  [/\bit is important to note that\b/gi, 'just say it'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bin spite of the fact that\b/gi, 'although'],
];

/** Words that weaken a sentence more often than they help it. */
const QUALIFIERS = /\b(very|really|quite|just|actually|basically|simply|literally|totally)\b/gi;

/** Above this a sentence is doing too much. */
const LONG_SENTENCE = 40;

export function checkProse(text: string): ProseIssue[] {
  const source = String(text ?? '');
  const prose = maskNonProse(source);
  const issues: ProseIssue[] = [];

  const add = (
    id: string,
    label: string,
    severity: Severity,
    start: number,
    end: number,
    fix?: string,
  ) => {
    issues.push({
      id,
      label,
      severity,
      snippet: source.slice(start, end).replace(/\s+/g, ' ').trim(),
      start,
      end,
      line: lineAt(source, start),
      fix,
    });
  };

  const scan = (pattern: RegExp, handle: (match: RegExpExecArray) => void) => {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    let match: RegExpExecArray | null;
    while ((match = re.exec(prose)) !== null) {
      handle(match);
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  };

  // --- things that are simply wrong -----------------------------------------
  scan(/\b(\w+)(\s+)\1\b/gi, (match) => {
    if (MAY_REPEAT.has(match[1].toLowerCase())) return;
    // A line break between them is usually a list, not a stutter.
    if (match[2].includes('\n')) return;
    add('doubled-word', 'The same word twice', 'error', match.index, match.index + match[0].length,
      `Just “${match[1]}”.`);
  });

  for (const [pattern, wrong, right] of MISSPELLINGS) {
    scan(pattern, (match) => {
      add('misspelling', `“${wrong}”`, 'error', match.index, match.index + match[0].length,
        `Should be “${right}”.`);
    });
  }

  scan(/\s+[,.;:!?](?!\w)/g, (match) => {
    // An ellipsis or a decimal is not this.
    if (/\.\s*\./.test(match[0])) return;
    add('space-before-punctuation', 'Space before punctuation', 'error',
      match.index, match.index + match[0].length);
  });

  // --- house style ----------------------------------------------------------
  //
  // The site is written with curly quotes and em dashes throughout, so a
  // straight apostrophe is a paste from somewhere else rather than a choice.
  scan(/'/g, (match) => {
    add('straight-apostrophe', 'Straight apostrophe', 'style', match.index, match.index + 1,
      'This site uses ’ everywhere else.');
  });
  scan(/"/g, (match) => {
    add('straight-quote', 'Straight quotation mark', 'style', match.index, match.index + 1,
      'This site uses “ ” everywhere else.');
  });
  /* " - " as a dash. The em dash is the house punctuation mark; a spaced
   * hyphen is what a word processor leaves behind.
   *
   * Requires something on the line before it, because `- **Irony**` at the
   * start of a line is a list bullet and this fired on nine of them in one
   * post before that was fixed. */
  scan(/\S[ \t]+-[ \t]+\S/g, (match) => {
    add('hyphen-as-dash', 'Hyphen used as a dash', 'style', match.index, match.index + match[0].length,
      'An em dash — like this one.');
  });
  scan(/\S  +/g, (match) => {
    add('double-space', 'More than one space', 'style', match.index, match.index + match[0].length);
  });
  scan(/[ \t]+$/gm, (match) => {
    if (match[0].length === 0) return;
    add('trailing-space', 'Trailing whitespace', 'style', match.index, match.index + match[0].length);
  });

  for (const [pattern, better] of FILLER) {
    scan(pattern, (match) => {
      add('filler', `“${match[0]}”`, 'style', match.index, match.index + match[0].length,
        `Usually just “${better}”.`);
    });
  }

  scan(QUALIFIERS, (match) => {
    add('qualifier', `“${match[0]}”`, 'style', match.index, match.index + match[0].length,
      'Cut it and read the sentence again.');
  });

  /* Passive voice, roughly.
   *
   * "was written", "is built", "were taken". Rough because a real test needs a
   * parser — so it is reported as style, never as an error, and it is the one
   * check most likely to be wrong about a sentence that is fine. */
  scan(/\b(was|were|is|are|been|being)\s+(\w+ed|written|built|taken|given|made|done|known)\b/gi, (match) => {
    add('passive', 'Possibly passive', 'style', match.index, match.index + match[0].length);
  });

  // --- sentence length ------------------------------------------------------
  //
  // Split on terminators rather than on a sentence tokeniser, which is both
  // what is available and good enough: an abbreviation inflates one sentence's
  // count and never invents a long one.
  let at = 0;
  for (const piece of prose.split(/(?<=[.!?])\s+/)) {
    const words = piece.trim().split(/\s+/).filter(Boolean).length;
    if (words > LONG_SENTENCE) {
      const start = at + (piece.length - piece.trimStart().length);
      add('long-sentence', `A ${words}-word sentence`, 'style', start, at + piece.length,
        'Somewhere in here there are two sentences.');
    }
    at += piece.length + 1;
  }

  /* A NAME SPELLED TWO WAYS IS NOT CHECKED, and the attempt is worth
   * recording so it is not made again.
   *
   * The idea was to catch "Orthodoxy" against "orthodoxy" — a slip this site
   * does make. Done with regex it cannot tell a proper noun from a word that
   * happens to start a sentence, and "## The two you can" is not a sentence
   * start by any test that does not understand Markdown. On one real post it
   * produced thirty-two findings, every one of them an ordinary word like
   * "and" or "what" capitalised at the start of something. A check that is
   * wrong thirty-two times is worse than no check: it buries the ones that
   * are right. It needs a parser, or a model, and neither belongs here.
   */

  // Earliest first, so the list reads down the page the way the post does.
  return issues.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}

/** A count per severity, for the panel's heading. */
export function countIssues(issues: ProseIssue[]): { errors: number; style: number } {
  return {
    errors: issues.filter((issue) => issue.severity === 'error').length,
    style: issues.filter((issue) => issue.severity === 'style').length,
  };
}
