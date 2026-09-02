import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { site } from '@/lib/site';
import './globals.css';

// One grotesque doing all the work, per the visual direction. Archivo holds up
// at both ends — heavy and tight at display sizes, readable at body sizes —
// which is what lets the design drop to a single family. Self-hosted at build
// time by next/font, so there is no request to Google at runtime.
const sans = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: site.name,
    description: site.description,
    url: site.url,
    locale: 'en_ZA',
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.description,
  },
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': `${site.url}/rss.xml` },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
