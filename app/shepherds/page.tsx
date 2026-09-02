import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import PostCard from '@/components/PostCard';
import Sigil from '@/components/Sigil';
import { getCollection, toSummary } from '@/lib/content';
import styles from './shepherds.module.css';

export const metadata: Metadata = {
  title: 'Shepherds We Shall Be',
  description:
    'A 2.5D pixel art ARPG, built solo in Godot. Devlog and progress.',
};

export default function ShepherdsPage() {
  const devlog = getCollection('devlog').map(toSummary);

  return (
    <div className="shell" style={{ paddingBottom: '80px' }}>
      <PageHeader
        eyebrow="In Development"
        title="Shepherds We Shall Be"
        lede="A 2.5D pixel art ARPG, built solo in Godot. Still early — this is where progress gets written down."
        accent="teal"
      />

      <section className={styles.facts}>
        <div className={styles.fact}>
          <span className={styles.factLabel}>Engine</span>
          <span className={styles.factValue}>Godot</span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factLabel}>Style</span>
          <span className={styles.factValue}>2.5D pixel art</span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factLabel}>Team</span>
          <span className={styles.factValue}>Solo</span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factLabel}>Status</span>
          <span className={styles.factValue}>Early</span>
        </div>
      </section>

      <section className={styles.devlog}>
        <h2 className="section-title">Devlog</h2>
        {devlog.length === 0 ? (
          <div className={styles.empty}>
            <Sigil size={40} color="var(--teal)" opacity={0.4} />
            <p>
              No entries published yet. They land here as the game takes shape.
            </p>
          </div>
        ) : (
          <div>
            {devlog.map((entry) => (
              <PostCard
                key={entry.slug}
                entry={entry}
                basePath="/shepherds/devlog"
                showTrack={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
