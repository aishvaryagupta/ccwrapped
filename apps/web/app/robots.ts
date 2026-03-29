import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/p/', '/claim', '/api/'],
    },
    sitemap: 'https://ccwrapped.dev/sitemap.xml',
  };
}
