import { site } from '@/lib/site';

// JSON-LD describing the site and the person behind it.
//
// There was none, which meant a search engine had to infer from the markup
// that masterroachi.com is one person's site, that Master Roachi and Stephan
// Engelbrecht are the same, and which accounts belong to him. Stating it is
// cheap and removes the guesswork.
//
// Rendered as a plain <script> rather than next/script: this is data, not
// executable code, and it has to be in the static HTML for a crawler that does
// not run JavaScript.

export default function StructuredData() {
  const person = {
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.personName,
    alternateName: site.name,
    url: `${site.url}/`,
    description: site.description,
    image: `${site.url}/og.png`,
    // Only the accounts that are actually set. sameAs is how the identities
    // are tied together, so a wrong or dead one is worse than a missing one.
    sameAs: Object.values(site.socials).filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    ),
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: `${site.url}/`,
    name: site.name,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': `${site.url}/#person` },
  };

  const graph = { '@context': 'https://schema.org', '@graph': [person, website] };

  return (
    <script
      type="application/ld+json"
      // The content is built here from lib/site.ts, not from anything a
      // visitor can influence.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
