import { redirect } from 'next/navigation';
import { Header } from '@/components/Chrome';
import { isAdmin } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin sign in', robots: { index: false } };

export default async function Login() {
  if (await isAdmin()) redirect('/admin');
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 48, maxWidth: 420 }}>
        <p className="eyebrow">Admin</p>
        <h2 style={{ marginTop: 8 }}>Sign in</h2>
        <LoginForm />
      </main>
    </>
  );
}
