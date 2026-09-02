import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { Track, EntrySummary } from './format';

// Filesystem-backed content collections. Every entry is an .mdx file under
// content/<collection>/, with YAML frontmatter. Read at build time only —
// these functions are called from server components during prerender, never
// shipped to the browser.

export interface Frontmatter {
  title: string;
  summary: string;
  date: string;
  /** Thoughts only: which of the two tracks this post belongs to. */
  track?: Track;
  /** Work only: the live/source link, and the stack it was built with. */
  link?: string;
  stack?: string[];
  /** Work only: dims the card and drops the outbound link. */
  status?: 'live' | 'in-progress' | 'planned';
  /** Hidden from production builds; still visible in `next dev`. */
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
// half-written post can be committed without publishing it. `next dev` shows
// them so they can be previewed while being written.
const showDrafts = process.env.NODE_ENV === 'development';

function publishable(entries: Entry[]): Entry[] {
  return entries.filter((e) => showDrafts || !e.frontmatter.draft);
}

function byNewest(a: Entry, b: Entry): number {
  return Date.parse(b.frontmatter.date) - Date.parse(a.frontmatter.date);
}

export function getCollection(collection: string): Entry[] {
  return publishable(readCollection(collection)).sort(byNewest);
}

export function getEntry(collection: string, slug: string): Entry | undefined {
  return getCollection(collection).find((e) => e.slug === slug);
}

/** Slugs for `generateStaticParams` — every route must be known at build. */
export function getSlugs(collection: string): { slug: string }[] {
  return getCollection(collection).map((e) => ({ slug: e.slug }));
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
    draft: entry.frontmatter.draft,
  };
}

// ---------------------------------------------------------------------------
// Draft handling
//
// Drafts are withheld from every *listing* — index pages, the sitemap, and the
// RSS feed all go through getCollection() above, which filters them out.
//
// Their pages are still generated, though, for two reasons: it gives a draft a
// real URL to preview at, and `output: 'export'` refuses to build a dynamic
// route whose generateStaticParams() returns an empty array. Without this, a
// blog with nothing published yet cannot compile at all.
//
// Draft pages are marked noindex by the route's generateMetadata, so they stay
// out of search results.
// ---------------------------------------------------------------------------

/** Every entry including drafts. For route generation only, never listings. */
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
  return getAllEntries(collection).map((e) => ({ slug: e.slug }));
}
