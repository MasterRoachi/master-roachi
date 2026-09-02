import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import WritingList from '@/components/WritingList';
import { getWriting, toSummary } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Posts on code, games, and Orthodoxy.',
};

export default function WritingPage() {
  const posts = getWriting().map(toSummary);

  return (
    <div className="shell" style={{ paddingBottom: '120px' }}>
      <PageHeader
        eyebrow="Writing"
        title="Words"
        lede="Code, games, and Orthodoxy. Devlogs where a project earns one."
      />
      <WritingList posts={posts} />
    </div>
  );
}
