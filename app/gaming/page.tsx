import type { Metadata } from 'next';
import Starfield from '@/components/Starfield';
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
import { getSteam, steamHeader, steamIcon, hoursFrom } from '@/lib/steam';
import styles from './gaming.module.css';

export const metadata: Metadata = {
  title: 'Fun',
  description:
    'Completionist runs, achievement hunting, and analysis of the games worth thinking about.',
};

// Lime, the colour this side carries on the About page and in the nav.
const ACCENT = 'oklch(86% 0.20 135)';
const ACCENT_2 = 'oklch(72% 0.16 145)';

export default function GamingPage() {
  const posts = getWriting('gaming').map(toSummary);
  const steam = getSteam();

  const perfect = finished.filter((g: Game) => g.perfect);
  const completed = finished.filter((g: Game) => !g.perfect);

  // A game cannot be queued and already playing. Wall World sat in both lists
  // once Steam started reporting it, which read as not knowing what was going
  // on.
  const played = new Set(
    [...steam.recent.map((g) => g.title), ...finished.map((g) => g.title)].map(
      (t) => t.toLowerCase(),
    ),
  );
  const queue = upNext.filter((g) => !played.has(g.title.toLowerCase()));

  const alsoPlayed = steam.recent.slice(1);

  // Sections with nothing in them yet are gathered into one honest note rather
  // than stacked as three separate apologies.
  const pending = [
    completed.length === 0 && 'verdicts on finished games',
    tierList.length === 0 && 'a tier list',
    posts.length === 0 && 'reviews and analysis',
  ].filter(Boolean) as string[];

  return (
    <div
      className={styles.page}
      style={
        { '--accent-a': ACCENT, '--accent-b': ACCENT_2 } as React.CSSProperties
      }
    >
      <section className={styles.top}>
        <Starfield
          tint={`radial-gradient(120% 90% at 74% 26%, color-mix(in oklch, ${ACCENT} 16%, transparent), transparent 66%), radial-gradient(90% 70% at 16% 90%, color-mix(in oklch, ${ACCENT_2} 12%, transparent), transparent 62%)`}
        />
        <div className={`shell ${styles.topInner}`}>
          <p className="eyebrow">Rest Plenty</p>
          <h1 className={styles.title}>Fun</h1>
          <p className={styles.lede}>
            Completionist runs, achievement hunting, and analysis of the games
            that reward it. One game at a time, finished honestly.
          </p>

          {streamSchedule.active && (
            <p className={styles.stream}>
              <span className={styles.dot} aria-hidden="true" />
              Streaming {streamSchedule.summary}
            </p>
          )}
        </div>
      </section>

      <div className="shell">
        {steam.current && (
          <section className={styles.section}>
            <p className="eyebrow">Now playing</p>
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
                <h2 className={styles.currentTitle}>{steam.current.title}</h2>
                <p className={styles.note}>
                  {hoursFrom(steam.current.minutesTwoWeeks)}h in the last
                  fortnight · {hoursFrom(steam.current.minutesTotal)}h all told
                </p>
                <p className={styles.live}>Straight from Steam</p>
              </div>
            </div>

            {alsoPlayed.length > 0 && (
              <div className={styles.also}>
                <p className={styles.alsoLabel}>Also this fortnight</p>
                <ul className={styles.alsoList}>
                  {alsoPlayed.map((g) => (
                    <li key={g.appid}>
                      <img
                        src={steamIcon(g)}
                        alt=""
                        width={22}
                        height={22}
                        loading="lazy"
                        decoding="async"
                      />
                      <span>{g.title}</span>
                      {g.minutesTwoWeeks > 0 && (
                        <span className={styles.alsoHours}>
                          {hoursFrom(g.minutesTwoWeeks)}h
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {perfect.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Perfect runs</p>
            <h2 className="section-title">Every achievement</h2>
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
                    {game.note && (
                      <span className={styles.perfectMeta}>{game.note}</span>
                    )}
                  </div>
                  {game.achievements && (
                    <span className={styles.perfectBadge}>
                      {game.achievements.unlocked}/{game.achievements.total}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {queue.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Up next</p>
            <ul className={styles.queue}>
              {queue.map((game) => (
                <li key={game.title}>{game.title}</li>
              ))}
            </ul>
          </section>
        )}

        {completed.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Finished</p>
            <ul className={styles.finished}>
              {completed.map((game) => (
                <li key={game.title}>
                  <span>{game.title}</span>
                  {game.note && (
                    <span className={styles.note}>{game.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {tierList.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Tier list</p>
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
          </section>
        )}

        {posts.length > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Reviews &amp; analysis</p>
            <div>
              {posts.map((post) => (
                <PostCard key={post.slug} entry={post} showTrack={false} />
              ))}
            </div>
          </section>
        )}

        {retroAchievements.url && (
          <section className={styles.section}>
            <p className="eyebrow">Retro</p>
            <a
              className={styles.retro}
              href={retroAchievements.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              RetroAchievements profile ↗
            </a>
          </section>
        )}

        {pending.length > 0 && (
          <section className={styles.section}>
            <div className={styles.pending}>
              <p className="eyebrow eyebrow--muted">Not here yet</p>
              <p className={styles.pendingText}>
                Still to come: {pending.join(', ')}. Nothing published yet
                rather than something padded out.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
