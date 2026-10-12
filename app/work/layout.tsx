import WorkHeader from '@/components/WorkHeader';
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
export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <WorkHeader />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
