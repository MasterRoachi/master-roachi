import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import PostCard from '@/components/PostCard';
import { getWriting, toSummary } from '@/lib/content';
import { orthodoxWork } from '@/lib/pursuits';
import styles from './orthodoxy.module.css';

export const metadata: Metadata = {
  title: 'Orthodoxy',
  description:
    'Articles and videos on Eastern Orthodoxy — aimed at people willing to ask whether it is true.',
};

export default function OrthodoxyPage() {
  const posts = getWriting('theology').map(toSummary);
  const published = orthodoxWork.filter((w) => !w.upcoming);
  const upcoming = orthodoxWork.filter((w) => w.upcoming);

  return (
    <div className="shell" style={{ paddingBottom: '120px' }}>
      <PageHeader
        eyebrow="Orthodoxy"
        title="Study Well"
        lede="Long-form video, written argument, and questions taken seriously. The aim is not to make Orthodoxy trendy — it is to ask whether it is true."
      />

      {published.length > 0 && (
        <section className={styles.section}>
          <h2 className="section-title">Published</h2>
          <ul className={styles.list}>
            {published.map((item) => (
              <li key={item.title}>
                <span className={styles.kind}>{item.kind}</span>
                {item.url ? (
                  <a className="link" href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                ) : (
                  <span>{item.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className={styles.section}>
          <h2 className="section-title">In the works</h2>
          <ul className={styles.list}>
            {upcoming.map((item) => (
              <li key={item.title} className={styles.upcoming}>
                <span className={styles.kind}>{item.kind}</span>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2 className="section-title">Articles</h2>
        {posts.length === 0 ? (
          <p className={styles.empty}>Nothing published yet.</p>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.slug} entry={post} showTrack={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
