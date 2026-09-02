import Sigil from './Sigil';
import styles from './Divider.module.css';

/** Two fading rules flanking the sigil, in place of a plain <hr>. */
export default function Divider() {
  return (
    <div className={styles.divider} role="presentation">
      <span className={styles.line} />
      <Sigil size={14} color="var(--muted-2)" variant="mark" />
      <span className={styles.line} />
    </div>
  );
}
