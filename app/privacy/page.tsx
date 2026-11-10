import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import Mdx from '@/components/Mdx';
import styles from './privacy.module.css';

// The privacy notice for the web-design business (POPIA s18), published
// 2026-11-10 at his word, ahead of the attorney's read.
//
// The text is the CRM's: written in the outreach repository, where the CRM
// records which version each consent was given under. Copied here verbatim
// as content/legal/privacy-notice.md. Change no words here: a change goes
// back to the outreach side first, so the two copies stay identical. Only the
// opening "# Privacy Notice" is dropped, because the page header carries it.
//
// The shop's own buyer terms stay on /policies#privacy, which links here.

export const metadata: Metadata = pageMeta({
  path: '/privacy/',
  title: 'Privacy notice',
  description:
    'How Master Roachi collects and uses personal information for its website design, hosting and maintenance business, and your rights under POPIA.',
});

function notice(): string {
  const text = fs.readFileSync(path.join(process.cwd(), 'content/legal/privacy-notice.md'), 'utf8');
  return text.replace(/^# Privacy Notice\s*\n/, '');
}

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={`shell ${styles.body}`}>
        <PageHeader eyebrow="The small print" title="Privacy notice" />
        <div className={styles.legal}>
          <Mdx source={notice()} />
        </div>
        <p className={styles.shop}>
          Buying from the store? What it collects and how long it keeps it are on{' '}
          <Link href="/policies/#privacy">the store&apos;s terms</Link>.
        </p>
      </div>
    </div>
  );
}
