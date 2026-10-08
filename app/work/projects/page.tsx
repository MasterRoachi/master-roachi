import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import { COLLECTIONS } from '@/lib/collections';
import CollectionEditor from '../CollectionEditor';

// Project pages in content/projects, editable from the browser.
//
// Private, behind the same Access application as the rest of the backend:
// its policy covers the path `work` as a prefix. Saving commits the file,
// and the commit is what publishes it.

export const metadata: Metadata = pageMeta({
  path: '/work/projects/',
  title: 'Projects',
  description: 'Edit a project page. Weight orders the grid; the accents colour its card.',
  noIndex: true,
});

const collection = COLLECTIONS.find((c) => c.key === 'projects')!;

export default function Page() {
  return (
    <div className="shell">
      <PageHeader eyebrow="Private" title="Projects" lede="Edit a project page. Weight orders the grid; the accents colour its card." />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <CollectionEditor
        collection="projects"
        noun="project"
        template={collection.template?.(new Date().toISOString().slice(0, 10))}
      />
    </div>
  );
}
