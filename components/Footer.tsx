import Link from 'next/link';
import Sigil from './Sigil';
import { navLinks, site } from '@/lib/site';
import styles from './Footer.module.css';

export default function Footer() {
  const { contactEmail, socials } = site;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <Sigil size={18} color="var(--accent)" />
          <p className={styles.tagline}>
            {site.tagline} <span>{site.taglineTail}</span>
          </p>
        </div>

        <div className={styles.columns}>
          <nav className={styles.column} aria-label="Footer">
            <p className={styles.columnHead}>Site</p>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.column}>
            <p className={styles.columnHead}>Elsewhere</p>
            {contactEmail && (
              <a className={styles.link} href={`mailto:${contactEmail}`}>
                Email
              </a>
            )}
            <a
              className={styles.link}
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {socials.linkedin && (
              <a
                className={styles.link}
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            )}
            <a className={styles.link} href="/rss.xml">
              RSS
            </a>
          </div>
        </div>
      </div>

      <div className={styles.base}>
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>{site.personName}</span>
      </div>
    </footer>
  );
}
