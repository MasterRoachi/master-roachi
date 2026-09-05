import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { Track, Status, EntrySummary } from './format';
export type { Status };

// Filesystem-backed content collections. Every entry is an .mdx file under
// content/<collection>/, with YAML frontmatter. Read at build time only —
// these functions run in server components during prerender and never reach
// the browser.

export interface Frontmatter {
  title: string;
  summary: string;
  date: string;

  // Writing only.
  track?: Track;
  /**
   * What kind of post it is, beyond which track it sits in.
   *
   * `track` answers the subject — Gaming, Orthodoxy, Code — and a post has
   * exactly one. These answer the form, and a post can have several: a
   * BioShock piece is a Walkthrough and an Achievement guide at once, and
   * neither of those is a subject.
   */
  tags?: string[];
  /** Slug of a project this post belongs to, e.g. a devlog entry. */
  project?: string;

  // Projects only.
  status?: Status;
  /** What the thing is, in a couple of words: "Game", "Store", "World". */
  kind?: string;
  /** Outbound links. `link` is the primary one; `repo` is source. */
  link?: string;
  repo?: string;
  stack?: string[];
  /** Ordering on the projects index — higher floats to the top. */
  weight?: number;
  /** Per-project hover colour, and its second stop. Any CSS colour. */
  accent?: string;
  accent2?: string;
  /**
   * Cover art, as a path under public/ — screenshot, key art, a map. Absent
   * is a supported state: the card simply has no picture rather than a broken
   * one or a placeholder standing in for work that does not exist yet.
   */
  cover?: string;
  /** What the cover shows, for anyone who cannot see it. */
  coverAlt?: string;
  /**
   * Where this card goes, when the project already lives on another page.
   * Fabled Threads is the Store, so it has no second home under /projects/.
   */
  href?: string;
  /**
   * Individual pieces making up a project — the Odin exercises, and anything
   * else that is a collection rather than a single thing.
   */
  pieces?: {
    title: string;
    summary: string;
    /** Live demo. */
    demo?: string;
    /** Source, if it differs from the project's own repo. */
    source?: string;
    tags?: string[];
  }[];

  /** Hidden from listings and marked noindex; still visible in `next dev`. */
  draft?: boolean;
}

export interface Entry {
  slug: string;
  body: string;
  readingMinutes: number;
  frontmatter: Frontmatter;
}

const CONTENT_ROOT = path.join(process.cwd(), 'content');

function readCollection(collection: string): Entry[] {
  const dir = path.join(CONTENT_ROOT, collection);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.mdx$/, ''),
        body: content,
        readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
        frontmatter: data as Frontmatter,
      };
    });
}

// Drafts are authored in the repo but withheld from the deployed site, so a
// half-written post can be committed without publishing it.
const showDrafts = process.env.NODE_ENV === 'development';

function publishable(entries: Entry[]): Entry[] {
  return entries.filter((e) => showDrafts || !e.frontmatter.draft);
}

function byNewest(a: Entry, b: Entry): number {
  return Date.parse(b.frontmatter.date) - Date.parse(a.frontmatter.date);
}

/** Projects sort by explicit weight first, then by date. */
function byWeightThenNewest(a: Entry, b: Entry): number {
  const wa = a.frontmatter.weight ?? 0;
  const wb = b.frontmatter.weight ?? 0;
  if (wa !== wb) return wb - wa;
  return byNewest(a, b);
}

export function getProjects(): Entry[] {
  return publishable(readCollection('projects')).sort(byWeightThenNewest);
}

export function getWriting(track?: Track): Entry[] {
  const all = publishable(readCollection('writing')).sort(byNewest);
  return track ? all.filter((e) => e.frontmatter.track === track) : all;
}

/** Posts attached to a project — devlog entries, write-ups, postmortems. */
export function getWritingForProject(slug: string): Entry[] {
  return getWriting().filter((e) => e.frontmatter.project === slug);
}

export function getCollection(collection: string): Entry[] {
  return publishable(readCollection(collection)).sort(byNewest);
}

/** Strip the MDX body so a list can be handed to a client component. */
export function toSummary(entry: Entry): EntrySummary {
  return {
    slug: entry.slug,
    title: entry.frontmatter.title,
    summary: entry.frontmatter.summary,
    date: entry.frontmatter.date,
    readingMinutes: entry.readingMinutes,
    track: entry.frontmatter.track,
    tags: entry.frontmatter.tags,
    project: entry.frontmatter.project,
    draft: entry.frontmatter.draft,
    cover: entry.frontmatter.cover,
    coverAlt: entry.frontmatter.coverAlt,
  };
}

// ---------------------------------------------------------------------------
// Route generation
//
// Drafts still get a page. Two reasons: it gives a draft a real URL to preview
// at, and `output: 'export'` refuses to build a dynamic route whose
// generateStaticParams() returns an empty array — so a section with nothing
// published yet would otherwise break the build outright. Draft pages are
// marked noindex by each route's generateMetadata.
// ---------------------------------------------------------------------------

export function getAllEntries(collection: string): Entry[] {
  return readCollection(collection).sort(byNewest);
}

export function getAnyEntry(
  collection: string,
  slug: string,
): Entry | undefined {
  return getAllEntries(collection).find((e) => e.slug === slug);
}

export function getAllSlugs(collection: string): { slug: string }[] {
  return hasOwnPage(getAllEntries(collection)).map((e) => ({ slug: e.slug }));
}

/**
 * Entries that actually get a page generated for them.
 *
 * An entry whose card points elsewhere has no page of its own — Fabled Threads
 * sets `href: /store/` because the catalogue and the checkout already live
 * there, so generating a second, unlinked copy under /projects/ would be a page
 * nothing points to.
 *
 * This is exported because generateStaticParams was not the only place that
 * needed to know. The sitemap listed /projects/fabled-threads/ and the pager on
 * the neighbouring project linked to it, both from the unfiltered list, so the
 * site advertised and linked a URL that had deliberately never been built. One
 * function now, used by all three.
 */
export function hasOwnPage(entries: Entry[]): Entry[] {
  return entries.filter((e) => !e.frontmatter.href);
}

/** Projects with a page of their own, in the order the index shows them. */
export function getProjectPages(): Entry[] {
  return hasOwnPage(getProjects());
}

/**
 * A project reduced to what a card renders. The card is interactive, so it is
 * a client component — passing whole entries would serialise every MDX body
 * into the payload for text no card ever shows.
 */
export interface ProjectSummary {
  slug: string;
  title: string;
  summary: string;
  status: Status;
  kind?: string;
  stack?: string[];
  accent?: string;
  accent2?: string;
  cover?: string;
  coverAlt?: string;
  href?: string;
}

export function toProjectSummary(entry: Entry): ProjectSummary {
  return {
    slug: entry.slug,
    title: entry.frontmatter.title,
    summary: entry.frontmatter.summary,
    status: entry.frontmatter.status ?? 'building',
    kind: entry.frontmatter.kind,
    stack: entry.frontmatter.stack,
    accent: entry.frontmatter.accent,
    accent2: entry.frontmatter.accent2,
    cover: entry.frontmatter.cover,
    coverAlt: entry.frontmatter.coverAlt,
    href: entry.frontmatter.href,
  };
}
