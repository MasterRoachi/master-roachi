import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    // /work is the private hub. Cloudflare Access is what actually keeps it
    // shut — a crawler cannot authenticate — but there is no reason to name
    // the path in a sitemap or let it be requested in the first place.
    rules: { userAgent: '*', allow: '/', disallow: '/work/' },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
