import Link from 'next/link';
import { formatDate, TRACK_LABEL, type EntrySummary } from '@/lib/format';
import styles from './PostCard.module.css';

export default function PostCard({
  entry,
  showTrack = true,
}: {
  entry: EntrySummary;
  showTrack?: boolean;
}) {
  const track = entry.track ?? 'code';

  return (
    <Link href={`/writing/${entry.slug}/`} className={styles.post}>
      <div className={styles.side}>
        {showTrack && <span className={styles.track}>{TRACK_LABEL[track]}</span>}
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        <span>{entry.readingMinutes} min</span>
        {entry.draft && <span className={styles.draft}>Draft</span>}
      </div>
      <div>
        <h3 className={styles.title}>{entry.title}</h3>
        <p className={styles.summary}>{entry.summary}</p>
      </div>
    </Link>
  );
}
