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

  /**
   * Who a customer is actually dealing with.
   *
   * South Africa's ECT Act requires an online seller to say this on the site —
   * legal name, status, physical address, contact details — and PayFast asked
   * for it during merchant verification, which is what these pages exist for.
   * Not decoration: a missing address here is a compliance gap, not a styling
   * choice.
   */
  legal: {
    proprietor: 'Stephan Engelbrecht',
    /** Not a registered company. */
    status: 'Sole proprietor',
    address: [
      '858 Delfi Avenue',
      'Garsfontein',
      'Pretoria',
      '0042',
      'South Africa',
    ] as string[],
    /** Who takes the money. Checkout never happens on this site. */
    paymentProcessor: 'PayFast',
    /** Who prints and ships. */
    fulfilment: 'Printful',
    /** Days from delivery to report a fault and still be covered. */
    faultWindowDays: 14,
    /**
     * The cooling-off window honoured for South African customers.
     *
     * The ECT Act gives a right to cancel certain electronic transactions
     * within seven days of delivery. Whether print-on-demand of a stock design
     * counts as "made to the consumer's specifications" — which the Act
     * excludes — is genuinely arguable, so the right is offered rather than
     * argued about.
     */
    coolingOffDays: 7,
    /** Bumped when the terms change, so a customer can see which they agreed to. */
    updated: '2026-09-08',
  },

  store: {
    name: 'Fabled Threads',
    /**
     * A payment link per price, per product: `{ printfulId: { rands: url } }`.
     *
     * There is no storefront platform. Etsy's verification never went
     * through, and every alternative charges a monthly fee for automated
     * fulfilment that one product does not yet justify — worse in South
     * Africa, where Shopify Payments does not operate and a gateway plus
     * Shopify's own surcharge reaches about 5% a transaction.
     *
     * So: a PayFast link takes the money, and the Printful order is raised by
     * hand. A product with no link here shows no Buy button rather than a dead
     * one, which is why the map is allowed to be empty.
     *
     * Keyed by the amount rather than by size, for two reasons. A PayFast link
     * is a fixed sum, so one link serves every size sharing that price — five
     * links cover XS to 5XL rather than nine. And if the rate in
     * lib/pricing.json moves, the new prices stop matching these keys and the
     * Buy buttons disappear, instead of quietly charging yesterday's amount for
     * today's price. Losing the button is the safe failure; charging the wrong
     * number is not.
     *
     * The key is the rand figure as it appears on the page, with no decimals:
     * '500', not 'R500' or '500.00'. Printful ids are in data/store.json.
     *
     *   '464722916': {
     *     '500': 'https://payf.st/xxxxx',
     *     '550': 'https://payf.st/yyyyy',
     *   },
     */
    paymentLinks: {} as Record<string, Record<string, string>>,

    /**
     * What the design is, in Stephan's words, per product.
     *
     * Keyed by Printful id like the payment links, and for the same reason:
     * the id survives a rename and the slug does not. One string per
     * paragraph. A product with nothing here shows no section rather than a
     * heading over an empty space.
     *
     * Everything else on a product page is a number from Printful. This is
     * the only part that is his, so it goes above the spec rather than under
     * it.
     */
    blurbs: {
      // Roachi Shirt.
      '464722916': [
        'That’s my face.',
        'It went first because it’s the one I finished first — there was no plan. Wear it if you think it looks cool, which is the entire qualification.',
        'And if you really love me, you’d wear this.',
        'Chest print only; the back is a plain shirt.',
      ],
    } as Record<string, string[]>,

    /**
     * The order categories appear in. A product with no category of its own
     * falls into the first.
     */
    categories: ['Tees', 'Hoodies', 'Prints'] as string[],

    /**
     * Designs that exist as a plan rather than a product.
     *
     * These used to be rendered as full product cards with invented prices and
     * option counts, marked "Placeholder". Ten of them made up roughly three
     * quarters of the page on a phone — each one a tall empty box of nearly
     * invisible diagonal stripes — so a store with one real shirt read as a
     * store where ten things had failed to load.
     *
     * Now they are a list, which is what they are. No price, because there is
     * no price: quoting one for a design that does not exist is the sort of
     * small lie the rest of this site is written to avoid.
     *
     * Empty is a supported state — the section simply does not appear.
     */
    planned: [
      { name: 'Turtle Hermit', category: 'Tees' },
      { name: 'Saturday Morning', category: 'Tees' },
      { name: 'Kame House Crest', category: 'Tees' },
      { name: 'Late Night Rerun', category: 'Tees' },
      { name: 'Study Well', category: 'Hoodies' },
      { name: 'Coal Black Heavyweight', category: 'Hoodies' },
      { name: 'Rest Plenty', category: 'Hoodies' },
      { name: 'Terrath, Mapped', category: 'Prints' },
      { name: 'The Twelve', category: 'Prints' },
      { name: 'Shepherds Key Art', category: 'Prints' },
    ] as { name: string; category: string }[],
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
