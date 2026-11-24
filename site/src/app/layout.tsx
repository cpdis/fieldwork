import type { Metadata } from 'next';
import { Caveat, IBM_Plex_Mono, Instrument_Sans, Newsreader } from 'next/font/google';
import './globals.css';

const sans = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });
// Field-notes half only (the Claude side of a dual-track panel): serif label and hand annotations.
const serif = Newsreader({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-serif', preload: false });
const hand = Caveat({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-hand', preload: false });

const SITE = process.env.SITE_URL || 'https://fieldworkperth.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Fieldwork · a one-day AI course in Perth', template: '%s · Fieldwork' },
  description:
    'One hands-on day in Perth for people who run a small business. ChatGPT and Claude side by side, on work from your own week. The models are already good enough; the gap is the habit of asking.',
  openGraph: { type: 'website', siteName: 'Fieldwork', locale: 'en_AU' },
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${serif.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
