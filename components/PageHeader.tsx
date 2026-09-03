import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export default function PageHeader({
  mark,
  eyebrow,
  title,
  lede,
}: {
  /** The section's own symbol, above the eyebrow. */
  mark?: ReactNode;
  eyebrow: string;
  title: string;
  /** A string, or anything that renders — the Work page passes a quote. */
  lede?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      {mark && <span className={styles.mark}>{mark}</span>}
      <p className="eyebrow">{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {typeof lede === 'string' ? <p className="lede">{lede}</p> : lede}
    </header>
  );
}
