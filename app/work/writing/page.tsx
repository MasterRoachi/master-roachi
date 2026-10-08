import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Editor from './Editor';

// Writing, editable from the browser.
//
// Private, and protected by the same Access application as the rest of the
// backend: its policy covers the path `work` as a prefix, so this page and its
// API at /work/api/content are both behind it with no extra rule.
//
// Saving commits the file to the repo, and the push is what publishes it —
// Workers Builds deploys on push. So a save is a deploy, about two minutes
// from pressing the button to being live.

export const metadata: Metadata = pageMeta({
  path: '/work/writing/',
  title: 'Writing',
  description: 'Edit and publish posts.',
  noIndex: true,
});

export default function WorkWritingPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Writing"
        lede="Edit a post and save. Saving commits it, and the commit publishes it."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>

      <Editor />
    </div>
  );
}
