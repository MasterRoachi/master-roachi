import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import Callout from './Callout';
import ComingSoon from './ComingSoon';
import Split from './Split';
import styles from './Prose.module.css';

// Renders an entry body as a server component — MDX is compiled during the
// static export, so none of this reaches the browser.
export default function Mdx({ source }: { source: string }) {
  return (
    <div className={styles.prose}>
      <MDXRemote
        source={source}
        // Components an entry body may use. Kept deliberately small — an MDX
        // file that can reach for anything stops being content and becomes a
        // second template.
        components={{ Split, ComingSoon, Callout }}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            ],
          },
        }}
      />
    </div>
  );
}
