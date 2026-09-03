import type { Metadata } from 'next';
import CandleField from '@/components/CandleField';
import OrthodoxCross from '@/components/OrthodoxCross';
import PageHeader from '@/components/PageHeader';
import PostCard from '@/components/PostCard';
import { getWriting, toSummary } from '@/lib/content';
import { orthodoxWork, orthodoxReading } from '@/lib/pursuits';
import { getVideos } from '@/lib/videos';
import CyclingQuote from '@/components/CyclingQuote';
import { faithQuotes } from '@/lib/quotes';
import styles from './orthodoxy.module.css';

export const metadata: Metadata = {
  title: 'Foundations',
  description:
    'Articles and videos on Eastern Orthodoxy — aimed at people willing to ask whether it is true.',
};

/** Gold, the colour this side of the site carries in the nav and on the cross. */
const ACCENT = 'oklch(84% 0.16 92)';
const ACCENT_2 = 'oklch(70% 0.14 80)';

/**
 * The one piece that gets the top of the page rather than a place in the list.
 *
 * Matched on slug rather than a frontmatter flag so there is exactly one, and
 * so nothing silently becomes the anchor by having the wrong field set. Absent
 * is a supported state: the section is simply not there until the piece is
 * written.
 */
const ROAD_IN_SLUG = 'the-road-in';

export default function OrthodoxyPage() {
  const posts = getWriting('theology').map(toSummary);
  const roadIn = posts.find((p) => p.slug === ROAD_IN_SLUG);
  const articles = posts.filter((p) => p.slug !== ROAD_IN_SLUG);

  const videos = getVideos('orthodoxy');
  const upcoming = orthodoxWork.filter((w) => w.upcoming);
  const published = orthodoxWork.filter((w) => !w.upcoming);

  const reading = orthodoxReading.filter((r) => r.status !== 'finished');

  return (
    <div
      className={styles.page}
      style={
        { '--accent-a': ACCENT, '--accent-b': ACCENT_2 } as React.CSSProperties
      }
    >
      <section className={styles.top}>
        <CandleField />
        <div className={`shell ${styles.topInner}`}>
          <PageHeader
            mark={<OrthodoxCross />}
            eyebrow="Foundations"
            title="Study Well"
            lede={<CyclingQuote quotes={faithQuotes} />}
          />
        </div>
      </section>

      <div className="shell">
        {roadIn && (
          <section className={styles.section}>
            {/* No section heading: the card underneath already carries the
                title in full, and the two together said "The road in" twice
                in a row. */}
            <p className="eyebrow">Start here</p>
            <PostCard entry={roadIn} showTrack={false} />
          </section>
        )}

        {videos.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Watch</p>
            <h2 className="section-title">Videos</h2>
            <ul className={styles.videos}>
              {videos.map((video) => (
                <li key={video.id}>
                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                    <img
                      className={styles.videoThumb}
                      src={video.thumbnail}
                      alt=""
                      width={480}
                      height={360}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className={styles.videoTitle}>{video.title}</span>
                    {video.published && (
                      <span className={styles.videoDate}>
                        {new Date(video.published).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {published.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Published</p>
            <h2 className="section-title">Out in the world</h2>
            <ul className={styles.list}>
              {published.map((item) => (
                <li key={item.title}>
                  <span className={styles.kind}>{item.kind}</span>
                  {item.url ? (
                    <a
                      className="link"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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

        {reading.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Study</p>
            <h2 className="section-title">Reading</h2>
            <ul className={styles.reading}>
              {reading.map((item) => (
                <li key={item.title} data-status={item.status}>
                  <span className={styles.readingStatus}>
                    {item.status === 'reading' ? 'Open' : 'Next'}
                  </span>
                  <span className={styles.readingBody}>
                    <span className={styles.readingTitle}>{item.title}</span>
                    {item.author && (
                      <span className={styles.readingMeta}>{item.author}</span>
                    )}
                  </span>
                  {item.note && (
                    <span className={styles.readingNote}>{item.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {articles.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Read</p>
            <h2 className="section-title">Articles</h2>
            <div>
              {articles.map((post) => (
                <PostCard key={post.slug} entry={post} showTrack={false} />
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className={styles.section}>
            {/* A full heading rather than a muted line. Demoting it to a
                small label buried it: on a page with little else published,
                what is coming is the news. */}
            <p className="eyebrow">Soon</p>
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
      </div>
    </div>
  );
}
