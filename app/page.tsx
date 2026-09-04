import type { Metadata } from 'next';
import Link from 'next/link';
import HeroBookMount from '@/components/HeroBookMount';
import SheenLink from '@/components/SheenLink';
import Starfield from '@/components/Starfield';
import PursuitCarousel from '@/components/PursuitCarousel';
import ProjectDeck from '@/components/ProjectDeck';
import PostCard from '@/components/PostCard';
import {
  getProjects,
  getWriting,
  toSummary,
  toProjectSummary,
} from '@/lib/content';
import { currentlyReading, currentFocus } from '@/lib/pursuits';
import { getSteam, steamIcon } from '@/lib/steam';
import { site, navLinks } from '@/lib/site';
import { pageMeta } from '@/lib/seo';
import styles from './page.module.css';

// The homepage had no metadata of its own and inherited the root's, which was
// the only page for which that was ever correct. It states it now, so the
// canonical is deliberate rather than a default that happened to be right.
export const metadata: Metadata = pageMeta({
  path: '/',
  description: site.description,
});

export default function HomePage() {
  const allProjects = getProjects();
  // Weight puts active work first, so the homepage leads with what is being
  // built rather than what happens to be newest. The cap is high enough that
  // nothing is hidden while the list is short.
  const projects = allProjects.slice(0, 6).map(toProjectSummary);
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

  // Each line of "Right now" belongs to one of the pursuits, so it answers in
  // that pursuit's colour and links to its page. Taken from lib/site.ts rather
  // than written out again — About had a second hardcoded copy of these that
  // had drifted out of step with the nav.
  const accentOf = (label: string) =>
    navLinks.find((l) => l.label === label)?.accent ?? 'var(--accent)';

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
          <div className={`divider ${styles.heroRule}`} aria-hidden="true">
            <span />
            <img
              src="/kanji.webp"
              alt=""
              width={26}
              height={26}
              className="divider-mark"
              decoding="async"
            />
            <span />
          </div>

          <div className={styles.heroFoot}>
            <p className={styles.heroBlurb}>
              I&rsquo;m {site.personName} — Master Roachi. I build games, worlds
              and software, play games, and I&rsquo;m Orthodox. This is the
              public record of my stuff.
            </p>
            <div className={styles.heroActions}>
              <SheenLink href="/projects/">Work</SheenLink>
              <SheenLink href="/about/" tone="white">
                About
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
            <div
              className={styles.nowItem}
              style={{ '--now': accentOf('Work') } as React.CSSProperties}
            >
              <dt>Building</dt>
              <dd>
                <Link href="/projects/" className={styles.nowValue}>
                  {focus}
                </Link>
              </dd>
            </div>

            <div
              className={styles.nowItem}
              style={{ '--now': accentOf('Fun') } as React.CSSProperties}
            >
              <dt>Playing</dt>
              <dd>
                {playing ? (
                  <Link
                    href="/gaming/"
                    className={`${styles.nowValue} ${styles.nowWithArt}`}
                  >
                    <img
                      src={steamIcon(playing)}
                      alt=""
                      width={44}
                      height={44}
                      className={styles.nowArt}
                      loading="lazy"
                      decoding="async"
                    />
                    {playing.title}
                  </Link>
                ) : (
                  <span className={styles.nowPending}>
                    Nothing this fortnight
                  </span>
                )}
              </dd>
            </div>

            {currentlyReading && (
              <div
                className={styles.nowItem}
                style={
                  { '--now': accentOf('Foundations') } as React.CSSProperties
                }
              >
                <dt>Reading</dt>
                <dd>
                  <Link href="/orthodoxy/" className={styles.nowValue}>
                    {currentlyReading.title}
                    <span className={styles.nowSub}>
                      {currentlyReading.author}
                    </span>
                  </Link>
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
          <ProjectDeck projects={projects} />
        </div>
      </section>

      <section className="shell section">
        <PursuitCarousel />
      </section>

      {posts.length > 0 && (
        <>
          <hr className="rule" />
          <section className="shell section">
            <div className={styles.blockHead}>
              <div>
                <p className="eyebrow">Writing</p>
                <h2 className="section-title">Recent thoughts</h2>
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
