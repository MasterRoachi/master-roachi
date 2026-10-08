import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import Scratchpad from './Scratchpad';

// Somewhere to write and draw, where what is made is kept.
//
// Notes commit to notes/ in the repo as Markdown, so they are versioned and
// diffable rather than sitting in a store only this page can read. Drawings
// are PNGs beside them. Export is .md, .txt, or the browser's own PDF writer.

export const metadata: Metadata = pageMeta({
  path: '/work/scratchpad/',
  title: 'Scratchpad',
  description: 'Write, draw, and keep it.',
  noIndex: true,
});

export default function WorkScratchpadPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Scratchpad"
        lede="Write or draw. Saving commits it to the repo; export takes a copy out."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <Scratchpad />
    </div>
  );
}
