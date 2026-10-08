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
  /** The only extension that may be read or written in it. */
  ext: '.mdx' | '.json';
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
    ext: '.mdx',
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
    ext: '.mdx',
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
    ext: '.json',
    singleFile: 'content/store/copy.json',
  },
];

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

  const pattern = new RegExp(
    `^${collection.dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[a-z0-9-]+\\${collection.ext}$`,
  );
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
