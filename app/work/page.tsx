import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/components/ProjectCard';
import { getCollection } from '@/lib/content';
import styles from '@/components/Card.module.css';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Projects, exercises, and things still being built.',
};

export default function WorkPage() {
  const projects = getCollection('projects');

  return (
    <div className="shell">
      <PageHeader
        eyebrow="Selected Work"
        title="Things I've Built"
        lede="Foundations work, a site, and a game that isn't ready yet. Gold means it's real and shipped; teal means it's still ahead of me."
      />
      <div className={styles.grid} style={{ paddingBottom: '80px' }}>
        {projects.map((entry) => (
          <ProjectCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </div>
  );
}
