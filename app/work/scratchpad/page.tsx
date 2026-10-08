import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import Sketchpad from './Sketchpad';

// One page to write and draw on, saved as one file.
//
// A sketch is an SVG in notes/, holding the ink and the text together at the
// positions they were put. Not a document plus images: what was left on the
// page is what is in the file. See lib/sketch.ts for why SVG and not a canvas.

export const metadata: Metadata = pageMeta({
  path: '/work/scratchpad/',
  title: 'Sketchpad',
  description: 'Write and draw on the same page.',
  noIndex: true,
});

export default function WorkScratchpadPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Sketchpad"
        lede="Pen, text, and select. Saving keeps one file that looks like what you left."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <Sketchpad />
    </div>
  );
}
