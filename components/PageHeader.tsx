import styles from './PageHeader.module.css';

export default function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className={styles.header}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {lede && <p className="lede">{lede}</p>}
    </header>
  );
}
