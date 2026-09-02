import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import PostCard from '@/components/PostCard';
import { getWriting, toSummary } from '@/lib/content';
import {
  nowPlaying,
  upNext,
  finished,
  tierList,
  TIERS,
  streamSchedule,
  retroAchievements,
} from '@/lib/pursuits';
import styles from './gaming.module.css';

export const metadata: Metadata = {
  title: 'Gaming',
  description:
    'Playthroughs, achievement hunting, and analysis of the games worth thinking about.',
};

export default function GamingPage() {
  const posts = getWriting('gaming').map(toSummary);

  return (
    <div className="shell" style={{ paddingBottom: '120px' }}>
      <PageHeader
        eyebrow="Gaming"
        title="Rest Plenty"
        lede="Completionist runs, achievement hunting, and analysis of the games that reward it. One game at a time, finished honestly."
      />

      {streamSchedule.active && (
        <p className={styles.stream}>
          <span className={styles.dot} aria-hidden="true" />
          Streaming {streamSchedule.summary}
        </p>
      )}

      {nowPlaying.length > 0 && (
        <section className={styles.section}>
          <h2 className="section-title">Now playing</h2>
          {nowPlaying.map((game) => (
            <div key={game.title} className={styles.current}>
              <h3 className={styles.currentTitle}>{game.title}</h3>
              {game.note && <p className={styles.note}>{game.note}</p>}
              {game.achievements && (
                <div className={styles.progress}>
                  <div className={styles.bar}>
                    <span
                      style={{
                        width: `${Math.round(
                          (game.achievements.unlocked / game.achievements.total) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className={styles.progressLabel}>
                    {game.achievements.unlocked} / {game.achievements.total}{' '}
                    achievements
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {upNext.length > 0 && (
        <section className={styles.section}>
          <h2 className="section-title">Up next</h2>
          <ul className={styles.queue}>
            {upNext.map((game) => (
              <li key={game.title}>{game.title}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2 className="section-title">Finished</h2>
        {finished.length === 0 ? (
          <p className={styles.empty}>
            Nothing logged here yet. Completed runs land here with a verdict.
          </p>
        ) : (
          <ul className={styles.finished}>
            {finished.map((game) => (
              <li key={game.title}>
                <span>{game.title}</span>
                {game.note && <span className={styles.note}>{game.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className="section-title">Tier list</h2>
        {tierList.length === 0 ? (
          <p className={styles.empty}>
            Not ranked yet — it needs a few more finished games to be worth
            arguing about.
          </p>
        ) : (
          <div className={styles.tiers}>
            {TIERS.map((rank) => {
              const games = tierList.filter((g) => g.tier === rank);
              if (games.length === 0) return null;
              return (
                <div key={rank} className={styles.tier}>
                  <span className={styles.tierRank}>{rank}</span>
                  <div className={styles.tierGames}>
                    {games.map((g) => (
                      <span key={g.title}>{g.title}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {retroAchievements.url && (
        <section className={styles.section}>
          <h2 className="section-title">Retro</h2>
          <a className="button" href={retroAchievements.url} target="_blank" rel="noopener noreferrer">
            RetroAchievements profile ↗
          </a>
        </section>
      )}

      <section className={styles.section}>
        <h2 className="section-title">Reviews &amp; analysis</h2>
        {posts.length === 0 ? (
          <p className={styles.empty}>
            No write-ups published yet.
          </p>
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
