import type { Metadata } from 'next';
import { site } from '@/lib/site';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: site.description,
};

// The ethos below is carried over near-verbatim from the original Master
// Roachi site (preserved on the archive/html-site branch), because it said
// what the project is better than anything written since.
export default function AboutPage() {
  const { contactEmail, socials } = site;

  return (
    <div className="shell" style={{ paddingBottom: '120px' }}>
      <header className={styles.header}>
        <p className="eyebrow">About</p>
        <h1 className={styles.title}>
          Master Roachi is a work in progress — both the man and the website.
        </h1>
      </header>

      <div className={styles.body}>
        <div className={styles.copy}>
          <p className={styles.lead}>
            I&rsquo;m {site.personName}. I go by Master Roachi. I build games,
            worlds and software, I play games properly rather than quickly, and
            I take Orthodoxy seriously.
          </p>

          <p>
            This site exists because I don&rsquo;t want my pursuits to stay
            vague ideas, half-finished attempts, or private ambitions that never
            become visible work. I want to build things, finish things, study
            seriously, and leave a clear trail of progress.
          </p>

          <p className={styles.pull}>
            Do the work, tell the truth, improve over time, and repeat.
            Everything is public. Nothing is hidden — the weaknesses, the
            learning, the unfinished projects included.
          </p>

          <h2 className={styles.heading}>The three sides of it</h2>
          <p>
            The tagline isn&rsquo;t decoration. <strong>Work Hard</strong> is the
            building — games, worlds, and the code underneath them.{' '}
            <strong>Study Well</strong> is Orthodoxy, taken as a real question
            rather than an aesthetic. <strong>Rest Plenty</strong> is gaming,
            done attentively enough to be worth writing about. They&rsquo;re
            distinct, but they aren&rsquo;t separate.
          </p>

          <h2 className={styles.heading}>Tools</h2>
          <ul className={styles.tools}>
            <li>TypeScript &amp; JavaScript</li>
            <li>React &amp; Next.js</li>
            <li>Vue</li>
            <li>Godot &amp; GDScript</li>
            <li>HTML &amp; CSS</li>
          </ul>

          <h2 className={styles.heading}>Get in touch</h2>
          <p>
            Open to collaboration, or just a good argument.
          </p>
          <div className={styles.contact}>
            {contactEmail && (
              <a className="button button--accent" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            )}
            <a className="button" href={socials.github} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            {socials.linkedin && (
              <a className="button" href={socials.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
