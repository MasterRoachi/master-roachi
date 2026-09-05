import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Mdx from '@/components/Mdx';
import { getAnyEntry, getAllSlugs, getProjects } from '@/lib/content';
import { formatDate, TRACK_LABEL, TRACK_COLOUR } from '@/lib/format';
import GlyphField from '@/components/GlyphField';
import ReadingProgress from '@/components/ReadingProgress';
import styles from '../../entry.module.css';

export function generateStaticParams() {
  return getAllSlugs('writing');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getAnyEntry('writing', slug);
  if (!entry) return {};
  const meta = pageMeta({
    path: `/writing/${slug}/`,
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    image: entry.frontmatter.cover ?? undefined,
    type: 'article',
    noIndex: entry.frontmatter.draft,
  });
  // The publication date is the one thing pageMeta has no opinion about,
  // since only articles have one.
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      // Restated so the OpenGraph union narrows to the article variant, which
      // is the only one that admits publishedTime.
      type: 'article',
      publishedTime: entry.frontmatter.date,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getAnyEntry('writing', slug);
  if (!entry) notFound();

  const { frontmatter: fm } = entry;
  const track = fm.track ?? 'code';
  const project = fm.project
    ? getProjects().find((p) => p.slug === fm.project)
    : undefined;

  // The post takes its track's colour, so a piece about Orthodoxy reads in
  // Foundations gold and one about a game in Fun's green — the same identity
  // the section it belongs to has everywhere else on the site. Posts were the
  // only pages on the site with no accent at all.
  return (
    <div
      className={styles.page}
      style={{ '--accent-a': TRACK_COLOUR[track] } as React.CSSProperties}
    >
      <ReadingProgress />
      {/* The same field Thoughts runs, so a post looks like it came from the
          page that lists it rather than from a plain document template. */}
      <GlyphField tint={TRACK_COLOUR[track]} />

      <article className={`shell ${styles.entry} ${styles.body}`}>
        <Link href="/writing/" className={styles.back}>
          ← Writing
        </Link>

      <header className={styles.head}>
        <div className={styles.meta}>
          <span className={styles.track}>{TRACK_LABEL[track]}</span>
          <time dateTime={fm.date}>{formatDate(fm.date)}</time>
          <span>{entry.readingMinutes} min read</span>
          {fm.draft && <span className={styles.draft}>Draft</span>}
          {fm.tags?.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <h1 className={styles.title}>{fm.title}</h1>
        <p className="lede">{fm.summary}</p>
        {project && (
          <p className={styles.attached}>
            Part of{' '}
            <Link href={`/projects/${project.slug}/`} className="link">
              {project.frontmatter.title}
            </Link>
          </p>
        )}
      </header>

      {fm.cover && (
        <figure className={styles.cover}>
          <img
            src={fm.cover}
            alt={fm.coverAlt ?? ''}
            width={1600}
            height={900}
            loading="eager"
            decoding="async"
          />
        </figure>
      )}

        <Mdx source={entry.body} />
      </article>
    </div>
  );
}
