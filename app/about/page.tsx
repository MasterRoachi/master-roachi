import type { Metadata } from 'next';
import Logo from '@/components/Logo';
import SheenLink from '@/components/SheenLink';
import AboutFacets from '@/components/AboutFacets';
import { site } from '@/lib/site';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: site.description,
};

// The ethos here is carried over near-verbatim from the original Master Roachi
// site (preserved on the archive/html-site branch). It said what this project
// is better than anything written since, so it is quoted rather than rewritten.
export default function AboutPage() {
  const { contactEmail, socials } = site;

  return (
    <>
      <header className={`shell ${styles.head}`}>
        <p className="eyebrow">About</p>
        <h1 className={styles.title}>
          Master Roachi is a work in progress — both the man and the website.
        </h1>
      </header>

      <div className={`shell ${styles.intro}`}>
        <div className={styles.portrait}>
          <Logo size={220} className={styles.mark} />
        </div>

        <div className={styles.introCopy}>
          <p className={styles.lead}>
            I&rsquo;m {site.personName}. I go by Master Roachi. I build games,
            worlds and software, I play games, but not when it comes to Truth,
            so I&rsquo;m Orthodox.
          </p>
          <p>
            This site exists because I don&rsquo;t want my pursuits to stay
            vague ideas, half-finished attempts, or private ambitions that never
            become visible work. I want to build things, finish things, study
            seriously, and leave a clear trail of progress.
          </p>
        </div>
      </div>

      {/* The ethos, given the weight it deserves. */}
      <section className={styles.ethos}>
        <div className="shell">
          <p className={styles.ethosText}>
            Do the work, tell the truth, improve over time, and repeat.
            <span>
              Everything is public. Nothing is hidden — the weaknesses, the
              learning, the unfinished projects included.
            </span>
          </p>
        </div>
      </section>

      <section className={`shell ${styles.section}`}>
        <div className={styles.sectionHead}>
          <p className="eyebrow">The three sides of it</p>
          <h2 className="section-title">
            The tagline isn&rsquo;t decoration
          </h2>
          <p className="lede">
            Work Hard, Study Well, Rest Plenty. They&rsquo;re distinct, but they
            aren&rsquo;t separate — each one is where a different part of the
            same record gets kept.
          </p>
        </div>
        <AboutFacets />
      </section>

      <div className={styles.rule} aria-hidden="true">
        <span />
        <img
          src="/kanji.webp"
          alt=""
          width={22}
          height={22}
          className={styles.ruleMark}
          decoding="async"
        />
        <span />
      </div>

      <section className={`shell ${styles.section}`}>
        <div className={styles.split}>
          <div>
            <p className="eyebrow">Tools</p>
            <ul className={styles.tools}>
              <li>TypeScript &amp; JavaScript</li>
              <li>React &amp; Next.js</li>
              <li>Vue</li>
              <li>Godot &amp; GDScript</li>
              <li>HTML &amp; CSS</li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Get in touch</p>
            <p className={styles.contactLede}>
              Open to collaboration, or just a good argument.
            </p>
            <div className={styles.contact}>
              {contactEmail && (
                <SheenLink href={`mailto:${contactEmail}`}>Email</SheenLink>
              )}
              <SheenLink href={socials.github} tone="white">
                GitHub
              </SheenLink>
              {socials.linkedin && (
                <SheenLink href={socials.linkedin} tone="white">
                  LinkedIn
                </SheenLink>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
