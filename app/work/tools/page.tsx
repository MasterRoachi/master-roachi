import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import WorkDoors from '../WorkDoors';

// The tools app's doors (2026-11-10): where the installed app opens, one door
// per tool. See lib/work-tools.ts for what it holds.

export const metadata: Metadata = pageMeta({
  path: '/work/tools/',
  title: 'Tools',
  description: 'Your own tools for the day.',
  noIndex: true,
});

export default function ToolsPage() {
  return (
    <div className="shell">
      <WorkDoors app="tools" />
    </div>
  );
}
