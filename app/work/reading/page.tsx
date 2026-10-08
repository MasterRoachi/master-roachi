import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import Reading from './Reading';

// The reading tracker. On D1, beside the habits, for the same reason: moving
// a bookmark is not worth a commit.

export const metadata: Metadata = pageMeta({
  path: '/work/reading/',
  title: 'Reading',
  description: 'What is open, what is next, and what was put down.',
  noIndex: true,
});

export default function WorkReadingPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Reading"
        lede="What is open now, what is next, and the years behind it."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <Reading />
    </div>
  );
}
