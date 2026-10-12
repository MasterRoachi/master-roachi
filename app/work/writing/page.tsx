import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { COLLECTIONS } from '@/lib/collections';
import { getProjects } from '@/lib/content';
import { site } from '@/lib/site';
import CollectionEditor from '../CollectionEditor';

// Posts in content/writing, editable from the browser.
//
// Private, behind the same Access application as the rest of the backend:
// its policy covers the path `work` as a prefix. Saving commits the file,
// and the commit is what publishes it.

export const metadata: Metadata = pageMeta({
  path: '/work/writing/',
  title: 'Writing',
  description: 'Edit a post and save. Saving commits it, and the commit publishes it.',
  noIndex: true,
});

const collection = COLLECTIONS.find((c) => c.key === 'writing')!;

export default function Page() {
  return (
    <div className="shell">
      <CollectionEditor
        collection="writing"
        noun="post"
        template={collection.template?.(new Date().toISOString().slice(0, 10))}
        seo
        prose
        siteName={site.name}
        art={{ collection: 'writing-art', dir: 'public/writing' }}
        // The real slugs, so pointing a post at a project is a choice from a
        // list rather than a string that silently matches nothing.
        projects={getProjects().map((project) => project.slug)}
      />
    </div>
  );
}
