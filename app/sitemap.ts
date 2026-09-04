import type { MetadataRoute } from 'next';
import { getProjectPages, getWriting } from '@/lib/content';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // /store was missing while /projects/fabled-threads/ — a page that is never
  // generated — was listed. Both halves of that are fixed here.
  const staticRoutes = [
    '',
    '/projects',
    '/gaming',
    '/orthodoxy',
    '/writing',
    '/store',
    '/about',
  ].map((route) => ({
    url: `${site.url}${route}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  const entryRoutes = [
    ...getProjectPages().map((e) => ({
      url: `${site.url}/projects/${e.slug}/`,
      lastModified: new Date(e.frontmatter.date),
    })),
    ...getWriting().map((e) => ({
      url: `${site.url}/writing/${e.slug}/`,
      lastModified: new Date(e.frontmatter.date),
    })),
  ];

  return [...staticRoutes, ...entryRoutes];
}
