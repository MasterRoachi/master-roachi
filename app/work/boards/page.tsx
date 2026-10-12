import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
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
      <WorkHub />
    </div>
  );
}
