// A page body as its opening and its `## ` sections, for the editor's fields.
//
// His ruling, 2026-10-19 (Stage 2): the body gets labelled fields for the
// parts every project page has — an opening, then sections under `## `
// headings — with the raw text still there for everything else.
//
// The rule from SPEC holds here too: nothing parses and reserialises the
// document. A section's text is kept VERBATIM, every blank line and every
// `<Split>` exactly as written; only the heading line is a field. So
// joinSections(splitSections(body)) is the identical string, always, and a
// save that changed nothing changes nothing.
//
// Only `## ` at the start of a line starts a section. `###` and deeper stay
// inside their section's text. A `## ` line inside a fenced code block would
// still split — no project page has one — and even then the round trip is
// exact; the card boundaries would merely be in an odd place.

export interface Section {
  /** The heading's text, after "## ". */
  heading: string;
  /** Everything after the heading's text up to the next section, starting with its newline. */
  text: string;
}

export interface Sections {
  /** Everything before the first `## ` heading, verbatim. */
  opening: string;
  sections: Section[];
}

const HEADING = /^## (.*)$/gm;

export function splitSections(body: string): Sections {
  const found = [...body.matchAll(HEADING)];
  if (found.length === 0) return { opening: body, sections: [] };
  const opening = body.slice(0, found[0].index);
  const sections = found.map((match, i) => {
    const textStart = (match.index ?? 0) + match[0].length;
    const textEnd = i + 1 < found.length ? (found[i + 1].index ?? body.length) : body.length;
    return { heading: match[1], text: body.slice(textStart, textEnd) };
  });
  return { opening, sections };
}

export function joinSections({ opening, sections }: Sections): string {
  // A heading must start its own line. Text that came out of splitSections
  // always ends in a newline before the next heading, so this only ever
  // repairs an edit that deleted it — it cannot change an untouched body.
  const ended = (text: string) => (text === '' || text.endsWith('\n') ? text : `${text}\n`);
  let out = sections.length ? ended(opening) : opening;
  sections.forEach((section, i) => {
    const text = `## ${section.heading}${section.text}`;
    out += i + 1 < sections.length ? ended(text) : text;
  });
  return out;
}

/**
 * A section's text as the box shows it: without the newline that ends the
 * heading line, which is structure rather than writing. `withBreak` puts it
 * back, so showing and saving a section that was not touched is exact.
 */
export function shownText(text: string): string {
  return text.startsWith('\n') ? text.slice(1) : text;
}

export function withBreak(shown: string): string {
  return `\n${shown}`;
}

/** A new, empty section, ending in a blank line so the next heading stays a heading. */
export function newSection(heading = 'New section'): Section {
  return { heading, text: '\n\n\n' };
}

/** An image beside text, as the site's `<Split>` component takes it. */
export function splitBlock(src: string, side: 'left' | 'right'): string {
  return `<Split src="${src}" side="${side}">\n\nText beside the image.\n\n</Split>\n`;
}
