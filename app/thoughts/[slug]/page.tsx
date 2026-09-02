import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Mdx from '@/components/Mdx';
import { getAnyEntry, getAllSlugs } from '@/lib/content';
import { formatDate, TRACK_LABEL } from '@/lib/format';
import styles from '../../entry.module.css';

export function generateStaticParams() {
  return getAllSlugs('thoughts');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getAnyEntry('thoughts', slug);
  if (!entry) return {};
  return {
    // A draft has a URL so it can be previewed, but must not be indexed.
    robots: entry.frontmatter.draft ? { index: false, follow: false } : undefined,
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    openGraph: {
      title: entry.frontmatter.title,
      description: entry.frontmatter.summary,
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
  const entry = getAnyEntry('thoughts', slug);
  if (!entry) notFound();

  const { frontmatter: fm } = entry;
  const track = fm.track ?? 'tech';

  return (
    <article className={`shell ${styles.entry}`}>
      <Link href="/thoughts/" className={styles.back}>
        ← All thoughts
      </Link>

      <header className={styles.head}>
        <div className={styles.meta}>
          <span className={styles.track} data-track={track}>
            {TRACK_LABEL[track]}
          </span>
          <time dateTime={fm.date}>{formatDate(fm.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{entry.readingMinutes} min read</span>
          {fm.draft && <span className={styles.draft}>Draft</span>}
        </div>
        <h1 className={styles.title}>{fm.title}</h1>
        <p className={styles.summary}>{fm.summary}</p>
      </header>

      <Mdx source={entry.body} />
    </article>
  );
}
