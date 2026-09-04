import styles from './ComingSoon.module.css';

// A banner for a page that is deliberately holding most of itself back.
//
// Terrath is the case it was built for: the world is written, but publishing it
// in full would spend the reveals both games are built on. The page says enough
// to be worth reading and then says plainly that the rest is not ready — which
// is more honest than padding it out, and more interesting than a short page
// with no explanation for being short.
//
// Takes the page's accent like everything else, so it belongs to whatever it
// sits on rather than being a generic notice.

export default function ComingSoon({
  title = 'Coming soon',
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <aside className={styles.banner}>
      <span className={styles.sheen} aria-hidden="true" />
      <span className={styles.stripes} aria-hidden="true" />
      <div className={styles.inner}>
        <p className={styles.title}>{title}</p>
        {children && <div className={styles.body}>{children}</div>}
      </div>
    </aside>
  );
}
