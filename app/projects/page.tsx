import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/components/ProjectCard';
import { getProjects } from '@/lib/content';
import cards from '@/components/Card.module.css';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Games, worlds, stores and code — finished, building, and still an idea.',
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="shell">
      <PageHeader
        eyebrow="Projects"
        title="What I'm building"
        lede="Everything public, nothing hidden — including the parts that aren't finished."
      />
      <div className={cards.grid} style={{ paddingBottom: '120px' }}>
        {projects.map((entry) => (
          <ProjectCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </div>
  );
}
