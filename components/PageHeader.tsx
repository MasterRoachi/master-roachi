import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export default function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  /** A string, or anything that renders — the Work page passes a quote. */
  lede?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {typeof lede === 'string' ? <p className="lede">{lede}</p> : lede}
    </header>
  );
}
