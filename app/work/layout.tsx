import type { Metadata, Viewport } from 'next';
import WorkHeader, { DeskTitle } from '@/components/WorkHeader';
import WorkShell from './WorkShell';
import styles from './work.module.css';

// Everything under /work gets the backend's own header, and the viewport.
//
// The site's nav and footer hide themselves on these paths rather than being
// lifted out into a route group. A route group — moving every public page into
// app/(site)/ — is the tidier Next answer and it would mean moving every page
// in the repository to change the chrome on nine of them. The guard is two
// lines in each component and says why it is there.
//
// THE SHELL IS EXACTLY THE VIEWPORT and does not scroll. `main` is unstyled
// and `body` is a flex column with min-height 100dvh, so a wrapper of exactly
// 100dvh fills it and leaves nothing to scroll. Anything inside that holds
// more than fits scrolls in its own pane — see work.module.css.
// Installable (2026-11-10): each app's address answers /manifest.webmanifest,
// /icon.png and /apple-icon.png with its own name and icon (worker/apps.ts), so
// the one static layout serves three apps. On masterroachi.com itself the
// manifest is not there, and nothing installs.
//
// THE MANIFEST IS FETCHED WITH THE SIGN-IN COOKIE. A browser asks for a
// manifest without cookies unless its link says crossorigin="use-credentials",
// and every path on the apps' addresses is behind Access, so the uncredentialed
// ask got Access's login redirect instead and the phone offered no install.
// Next's `metadata.manifest` sets that attribute only on Vercel previews, so
// the link is written here instead; React puts a <link> in the head.
export const metadata: Metadata = {
  appleWebApp: { capable: true, statusBarStyle: 'black' },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkShell>
      <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
      <WorkHeader />
      {/* The page's column: on a computer the sidebar is beside it and the
          title above the page; on a phone the title is the header. */}
      <div className={styles.main}>
        <DeskTitle />
        <div className={styles.content}>{children}</div>
      </div>
    </WorkShell>
  );
}
