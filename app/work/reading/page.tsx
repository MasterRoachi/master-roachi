import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import Reading from './Reading';

// The reading tracker, as a bookcase. On D1, beside the habits, for the same
// reason: moving a bookmark is not worth a commit.
//
// NOT BUILT YET, and the reason the thoughts field is Markdown: a book's
// thoughts are meant to become a post on the site. The path is short, because
// everything it needs exists — /work/api/content already commits .mdx into
// content/writing, and the writing editor already publishes from there. It
// wants a button on the open book that writes the note out as a post with the
// title, author and rating in its frontmatter, and a record on the book of
// which post it became, so pressing it twice does not make a second one.
//
// Writing the note as prose now means there is nothing to convert then.

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
        lede="Take a book off the shelf to read what you thought of it."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <Reading />
    </div>
  );
}
