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
// This page is deliberately a way in and nothing else: the admin app's doors
// (2026-11-10). learn and tools have their own, at /work/learn/ and
// /work/tools/, and each app opens on its own. WorkDoors.tsx says why.

export const metadata: Metadata = pageMeta({
  path: '/work/',
  title: 'Admin',
  description: 'The site, the shop and the business.',
  noIndex: true,
});

export default function WorkPage() {
  return (
    <div className="shell">
      <WorkDoors app="admin" />

      {/* The two site-wide actions, kept at the foot: they are about the site
          rather than about any door, and they must not be what the eye lands
          on first. */}
      <div className={styles.foot}>
        <SiteActions />
      </div>
    </div>
  );
}
