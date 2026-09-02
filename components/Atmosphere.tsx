import styles from './Atmosphere.module.css';

// Grain + layered gold/teal glows, per SPEC.md "Visual Direction".
//
// The Astro version positioned these absolutely at hard-coded scroll offsets
// (top: 900px, top: 1750px). Two problems: the last glow ended 190px below the
// footer and extended the document into dead scroll space, and the offsets
// only lined up with the sections at one viewport width. This layer is fixed
// and clipped instead, so it can never affect document height or scroll width,
// and it stays behind content at every breakpoint.
export default function Atmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div className={`${styles.glow} ${styles.gold1}`} />
      <div className={`${styles.glow} ${styles.teal}`} />
      <div className={`${styles.glow} ${styles.gold2}`} />
      <div className={styles.grain} />
    </div>
  );
}
