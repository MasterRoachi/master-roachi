// What the backend editor puts a control in front of, per collection.
//
// A schema and not a form component, so that the thing deciding which fields
// exist is one short list rather than JSX spread through an editor — and so
// the Worker tests can check it without a browser.
//
// IT IS DELIBERATELY NOT EXHAUSTIVE. Any frontmatter key missing from here is
// still editable, as raw text, in the "other fields" box — see
// lib/frontmatter.ts for why that matters. The schema decides what gets a nice
// control, never what is allowed to exist. Adding a key to a file without
// adding it here costs a plain textarea and loses nothing.

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'select'
  | 'tags'
  | 'color'
  | 'image'
  | 'url'
  | 'blocklist';

export interface EntryField {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'url' | 'tags';
}

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  /** One line under the control, for anything the label cannot say. */
  hint?: string;
  /** For `select`. The first is not a default — absent stays absent. */
  options?: readonly string[];
  /** For `blocklist`: the fields of one entry. */
  entry?: readonly EntryField[];
  /** Named in the warnings when it is missing. */
  required?: boolean;
}

/**
 * `weight` is absent on purpose.
 *
 * It is a sort key with no meaning of its own — 40 to 100 across six projects,
 * highest first — so a number box asks the wrong question. The order is set by
 * dragging the list, and /work/api/reorder redistributes the existing numbers
 * into the new order as a single commit.
 */
const PROJECT_FIELDS: readonly FieldSpec[] = [
  { key: 'title', label: 'Title', kind: 'text', required: true },
  {
    key: 'summary',
    label: 'Summary',
    kind: 'textarea',
    required: true,
    // Worth saying on screen: unlike the store, where the description had to
    // be taught to use his words, this field already IS the page's meta
    // description. Editing it is an SEO change.
    hint: 'Also the page’s meta description — this is what a search result shows.',
  },
  { key: 'date', label: 'Date', kind: 'date' },
  {
    key: 'status',
    label: 'Status',
    kind: 'select',
    options: ['released', 'building', 'ongoing', 'concept', 'parked'],
    hint: 'Shown on the card and the page. “Parked” is how something goes inactive without being hidden.',
  },
  {
    key: 'kind',
    label: 'Kind',
    kind: 'text',
    hint: 'Game, Store, Tool, World, Exercises — a couple of words for what the thing is.',
  },
  {
    key: 'hero',
    label: 'Hero image',
    kind: 'image',
    hint: 'Leads the project’s own page. Wide crops work; the card is a separate picture.',
  },
  { key: 'heroAlt', label: 'Hero alt text', kind: 'text' },
  {
    key: 'cover',
    label: 'Cover',
    kind: 'image',
    hint: 'The card in the grid and the face in the homepage deck. Generated from the accents if absent.',
  },
  { key: 'coverAlt', label: 'Cover alt text', kind: 'text' },
  { key: 'accent', label: 'Accent', kind: 'color' },
  { key: 'accent2', label: 'Second accent', kind: 'color' },
  { key: 'stack', label: 'Stack', kind: 'tags' },
  { key: 'link', label: 'Visit link', kind: 'url' },
  { key: 'repo', label: 'Source repo', kind: 'url' },
  {
    key: 'href',
    label: 'Card goes to',
    kind: 'url',
    hint: 'Only for a project that lives on another page — Fabled Threads is the store.',
  },
  {
    key: 'pieces',
    label: 'Pieces',
    kind: 'blocklist',
    hint: 'For a project that is a collection of things rather than one thing.',
    entry: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'summary', label: 'Summary', kind: 'textarea' },
      { key: 'demo', label: 'Demo', kind: 'url' },
      { key: 'tags', label: 'Tags', kind: 'tags' },
    ],
  },
];

const WRITING_FIELDS: readonly FieldSpec[] = [
  { key: 'title', label: 'Title', kind: 'text', required: true },
  {
    key: 'summary',
    label: 'Summary',
    kind: 'textarea',
    required: true,
    hint: 'Also the post’s meta description, and what the feed shows.',
  },
  { key: 'date', label: 'Date', kind: 'date' },
  {
    key: 'track',
    label: 'Track',
    kind: 'select',
    options: ['code', 'gaming', 'theology', 'devlog'],
    hint: 'The subject, and a post has exactly one. /gaming and /orthodoxy are built from it.',
  },
  {
    key: 'tags',
    label: 'Tags',
    kind: 'tags',
    hint: 'The form rather than the subject — a post can be a Walkthrough and an Achievement guide at once.',
  },
  { key: 'project', label: 'Project slug', kind: 'text', hint: 'Points this post at a project page.' },
  { key: 'cover', label: 'Cover', kind: 'text' },
];

export const COLLECTION_FIELDS: Record<string, readonly FieldSpec[]> = {
  projects: PROJECT_FIELDS,
  writing: WRITING_FIELDS,
};

export function fieldsFor(collection: string): readonly FieldSpec[] {
  return COLLECTION_FIELDS[collection] ?? [];
}

/** Every key with a control, plus the ones handled elsewhere. */
export function knownKeys(collection: string): string[] {
  // `draft` has its own button and `weight` its own drag handle, so neither
  // should also appear in the raw box as an unknown field.
  return [...fieldsFor(collection).map((field) => field.key), 'draft', 'weight'];
}

export interface Warning {
  key: string;
  text: string;
}

/**
 * What is wrong with a file, without refusing to save it.
 *
 * Warn rather than block, his call, with one exception kept in the Worker: a
 * malformed JSON body is refused outright because it fails the build, and a
 * failed build leaves the old site up with no obvious cause. Everything here
 * is survivable — a missing cover is a card without a picture, not a broken
 * deploy — so it is said out loud and left to him.
 */
export function warningsFor(
  collection: string,
  values: Record<string, string>,
  options: { images?: readonly string[]; isOklch?: (value: string) => boolean } = {},
): Warning[] {
  const out: Warning[] = [];
  const images = options.images ?? [];

  for (const field of fieldsFor(collection)) {
    const value = (values[field.key] ?? '').trim();

    if (field.required && !value) {
      out.push({ key: field.key, text: `${field.label} is empty.` });
      continue;
    }
    if (!value) continue;

    if (field.kind === 'select' && field.options && !field.options.includes(value)) {
      out.push({
        key: field.key,
        text: `“${value}” is not one of ${field.options.join(', ')} — the page will fall back to its default.`,
      });
    }
    if (field.kind === 'color' && options.isOklch && !options.isOklch(value)) {
      out.push({
        key: field.key,
        text: `${field.label} is not an oklch colour, so the card will not take it.`,
      });
    }
    if (field.kind === 'image' && images.length > 0 && !images.includes(value)) {
      out.push({
        key: field.key,
        text: `${value} is not a file in public/ — the page will show a broken image.`,
      });
    }
    if (field.kind === 'url' && !/^(https?:\/\/|\/)/.test(value)) {
      out.push({
        key: field.key,
        text: `${field.label} should start with https:// or a leading slash.`,
      });
    }
  }

  // An image with no alt text is the one accessibility failure this editor can
  // actually prevent, and the SEO panel marks it too.
  for (const [image, alt] of [
    ['hero', 'heroAlt'],
    ['cover', 'coverAlt'],
  ]) {
    if ((values[image] ?? '').trim() && !(values[alt] ?? '').trim()) {
      out.push({ key: alt, text: `There is a ${image} but no alt text for it.` });
    }
  }

  return out;
}
