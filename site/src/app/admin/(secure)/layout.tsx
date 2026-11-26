import Link from 'next/link';
import { Header } from '@/components/Chrome';
import { requireAdmin } from '@/lib/auth';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <Header
        right={
          <>
            <Link href="/admin" className="small">
              Cohorts
            </Link>
            <form action={logout}>
              <button className="btn quiet small">Sign out</button>
            </form>
          </>
        }
      />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {children}
      </main>
    </>
  );
}
