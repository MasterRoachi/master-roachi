import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Mdx from '@/components/Mdx';
import PostCard from '@/components/PostCard';
import { getAnyEntry, getAllSlugs, getWritingForProject, toSummary } from '@/lib/content';
import { STATUS_LABEL, type Status } from '@/lib/format';
import styles from '../../entry.module.css';

export function generateStaticParams() {
  return getAllSlugs('projects');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getAnyEntry('projects', slug);
  if (!entry) return {};
  return {
    robots: entry.frontmatter.draft ? { index: false, follow: false } : undefined,
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    openGraph: {
      title: entry.frontmatter.title,
      description: entry.frontmatter.summary,
      type: 'article',
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getAnyEntry('projects', slug);
  if (!entry) notFound();

  const { frontmatter: fm } = entry;
  const status: Status = fm.status ?? 'building';
  const related = getWritingForProject(slug).map(toSummary);

  return (
    <article className={`shell ${styles.entry}`}>
      <Link href="/projects/" className={styles.back}>
        ← Projects
      </Link>

      <header className={styles.head}>
        <div className={styles.badges}>
          {fm.kind && <span className={styles.kind}>{fm.kind}</span>}
          <span className={styles.status} data-status={status}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <h1 className={styles.title}>{fm.title}</h1>
        <p className="lede">{fm.summary}</p>

        {fm.stack && fm.stack.length > 0 && (
          <ul className={styles.stack}>
            {fm.stack.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        )}

        {(fm.link || fm.repo) && (
          <div className={styles.actions}>
            {fm.link && (
              <a className="button button--accent" href={fm.link} target="_blank" rel="noopener noreferrer">
                Visit ↗
              </a>
            )}
            {fm.repo && (
              <a className="button" href={fm.repo} target="_blank" rel="noopener noreferrer">
                Source ↗
              </a>
            )}
          </div>
        )}
      </header>

      <Mdx source={entry.body} />

      {related.length > 0 && (
        <section className={styles.related}>
          <h2 className="section-title">Written about this</h2>
          {related.map((post) => (
            <PostCard key={post.slug} entry={post} />
          ))}
        </section>
      )}
    </article>
  );
}
