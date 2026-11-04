import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { site } from '@/lib/site';
import './globals.css';

// One grotesque doing all the work, per the visual direction. Archivo holds up
// at both ends — heavy and tight at display sizes, readable at body sizes —
// which is what lets the design drop to a single family.
//
// LOCAL FILES, NOT next/font/google. The Google loader downloads the fonts at
// build time, and on 4 November 2026 that download failed in CI twice and took
// two deploys down with it. These are the same Latin-subset woff2 files Google
// serves (Archivo variable, 400–800; Reggae One 400), committed with their OFL
// licences in app/fonts/, so a build needs nothing from the network.
const sans = localFont({
  src: './fonts/archivo-latin.woff2',
  weight: '400 800',
  style: 'normal',
  variable: '--font-sans',
  display: 'swap',
});

// The wordmark, and only the wordmark.
//
// Midorima was the first choice and is licensed for personal use only, which a
// site with a shop on it cannot honour — least of all on its own name. Reggae
// One is SIL Open Font License, so commercial use is permitted, and unusually
// for a display face it holds up at the 0.95rem the nav runs at.
const display = localFont({
  src: './fonts/reggae-one-latin.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  // Deliberately no openGraph, twitter or canonical here.
  //
  // Next inherits root metadata into every page, so a canonical set here was
  // set everywhere — and it said '/'. Every page on the site therefore told
  // search engines it was a duplicate of the homepage. The Open Graph block
  // did the same quietly: og:url, og:title and og:description were the
  // homepage's on every page, so sharing any page showed the homepage.
  //
  // Each page builds its own with pageMeta() in lib/seo.ts. Only the RSS
  // alternate, which really is site-wide, stays here.
  alternates: {
    types: { 'application/rss+xml': `${site.url}/rss.xml` },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <StructuredData />
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
