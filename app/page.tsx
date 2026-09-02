import Link from 'next/link';
import Sigil from '@/components/Sigil';
import Divider from '@/components/Divider';
import ProjectCard from '@/components/ProjectCard';
import PostCard from '@/components/PostCard';
import { getCollection, toSummary } from '@/lib/content';
import { site } from '@/lib/site';
import styles from './page.module.css';

export default function HomePage() {
  const projects = getCollection('projects').slice(0, 3);
  const posts = getCollection('thoughts').slice(0, 3).map(toSummary);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.watermark} aria-hidden="true">
          <Sigil size={440} color="var(--gold)" strokeWidth={0.4} opacity={0.06} />
        </div>
        <div className={styles.heroInner}>
          <p className="eyebrow">Software Engineer</p>
          <h1 className={styles.heroTitle}>Master Roachi</h1>
          <div className={styles.rule} aria-hidden="true">
            <span />
            <Sigil size={10} color="var(--gold)" variant="mark" />
            <span />
          </div>
          <p className={styles.tagline}>
            Code by trade, worlds by nature. What I build and what I write
            about, gathered in one place.
          </p>
          <div className={styles.actions}>
            <Link href="/work/" className={styles.primaryAction}>
              See the work
            </Link>
            <Link href="/thoughts/" className={styles.secondaryAction}>
              Read the writing
            </Link>
          </div>
        </div>
      </section>

      <Divider />

      <section className={`shell section ${styles.block}`}>
        <div className={styles.blockHead}>
          <div>
            <p className="eyebrow">Selected Work</p>
            <h2 className="section-title">Things I&rsquo;ve Built</h2>
          </div>
          <Link href="/work/" className={styles.more}>
            All work →
          </Link>
        </div>
        <div className={styles.cards}>
          {projects.map((entry) => (
            <ProjectCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>

      <Divider />

      <section className={`shell section ${styles.about}`}>
        <div className={styles.aboutMark} aria-hidden="true">
          <Sigil size={150} color="var(--gold)" strokeWidth={0.8} opacity={0.4} />
        </div>
        <div>
          <p className="eyebrow">About</p>
          <p className={styles.bio}>
            My name is {site.personName}. I go by Master Roachi. I&rsquo;m a
            software engineer, and outside of that I write — mostly about code,
            sometimes about theology.
          </p>
          <Link href="/about/" className={styles.more}>
            More about me →
          </Link>
        </div>
      </section>

      {posts.length > 0 && (
        <>
          <Divider />
          <section className={`shell section ${styles.block}`}>
            <div className={styles.blockHead}>
              <div>
                <p className="eyebrow">Thoughts</p>
                <h2 className="section-title">Recent Writing</h2>
              </div>
              <Link href="/thoughts/" className={styles.more}>
                All posts →
              </Link>
            </div>
            <div>
              {posts.map((entry) => (
                <PostCard key={entry.slug} entry={entry} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
