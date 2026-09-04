import type { Metadata } from 'next';
import Logo from '@/components/Logo';
import Starfield from '@/components/Starfield';
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

/** Orange, the colour About answers in the nav. */
const ACCENT = accentOf('About');

export default function AboutPage() {
  const perfect = getPerfectRuns();
  const runs = perfect.steam.length + perfect.retro.length;

  // Every number here comes off the page it points at, so a door cannot claim
  // work that is no longer there.
  //
  // Bodies are one short line each and units are a word or two. Longer ones
  // broke the row: "finished 100%" wrapped and shoved the Fun card a line below
  // the rest, while Foundations ran to five lines against Store at three.
  const plural = (n: number, one: string, many: string) =>
    n === 1 ? one : many;

  const projects = getProjects().length;
  const written = getWriting().length;
  const books = orthodoxReading.length;
  const rail = getStore().products.length;

  const facets: Facet[] = [
    {
      title: 'Work',
      body: 'Games, worlds, and the code underneath them.',
      href: '/projects/',
      accent: accentOf('Work'),
      count: String(projects),
      unit: plural(projects, 'project', 'projects'),
    },
    {
      title: 'Fun',
      body: 'One at a time, finished properly.',
      href: '/gaming/',
      accent: accentOf('Fun'),
      count: String(runs),
      unit: 'at 100%',
    },
    {
      title: 'Foundations',
      body: 'Orthodoxy as a question, not an aesthetic.',
      href: '/orthodoxy/',
      accent: accentOf('Foundations'),
      count: String(books),
      unit: plural(books, 'book', 'books'),
    },
    {
      title: 'Thoughts',
      body: 'Walkthroughs, breakdowns, the occasional rant.',
      href: '/writing/',
      accent: accentOf('Thoughts'),
      count: String(written),
      unit: plural(written, 'post', 'posts'),
    },
    {
      title: 'Store',
      body: 'Fabled Threads. Line work you can wear.',
      href: '/store/',
      accent: accentOf('Store'),
      count: String(rail),
      unit: plural(rail, 'design', 'designs'),
    },
  ];

  return (
    <div
      className={styles.page}
      style={{ '--accent-a': ACCENT } as React.CSSProperties}
    >
      {/* Turned right down: a quarter of the usual star count, and the wash
          two soft pools rather than a flat colour — `tint` is a whole
          background value, not a colour, and handing it one paints the page.
          About should still read as the still room, but unbroken black behind
          it was starker than the rest of the site. */}
      <Starfield
        density={0.25}
        tint={`radial-gradient(110% 80% at 72% 22%, color-mix(in oklch, ${ACCENT} 11%, transparent), transparent 66%), radial-gradient(90% 70% at 14% 88%, color-mix(in oklch, ${ACCENT} 7%, transparent), transparent 60%)`}
      />

      <div className={`shell ${styles.body}`}>
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
            <p className="eyebrow">Master Roachi</p>
            <p className={styles.lead}>
              My grandpa was my best friend. He taught me Diablo&nbsp;2, DBZ
              and PCs.
            </p>
            <p>
              Goku was raised by his grandpa. When that ended, Master Roshi
              took over — so Roshi became the new grandpa. The other half of
              the name came from a habit I have since dropped.
            </p>
            <p>
              I&rsquo;m {site.personName}. I build games, worlds and software,
              and I&rsquo;m Orthodox.
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

        {/* No heading over these. The cards say what they are, and the
            tagline above already said where everything is. */}
        <section className={styles.section}>
          <AboutFacets facets={facets} />
        </section>

        <div className={`divider ${styles.rule}`} aria-hidden="true">
          <span />
          <img
            src="/kanji.webp"
            alt=""
            width={22}
            height={22}
            className="divider-mark"
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
