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

  store: {
    name: 'Fabled Threads',
    // The hosted storefront that actually takes the money. Until this is set,
    // the store page shows the catalogue without Buy buttons rather than
    // linking nowhere.
    storefrontUrl: null as string | null,
    // How the storefront addresses one product, with {id} standing in for the
    // external id Printful records. Big Cartel uses '/product/{id}', Shopify
    // '/products/{id}'. Left null until a real product URL has been seen —
    // guessing produces confident links to nothing.
    productUrlPattern: null as string | null,
  },

  socials: {
    github: 'https://github.com/MasterRoachi',
    linkedin:
      'https://www.linkedin.com/in/stephanusmengelbrecht/' as string | null,
    facebook:
      'https://www.facebook.com/profile.php?id=61584527721768' as string | null,
    instagram: 'https://www.instagram.com/sidphanus/' as string | null,
    // Not set up yet. Rendered as a dimmed, non-interactive mark rather than
    // hidden — the site's whole line is that unfinished things are shown.
    youtube: null as string | null,
  },

  /**
   * Which YouTube playlist feeds each section pulls from.
   *
   * A playlist per track rather than the channel feed, so which videos belong
   * to Fun and which to Foundations is a decision made once on YouTube rather
   * than guessed here on every build. The id is the string after `list=` in a
   * playlist URL, and starts with PL.
   *
   * Nothing is fetched while these are null, and the video sections stay
   * hidden. scripts/youtube.mjs reads this file directly, so the shape below
   * matters: `key: 'value'` pairs inside a `playlists: { }` block.
   */
  youtube: {
    playlists: {
      // gaming: 'PL...',
      // orthodoxy: 'PL...',
    },
  },
} as const;

// Nav labels are deliberately not the route names. The routes stay as they
// are — changing them would break every published link — while the labels say
// what each section is for.
export const navLinks = [
  { href: '/projects/', label: 'Work' },
  { href: '/gaming/', label: 'Fun' },
  { href: '/orthodoxy/', label: 'Foundations' },
  { href: '/store/', label: 'Store' },
  { href: '/writing/', label: 'Thoughts' },
  { href: '/about/', label: 'About' },
];
