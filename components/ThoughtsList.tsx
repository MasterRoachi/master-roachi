'use client';

import { useMemo, useState } from 'react';
import PostCard from './PostCard';
import { TRACK_LABEL, type EntrySummary, type Track } from '@/lib/format';
import styles from './ThoughtsList.module.css';

type Filter = 'all' | Track;

// SPEC.md calls for two visible tracks, Tech and Theology. Filtering happens
// on the client over an already-rendered list, so it stays instant and the
// page itself is still fully prerendered for crawlers.
export default function ThoughtsList({ posts }: { posts: EntrySummary[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        const track = post.track ?? 'tech';
        acc[track] += 1;
        return acc;
      },
      { tech: 0, theology: 0 } as Record<Track, number>,
    );
  }, [posts]);

  const visible =
    filter === 'all'
      ? posts
      : posts.filter((post) => (post.track ?? 'tech') === filter);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: posts.length },
    { key: 'tech', label: TRACK_LABEL.tech, count: counts.tech },
    { key: 'theology', label: TRACK_LABEL.theology, count: counts.theology },
  ];

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter by track">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={styles.filter}
            data-active={filter === f.key}
            data-track={f.key}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className={styles.count}>{f.count}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>Nothing published under this track yet.</p>
      ) : (
        <div>
          {visible.map((post) => (
            <PostCard key={post.slug} entry={post} />
          ))}
        </div>
      )}
    </>
  );
}
