import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import WorkHub from './WorkHub';

// The Trello boards, read live.
//
// Its own page rather than the backend's front door: it is the longest thing
// here, and having it under /work meant the page opened every morning had to
// be scrolled before anything else could be reached.

export const metadata: Metadata = pageMeta({
  path: '/work/boards/',
  title: 'Boards',
  description: 'What is next across Trello.',
  noIndex: true,
});

export default function WorkBoardsPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Boards"
        lede="What is next, per project, straight off Trello."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <WorkHub />
    </div>
  );
}
