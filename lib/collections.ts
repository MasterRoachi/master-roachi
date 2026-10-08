// What the backend is allowed to edit.
//
// This is the allow-list, and it is the whole security boundary on writes.
// The endpoint commits to a repository that deploys itself, so anything not
// described here must be unreachable — most of all .github/workflows, where a
// write would turn a stolen Access session into arbitrary CI.
//
// Adding a collection is adding an entry. Nothing else in the Worker knows
// the names of any directories.

export interface Collection {
  /** URL key, and what the page asks for. */
  key: string;
  /** What it is called on screen. */
  label: string;
  /** Repo-relative directory, no trailing slash. */
  dir: string;
  /**
   * Every extension that may be read or written in it. An array and not one
   * string because a scratchpad note is a .md file and its drawing is a .png
   * beside it — a registry that cannot say that is the wrong registry.
   *
   * The first is what a new file gets named with.
   */
  exts: readonly string[];
  /**
   * A single file rather than a directory of them.
   *
   * content/store/copy.json is one object keyed by Printful id, so there is
   * nothing to list — the collection is that file and only that file.
   */
  singleFile?: string;
  /** Starting text for something new. Absent for single-file collections. */
  template?: (today: string) => string;
}

export const COLLECTIONS: Collection[] = [
  {
    key: 'writing',
    label: 'Writing',
    dir: 'content/writing',
    exts: ['.mdx'],
    template: (today) => `---
title: ""
summary:
date: ${today}
track:
draft: true
---

`,
  },
  {
    key: 'projects',
    label: 'Projects',
    dir: 'content/projects',
    exts: ['.mdx'],
    // Matches what the existing project pages carry. weight orders the grid and
    // the accents drive each card's colour, so a project with neither looks
    // broken rather than plain — they are in the template for that reason.
    template: (today) => `---
title: ""
summary:
date: ${today}
status: building
kind: Game
weight: 50
accent: "oklch(82% 0.16 85)"
accent2: "oklch(70% 0.14 95)"
stack: []
cover:
---

`,
  },
  {
    key: 'store-copy',
    label: 'Product copy',
    dir: 'content/store',
    exts: ['.json'],
    singleFile: 'content/store/copy.json',
  },
  {
    key: 'notes',
    label: 'Notes',
    // Not under content/, deliberately. content/ is what the site publishes,
    // and these are his own notes — versioned and private, which is what the
    // repo is for once the Access gate is in front of the only page that
    // reads them. lib/content.ts never looks here.
    dir: 'notes',
    // The note, and the drawing that may sit beside it under the same slug.
    exts: ['.md', '.png'],
    template: (today) => `---
title: ""
date: ${today}
---

`,
  },
];

/** What a new file in this collection is called. */
export function newPath(collection: Collection, slug: string): string {
  return `${collection.dir}/${slug}${collection.exts[0]}`;
}

export function collectionFor(key: unknown): Collection | null {
  if (typeof key !== 'string') return null;
  return COLLECTIONS.find((c) => c.key === key) ?? null;
}

/**
 * Whether a path is one this collection may touch.
 *
 * Built from the collection rather than hardcoded, and matched WHOLE: one
 * directory, one flat level, a restricted filename, one extension. No amount
 * of `../` or percent-encoding widens it, because nothing about the candidate
 * is interpreted — it either matches the shape exactly or it is refused.
 */
export function pathAllowed(collection: Collection, candidate: unknown): string | null {
  if (typeof candidate !== 'string') return null;

  if (collection.singleFile) {
    return candidate === collection.singleFile ? candidate : null;
  }

  const dir = collection.dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exts = collection.exts.map((ext) => ext.replace('.', '\\.')).join('|');
  const pattern = new RegExp(`^${dir}/[a-z0-9-]+(${exts})$`);
  return pattern.test(candidate) ? candidate : null;
}

/** The frontmatter line that decides whether a post is published. */
const DRAFT_LINE = /^draft:\s*(true|false)\s*$/m;

/** Whether the text in front of us is a draft. Absent means published. */
export function isDraft(text: string): boolean {
  return DRAFT_LINE.exec(text)?.[1] === 'true';
}

/**
 * Flip the draft flag in a file's own text.
 *
 * Rewriting the text rather than keeping the flag somewhere beside it, so the
 * editor stays honest: what is stored is what is shown, and he can see the
 * line change. A file with no draft line gets one, inserted inside the
 * frontmatter rather than appended — appending would put it in the body,
 * where it is prose rather than metadata.
 */
export function setDraft(text: string, draft: boolean): string {
  if (DRAFT_LINE.test(text)) {
    return text.replace(DRAFT_LINE, `draft: ${draft}`);
  }

  const fence = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fence) return text;
  return text.replace(fence[0], `---\n${fence[1]}\ndraft: ${draft}\n---`);
}
