import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Sketchpad from './Sketchpad';

// One page to write and draw on, saved as one file.
//
// A sketch is an SVG in notes/, holding the ink and the text together at the
// positions they were put. Not a document plus images: what was left on the
// page is what is in the file. See lib/sketch.ts for why SVG and not a canvas.

export const metadata: Metadata = pageMeta({
  path: '/work/sketchpad/',
  title: 'Sketchpad',
  description: 'Write and draw on the same page.',
  noIndex: true,
});

export default function WorkScratchpadPage() {
  return (
    <div className="shell">
      <Sketchpad />
    </div>
  );
}
