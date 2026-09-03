import type { Metadata } from 'next';
import Starfield from '@/components/Starfield';
import PostCard from '@/components/PostCard';
import { getWriting, toSummary } from '@/lib/content';
import {
  upNext,
  finished,
  tierList,
  tierListProvisional,
  TIERS,
  streamSchedule,
  type Game,
  type TierRank,
} from '@/lib/pursuits';
import { getSteam, steamHeader, steamIcon, hoursFrom } from '@/lib/steam';
import { getPerfectRuns, type PerfectRun } from '@/lib/perfect';
import { getRetro } from '@/lib/retro';
import { candidateId } from '@/lib/poll';
import PlayNextVote from '@/components/PlayNextVote';
import { getVideos } from '@/lib/videos';
import styles from './gaming.module.css';

export const metadata: Metadata = {
  title: 'Fun',
  description:
    'Completionist runs, achievement hunting, and analysis of the games worth thinking about.',
};

/**
 * The conventional tier-list ramp, hot to cold. Not the page's lime, because
 * the ranks have to be told apart from each other rather than matched to the
 * section.
 */
const TIER_COLOUR: Record<TierRank, string> = {
  // Z is off the ramp on purpose. It sits above S, so giving it a hotter red
  // would read as merely more of the same; violet reads as a different shelf.
  Z: 'oklch(72% 0.22 330)',
  S: 'oklch(70% 0.21 25)',
  A: 'oklch(75% 0.17 55)',
  B: 'oklch(83% 0.15 95)',
  C: 'oklch(80% 0.16 145)',
};

// Lime, the colour this side carries on the About page and in the nav.
const ACCENT = 'oklch(86% 0.20 135)';
const ACCENT_2 = 'oklch(72% 0.16 145)';

/**
 * One 100% run. Steam has wide header art; RetroAchievements only serves a
 * square badge, so the two are laid out differently rather than forcing one
 * platform's art into the other's shape and stretching it.
 */
function RunCard({ run, compact }: { run: PerfectRun; compact?: boolean }) {
  const meta = [
    run.hardcore ? 'Hardcore' : null,
    // Redundant inside a group already labelled with the platform.
    run.platform === 'Steam' ? null : run.platform,
    run.note,
  ]
    .filter(Boolean)
    .join(' · ');

  const inner = (
    <>
      {run.art ? (
        <img
          className={styles.runArt}
          src={run.art}
          alt=""
          width={460}
          height={215}
          loading="lazy"
          decoding="async"
        />
      ) : run.icon ? (
        <img
          className={styles.runIcon}
          src={run.icon}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className={styles.runBody}>
        <span className={styles.runTitle}>{run.title}</span>
        {meta && <span className={styles.runNote}>{meta}</span>}
      </span>
      {run.total ? (
        <span className={styles.runBadge}>
          {run.unlocked}/{run.total}
        </span>
      ) : null}
    </>
  );

  return (
    <li className={compact ? styles.runCompact : styles.run}>
      {run.href ? (
        <a href={run.href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      ) : (
        <div>{inner}</div>
      )}
    </li>
  );
}

export default function GamingPage() {
  const posts = getWriting('gaming').map(toSummary);
  const steam = getSteam();

  const retro = getRetro();
  const runs = getPerfectRuns();
  const videos = getVideos('gaming');
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
    videos.length === 0 && 'videos',
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

        {runs.total > 0 && (
          <section className={styles.section}>
            <p className="eyebrow">Perfect runs</p>
            <h2 className="section-title">Every achievement</h2>
            <p className={styles.sectionNote}>
              {runs.total} {runs.total === 1 ? 'game' : 'games'} taken to 100%
              {runs.synced
                ? ' — read from the platforms that track them, not typed out here.'
                : '.'}
            </p>

            {runs.steam.length > 0 && (
              <div className={styles.runGroup}>
                <p className={styles.runGroupLabel}>
                  Steam <span>{runs.steam.length}</span>
                </p>
                <ul className={styles.runGrid}>
                  {runs.steam.map((run) => (
                    <RunCard key={run.key} run={run} />
                  ))}
                </ul>
              </div>
            )}

            {runs.retro.length > 0 && (
              <div className={styles.runGroup}>
                <p className={styles.runGroupLabel}>
                  RetroAchievements <span>{runs.retro.length}</span>
                </p>
                <ul className={styles.retroGrid}>
                  {runs.retro.map((run) => (
                    <RunCard key={run.key} run={run} compact />
                  ))}
                </ul>
              </div>
            )}

            {runs.other.length > 0 && (
              <div className={styles.runGroup}>
                <p className={styles.runGroupLabel}>
                  Also <span>{runs.other.length}</span>
                </p>
                <ul className={styles.runGrid}>
                  {runs.other.map((run) => (
                    <RunCard key={run.key} run={run} />
                  ))}
                </ul>
              </div>
            )}

            {retro.profileUrl && (
              <a
                className={styles.retro}
                href={retro.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {retro.gamesTracked} games tracked on RetroAchievements ↗
              </a>
            )}
          </section>
        )}

        {queue.length > 0 && (
          <section className={styles.section}>
            <PlayNextVote
              candidates={queue.map((game) => ({
                id: candidateId(game.title),
                title: game.title,
              }))}
            />
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
            {tierListProvisional && (
              <p className={styles.sectionNote}>
                Placeholder ordering while the real one gets written — these
                are games off the shelf, not a considered ranking yet.
              </p>
            )}
            <div className={styles.tiers}>
              {TIERS.map((rank) => {
                const games = tierList.filter((g) => g.tier === rank);
                if (games.length === 0) return null;
                return (
                  <div
                    key={rank}
                    className={styles.tier}
                    style={
                      { '--tier': TIER_COLOUR[rank] } as React.CSSProperties
                    }
                  >
                    <span className={styles.tierRank}>{rank}</span>
                    <div className={styles.tierGames}>
                      {games.map((g) => (
                        <span key={g.title} className={styles.tierGame}>
                          {g.appid && (
                            <img
                              className={styles.tierArt}
                              src={steamHeader(g.appid)}
                              alt=""
                              width={460}
                              height={215}
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                          <span>{g.title}</span>
                        </span>
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
