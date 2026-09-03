import { SOCIAL_ICONS } from '@/lib/toolIcons';
import { site } from '@/lib/site';
import styles from './SocialLinks.module.css';

// The socials as their own marks. Email and LinkedIn are drawn here rather
// than taken from simple-icons: email has no brand, and LinkedIn was removed
// from that set after they enforced their trademark, so redrawing the very
// mark they objected to would be doing knowingly what the removal was about.
// Both get a wordmark instead.

const HREFS: Record<string, string | null> = {
  github: site.socials.github,
  facebook: site.socials.facebook,
  instagram: site.socials.instagram,
  youtube: site.socials.youtube,
};

export default function SocialLinks() {
  const { contactEmail, socials } = site;

  return (
    <ul className={styles.socials}>
      {contactEmail && (
        <li>
          <a
            className={styles.item}
            href={`mailto:${contactEmail}`}
            aria-label="Email"
          >
            {/* Generic envelope — email is a protocol, not a brand. */}
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                d="M2.5 5.5h19v13h-19z"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.6"
              />
              <path
                d="M2.5 6.2 12 13l9.5-6.8"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.6"
              />
            </svg>
            <span className={styles.name}>Email</span>
          </a>
        </li>
      )}

      {SOCIAL_ICONS.map((s) => {
        const href = HREFS[s.key];

        // Instagram's mark is a gradient, not a flat colour; anything else
        // would not be its real colour.
        const fill =
          s.key === 'instagram' ? 'url(#ig-gradient)' : s.color;

        const mark = (
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            {s.key === 'instagram' && (
              <defs>
                <linearGradient id="ig-gradient" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FFD521" />
                  <stop offset="30%" stopColor="#F50000" />
                  <stop offset="60%" stopColor="#B900B4" />
                  <stop offset="100%" stopColor="#5B6DEF" />
                </linearGradient>
              </defs>
            )}
            <path d={s.path} fill={fill} />
          </svg>
        );

        // No link yet. Shown dimmed rather than hidden — the site's line is
        // that unfinished things are visible, not tidied away.
        if (!href) {
          return (
            <li key={s.key}>
              <span className={styles.item} data-pending="true">
                {mark}
                <span className={styles.name}>{s.label}</span>
                <span className={styles.soon}>Soon</span>
              </span>
            </li>
          );
        }

        return (
          <li key={s.key}>
            <a
              className={styles.item}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
            >
              {mark}
              <span className={styles.name}>{s.label}</span>
            </a>
          </li>
        );
      })}

      {socials.linkedin && (
        <li>
          <a
            className={styles.item}
            href={socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <span className={styles.wordmark} aria-hidden="true">
              Li
            </span>
            <span className={styles.name}>LinkedIn</span>
          </a>
        </li>
      )}
    </ul>
  );
}
