import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import LearnHome from '../home/LearnHome';

// The learn app's home (2026-11-10): where the installed app opens. Continue,
// the cards due and the books open now, then the three doors (his pick,
// 2026-11-10, redesign page, Learn doors: B). home/LearnHome.tsx says how.
// See lib/work-tools.ts for what the app holds.

export const metadata: Metadata = pageMeta({
  path: '/work/learn/',
  title: 'Learn',
  description: 'Everything being studied.',
  noIndex: true,
});

export default function LearnPage() {
  return (
    <div className="shell">
      <LearnHome />
    </div>
  );
}
