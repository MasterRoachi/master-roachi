import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import SiteActions from './SiteActions';
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

/** Only what exists. A link to a page that is not built is a bug report. */
const TOOLS = [
  {
    href: '/work/boards/',
    name: 'Boards',
    what: 'What is next across Trello, and the day job.',
  },
  {
    href: '/work/habits/',
    name: 'Habits',
    what: 'What got done, and what did not.',
  },
  {
    href: '/work/reading/',
    name: 'Reading',
    what: 'What is open, what is next, and what was put down.',
  },
  {
    href: '/work/curriculums/',
    name: 'Curriculums',
    what: 'What is being studied, and how far through it you are.',
  },
  {
    href: '/work/writing/',
    name: 'Writing',
    what: 'Posts. Editing one commits it, and the commit publishes it.',
  },
  {
    href: '/work/projects/',
    name: 'Projects',
    what: 'The project pages behind /projects.',
  },
  {
    href: '/work/store/',
    name: 'Product copy',
    what: 'What each design is, in your own words.',
  },
];

export default function WorkPage() {
  return (
    <div className="shell">
      <PageHeader eyebrow="Private" title="Work" lede="The back of the house." />

      <ul className={styles.tools}>
        {TOOLS.map((tool) => (
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
