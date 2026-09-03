import type { Metadata } from 'next';
import Starfield from '@/components/Starfield';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/components/ProjectCard';
import { getProjects, toProjectSummary } from '@/lib/content';
import CyclingQuote from '@/components/CyclingQuote';
import LaptopIcon from '@/components/LaptopIcon';
import { quotes } from '@/lib/quotes';
import cards from '@/components/Card.module.css';
import styles from './projects.module.css';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Games, worlds, stores and code — finished, building, and still an idea.',
};

export default function ProjectsPage() {
  const projects = getProjects().map(toProjectSummary);

  // Highest weight leads. Everything else keeps its order beneath, so adding a
  // project changes the page by adding to it rather than rearranging it.
  const [lead, ...rest] = projects;

  return (
    <div
      className={styles.page}
      // White, the colour Work answers in the nav — so the laptop matches its
      // section the way Fun's controller matches lime.
      style={{ '--accent-a': 'oklch(97% 0 0)' } as React.CSSProperties}
    >
      {/* Every other main page has this behind it, and ProjectCard is written
          for it — the cards are translucent and tilt so they read as objects
          floating in the depth. Without it they were flat tiles on black, and
          the one page they were designed for was the one page missing it. */}
      <Starfield />

      <div className="shell">
        <PageHeader
          mark={<LaptopIcon />}
          eyebrow="Work"
          title="Work Hard"
          lede={<CyclingQuote quotes={quotes} seed="work" />}
        />

        {lead && (
          <div className={styles.lead}>
            <ProjectCard entry={lead} featured />
          </div>
        )}

        {rest.length > 0 && (
          <div className={cards.grid}>
            {rest.map((entry) => (
              <ProjectCard key={entry.slug} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
