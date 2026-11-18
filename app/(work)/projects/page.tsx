import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import ProjectCard from '@/components/ProjectCard';
import { getOwnProjects, toProjectSummary } from '@/lib/content';
import cards from '@/components/Card.module.css';
import styles from './projects.module.css';

export const metadata: Metadata = pageMeta({
  path: '/projects/',
  title: 'Work',
  description:
    'Games, worlds, stores and code — finished, building, and still an idea.',
});

export default function ProjectsPage() {
  // His own projects only. Work done for other people moved to the hire tabs
  // on 18 Nov 2026: the client sites are the proof on Websites, the client
  // apps the proof on Software. Their own pages under /projects/ stay.
  const projects = getOwnProjects().map(toProjectSummary);

  // Highest weight leads. Everything else keeps its order beneath, so adding a
  // project changes the page by adding to it rather than rearranging it.
  const [lead, ...rest] = projects;

  return (
    <div
      className={styles.page}
      // White, the colour Work answers in the nav.
      style={{ '--accent-a': 'oklch(97% 0 0)' } as React.CSSProperties}
    >
      {/* The starfield is the layout's, app/(work)/layout.tsx, so it stays put
          when a tab is chosen. ProjectCard is written for it: the cards are
          translucent and tilt, objects floating in the depth. */}
      {/* The hero, "Work Hard", is the layout's (components/WorkHero.tsx), in
          the same shape as the two hire tabs'. */}
      <div className="shell" id="work">

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

        {/* The way across to the two hire tabs, for anyone who came to look
            at the work and wants something built. */}
        <div className={styles.hire}>
          <Link href="/hire/" className={styles.door} style={{ '--door': 'oklch(80% 0.12 190)' } as React.CSSProperties}>
            <span className={styles.doorEyebrow}>Hire me</span>
            <b>Need a website for your business?</b>
            <span>From R3,950, with a free sample first.</span>
          </Link>
          <Link href="/hire/software/" className={styles.door} style={{ '--door': 'oklch(76% 0.15 300)' } as React.CSSProperties}>
            <span className={styles.doorEyebrow}>Hire me</span>
            <b>Need an app or a tool built?</b>
            <span>Phone apps, web apps and the tools behind a business.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
