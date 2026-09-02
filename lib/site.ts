// Single source of truth for anything that appears in more than one place —
// metadata, nav, and contact details.

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
    // TODO before deploy: real LinkedIn profile URL. Null hides the link.
    linkedin: null as string | null,
  },
} as const;

export const navLinks = [
  { href: '/work/', label: 'Work' },
  { href: '/thoughts/', label: 'Thoughts' },
  { href: '/shepherds/', label: 'Shepherds' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
