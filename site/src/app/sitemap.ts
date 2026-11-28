import type { MetadataRoute } from 'next';

const SITE = process.env.SITE_URL || 'https://fieldworkperth.com';

/** One public page today. Booking pages are reached from it and change with each cohort. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 }];
}
