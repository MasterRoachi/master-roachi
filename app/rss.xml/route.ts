import { getCollection } from '@/lib/content';
import { site } from '@/lib/site';

// Prerendered into out/rss.xml at build time — `output: 'export'` allows a
// GET route handler as long as it does not read from the request.
export const dynamic = 'force-static';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET() {
  const posts = [
    ...getCollection('thoughts').map((e) => ({
      entry: e,
      path: `/thoughts/${e.slug}/`,
    })),
    ...getCollection('devlog').map((e) => ({
      entry: e,
      path: `/shepherds/devlog/${e.slug}/`,
    })),
  ].sort(
    (a, b) =>
      Date.parse(b.entry.frontmatter.date) -
      Date.parse(a.entry.frontmatter.date),
  );

  const items = posts
    .map(({ entry, path }) => {
      const url = `${site.url}${path}`;
      return `    <item>
      <title>${escapeXml(entry.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(entry.frontmatter.summary)}</description>
      <pubDate>${new Date(entry.frontmatter.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en</language>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
