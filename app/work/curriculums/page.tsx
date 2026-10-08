import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import Curriculums from './Curriculums';

// The control dashboard for what he is studying: curriculum, module, lesson.
//
// Built before any curriculum is entered, deliberately — including the outline
// import, because entering three courses one lesson at a time through an "Add"
// box is the part that would never get done.

export const metadata: Metadata = pageMeta({
  path: '/work/curriculums/',
  title: 'Curriculums',
  description: 'What is being studied, and how far through it you are.',
  noIndex: true,
});

export default function WorkCurriculumsPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Curriculums"
        lede="Where you were, and the path from here."
      />
      <p>
        <Link href="/work/">← Work</Link>
      </p>
      <Curriculums />
    </div>
  );
}
