import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import WorkDoors from '../WorkDoors';

// The learn app's doors (2026-11-10): where the installed app opens, one door
// per tool. See lib/work-tools.ts for what it holds.

export const metadata: Metadata = pageMeta({
  path: '/work/learn/',
  title: 'Learn',
  description: 'Everything being studied.',
  noIndex: true,
});

export default function LearnPage() {
  return (
    <div className="shell">
      <WorkDoors app="learn" />
    </div>
  );
}
