import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import Starfield from '@/components/Starfield';
import EnquiryForm from '@/components/EnquiryForm';
import { getClientProjects } from '@/lib/content';
import styles from './hire.module.css';

// The design business, for the people his outreach reaches (2026-11-10).
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

const PHONE = '076 389 4279';
const PHONE_INTL = '27763894279';
const EMAIL = 'roachi@masterroachi.com';
const WHATSAPP = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent("Hi, I'd like a website for my business.")}`;

const TIERS = [
  {
    name: 'One page',
    for: 'For a business that needs to be findable and reachable.',
    from: 'R3,950',
    monthly: 'or R499/month, nothing upfront',
    gets: ['What you do, your hours and a map', 'A WhatsApp button and an enquiry form', 'Your Google profile tidied up'],
  },
  {
    name: 'A business site',
    for: 'Most businesses: room for a menu or a price list.',
    from: 'R8,950',
    monthly: 'or R799/month, nothing upfront',
    gets: ['Four to six pages', 'A menu or price list, and an enquiry form', 'Your Google profile set up properly'],
    pick: true,
  },
  {
    name: 'Bookings',
    for: 'Salons, guest houses, practices: people book a time.',
    from: 'R14,500',
    monthly: 'or R1,299/month, nothing upfront',
    gets: ['A business site, plus booking requests or slots', 'A deposit paid by card', 'A page where you manage it all'],
  },
  {
    name: 'A shop',
    for: 'Sell your products online, with courier rates.',
    from: 'R19,500',
    monthly: 'or from R1,999/month, nothing upfront',
    gets: ['Up to 50 products, loaded for you', 'Card checkout and courier rates', 'A page for your orders'],
  },
];

const STEPS = [
  {
    title: 'A free sample',
    what: 'Tell me about your business and I make a sample of your page, free. You see what you would get before you pay anything.',
  },
  {
    title: 'A written quote',
    what: 'The exact work, the price and the terms, in writing. Half up front, half before it goes live.',
  },
  {
    title: 'Built, with two rounds of changes',
    what: 'Usually about two weeks once I have your words and photos. Two rounds of changes are included.',
  },
];

const CARE = [
  { name: 'Care', price: 'R290/month', what: '30 minutes of changes a month, done within two working days.' },
  {
    name: 'Care Plus',
    price: 'R490/month',
    what: 'Ninety minutes a month, done the next working day, plus your Google profile kept up and a monthly report.',
  },
  {
    name: 'Care Shop',
    price: 'R890/month',
    what: 'Three hours a month, done the next working day, plus a monthly test order and payment checks.',
  },
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

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z" />
    </svg>
  );
}

export default function HirePage() {
  // Sites only: the client apps (The Prospector, Obedience) are not what this
  // page sells, so they stay on /projects and off here (his word, 2026-11-10).
  // Named as businesses only, never people (the client-page rule).
  const work = getClientProjects().filter((e) => e.frontmatter.kind !== 'App');

  return (
    <div
      className={styles.page}
      // Teal, the colour Hire me answers in the nav.
      style={{ '--accent-a': 'oklch(80% 0.12 190)' } as React.CSSProperties}
    >
      <Starfield density={0.25} />
      <div className={`shell ${styles.body}`}>
        {/* ---- the hero: the promise, and the way in, above the fold ---- */}
        <header className={styles.hero}>
          <div>
            <p className="eyebrow">Hire me</p>
            <h1 className={styles.title}>
              A website for your business, <em>and a person who answers.</em>
            </h1>
            <p className={styles.lede}>
              I build websites for small businesses in and around Pretoria. Quick on a phone, with your hours,
              map and WhatsApp a tap away. When something needs changing, you message me, not a call centre.
            </p>
            <div className={styles.buttons}>
              <a className={`${styles.btn} ${styles.primary}`} href={WHATSAPP} rel="noopener">
                <WhatsAppIcon />
                WhatsApp me
              </a>
              <a className={styles.btn} href="#prices">
                See prices
              </a>
            </div>
            <p className={styles.reply}>
              <b>I reply within one working day</b>, usually the same day. Garsfontein, Pretoria.
            </p>
          </div>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <b>Free sample</b>
              <span>See your page before you pay anything</span>
            </div>
            <div className={styles.fact}>
              <b>Yours</b>
              <span>The domain in your name; a full copy if you ever leave</span>
            </div>
            <div className={styles.fact}>
              <b>From R3,950</b>
              <span>or from R499 a month, nothing upfront</span>
            </div>
            <div className={styles.fact}>
              <b>Month to month</b>
              <span>Care plans with no lock-in</span>
            </div>
          </div>
        </header>

        {/* ---- what I build, priced ---- */}
        <section className={styles.section} id="prices" aria-labelledby="kinds">
          <p className="eyebrow">What I build</p>
          <h2 id="kinds" className="section-title">
            Four kinds of site
          </h2>
          <p className={styles.sectionLede}>
            Prices are where each one starts. Your written quote gives the exact figure before any money moves.
          </p>
          {/* Every card shares the same rows (subgrid), so the names, the
              prices, the lists and the buttons line up across all four. */}
          <ul className={styles.tiers}>
            {TIERS.map((t) => (
              <li key={t.name} className={`${styles.tier} ${t.pick ? styles.pick : ''}`}>
                <h3>{t.name}</h3>
                <p className={styles.for}>{t.for}</p>
                <p className={styles.price}>
                  <span className={styles.from}>From</span>
                  <span className={styles.amount}>{t.from}</span>
                  <span className={styles.monthly}>{t.monthly}</span>
                </p>
                <ul className={styles.gets}>
                  {t.gets.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                <a className={`${styles.btn} ${t.pick ? styles.primary : ''}`} href="#contact">
                  Start with this
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.small}>
            The monthly plans run for 12 months at least; after 24 the site is yours and the fee drops to the
            care plan. VAT not applicable. Add-ons, such as extra pages, copywriting or an Afrikaans version, are
            on the quote.
          </p>
        </section>

        {/* ---- how it works ---- */}
        <section className={styles.section} aria-labelledby="how">
          <p className="eyebrow">How it works</p>
          <h2 id="how" className="section-title">
            From hello to live
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.what}</p>
              </li>
            ))}
          </ol>
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
          <ul className={styles.care}>
            {CARE.map((c) => (
              <li key={c.name}>
                <h3>
                  {c.name} <span>{c.price}</span>
                </h3>
                <p>{c.what}</p>
              </li>
            ))}
          </ul>
          <dl className={styles.own}>
            {OWN.map((o) => (
              <div key={o.title}>
                <dt>{o.title}</dt>
                <dd>{o.what}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- who you deal with ---- */}
        <section className={styles.section} aria-labelledby="who">
          <p className="eyebrow">Who you deal with</p>
          <h2 id="who" className="section-title">
            Me, Master Roachi
          </h2>
          <p className={styles.sectionLede}>
            <b>I build every site myself and answer every message myself.</b> I built this site, its shop and the
            tools behind it. I&rsquo;m in Garsfontein, so if you&rsquo;re in Pretoria East we can meet.
          </p>
          {work.length > 0 && (
            <ul className={styles.clients}>
              {work.map((e) => (
                <li key={e.slug}>
                  <Link href={`/projects/${e.slug}/`} className={styles.client}>
                    <span className={styles.state}>
                      {e.frontmatter.status === 'released' ? 'Live' : 'In progress'}
                    </span>
                    <h3>{e.frontmatter.title}</h3>
                    <p>{e.frontmatter.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
            <div className={styles.ways}>
              <a className={`${styles.way} ${styles.primaryWay}`} href={WHATSAPP} rel="noopener">
                <b>WhatsApp {PHONE}</b>
                <span>Opens with &ldquo;Hi, I&rsquo;d like a website for my business.&rdquo; ready to send.</span>
              </a>
              <a className={styles.way} href={`tel:+${PHONE_INTL}`}>
                <b>Call {PHONE}</b>
                <span>Weekdays, 8 to 5.</span>
              </a>
              <a className={styles.way} href={`mailto:${EMAIL}`}>
                <b>{EMAIL}</b>
                <span>Always works, even if the form doesn&rsquo;t.</span>
              </a>
              <p className={styles.reply}>
                <b>I reply within one working day</b>, usually the same day.
              </p>
            </div>
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
