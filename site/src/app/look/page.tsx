import { Footer, Header } from '@/components/Chrome';
import { CONTACT_EMAIL } from '@/lib/site-content';

export const metadata = { title: 'Link not working', robots: { index: false } };

/** Where a revoked, expired or mistyped share link lands. */
export default function LookExpired() {
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 48, maxWidth: 720, minHeight: '60vh' }}>
        <p className="eyebrow">Preview link</p>
        <h1 style={{ marginTop: 12 }}>This link isn&rsquo;t working any more.</h1>
        <p className="lede">Preview links to the Fieldwork deck are personal and expire after a while. If you were sent one, ask Colin for a fresh link.</p>
        {CONTACT_EMAIL && (
          <p style={{ marginTop: 32 }}>
            <a href={`mailto:${CONTACT_EMAIL}?subject=Fieldwork%20preview%20link`} className="btn quiet">
              Ask for a new link
            </a>
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
