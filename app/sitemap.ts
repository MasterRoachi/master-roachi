import type { MetadataRoute } from 'next';
import { getCollection } from '@/lib/content';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/work',
    '/thoughts',
    '/shepherds',
    '/about',
    '/contact',
  ].map((route) => ({
    url: `${site.url}${route}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  const entryRoutes = [
    ...getCollection('projects').map((e) => ({
      url: `${site.url}/work/${e.slug}/`,
      lastModified: new Date(e.frontmatter.date),
    })),
    ...getCollection('thoughts').map((e) => ({
      url: `${site.url}/thoughts/${e.slug}/`,
      lastModified: new Date(e.frontmatter.date),
    })),
    ...getCollection('devlog').map((e) => ({
      url: `${site.url}/shepherds/devlog/${e.slug}/`,
      lastModified: new Date(e.frontmatter.date),
    })),
  ];

  return [...staticRoutes, ...entryRoutes];
}
