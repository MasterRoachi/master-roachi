import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Mdx from '@/components/Mdx';
import PostCard from '@/components/PostCard';
import Starfield from '@/components/Starfield';
import {
  getAnyEntry,
  getAllSlugs,
  getProjects,
  getWritingForProject,
  toSummary,
} from '@/lib/content';
import { STATUS_LABEL, type Status } from '@/lib/format';
import styles from './project.module.css';

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
    robots: entry.frontmatter.draft
      ? { index: false, follow: false }
      : undefined,
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

  // Neighbours in the same order the projects index uses, so moving between
  // pages matches the order they were browsed in.
  const all = getProjects();
  const i = all.findIndex((p) => p.slug === slug);
  const prev = i > 0 ? all[i - 1] : null;
  const nextUp = i >= 0 && i < all.length - 1 ? all[i + 1] : null;

  const accent = fm.accent ?? 'var(--accent)';
  const accent2 = fm.accent2 ?? accent;

  return (
    <div
      className={styles.page}
      style={
        {
          '--accent-a': accent,
          '--accent-b': accent2,
        } as React.CSSProperties
      }
    >
      {/* The field takes the project's own colour, so the page belongs to it
          rather than being a generic template with a title swapped in. */}
      <section className={styles.top}>
        <Starfield
          tint={`radial-gradient(120% 90% at 72% 30%, color-mix(in oklch, ${accent} 18%, transparent), transparent 68%), radial-gradient(90% 70% at 15% 85%, color-mix(in oklch, ${accent2} 12%, transparent), transparent 62%)`}
        />

        <div className={`shell ${styles.topInner}`}>
          <Link href="/projects/" className={styles.back}>
            ← Projects
          </Link>

          <div className={styles.badges}>
            {fm.kind && <span className={styles.kind}>{fm.kind}</span>}
            <span className={styles.status} data-status={status}>
              {STATUS_LABEL[status]}
            </span>
          </div>

          <h1 className={styles.title}>{fm.title}</h1>
          <p className={styles.summary}>{fm.summary}</p>

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
                <a
                  className={styles.action}
                  href={fm.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit ↗
                </a>
              )}
              {fm.repo && (
                <a
                  className={`${styles.action} ${styles.actionQuiet}`}
                  href={fm.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source ↗
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <article className={`shell ${styles.body}`}>
        <Mdx source={entry.body} />
      </article>

      {related.length > 0 && (
        <section className={`shell ${styles.related}`}>
          <p className="eyebrow">Written about this</p>
          {related.map((post) => (
            <PostCard key={post.slug} entry={post} />
          ))}
        </section>
      )}

      {(prev || nextUp) && (
        <nav className={styles.pager} aria-label="Other projects">
          {prev ? (
            <Link href={`/projects/${prev.slug}/`} className={styles.pagerLink}>
              <span className={styles.pagerLabel}>← Previous</span>
              <span className={styles.pagerTitle}>
                {prev.frontmatter.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextUp && (
            <Link
              href={`/projects/${nextUp.slug}/`}
              className={`${styles.pagerLink} ${styles.pagerNext}`}
            >
              <span className={styles.pagerLabel}>Next →</span>
              <span className={styles.pagerTitle}>
                {nextUp.frontmatter.title}
              </span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
