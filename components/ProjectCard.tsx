import Link from 'next/link';
import { STATUS_LABEL, type Status } from '@/lib/format';
import type { Entry } from '@/lib/content';
import styles from './Card.module.css';

// Every project links to its own page, whatever its status — a concept still
// has something to say about itself. The old build made unreleased cards
// non-clickable, which left them looking like dead UI.
export default function ProjectCard({ entry }: { entry: Entry }) {
  const { frontmatter: fm, slug } = entry;
  const status: Status = fm.status ?? 'building';

  return (
    <Link href={`/projects/${slug}/`} className={styles.card}>
      <div className={styles.cardTop}>
        {fm.kind && <span className={styles.kind}>{fm.kind}</span>}
        <span className={styles.status} data-status={status}>
          {STATUS_LABEL[status]}
        </span>
      </div>
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
    </Link>
  );
}
