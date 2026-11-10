import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import AdminHome from './home/AdminHome';
import SiteActions from './SiteActions';
import styles from './nav.module.css';

// The backend's front door.
//
// Everything here is private, and all of it is covered by one Cloudflare
// Access application: its policy matches the path `work` as a PREFIX, so each
// tool added below inherits the gate without a new rule. That is the reason
// every backend page and every backend endpoint lives under /work.
//
// This page is a way in: the admin app's doors (2026-11-10), each saying what
// is waiting behind it, and the site card at the foot (his pick, 2026-11-10,
// redesign page, Admin doors: A). learn and tools have their own homes, at
// /work/learn/ and /work/tools/, and each app opens on its own. WorkDoors.tsx
// and home/AdminHome.tsx say why.

export const metadata: Metadata = pageMeta({
  path: '/work/',
  title: 'Admin',
  description: 'The site, the shop and the business.',
  noIndex: true,
});

export default function WorkPage() {
  return (
    <div className="shell">
      <AdminHome />

      {/* The site status and Rebuild, one small card at the foot: they are
          about the site rather than about any door, and they must not be what
          the eye lands on first. */}
      <div className={styles.foot}>
        <SiteActions />
      </div>
    </div>
  );
}
