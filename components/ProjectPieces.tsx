import type { Frontmatter } from '@/lib/content';
import styles from './ProjectPieces.module.css';

// The individual pieces of a project that is a collection rather than one
// thing — the Odin exercises being the case that prompted it.
//
// Every piece links to a live demo where there is one: a list of exercise
// names is a claim, a list of working links is evidence.

type Piece = NonNullable<Frontmatter['pieces']>[number];

export default function ProjectPieces({ pieces }: { pieces: Piece[] }) {
  return (
    <ol className={styles.pieces}>
      {pieces.map((piece, i) => (
        <li key={piece.title} className={styles.piece}>
          <span className={styles.index} aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>

          <div className={styles.detail}>
            <h3 className={styles.title}>{piece.title}</h3>
            <p className={styles.summary}>{piece.summary}</p>
            {piece.tags && piece.tags.length > 0 && (
              <div className={styles.tags}>
                {piece.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.links}>
            {piece.demo && (
              <a
                className={styles.link}
                href={piece.demo}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open ↗
              </a>
            )}
            {piece.source && (
              <a
                className={`${styles.link} ${styles.linkQuiet}`}
                href={piece.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source ↗
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
