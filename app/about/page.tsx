import type { Metadata } from 'next';
import Logo from '@/components/Logo';
import PageHeader from '@/components/PageHeader';
import CyclingQuote from '@/components/CyclingQuote';
import AboutFacets, { type Facet } from '@/components/AboutFacets';
import ToolIcons from '@/components/ToolIcons';
import SocialLinks from '@/components/SocialLinks';
import { quotes } from '@/lib/quotes';
import { getProjects, getWriting } from '@/lib/content';
import { getPerfectRuns } from '@/lib/perfect';
import { orthodoxReading } from '@/lib/pursuits';
import { getStore } from '@/lib/store';
import { site, navLinks } from '@/lib/site';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: site.description,
};

// The one page on the site with no subject of its own, so it is where the other
// five meet.
//
// Deliberately the only page without a moving backdrop. Work has its starfield,
// Fun its arcade field, Foundations its candles, Thoughts its glyphs and the
// Store its halftone — About earns its place by being the room that is not
// performing. The five doors below supply the motion by pointing at pages that
// have it.

const accentOf = (label: string) =>
  navLinks.find((l) => l.label === label)?.accent ?? 'oklch(97% 0 0)';

export default function AboutPage() {
  const perfect = getPerfectRuns();
  const runs = perfect.steam.length + perfect.retro.length;

  // Every number here comes off the page it points at, so a door cannot claim
  // work that is no longer there.
  const facets: Facet[] = [
    {
      title: 'Work',
      body: 'Games, worlds, and the code underneath them. The long road from beginner to craftsman, in public.',
      href: '/projects/',
      accent: accentOf('Work'),
      count: String(getProjects().length),
      unit: 'projects',
    },
    {
      title: 'Fun',
      body: 'Played attentively enough to be worth writing about. One game at a time, finished honestly.',
      href: '/gaming/',
      accent: accentOf('Fun'),
      count: String(runs),
      unit: 'finished 100%',
    },
    {
      title: 'Foundations',
      body: 'Orthodoxy taken as a real question rather than an aesthetic. The aim is not to make it trendy — it is to ask whether it is true.',
      href: '/orthodoxy/',
      accent: accentOf('Foundations'),
      count: String(orthodoxReading.length),
      unit: 'on the shelf',
    },
    {
      title: 'Thoughts',
      body: 'Walkthroughs, breakdowns and whatever else will not leave me alone at one in the morning.',
      href: '/writing/',
      accent: accentOf('Thoughts'),
      count: String(getWriting().length),
      unit: 'written',
    },
    {
      title: 'Store',
      body: 'Fabled Threads. Original line work from the Saturday-morning end of anime and cartoons, printed on things you can wear.',
      href: '/store/',
      accent: accentOf('Store'),
      count: String(getStore().products.length),
      unit: 'in the rail',
    },
  ];

  return (
    <div
      className={styles.page}
      /* Orange, the colour About answers in the nav. */
      style={{ '--accent-a': accentOf('About') } as React.CSSProperties}
    >
      <div className="shell">
        <PageHeader
          mark={<Logo size={30} />}
          eyebrow="About"
          title="Work Hard, Study Well, Eat and Sleep Plenty."
          lede={<CyclingQuote quotes={quotes} seed="about" />}
        />

        {/* The name first. It is the only thing here nobody could guess from
            the rest of the site. */}
        <section className={styles.name}>
          <div className={styles.portrait}>
            <Logo size={200} className={styles.mark} />
          </div>
          <div className={styles.nameCopy}>
            <p className="eyebrow">The name</p>
            <p className={styles.lead}>
              My grandpa was my best friend. He taught me Diablo&nbsp;2, DBZ,
              and PCs.
            </p>
            <p>
              Goku was raised by his grandpa too, and when that ended Master
              Roshi took over. So Roshi became the new grandpa. The other half
              of the name came from a habit I have since put down. It fit at
              the time, and it stuck.
            </p>
            <p>
              I&rsquo;m {site.personName}. I build games, worlds and software,
              I play games, but not when it comes to Truth, so I&rsquo;m
              Orthodox.
            </p>
          </div>
        </section>

        {/* The line he actually said when asked what he is building toward.
            It is better than any mission statement and it goes in big. */}
        <section className={styles.ethos}>
          <p className={styles.ethosText}>
            I&rsquo;m doing what I can to do what I can.
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className="eyebrow">Where everything is</p>
            <h2 className="section-title">Five doors</h2>
            <p className="lede">
              The tagline is not decoration — it is the site map. Work Hard is
              the Work page. Study Well is Foundations and Thoughts. Eat and
              Sleep Plenty is Fun. They are distinct, but they aren&rsquo;t
              separate.
            </p>
          </div>
          <AboutFacets facets={facets} />
        </section>

        <section className={styles.section}>
          <div className={styles.turn}>
            <div>
              <p className="eyebrow">What changed</p>
              <h2 className="section-title">My son was born</h2>
              <p className={styles.turnBody}>
                That is the hinge, and it is most of why this site looks the way
                it does. A page about the Church sitting next to a tier list and
                a shirt is not a contradiction I am trying to resolve. It is
                the actual shape of a life, and I would rather show it whole
                than pick the half that photographs better.
              </p>
            </div>
            <div>
              <p className="eyebrow">Why any of it</p>
              <h2 className="section-title">I never thought I would</h2>
              <p className={styles.turnBody}>
                Coding, late-night coffee, writing stories, tweaking mechanics
                until they feel right — I would be doing this with nobody
                watching. That is the honest test, and it is the only reason
                this is a website rather than a folder on a hard drive.
              </p>
              <p className={styles.turnBody}>
                Everything here is public. Nothing is hidden — the weaknesses,
                the learning, the unfinished projects included. Do the work,
                tell the truth, improve over time, and repeat.
              </p>
            </div>
          </div>
        </section>

        <div className={styles.rule} aria-hidden="true">
          <span />
          <img
            src="/kanji.webp"
            alt=""
            width={22}
            height={22}
            className={styles.ruleMark}
            decoding="async"
          />
          <span />
        </div>

        <section className={styles.section}>
          <div className={styles.split}>
            <div>
              <p className="eyebrow">Tools</p>
              <ToolIcons />
            </div>

            <div>
              <p className="eyebrow">Get in touch</p>
              <SocialLinks />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
