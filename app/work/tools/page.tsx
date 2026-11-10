import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import ToolsHome from '../home/ToolsHome';

// The tools app's home (2026-11-10): where the installed app opens. Today's
// habits, ticked right here, then Habits and Sketchpad as two small cards (his
// pick, 2026-11-10, redesign page, Tools doors: B). home/ToolsHome.tsx says
// how. See lib/work-tools.ts for what the app holds.

export const metadata: Metadata = pageMeta({
  path: '/work/tools/',
  title: 'Tools',
  description: 'Your own tools for the day.',
  noIndex: true,
});

export default function ToolsPage() {
  return (
    <div className="shell">
      <ToolsHome />
    </div>
  );
}
