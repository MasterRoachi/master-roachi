// Parsing a lesson's Markdown into blocks — the part worth testing.
//
// The rendering lives in app/work/curriculums/Curriculums.tsx, which is a
// client component and cannot be imported here. This is only the reading of
// the text: where a block starts and ends, and whether it is a table.
//
// It is in lib/ because this subset is the CEILING ON WHAT A LESSON CAN TEACH.
// `detail` stopped being a note about a lesson and became the material itself
// — "i dont want to open the sources, the material itself should be accessible
// here" — so a renderer that cannot show a code sample or a paradigm forces
// every curriculum to be written to the renderer instead of to the subject.
// Worth a test apiece, because the failure mode is not a crash: it is hundreds
// of lessons quietly displaying something other than what was written.

export type Block =
  | { kind: 'prose'; text: string }
  | { kind: 'code'; lang: string | null; text: string };

/**
 * A lesson's blocks, with fenced code kept whole.
 *
 * This used to be `source.split(/\n{2,}/)`, which cannot see a fence: a code
 * sample containing a blank line arrived as two or three unrelated blocks with
 * the opening and closing backticks in different ones. And every sample, blank
 * line or not, came out as one run-together inline code span — because ``` is
 * three backticks and the inline pattern matches a pair of them, so it took
 * the fence as an opening delimiter and the whole program as its contents.
 * Ninety-two Godot lessons were already shipping their code that way.
 *
 * So fences are found by walking lines, and only what is left over is split on
 * blank lines.
 */
export function blocksOf(source: string): Block[] {
  const out: Block[] = [];
  const lines = source.split('\n');
  let prose: string[] = [];

  const flush = () => {
    for (const block of prose.join('\n').split(/\n{2,}/)) {
      const text = block.trim();
      if (text) out.push({ kind: 'prose', text });
    }
    prose = [];
  };

  for (let at = 0; at < lines.length; at += 1) {
    const open = /^\s*```+[ \t]*([A-Za-z0-9+#._-]*)[ \t]*$/.exec(lines[at]);
    if (!open) {
      prose.push(lines[at]);
      continue;
    }

    flush();
    const code: string[] = [];
    at += 1;
    while (at < lines.length && !/^\s*```+[ \t]*$/.test(lines[at])) {
      code.push(lines[at]);
      at += 1;
    }
    // An unclosed fence runs to the end of the lesson rather than falling back
    // to prose: a missing backtick is a typo, and the code is still the most
    // useful thing on the page. As prose it would print its own backticks and
    // lose every line break, which is how this looked before.
    out.push({ kind: 'code', lang: open[1] || null, text: code.join('\n') });
  }

  flush();
  return out;
}

export interface Table {
  align: ('left' | 'center' | 'right')[];
  head: string[];
  rows: string[][];
}

/**
 * A pipe table, or null if the block is not one.
 *
 * The delimiter row decides it. A block of lines that merely begin with a pipe
 * could be anything, whereas `| --- | :-: |` is unambiguous and carries the
 * column alignment with it.
 *
 * Needed because a good deal of what has to be taught IS a table: kana against
 * their romanisation, a Greek noun's cases across both numbers, the three
 * spheres of government against what each may legislate on. Flattened into
 * prose a table becomes a list of words with every relationship removed.
 */
export function tableOf(block: string): Table | null {
  const lines = block.split('\n');
  if (lines.length < 2) return null;
  if (!lines.every((line) => line.trim().startsWith('|'))) return null;

  const cells = (line: string) => {
    let text = line.trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|')) text = text.slice(0, -1);
    return text.split('|').map((cell) => cell.trim());
  };

  const rule = cells(lines[1]);
  if (!rule.length || !rule.every((cell) => /^:?-+:?$/.test(cell))) return null;

  return {
    align: rule.map((cell) =>
      cell.startsWith(':') && cell.endsWith(':')
        ? 'center'
        : cell.endsWith(':')
          ? 'right'
          : 'left',
    ),
    head: cells(lines[0]),
    rows: lines.slice(2).map(cells),
  };
}
