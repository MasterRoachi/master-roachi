import type { FieldSpec } from '@/lib/editor-fields';

// Which tab, and which part of it, each frontmatter field sits in.
//
// His pick, 2026-11-10 (redesign page, Projects and Writing: A): Details shows
// only the fields that matter, the rarely used ones fold under "More details",
// and the pictures have a tab of their own. The schema in lib/editor-fields.ts
// says what has a control; this says where the control goes. Kept here rather
// than as a flag on the schema because it is a layout decision about this
// editor, not a fact about the files.
//
// Pictures are worked out rather than listed: every `image` field, and the alt
// text field beside it (`hero` → `heroAlt`), so a new image key lands in the
// right tab with nothing added here.
//
// Rare is listed, per collection. Title, Summary, Date and Status (or Track)
// are never rare. For a project: Kind is on every card, so it stays out; the
// accents, the stack, the two links, the "card goes to" override and the
// pieces list are set once when a project is made and almost never again. For
// a post: tags are chosen on most posts, so they stay out; pointing a post at
// a project is the exception.

const RARE: Record<string, readonly string[]> = {
  projects: ['accent', 'accent2', 'stack', 'link', 'repo', 'href', 'pieces'],
  writing: ['project'],
};

export interface FieldGroups {
  main: FieldSpec[];
  more: FieldSpec[];
  pictures: FieldSpec[];
}

export function groupFields(collection: string, fields: readonly FieldSpec[]): FieldGroups {
  const imageKeys = new Set(fields.filter((field) => field.kind === 'image').map((field) => field.key));
  const isPicture = (field: FieldSpec) =>
    imageKeys.has(field.key) || (field.key.endsWith('Alt') && imageKeys.has(field.key.slice(0, -3)));
  const rare = new Set(RARE[collection] ?? []);

  const groups: FieldGroups = { main: [], more: [], pictures: [] };
  for (const field of fields) {
    if (isPicture(field)) groups.pictures.push(field);
    else if (rare.has(field.key)) groups.more.push(field);
    else groups.main.push(field);
  }
  return groups;
}
