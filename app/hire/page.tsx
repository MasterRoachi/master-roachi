import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Starfield from '@/components/Starfield';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/components/ProjectCard';
import EnquiryForm from '@/components/EnquiryForm';
import { getClientProjects, toProjectSummary } from '@/lib/content';
import cards from '@/components/Card.module.css';
import styles from './hire.module.css';

// The design business, for the people his outreach reaches (2026-11-10).
// Outreach goes out as Master Roachi, so this lives on his own site.
//
// The words follow the leave-behind and price sheet he approved on 7 November,
// in the outreach repository. No prices here until he says so: every job gets
// a written quote. The client work below is the same set as /projects' "For
// others" section, so a client page is written once.

export const metadata: Metadata = pageMeta({
  path: '/hire/',
  title: 'Websites for local businesses',
  description:
    'Websites for small businesses in Pretoria: quick on a phone, easy to find on Google, and looked after by a person you can reach.',
});

const KINDS = [
  {
    name: 'One page',
    what: 'Everything a customer needs on one page: what you do, your hours, a map, a WhatsApp button and an enquiry form. Your Google profile tidied up as well.',
  },
  {
    name: 'A business site',
    what: 'Four to six pages, with room for a menu or a price list and an enquiry form. Your Google profile set up properly.',
  },
  {
    name: 'Bookings',
    what: 'A business site where customers can ask for a booking or pick a time slot, with a deposit paid by card, and a page where you manage it all.',
  },
  {
    name: 'A shop',
    what: 'Your products online with card checkout, courier rates and a page for your orders. I load the products for you.',
  },
];

const PROMISES = [
  {
    title: 'You see it first',
    what: 'Before you pay anything, I make a free sample of your page so you can see what you would be getting.',
  },
  {
    title: 'A written quote',
    what: 'The quote sets out the exact work and the terms before any money changes hands. Two rounds of changes are included.',
  },
  {
    title: 'It is yours',
    what: 'The domain is always in your name, the words and photos are yours, and so is the site once it is paid off. If you ever leave, you get a full copy.',
  },
  {
    title: 'Looked after',
    what: 'A care plan covers hosting, security updates, backups and your changes each month, done by me. It runs month to month, and you can leave it off.',
  },
];

export default function HirePage() {
  // Sites only: the client apps (The Prospector, Obedience) are not what this
  // page sells, so they stay on /projects and off here (his word, 2026-11-10).
  const work = getClientProjects()
    .filter((e) => e.frontmatter.kind !== 'App')
    .map(toProjectSummary);

  return (
    <div
      className={styles.page}
      // Teal, the colour Hire me answers in the nav.
      style={{ '--accent-a': 'oklch(80% 0.12 190)' } as React.CSSProperties}
    >
      <Starfield density={0.25} />

      <div className={`shell ${styles.body}`}>
        <PageHeader
          eyebrow="Hire me"
          title="Websites for local businesses"
          lede={
            <>
              I build websites for small businesses in and around Pretoria. They load quickly on a
              phone, they are easy to find on Google, and when something needs changing you deal
              with me.
            </>
          }
        />

        <section className={styles.section} aria-labelledby="kinds">
          <h2 id="kinds" className="section-title">
            What I build
          </h2>
          <div className={styles.kinds}>
            {KINDS.map((k) => (
              <div key={k.name} className={styles.kind}>
                <h3>{k.name}</h3>
                <p>{k.what}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="how">
          <h2 id="how" className="section-title">
            How it works
          </h2>
          <ol className={styles.promises}>
            {PROMISES.map((p) => (
              <li key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.what}</p>
              </li>
            ))}
          </ol>
        </section>

        {work.length > 0 && (
          <section className={styles.section} aria-labelledby="work">
            <h2 id="work" className="section-title">
              Work for clients
            </h2>
            <div className={cards.grid}>
              {work.map((entry) => (
                <ProjectCard key={entry.slug} entry={entry} />
              ))}
            </div>
          </section>
        )}

        <section className={styles.section} id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title" className="section-title">
            Get in touch
          </h2>
          <p className={styles.contactLede}>
            Tell me about your business and what you need. I&apos;m based in Garsfontein,
            Pretoria.
          </p>
          <EnquiryForm />
        </section>
      </div>
    </div>
  );
}
