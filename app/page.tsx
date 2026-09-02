import Link from 'next/link';
import ProjectCard from '@/components/ProjectCard';
import PostCard from '@/components/PostCard';
import { getProjects, getWriting, toSummary } from '@/lib/content';
import { site } from '@/lib/site';
import cards from '@/components/Card.module.css';
import styles from './page.module.css';

export default function HomePage() {
  // Weight puts the active work first, so the homepage leads with what is
  // actually being built rather than what happens to be newest.
  const projects = getProjects().slice(0, 4);
  const posts = getWriting().slice(0, 3).map(toSummary);

  return (
    <>
      <section className={styles.hero}>
        <div className="shell">
          <h1 className={styles.heroTitle}>
            {site.tagline}
            <span className={styles.heroTail}>{site.taglineTail}</span>
          </h1>
          <div className={styles.heroFoot}>
            <p className={styles.heroBlurb}>
              I&rsquo;m {site.personName} — Master Roachi. I build games, worlds
              and software, I play games properly, and I take Orthodoxy
              seriously. This is the public record of all of it.
            </p>
            <div className={styles.heroActions}>
              <Link href="/projects/" className="button button--accent">
                See the work
              </Link>
              <Link href="/about/" className="button">
                About me
              </Link>
            </div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="shell section">
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
