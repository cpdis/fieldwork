import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // The repo root holds the slide deck's own lockfile; this app is its own root.
  outputFileTracingRoot: import.meta.dirname,
  turbopack: { root: import.meta.dirname },
  // The attendee companion page (built from the deck by scripts/companion.mjs) lives at /companion.
  // The built deck's entry pages are read from deck-build/ by the routes that serve them.
  outputFileTracingIncludes: {
    '/admin/**': ['./deck-build/**'],
    '/look/**': ['./deck-build/**'],
  },
  async rewrites() {
    return [{ source: '/companion', destination: '/companion.html' }];
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // The deck's files have content hashes in their names, so the browser can keep them.
        // Listed after /admin/:path* so this Cache-Control wins for them. src/proxy.ts gates both.
        source: '/:area(admin/deck|look)/assets/:file*',
        headers: [
          { key: 'Cache-Control', value: 'private, max-age=31536000, immutable' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/look/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default config;
