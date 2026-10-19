'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as runtime from 'react/jsx-runtime';
import type { MDXComponents } from 'mdx/types';
import { usePreviewDraft } from './usePreviewDraft';
import Split from './Split';
import ComingSoon from './ComingSoon';
import Callout from './Callout';
import proseStyles from './Prose.module.css';

// A project page's (or a post's) title, summary and body, able to show a
// draft from the editor's preview frame — Stage 2, his ruling 2026-10-19:
// "preview the real page", the same as Products has.
//
// For a visitor these render exactly what the build rendered: the title and
// summary as given, and the body as the server-compiled MDX passed in as
// children. Only inside the preview frame (see usePreviewDraft) does a draft
// arrive, and only then is the MDX compiler loaded — a dynamic import, so it
// is never part of a visitor's download.

export const ENTRY_PREVIEW = 'entry-preview';

export interface EntryDraft {
  title: string;
  summary: string;
  body: string;
}

const NONE: EntryDraft | null = null;

export function LiveEntryText({
  field,
  initial,
  className,
  as: Tag = 'p',
}: {
  field: 'title' | 'summary';
  initial: string;
  className?: string;
  as?: 'h1' | 'p';
}) {
  const draft = usePreviewDraft<EntryDraft | null>(ENTRY_PREVIEW, NONE);
  return <Tag className={className}>{draft ? draft[field] : initial}</Tag>;
}

/* AchievementGrid reads its data from disk at build, which a browser cannot,
   so in a preview it is a labelled box rather than a crash. */
function AchievementPlaceholder() {
  return (
    <p style={{ padding: '1rem', border: '1px dashed var(--line)', borderRadius: 8, color: 'var(--muted)' }}>
      Achievement grid — drawn at build, not in the preview.
    </p>
  );
}

const COMPONENTS = { Split, ComingSoon, Callout, AchievementGrid: AchievementPlaceholder } as MDXComponents;

export function LiveBody({ children }: { children: ReactNode }) {
  const draft = usePreviewDraft<EntryDraft | null>(ENTRY_PREVIEW, NONE);
  const [rendered, setRendered] = useState<ReactNode>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) return;
    let live = true;
    // A short pause, so typing in the editor compiles once per pause rather
    // than once per keystroke.
    const timer = setTimeout(async () => {
      try {
        // Loaded only here, in a preview frame with a draft in hand.
        // The same plugins components/Mdx.tsx compiles with, so a heading
        // looks and links the way it will on the built page.
        const [{ evaluate }, { default: remarkGfm }, { default: rehypeSlug }, { default: rehypeAutolinkHeadings }] =
          await Promise.all([
            import('@mdx-js/mdx'),
            import('remark-gfm'),
            import('rehype-slug'),
            import('rehype-autolink-headings'),
          ]);
        const { default: Content } = await evaluate(draft.body, {
          ...runtime,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
        });
        if (!live) return;
        setRendered(<Content components={COMPONENTS} />);
        setProblem(null);
      } catch (error) {
        // Half-typed MDX — an unclosed <Split> — is normal while writing. Say
        // so, and keep the last body that compiled.
        if (live) setProblem(error instanceof Error ? error.message : 'The body does not compile yet.');
      }
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [draft]);

  if (!draft || rendered === null) return <>{children}</>;
  return (
    <>
      {problem && (
        <p style={{ padding: '0.6rem 0.9rem', borderLeft: '3px solid var(--accent)', color: 'var(--muted)' }}>
          The draft does not compile yet: {problem}
        </p>
      )}
      <div className={proseStyles.prose}>{rendered}</div>
    </>
  );
}
