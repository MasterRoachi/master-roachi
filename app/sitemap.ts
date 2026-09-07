import type { MetadataRoute } from 'next';
import { getProjectPages, getWriting } from '@/lib/content';
import { getStoreProducts, productPath } from '@/lib/store';
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
    // One page per product, generated from the same catalogue the store page
    // reads — so a product added in Printful appears here on the next build
    // without anyone remembering to list it.
    ...getStoreProducts().map((p) => ({
      url: `${site.url}${productPath(p)}`,
      lastModified: new Date(),
    })),
  ];

  return [...staticRoutes, ...entryRoutes];
}
