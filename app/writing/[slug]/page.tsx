import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Mdx from '@/components/Mdx';
import { getAnyEntry, getAllSlugs, getProjects } from '@/lib/content';
import { formatDate, TRACK_LABEL } from '@/lib/format';
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

  return (
    <article className={`shell ${styles.entry}`}>
      <Link href="/writing/" className={styles.back}>
        ← Writing
      </Link>

      <header className={styles.head}>
        <div className={styles.meta}>
          <span className={styles.track}>{TRACK_LABEL[track]}</span>
          <time dateTime={fm.date}>{formatDate(fm.date)}</time>
          <span>{entry.readingMinutes} min read</span>
          {fm.draft && <span className={styles.draft}>Draft</span>}
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

      <Mdx source={entry.body} />
    </article>
  );
}
