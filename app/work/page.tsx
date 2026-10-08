import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import WorkHub from './WorkHub';

// The work hub: what is next, per project, read live from Trello.
//
// Private. Everything else on this site is for whoever turns up; this page is
// for one person, and the gate is a Cloudflare Access application covering
// /work* and /api/work with a policy of a single email. Access sits in front
// of the Worker, so an unauthenticated request never reaches any code here.
//
// Three things still guard it in the repo, because an Access rule is one
// dashboard click away from being switched off by accident:
//   - noIndex below, so it carries a robots meta tag of its own
//   - a Disallow in app/robots.ts
//   - it is absent from app/sitemap.ts, which lists its routes by hand
// None of those are security. They stop the page being *advertised*; Access
// stops it being read.
//
// The shell is static, like every page here — `output: 'export'` means there
// is no server to render against, and the data has to arrive after load. The
// client component does that. See WorkHub.tsx.

export const metadata: Metadata = pageMeta({
  path: '/work/',
  title: 'Work',
  description: 'What is next, across every project.',
  noIndex: true,
});

export default function WorkPage() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Private"
        title="Work"
        lede="What is next, per project, straight off the boards."
      />
      {/* Neither backend page is in the site nav — they are private, and the
          nav is for visitors. This is how one reaches the other. */}
      <p>
        <Link href="/work/writing/">Writing →</Link>
      </p>

      <WorkHub />
    </div>
  );
}
