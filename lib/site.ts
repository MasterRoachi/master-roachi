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
    /**
     * A payment link per product, keyed by its Printful id.
     *
     * There is no storefront platform. Etsy's verification never went
     * through, and every alternative charges a monthly fee for automated
     * fulfilment that one product does not yet justify — worse in South
     * Africa, where Shopify Payments does not operate and a gateway plus
     * Shopify's own surcharge reaches about 5% a transaction.
     *
     * So: a Yoco or PayFast link takes the money, and the Printful order is
     * raised by hand. A product with no link here shows no Buy button rather
     * than a dead one, which is why the map is allowed to be empty.
     *
     * Printful ids are in data/store.json.
     */
    paymentLinks: {} as Record<string, string>,
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
/**
 * The nav, each link carrying the colour its own section uses.
 *
 * Not decoration: Fun, Store and Work already answer in these colours on their
 * own pages and cards, so hovering the nav previews where you are about to go.
 * Thoughts and About had no colour of their own before this and take one here.
 */
export const navLinks = [
  { href: '/projects/', label: 'Work', accent: 'oklch(97% 0 0)' },
  { href: '/gaming/', label: 'Fun', accent: 'oklch(86% 0.20 135)' },
  { href: '/orthodoxy/', label: 'Foundations', accent: 'oklch(84% 0.16 92)' },
  { href: '/store/', label: 'Store', accent: 'oklch(72% 0.26 350)' },
  { href: '/writing/', label: 'Thoughts', accent: 'oklch(74% 0.15 250)' },
  { href: '/about/', label: 'About', accent: 'oklch(76% 0.17 55)' },
];
