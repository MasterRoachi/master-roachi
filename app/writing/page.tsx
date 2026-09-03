import type { Metadata } from 'next';
import Link from 'next/link';
import GlyphField from '@/components/GlyphField';
import CyclingQuote from '@/components/CyclingQuote';
import { quotes } from '@/lib/quotes';
import QuillIcon from '@/components/QuillIcon';
import PageHeader from '@/components/PageHeader';
import PostCard from '@/components/PostCard';
import { getWriting, toSummary } from '@/lib/content';
import {
  TRACK_LABEL,
  TRACK_COLOUR,
  formatDate,
  type Track,
} from '@/lib/format';
import styles from './writing.module.css';

export const metadata: Metadata = {
  title: 'Thoughts',
  description: 'Posts on code, games, and Orthodoxy.',
};

/** Blue, the colour Thoughts carries in the nav. */
const ACCENT = 'oklch(74% 0.15 250)';

/** The order tracks appear in, when they have anything in them. */
const ORDER: Track[] = ['gaming', 'theology', 'code', 'devlog'];

export default function WritingPage() {
  const posts = getWriting().map(toSummary);

  // Newest first is what getWriting already gives, so the lead is simply the
  // first — and the groups below keep the rest in that same order.
  const [lead, ...rest] = posts;

  const groups = ORDER.map((track) => ({
    track,
    posts: rest.filter((p) => (p.track ?? 'code') === track),
  })).filter((g) => g.posts.length > 0);

  return (
    <div
      className={styles.page}
      style={{ '--accent-a': ACCENT } as React.CSSProperties}
    >
      <GlyphField />

      <div className={`shell ${styles.body}`}>
        <PageHeader
          mark={<QuillIcon />}
          eyebrow="Thoughts"
          title="I&rsquo;m a ramblin&rsquo; man"
          lede={<CyclingQuote quotes={quotes} seed="thoughts" />}
        />

        {!lead && (
          <p className={styles.empty}>
            Nothing published yet. It lands here when it does.
          </p>
        )}

        {lead && (
          <Link
            href={`/writing/${lead.slug}/`}
            className={styles.lead}
          >
            {lead.cover && (
              <span className={styles.leadArt}>
                <img
                  src={lead.cover}
                  alt={lead.coverAlt ?? ''}
                  width={920}
                  height={430}
                  loading="eager"
                  decoding="async"
                />
              </span>
            )}
            <span className={styles.leadBody}>
            <span className={styles.leadMeta}>
              <span
                className={styles.leadTrack}
                style={
                  {
                    '--track': TRACK_COLOUR[lead.track ?? 'code'],
                  } as React.CSSProperties
                }
              >
                {TRACK_LABEL[lead.track ?? 'code']}
              </span>
              <time dateTime={lead.date}>{formatDate(lead.date)}</time>
              <span>{lead.readingMinutes} min</span>
            </span>
            <h2 className={styles.leadTitle}>{lead.title}</h2>
            <p className={styles.leadSummary}>{lead.summary}</p>
            <span className={styles.leadCta}>Read it →</span>
            </span>
          </Link>
        )}

        {groups.map(({ track, posts: inTrack }) => (
          <section
            key={track}
            className={styles.group}
            style={{ '--track': TRACK_COLOUR[track] } as React.CSSProperties}
          >
            <h2 className={styles.groupHead}>
              <span>{TRACK_LABEL[track]}</span>
              <span className={styles.groupCount}>{inTrack.length}</span>
            </h2>
            <div>
              {inTrack.map((post) => (
                /* The track is the heading of the group it sits in, so
                   repeating it on every card underneath says nothing. */
                <PostCard key={post.slug} entry={post} showTrack={false} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
