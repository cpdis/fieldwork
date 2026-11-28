'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'Overview', match: (p: string) => p === '/admin' || p.startsWith('/admin/cohorts') },
  { href: '/admin/deck', label: 'Deck', match: (p: string) => p.startsWith('/admin/deck') },
  { href: '/admin/analytics', label: 'Analytics', match: (p: string) => p.startsWith('/admin/analytics') },
];

export function AdminNav() {
  const path = usePathname() ?? '';
  return (
    <nav className="anav" aria-label="Admin">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.match(path) ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
