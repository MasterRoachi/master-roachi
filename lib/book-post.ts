// Turning a book's notes into a post for the site.
//
// The thoughts on a book are already prose in Markdown — that is why the field
// says so — so this is mostly frontmatter and a lead line. Nothing here
// publishes: every post comes out as a draft, because `draft: true` keeps it
// off the live site until it is published deliberately from the writing
// editor. A tool that posted straight to a public site on one click would be
// a tool nobody could use for a first draft.

export interface BookForPost {
  title: string;
  author: string | null;
  pages: number | null;
  rating: number | null;
  started_on: string | null;
  finished_on: string | null;
  notes: string | null;
}

/**
 * A YAML double-quoted scalar.
 *
 * Quoting is not optional. A title containing a colon — "Dune: Messiah", "Vol
 * 2: The Return" — is a mapping to a YAML parser, and an unquoted one would
 * commit a file that fails the build. Since the build IS the deploy here, that
 * failure takes the site's next deploy with it. Backslashes and quotes have to
 * be escaped inside the quotes, and newlines folded, or the quoting itself
 * breaks.
 */
export function yamlString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  return `"${escaped}"`;
}

/** A summary for the post, taken from the note's own opening. */
export function summaryFrom(notes: string): string {
  // The first sentence if there is one short enough to be a summary, otherwise
  // a clean truncation. Whatever happens it is one line, because frontmatter
  // is one line.
  const flat = notes.replace(/\s+/g, ' ').trim();
  const sentence = flat.match(/^(.{20,180}?[.!?])(\s|$)/);
  if (sentence) return sentence[1];
  return flat.length > 180 ? `${flat.slice(0, 177).trimEnd()}…` : flat;
}

const STARS = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

/**
 * The post, as a complete .mdx file.
 *
 * `track` is deliberately absent. It is the post's subject — theology, gaming,
 * code, devlog — and which one a book belongs to depends on the book, so
 * guessing would file half of them wrongly. It is one line to add in the
 * writing editor, where the post is going to be read over anyway.
 */
export function postFor(book: BookForPost, today: string): string {
  const notes = (book.notes ?? '').trim();

  const facts = [
    book.author,
    book.pages ? `${book.pages} pages` : null,
    book.rating ? STARS(book.rating) : null,
    book.finished_on ? `finished ${book.finished_on}` : null,
  ].filter(Boolean);

  // The date is the day it was finished where that is known — the post is
  // about having read it, not about the afternoon the note was tidied up.
  const date = book.finished_on ?? today;

  return `---
title: ${yamlString(book.title)}
summary: ${yamlString(summaryFrom(notes))}
date: ${date}
draft: true
---

${facts.length > 0 ? `*${facts.join(' · ')}*\n\n` : ''}${notes}
`;
}

/** A slug that is safe as a filename and as a URL. */
export function slugFor(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
