import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Sigil from '@/components/Sigil';
import { site } from '@/lib/site';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch — collaboration, tutoring, or a good argument.',
};

export default function ContactPage() {
  const { contactEmail, socials } = site;

  return (
    <div className="shell" style={{ paddingBottom: '80px' }}>
      <PageHeader
        eyebrow="Contact"
        title="Get In Touch"
        lede="Open to tutoring inquiries, collaboration, or just a good argument."
      />

      <div className={styles.panel}>
        <div className={styles.mark} aria-hidden="true">
          <Sigil size={30} color="var(--gold)" opacity={0.6} />
        </div>

        {contactEmail ? (
          <a className={styles.email} href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        ) : (
          // Renders nothing clickable until a real address is set in
          // lib/site.ts. The Astro build shipped a literal `[YOUR@EMAIL]`
          // mailto link, which looked live and went nowhere.
          <p className={styles.pending}>
            Email address coming soon — use the links below in the meantime.
          </p>
        )}

        <div className={styles.socials}>
          <a href={socials.github} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
