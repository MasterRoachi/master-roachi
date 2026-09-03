import Link from 'next/link';
import HeroBookMount from '@/components/HeroBookMount';
import SheenLink from '@/components/SheenLink';
import Starfield from '@/components/Starfield';
import ProjectCard from '@/components/ProjectCard';
import PostCard from '@/components/PostCard';
import { getProjects, getWriting, toSummary } from '@/lib/content';
import { currentlyReading, currentFocus } from '@/lib/pursuits';
import { getSteam, steamIcon } from '@/lib/steam';
import { site } from '@/lib/site';
import cards from '@/components/Card.module.css';
import styles from './page.module.css';

export default function HomePage() {
  const allProjects = getProjects();
  // Weight puts active work first, so the homepage leads with what is being
  // built rather than what happens to be newest. The cap is high enough that
  // nothing is hidden while the list is short.
  const projects = allProjects.slice(0, 6);
  const posts = getWriting().slice(0, 3).map(toSummary);

  const inProgress = allProjects.filter(
    (p) => (p.frontmatter.status ?? 'building') === 'building',
  );

  // The heaviest in-progress project is the focus unless one is stated
  // outright, which saves maintaining a line that the project weights already
  // answer.
  const focus =
    currentFocus ?? inProgress[0]?.frontmatter.title ?? 'Between things';

  const playing = getSteam().current;

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCanvas}>
          <HeroBookMount />
        </div>
        <div className={`shell ` + styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {site.tagline}
            <span className={styles.heroTail}>{site.taglineTail}</span>
          </h1>
          {/* The rule carries the Turtle Hermit kanji, sitting on the line that
              separates the identity from everything under it. */}
          <div className={styles.heroRule} aria-hidden="true">
            <span />
            <img
              src="/kanji.webp"
              alt=""
              width={26}
              height={26}
              className={styles.heroRuleMark}
              decoding="async"
            />
            <span />
          </div>

          <div className={styles.heroFoot}>
            <p className={styles.heroBlurb}>
              I&rsquo;m {site.personName} — Master Roachi. I build games, worlds
              and software, I play games, but not when it comes to Truth, so
              I&rsquo;m Orthodox. This is the public record of my stuff.
            </p>
            <div className={styles.heroActions}>
              <SheenLink href="/projects/">See the work</SheenLink>
              <SheenLink href="/about/" tone="white">
                About me
              </SheenLink>
            </div>
          </div>
        </div>
      </section>

      {/* What is actually happening right now. Building comes from the project
          files and playing comes from Steam, so neither can drift out of date
          on its own — only the reading line is maintained by hand. */}
      <section className={styles.now}>
        <div className={`shell ${styles.nowInner}`}>
          <p className={styles.nowLabel}>Right now</p>
          <dl className={styles.nowList}>
            <div className={styles.nowItem}>
              <dt>Building</dt>
              <dd>{focus}</dd>
            </div>

            {playing ? (
              <div className={styles.nowItem}>
                <dt>Playing</dt>
                <dd className={styles.nowWithArt}>
                  <img
                    src={steamIcon(playing)}
                    alt=""
                    width={28}
                    height={28}
                    className={styles.nowArt}
                    loading="lazy"
                    decoding="async"
                  />
                  {playing.title}
                </dd>
              </div>
            ) : (
              <div className={styles.nowItem}>
                <dt>Playing</dt>
                <dd className={styles.nowPending}>Nothing this fortnight</dd>
              </div>
            )}

            {currentlyReading && (
              <div className={styles.nowItem}>
                <dt>Reading</dt>
                <dd>
                  {currentlyReading.title}
                  <span className={styles.nowSub}>
                    {currentlyReading.author}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* The one section with depth behind it — the work sits in space. */}
      <section className={styles.build}>
        <Starfield />
        <div className={`shell section `}>
          <div className={styles.blockHead}>
            <div>
              <p className="eyebrow">Projects</p>
              <h2 className="section-title">What I&rsquo;m building</h2>
            </div>
            <Link href="/projects/" className={styles.more}>
              All projects →
            </Link>
          </div>
          <div className={cards.grid}>
            {projects.map((entry) => (
              <ProjectCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="shell section">
        <div className={styles.pursuits}>
          <Link href="/gaming/" className={styles.pursuit}>
            <p className="eyebrow">Rest Plenty</p>
            <h2 className={styles.pursuitTitle}>Gaming</h2>
            <p className={styles.pursuitBody}>
              Completionist runs, achievement hunting, and analysis of the games
              that reward it.
            </p>
            <span className={styles.pursuitLink}>Go to Gaming →</span>
          </Link>
          <Link href="/orthodoxy/" className={styles.pursuit}>
            <p className="eyebrow">Study Well</p>
            <h2 className={styles.pursuitTitle}>Orthodoxy</h2>
            <p className={styles.pursuitBody}>
              Long-form video and written argument, for anyone willing to ask
              whether it is true.
            </p>
            <span className={styles.pursuitLink}>Go to Orthodoxy →</span>
          </Link>
        </div>
      </section>

      {posts.length > 0 && (
        <>
          <hr className="rule" />
          <section className="shell section">
            <div className={styles.blockHead}>
              <div>
                <p className="eyebrow">Writing</p>
                <h2 className="section-title">Recent words</h2>
              </div>
              <Link href="/writing/" className={styles.more}>
                All writing →
              </Link>
            </div>
            <div>
              {posts.map((post) => (
                <PostCard key={post.slug} entry={post} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
