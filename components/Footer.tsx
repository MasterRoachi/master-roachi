import Link from 'next/link';
import Sigil from './Sigil';
import { navLinks, site } from '@/lib/site';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Sigil size={16} color="var(--muted-2)" variant="mark" />
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
        </div>

        <nav className={styles.links} aria-label="Footer">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
          <a className={styles.link} href="/rss.xml">
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
