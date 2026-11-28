import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // The repo root holds the slide deck's own lockfile; this app is its own root.
  outputFileTracingRoot: import.meta.dirname,
  turbopack: { root: import.meta.dirname },
  // The attendee companion page (built from the deck by scripts/companion.mjs) lives at /companion.
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
