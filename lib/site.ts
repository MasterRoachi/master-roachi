// Single source of truth for anything that appears in more than one place —
// metadata, nav, and the contact details that still need filling in.

export const site = {
  name: 'Master Roachi',
  personName: 'Stephan Engelbrecht',
  url: 'https://masterroachi.com',
  description:
    'Software engineer. Writes about code, sometimes about theology.',

  // TODO before deploy: replace with the real address. Until this is a real
  // address, `contactEmail` is null and the UI hides the mailto link rather
  // than rendering a broken one.
  contactEmail: null as string | null,

  socials: {
    github: 'https://github.com/MasterRoachi',
    // TODO before deploy: real LinkedIn profile URL.
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
