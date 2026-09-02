import Link from 'next/link';
import { formatDate, TRACK_LABEL, type EntrySummary } from '@/lib/format';
import styles from './PostCard.module.css';

export default function PostCard({
  entry,
  basePath = '/thoughts',
  showTrack = true,
}: {
  entry: EntrySummary;
  basePath?: string;
  showTrack?: boolean;
}) {
  const track = entry.track ?? 'tech';

  return (
    <Link href={`${basePath}/${entry.slug}/`} className={styles.post}>
      <div className={styles.meta}>
        {showTrack && (
          <span className={styles.track} data-track={track}>
            {TRACK_LABEL[track]}
          </span>
        )}
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{entry.readingMinutes} min read</span>
        {entry.draft && <span className={styles.draft}>Draft</span>}
      </div>
      <h3 className={styles.title}>{entry.title}</h3>
      <p className={styles.summary}>{entry.summary}</p>
    </Link>
  );
}
