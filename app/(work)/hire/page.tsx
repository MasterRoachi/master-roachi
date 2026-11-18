import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import EnquiryForm from '@/components/EnquiryForm';
import ContactWays from './ContactWays';
import CarePlans, { type Plan } from './CarePlans';
import PriceTiers, { type Tier } from './PriceTiers';
import styles from './hire.module.css';

// The design business, for the people his outreach reaches (2026-11-10).
// Since 18 Nov 2026 the Websites tab of Work (app/(work)/layout.tsx); the
// address stays /hire/ because the printed price sheet and leave-behind carry it.
// Outreach goes out as Master Roachi, so this lives on his own site.
//
// Reworked 12 Nov 2026 from the public-site audit (finding 03) and a research
// run on what makes a strong services page; the mockup was approved that day
// (https://claude.ai/artifact/KcQGVpMrL2qvBweSZpKrh8). His rulings: prices
// shown; the founding offer NOT shown; the client sites stay as "in progress".
//
// The prices are the price sheet he approved on 5 Nov (outreach docs/PLAN.md
// §1.1, Q3). Change them there first, then here. A price on this page is a
// starting price: the written quote is the figure.
//
// Never promise a ranking. Google's own wording is that nobody can guarantee
// one; the page says what he does (a site Google can read, the Business
// Profile set up) and that the ranking is Google's.

export const metadata: Metadata = pageMeta({
  path: '/hire/',
  title: 'Websites for local businesses',
  description:
    'Websites for small businesses in Pretoria, from R3,950: quick on a phone, your Google profile set up, and a person who answers WhatsApp.',
});

const PHONE_INTL = '27763894279';
const WHATSAPP = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent("Hi, I'd like a website for my business.")}`;

// Once-off and monthly, as PLAN §1.1 and research 03 §8.3 have them: a
// monthly plan is the care plan plus the build over about 18 months, so care
// is included, and at month 24 the site is theirs and the fee drops to the
// care plan named here.
const HALF = 'Half to start, half before it goes live.';
const THIRDS = '40% to start, 40% partway, 20% before it goes live.';

const TIERS: Tier[] = [
  {
    name: 'One page',
    for: 'For a business that needs to be findable and reachable.',
    once: { label: 'From', amount: '3,950', note: HALF },
    monthly: { label: 'A month', amount: '499', unit: '/month', note: 'Care included. Yours after 24 months, then R290 a month.' },
    gets: ['What you do, your hours and a map', 'A WhatsApp button and an enquiry form', 'Your Google profile tidied up'],
  },
  {
    name: 'A business site',
    for: 'Most businesses: room for a menu or a price list.',
    once: { label: 'From', amount: '8,950', note: HALF },
    monthly: { label: 'A month', amount: '799', unit: '/month', note: 'Care included. Yours after 24 months, then R290 a month.' },
    gets: ['Four to six pages', 'A menu or price list, and an enquiry form', 'Your Google profile set up properly'],
    pick: true,
  },
  {
    name: 'Bookings',
    for: 'Salons, guest houses, practices: people book a time.',
    once: { label: 'From', amount: '14,500', note: THIRDS },
    monthly: { label: 'A month', amount: '1,299', unit: '/month', note: 'Care Plus included. Yours after 24 months, then R490 a month.' },
    gets: ['A business site, plus booking requests or slots', 'A deposit paid by card', 'A page where you manage it all'],
  },
  {
    name: 'A shop',
    for: 'Sell your products online, with courier rates.',
    once: { label: 'From', amount: '19,500', note: THIRDS },
    monthly: { label: 'From, a month', amount: '1,999', unit: '/month', note: 'Care Shop included. Yours after 24 months, then R890 a month.' },
    gets: ['Up to 50 products, loaded for you', 'Card checkout and courier rates', 'A page for your orders'],
  },
];

const STEPS = [
  {
    when: 'Free',
    title: 'A free sample',
    what: 'Tell me about your business and I make a sample of your page, free. You see what you would get before you pay anything.',
  },
  {
    when: 'Before any money moves',
    title: 'A written quote',
    what: 'The exact work, the price and the terms, in writing. Half up front, half before it goes live.',
  },
  {
    when: 'About two weeks',
    title: 'Built, with two rounds of changes',
    what: 'Usually about two weeks once I have your words and photos. Two rounds of changes are included.',
  },
];

const CARE: Plan[] = [
  { name: 'Care', price: '290', time: '30 min', done: '2 days', what: 'Hosting, updates and backups, and small changes.' },
  {
    name: 'Care Plus',
    price: '490',
    time: '90 min',
    done: 'Next day',
    what: 'Adds your Google profile kept up, and a report each month.',
    pick: true,
  },
  { name: 'Care Shop', price: '890', time: '3 hours', done: 'Next day', what: 'For a shop: adds a test order and payment checks each month.' },
];

const OWN = [
  { title: 'Your domain', what: 'Always in your name.' },
  { title: 'Your words and photos', what: 'Yours, always.' },
  { title: 'Your site', what: 'Yours once it is paid off.' },
  { title: 'If you leave', what: 'You get a full copy.' },
];

const FAQ = [
  {
    q: 'Will I be on Google?',
    a: 'I build the site so Google can read it properly, and I set up your Google Business Profile, so people searching nearby find your hours, map and number. Where you rank is Google’s decision, and nobody can honestly promise a position.',
  },
  {
    q: 'Monthly plan or pay upfront?',
    a: 'Paying upfront costs less over time. The monthly plan means nothing to pay now; it runs for at least 12 months, and after 24 the site is yours and you only pay for care.',
  },
  {
    q: 'What do you need from me?',
    a: 'Your words (or I can write them), your photos, your logo if you have one, and someone to say yes or no to the sample.',
  },
  {
    q: 'What if I want to leave?',
    a: 'Care is month to month on 30 days’ notice. Your domain is in your name, and you get a full copy of the site.',
  },
  {
    q: 'Do you charge VAT?',
    a: 'No. The business is under the VAT threshold, so quotes say “VAT not applicable”.',
  },
];

export default function HirePage() {
  return (
    <div
      className={styles.page}
      // Teal, the colour Hire me answers in the nav.
      style={{ '--accent-a': 'oklch(80% 0.12 190)' } as React.CSSProperties}
    >
      {/* The starfield is the layout's: app/(work)/layout.tsx. */}
      <div className={`shell ${styles.body}`}>
        {/* The hero is the layout's (components/WorkHero.tsx): one shape and one
            height on all three tabs of Work. */}

        {/* ---- how it works: first, under the hero (18 Nov 2026) ---- */}
        <section className={styles.section} aria-labelledby="how">
          <p className="eyebrow">How it works</p>
          <h2 id="how" className="section-title">
            From hello to live
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} data-n={i + 1}>
                <span className={styles.node} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={styles.when}>{s.when}</span>
                <h3>{s.title}</h3>
                <p>{s.what}</p>
              </li>
            ))}
          </ol>
        </section>


        {/* ---- what I build, priced ---- */}
        <section className={styles.section} id="prices" aria-labelledby="kinds">
          <p className="eyebrow">What I build</p>
          <h2 id="kinds" className="section-title">
            Four kinds of site
          </h2>
          <p className={styles.sectionLede}>
            Prices are where each one starts. Your written quote gives the exact figure before any money moves.
          </p>
          <PriceTiers
            tiers={TIERS}
            cta="Start with this"
            small={{
              once: 'A care plan is offered with every build, from R290 a month, and you can leave it off. VAT not applicable. Add-ons, such as extra pages, copywriting or an Afrikaans version, are on the quote.',
              monthly: 'Monthly plans run for 12 months at least. After 24 the site is yours outright and the fee drops to its care plan. VAT not applicable. Add-ons are on the quote.',
            }}
          />
        </section>

        {/* ---- care, and what is theirs ---- */}
        <section className={styles.section} aria-labelledby="care">
          <p className="eyebrow">Looked after</p>
          <h2 id="care" className="section-title">
            Care plans, month to month
          </h2>
          <p className={styles.sectionLede}>
            Hosting, security updates, backups and your changes each month, done by me. Leave whenever you like on
            30 days&rsquo; notice.
          </p>
          <CarePlans plans={CARE} />
          <dl className={styles.own}>
            {OWN.map((o) => (
              <div key={o.title}>
                <dt>{o.title}</dt>
                <dd>{o.what}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- questions ---- */}
        <section className={styles.section} aria-labelledby="faq">
          <p className="eyebrow">Questions</p>
          <h2 id="faq" className="section-title">
            What people ask
          </h2>
          <div className={styles.faq}>
            {FAQ.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---- the way in: WhatsApp first, then a call, email, the form ---- */}
        <section className={styles.section} id="contact" aria-labelledby="contact-title">
          <p className="eyebrow">Get in touch</p>
          <h2 id="contact-title" className="section-title">
            Ask for your free sample
          </h2>
          <div className={styles.contact}>
            <ContactWays whatsappText="Hi, I'd like a website for my business." emailNote="Always works, even if the form doesn’t." />
            <EnquiryForm />
          </div>
        </section>
      </div>

      {/* On a phone, the way in stays at hand at the bottom of the screen. */}
      <nav className={styles.sticky} aria-label="Contact">
        <a className={`${styles.btn} ${styles.primary}`} href={WHATSAPP} rel="noopener">
          WhatsApp
        </a>
        <a className={styles.btn} href={`tel:+${PHONE_INTL}`}>
          Call
        </a>
        <a className={styles.btn} href="#prices">
          Prices
        </a>
      </nav>
    </div>
  );
}
