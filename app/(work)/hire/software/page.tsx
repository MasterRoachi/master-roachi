import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import EnquiryForm from '@/components/EnquiryForm';
import ContactWays from '../ContactWays';
import CarePlans, { type Plan } from '../CarePlans';
import PriceTiers, { type Tier } from '../PriceTiers';
import styles from '../hire.module.css';

// The Software tab of Work (his ask, 18 Nov 2026): freelance work beyond
// websites, such as phone apps, web apps, tools and automation. Built in the
// shape of the Websites tab (../page.tsx) and on its styles, in violet.
//
// The prices are outreach docs/PLAN.md §1.5, printed as
// docs/sales/software-price-sheet.html, from the research in
// docs/research/07-software-pricing.md; approved 18 Nov 2026 when he shipped
// this page (outreach QUESTIONS.md Q18). Change them in PLAN §1.5 first, then
// here and on the sheet. As on Websites, the founding offer is not shown, and
// a price is a starting price: the written scope and quote is the figure.

export const metadata: Metadata = pageMeta({
  path: '/hire/software/',
  title: 'Apps and software, built to the job',
  description:
    'Phone apps, web apps, business tools and automation, built in Pretoria: a written scope and a fixed quote first, and support afterwards.',
});

const PHONE_INTL = '27763894279';
const WHATSAPP = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent("Hi, I'd like an app or a tool built.")}`;

const FIXED = 'Fixed price, quoted in writing.';

const KINDS: Tier[] = [
  {
    name: 'Fixes and checks',
    for: 'Something on your site or app is broken or slow, or you want to know what state it is in.',
    once: { label: 'From', amount: '1,100', note: 'A 2-hour minimum, then R550 an hour.' },
    gets: ['A health check with a priced fix list, R3,500', 'By the day, R4,000', 'Or a second pair of hands, from R4,950 a month'],
  },
  {
    name: 'Automation',
    for: 'The jobs nobody should do by hand: syncing, reports, reminders, a spreadsheet that outgrew itself.',
    once: { label: 'From', amount: '6,500', note: FIXED },
    gets: ['Two systems connected, or one job automated', 'Runs on a schedule, and tells you when it fails', 'Most come to R6,500–R18,000'],
  },
  {
    name: 'A business tool',
    for: 'A web app your staff or clients sign in to: job cards, quotes, stock, bookings, a client portal.',
    once: { label: 'From', amount: '35,000', note: FIXED },
    gets: ['Logins and roles for your people', 'Your records, searchable, with exports', 'Works on a phone as well as a desk'],
  },
  {
    name: 'A phone app',
    for: 'Android and iPhone from one codebase, for your customers or your staff in the field.',
    once: { label: 'From', amount: '65,000', note: FIXED },
    gets: ['Sign-in, 4–8 screens and its own back end', 'Notifications', 'Published to both stores, in your name'],
  },
];

const STEPS = [
  {
    when: 'Free',
    title: 'A call about the job',
    what: 'What it has to do, who will use it and what it must connect to. Free, and you leave with a rough price range.',
  },
  {
    when: 'Free, or paid for apps and tools',
    title: 'A written scope and quote',
    what: 'The screens, the features, the price and the dates, in writing. For a business tool (R3,500) or an app (R5,500) this is a paid step, credited to the build if you go ahead within 60 days.',
  },
  {
    when: 'Every week or two',
    title: 'Built in pieces you can try',
    what: 'A working piece every week or two, so nothing is a surprise at the end. Paid in stages as the pieces land.',
  },
];

const SUPPORT: Plan[] = [
  { name: 'Watch', price: '390', time: '30 min', done: '2 days', what: 'For an automation: watched, and fixed when the other side changes.' },
  {
    name: 'Tool Care',
    price: '890',
    time: '90 min',
    done: 'Next day',
    what: 'For a business tool: hosting included, backups and updates.',
  },
  { name: 'App Care', price: '1,490', time: '2 hours', done: 'Next day', what: 'For a phone app: the yearly store updates, and crashes watched.' },
];

const OWN = [
  { title: 'Your code', what: 'In your own repository once it is paid.' },
  { title: 'Your accounts', what: 'App stores, hosting and domains in your name.' },
  { title: 'Your data', what: 'Exportable, always.' },
  { title: 'If you leave', what: 'Everything handed over, written down.' },
];

const FAQ = [
  {
    q: 'Why is an app so much more than a website?',
    a: 'An app has people signing in, data that has to stay right, and two app stores to satisfy. Most of the work is in the parts you never see. The written scope says exactly what you are paying for.',
  },
  {
    q: 'What does it cost to keep an app running?',
    a: 'App Care is R1,490 a month. On top of that, the stores and services are in your name and paid by you at cost: Apple about R1,800 a year, Google about R450 once, and the app’s database service from about R450 a month.',
  },
  {
    q: 'Do you work on code someone else wrote?',
    a: 'Yes, by the day. The first day is usually spent reading it, and you get a written note of what I found.',
  },
  {
    q: 'Do you charge VAT?',
    a: 'No. The business is under the VAT threshold, so quotes say “VAT not applicable”.',
  },
];

export default function SoftwarePage() {
  return (
    <div
      className={styles.page}
      // Violet, the Software tab's colour in the switcher.
      style={{ '--accent-a': 'oklch(76% 0.15 300)' } as React.CSSProperties}
    >
      <div className={`shell ${styles.body}`}>
        {/* The hero is the layout's (components/WorkHero.tsx): one shape and one
            height on all three tabs of Work. */}

        {/* ---- how it works: first, under the hero (18 Nov 2026) ---- */}
        <section className={styles.section} aria-labelledby="how">
          <p className="eyebrow">How it works</p>
          <h2 id="how" className="section-title">
            From problem to running
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


        <section className={styles.section} id="prices" aria-labelledby="kinds">
          <p className="eyebrow">What I build</p>
          <h2 id="kinds" className="section-title">
            Four kinds of job
          </h2>
          <p className={styles.sectionLede}>
            Prices are where each one starts. The written scope and quote gives the exact figure before any money
            moves.
          </p>
          <PriceTiers
            tiers={KINDS}
            cta="Ask about this"
            small={{
              once: 'Under R12,000: half to start, half on handover. Business tools and apps: 40% to start, 40% when you can use it, 20% at go-live. Larger apps are quoted after scoping. VAT not applicable.',
            }}
          />
        </section>

        <section className={styles.section} aria-labelledby="care">
          <p className="eyebrow">Looked after</p>
          <h2 id="care" className="section-title">
            Support, month to month
          </h2>
          <p className={styles.sectionLede}>
            Software needs looking after once it is live. Leave whenever you like on 30 days&rsquo; notice.
          </p>
          <CarePlans plans={SUPPORT} />
          <dl className={styles.own}>
            {OWN.map((o) => (
              <div key={o.title}>
                <dt>{o.title}</dt>
                <dd>{o.what}</dd>
              </div>
            ))}
          </dl>
        </section>

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

        <section className={styles.section} id="contact" aria-labelledby="contact-title">
          <p className="eyebrow">Get in touch</p>
          <h2 id="contact-title" className="section-title">
            Tell me the job
          </h2>
          <div className={styles.contact}>
            <ContactWays whatsappText="Hi, I'd like an app or a tool built." emailNote="Send a brief, a sketch or a link." />
            <EnquiryForm kind="software" />
          </div>
        </section>
      </div>

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
