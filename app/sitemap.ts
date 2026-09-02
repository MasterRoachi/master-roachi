import type { MetadataRoute } from 'next';
import { getProjects, getWriting } from '@/lib/content';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/projects',
    '/gaming',
    '/orthodoxy',
    '/writing',
    '/about',
  ].map((route) => ({
    url: `${site.url}${route}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  const entryRoutes = [
    ...getProjects().map((e) => ({
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
