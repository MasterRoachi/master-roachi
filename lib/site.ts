// Single source of truth for anything appearing in more than one place.
//
// The `as string | null` annotations are deliberate: the UI hides a link
// rather than rendering a dead one when a value is null, and the wider type
// means a value can be pulled back out without a type error.

export const site = {
  name: 'Master Roachi',
  personName: 'Stephan Engelbrecht',
  url: 'https://masterroachi.com',

  // The identity line, carried over from the original site.
  tagline: 'Work Hard, Study Well, Eat and Sleep Plenty.',
  taglineTail: 'That is the Turtle Hermit Way.',

  description:
    'Games, worlds, code and Orthodoxy. A public record of what I am building.',

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
  { href: '/projects/', label: 'Projects' },
  { href: '/gaming/', label: 'Gaming' },
  { href: '/orthodoxy/', label: 'Orthodoxy' },
  { href: '/writing/', label: 'Writing' },
  { href: '/about/', label: 'About' },
];
