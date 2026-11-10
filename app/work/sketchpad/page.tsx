import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Sketchpad from './Sketchpad';
import styles from './sketchpad.module.css';

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
    // The whole width of the pane on a computer, not the site's content
    // width: a page to draw on wants all of it (his call, 2026-11-10, design
    // pass: the public site's styling, the CRM's desktop layout).
    <div className={`shell ${styles.wide}`}>
      <Sketchpad />
    </div>
  );
}
