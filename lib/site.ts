// Single source of truth for anything that appears in more than one place —
// metadata, nav, and contact details.
//
// The `as string | null` annotations are deliberate: the UI hides a link
// rather than rendering a dead one when a value is null, and keeping the
// wider type means a value can be pulled back out without a type error.

export const site = {
  name: 'Master Roachi',
  personName: 'Stephan Engelbrecht',
  url: 'https://masterroachi.com',
  description:
    'Software engineer. Writes about code, sometimes about theology.',

  // Forwarded to a personal inbox by Cloudflare Email Routing — there is no
  // mailbox behind this address. See DEPLOY.md.
  contactEmail: 'roachi@masterroachi.com' as string | null,

  socials: {
    github: 'https://github.com/MasterRoachi',
    linkedin:
      'https://www.linkedin.com/in/stephanusmengelbrecht/' as string | null,
  },
} as const;

export const navLinks = [
  { href: '/work/', label: 'Work' },
  { href: '/thoughts/', label: 'Thoughts' },
  { href: '/shepherds/', label: 'Shepherds' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
