'use client';

import { useMemo, useState } from 'react';
import PostCard from './PostCard';
import { TRACK_LABEL, type EntrySummary, type Track } from '@/lib/format';
import styles from './WritingList.module.css';

type Filter = 'all' | Track;

const ORDER: Track[] = ['code', 'gaming', 'theology', 'devlog'];

export default function WritingList({ posts }: { posts: EntrySummary[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const acc = { code: 0, gaming: 0, theology: 0, devlog: 0 } as Record<
      Track,
      number
    >;
    for (const post of posts) acc[post.track ?? 'code'] += 1;
    return acc;
  }, [posts]);

  // A filter row over nothing just advertises the emptiness.
  if (posts.length === 0) {
    return (
      <p className={styles.empty}>Nothing published yet. It lands here when it does.</p>
    );
  }

  const visible =
    filter === 'all'
      ? posts
      : posts.filter((post) => (post.track ?? 'code') === filter);

  // Only offer a track that actually has something in it.
  const available = ORDER.filter((t) => counts[t] > 0);

  return (
    <>
      {available.length > 1 && (
        <div className={styles.filters} role="group" aria-label="Filter by track">
          <button
            type="button"
            className={styles.filter}
            data-active={filter === 'all'}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All <span>{posts.length}</span>
          </button>
          {available.map((t) => (
            <button
              key={t}
              type="button"
              className={styles.filter}
              data-active={filter === t}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {TRACK_LABEL[t]} <span>{counts[t]}</span>
            </button>
          ))}
        </div>
      )}

      <div>
        {visible.map((post) => (
          <PostCard key={post.slug} entry={post} />
        ))}
      </div>
    </>
  );
}
