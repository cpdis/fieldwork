import Link from 'next/link';
import { Footer, Header } from '@/components/Chrome';

export const metadata = { title: 'Page not found' };

/** The site's 404: branded, with one way back. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 48, maxWidth: 720 }}>
        <p className="eyebrow">404</p>
        <h1 style={{ marginTop: 12 }}>That page isn&rsquo;t here.</h1>
        <p className="lede">The link may be old, or the day it pointed to is no longer listed.</p>
        <p style={{ marginTop: 32 }}>
          <Link href="/" className="btn quiet">
            Back to Fieldwork
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
