import type { MetadataRoute } from 'next';

const SITE = process.env.SITE_URL || 'https://fieldworkperth.com';

/** Index the marketing page; keep the admin and the post-payment page out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/book/success', '/api'] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
