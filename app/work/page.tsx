import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import SiteActions from './SiteActions';
import WorkDoors from './WorkDoors';
import styles from './nav.module.css';

// The backend's front door.
//
// Everything here is private, and all of it is covered by one Cloudflare
// Access application: its policy matches the path `work` as a PREFIX, so each
// tool added below inherits the gate without a new rule. That is the reason
// every backend page and every backend endpoint lives under /work.
//
// This page is deliberately a way in and nothing else. It used to be the
// Trello boards, which meant the one page he opens every morning was also the
// longest page in the backend — the boards have their own page now. Then it
// was a list of all nine tools, which was short but unsorted; it is three
// doors now, and WorkDoors.tsx says why.

export const metadata: Metadata = pageMeta({
  path: '/work/',
  title: 'Work',
  description: 'The back of the house.',
  noIndex: true,
});

export default function WorkPage() {
  return (
    <div className="shell">
      <WorkDoors />

      {/* The two site-wide actions, kept at the foot: they are about the site
          rather than about any door, and they must not be what the eye lands
          on first. */}
      <div className={styles.foot}>
        <SiteActions />
      </div>
    </div>
  );
}
