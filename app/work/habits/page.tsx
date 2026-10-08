import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import Habits from './Habits';

// The habit tracker.
//
// Kept in D1 rather than in the repo: a daily tick is not worth a commit, and
// a year of them would be a year of deploys. Private, behind the same Access
// application as the rest of the backend.

export const metadata: Metadata = pageMeta({
  path: '/work/habits/',
  title: 'Habits',
  description: 'What got done, and what did not.',
  noIndex: true,
});

export default function WorkHabitsPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Habits"
        lede="Today is the last column. Click any square to change it."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <Habits />
    </div>
  );
}
