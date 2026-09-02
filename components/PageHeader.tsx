import styles from './PageHeader.module.css';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lede?: string;
  accent?: 'gold' | 'teal';
}

export default function PageHeader({
  eyebrow,
  title,
  lede,
  accent = 'gold',
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={`eyebrow ${accent === 'teal' ? 'eyebrow--teal' : ''}`}>
        {eyebrow}
      </p>
      <h1 className={styles.title}>{title}</h1>
      {lede && <p className={styles.lede}>{lede}</p>}
    </header>
  );
}
