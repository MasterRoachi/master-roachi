import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ThoughtsList from '@/components/ThoughtsList';
import { getCollection, toSummary } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Thoughts',
  description: 'Writing about code, and sometimes about theology.',
};

export default function ThoughtsPage() {
  const posts = getCollection('thoughts').map(toSummary);

  return (
    <div className="shell" style={{ paddingBottom: '80px' }}>
      <PageHeader
        eyebrow="Thoughts"
        title="Writing"
        lede="Two tracks: code, and theology. They don't overlap much, so they're filterable."
      />
      <ThoughtsList posts={posts} />
    </div>
  );
}
