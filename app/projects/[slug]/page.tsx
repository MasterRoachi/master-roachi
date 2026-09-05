import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Mdx from '@/components/Mdx';
import PostCard from '@/components/PostCard';
import Starfield from '@/components/Starfield';
import ProjectPieces from '@/components/ProjectPieces';
import StackIcons from '@/components/StackIcons';
import {
  getAnyEntry,
  getAllSlugs,
  getProjectPages,
  getWritingForProject,
  toSummary,
} from '@/lib/content';
import { STATUS_LABEL, type Status } from '@/lib/format';
import { pageMeta } from '@/lib/seo';
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
  // Its own canonical and og:url. Without these it inherited the root's, and
  // every project page declared itself a duplicate of the homepage.
  return pageMeta({
    path: `/projects/${slug}/`,
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    image: entry.frontmatter.cover ?? undefined,
    type: 'article',
    noIndex: entry.frontmatter.draft,
  });
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
  // pages matches the order they were browsed in — but only those that have a
  // page to move to. Fabled Threads sits in that order and has no page, so the
  // unfiltered list sent "next project" from Shepherds straight to a 404.
  const all = getProjectPages();
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
            <div className={styles.stack}>
              <StackIcons stack={fm.stack} />
            </div>
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

      {fm.pieces && fm.pieces.length > 0 && (
        <section className={`shell ${styles.pieces}`}>
          <div className={styles.piecesHead}>
            <p className="eyebrow">In the collection</p>
            {/* Counts the ones that actually have a demo. "All 24, live" was
                true when every piece had one and stopped being true the moment
                three command-line exercises joined the list. */}
            <h2 className="section-title">
              {(() => {
                const live = fm.pieces.filter((p) => p.demo).length;
                return live === fm.pieces.length
                  ? `All ${live}, live`
                  : `${fm.pieces.length}, ${live} of them live`;
              })()}
            </h2>
          </div>
          <ProjectPieces pieces={fm.pieces} />
        </section>
      )}

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
            <Link
              href={`/projects/${prev.slug}/`}
              className={styles.pagerLink}
              style={
                {
                  '--accent-a': prev.frontmatter.accent ?? 'var(--accent)',
                } as React.CSSProperties
              }
            >
              <span className={styles.pagerLabel}>
                <span className={styles.pagerArrow}>←</span> Previous
              </span>
              <span className={styles.pagerTitle}>
                {prev.frontmatter.title}
              </span>
              {prev.frontmatter.kind && (
                <span className={styles.pagerKind}>{prev.frontmatter.kind}</span>
              )}
            </Link>
          ) : (
            <span className={styles.pagerEmpty} />
          )}
          {nextUp ? (
            <Link
              href={`/projects/${nextUp.slug}/`}
              className={`${styles.pagerLink} ${styles.pagerNext}`}
              style={
                {
                  '--accent-a': nextUp.frontmatter.accent ?? 'var(--accent)',
                } as React.CSSProperties
              }
            >
              <span className={styles.pagerLabel}>
                Next <span className={styles.pagerArrow}>→</span>
              </span>
              <span className={styles.pagerTitle}>
                {nextUp.frontmatter.title}
              </span>
              {nextUp.frontmatter.kind && (
                <span className={styles.pagerKind}>
                  {nextUp.frontmatter.kind}
                </span>
              )}
            </Link>
          ) : (
            <span className={styles.pagerEmpty} />
          )}
        </nav>
      )}
    </div>
  );
}
