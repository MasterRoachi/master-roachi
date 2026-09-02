import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Mdx from '@/components/Mdx';
import Sigil from '@/components/Sigil';
import { getAnyEntry, getAllSlugs } from '@/lib/content';
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
    // A draft has a URL so it can be previewed, but must not be indexed.
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

  return (
    <article className={`shell ${styles.entry}`}>
      <Link href="/work/" className={styles.back}>
        ← All work
      </Link>

      <header className={styles.head}>
        <div className={styles.headMark} aria-hidden="true">
          <Sigil size={22} color="var(--gold)" variant="mark" opacity={0.7} />
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

        {fm.link && (
          <a
            href={fm.link}
            className={styles.cta}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source ↗
          </a>
        )}
      </header>

      <Mdx source={entry.body} />
    </article>
  );
}
