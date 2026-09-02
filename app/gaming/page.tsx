import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import PostCard from '@/components/PostCard';
import { getWriting, toSummary } from '@/lib/content';
import {
  upNext,
  finished,
  tierList,
  TIERS,
  streamSchedule,
  retroAchievements,
  type Game,
} from '@/lib/pursuits';
import { getSteam, steamHeader, hoursFrom } from '@/lib/steam';
import styles from './gaming.module.css';

export const metadata: Metadata = {
  title: 'Gaming',
  description:
    'Playthroughs, achievement hunting, and analysis of the games worth thinking about.',
};

export default function GamingPage() {
  const posts = getWriting('gaming').map(toSummary);
  const steam = getSteam();
  const perfect = finished.filter((g: Game) => g.perfect);
  const completed = finished.filter((g: Game) => !g.perfect);

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

      {steam.current && (
        <section className={styles.section}>
          <h2 className="section-title">Now playing</h2>
          <div className={styles.current}>
            <img
              className={styles.currentArt}
              src={steamHeader(steam.current.appid)}
              alt=""
              width={460}
              height={215}
              loading="lazy"
              decoding="async"
            />
            <div className={styles.currentBody}>
              <h3 className={styles.currentTitle}>{steam.current.title}</h3>
              <p className={styles.note}>
                {hoursFrom(steam.current.minutesTwoWeeks)}h in the last
                fortnight · {hoursFrom(steam.current.minutesTotal)}h all told
              </p>
            </div>
          </div>
          {steam.recent.length > 1 && (
            <ul className={styles.queue} style={{ marginTop: '20px' }}>
              {steam.recent.slice(1).map((g) => (
                <li key={g.appid}>{g.title}</li>
              ))}
            </ul>
          )}
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

      {/* Perfect runs are called out separately from merely finished ones —
          100% is the thing being claimed, not just reaching the credits. */}
      {perfect.length > 0 && (
        <section className={styles.section}>
          <h2 className="section-title">Perfect runs</h2>
          <ul className={styles.perfect}>
            {perfect.map((game) => (
              <li key={game.title}>
                {game.appid && (
                  <img
                    src={steamHeader(game.appid)}
                    alt=""
                    width={184}
                    height={86}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div>
                  <span className={styles.perfectTitle}>{game.title}</span>
                  {game.achievements && (
                    <span className={styles.perfectMeta}>
                      {game.achievements.unlocked}/{game.achievements.total}{' '}
                      achievements
                    </span>
                  )}
                </div>
                <span className={styles.perfectBadge}>100%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2 className="section-title">Finished</h2>
        {completed.length === 0 ? (
          <p className={styles.empty}>
            Nothing logged here yet. Completed runs land here with a verdict.
          </p>
        ) : (
          <ul className={styles.finished}>
            {completed.map((game) => (
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
