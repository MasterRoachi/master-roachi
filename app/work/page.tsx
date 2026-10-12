import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import SiteActions from './SiteActions';
import { WORK_TOOLS } from '@/lib/work-tools';
import styles from './nav.module.css';

// The backend's front door.
//
// Everything here is private, and all of it is covered by one Cloudflare
// Access application: its policy matches the path `work` as a PREFIX, so each
// tool added below inherits the gate without a new rule. That is the reason
// every backend page and every backend endpoint lives under /work.
//
// This page is deliberately a list of ways in and nothing else. It used to be
// the Trello boards, which meant the one page he opens every morning was also
// the longest page in the backend — the boards have their own page now.

export const metadata: Metadata = pageMeta({
  path: '/work/',
  title: 'Work',
  description: 'The back of the house.',
  noIndex: true,
});


export default function WorkPage() {
  return (
    <div className="shell">
      <ul className={styles.tools}>
        {WORK_TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link href={tool.href}>{tool.name}</Link>
            <span>{tool.what}</span>
          </li>
        ))}
      </ul>

      <SiteActions />
    </div>
  );
}
