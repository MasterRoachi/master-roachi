import Link from 'next/link';
import Sigil from './Sigil';
import type { Entry } from '@/lib/content';
import styles from './Card.module.css';

const STATUS_LABEL = {
  live: 'Live',
  'in-progress': 'In Progress',
  planned: 'Coming Soon',
} as const;

// Gold marks real, shipped work; teal marks anything still ahead of it.
// SPEC.md sets that as the rule for the whole palette.
export default function ProjectCard({ entry }: { entry: Entry }) {
  const { frontmatter: fm, slug } = entry;
  const status = fm.status ?? 'live';
  const accent = status === 'live' ? 'gold' : 'teal';

  const inner = (
    <>
      <span className={styles.corner}>
        <Sigil
          size={18}
          color={`var(--${accent})`}
          variant="mark"
          opacity={0.7}
        />
      </span>
      <p className={styles.label} data-accent={accent}>
        {STATUS_LABEL[status]}
      </p>
      <h3 className={styles.title}>{fm.title}</h3>
      <p className={styles.body}>{fm.summary}</p>
      {fm.stack && fm.stack.length > 0 && (
        <div className={styles.meta}>
          {fm.stack.map((tech) => (
            <span key={tech} className={styles.tag}>
              {tech}
            </span>
          ))}
        </div>
      )}
    </>
  );

  // A planned project has nothing to link to yet, so it renders as a plain
  // card rather than a dead link.
  if (status === 'planned') {
    return (
      <div className={styles.card} data-status={status}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/work/${slug}/`} className={styles.card} data-status={status}>
      {inner}
    </Link>
  );
}
