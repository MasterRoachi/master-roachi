import type { Metadata } from 'next';
import Link from 'next/link';
import Sigil from '@/components/Sigil';
import PageHeader from '@/components/PageHeader';
import { site } from '@/lib/site';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: site.description,
};

// SPEC.md, "Content Decisions → About": casual first-person, plain and
// factual, not flowery. Scope is software and writing only. The employer is
// deliberately never named here — it stays discoverable via LinkedIn instead.
export default function AboutPage() {
  return (
    <div className="shell" style={{ paddingBottom: '80px' }}>
      <PageHeader eyebrow="About" title="Who I Am" />

      <div className={styles.layout}>
        <div className={styles.mark} aria-hidden="true">
          <Sigil size={170} color="var(--gold)" strokeWidth={0.7} opacity={0.35} />
        </div>

        <div className={styles.copy}>
          <p className={styles.bio}>
            My name is {site.personName}. I go by Master Roachi. I&rsquo;m a
            software engineer, and outside of that I write — mostly about code,
            sometimes about theology.
          </p>

          <section className={styles.section}>
            <h2 className={styles.heading}>What I work with</h2>
            <ul className={styles.tools}>
              <li>TypeScript &amp; JavaScript</li>
              <li>Vue</li>
              <li>React &amp; Next.js</li>
              <li>HTML &amp; CSS</li>
              <li>Godot &amp; GDScript</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Elsewhere</h2>
            <p className={styles.para}>
              The <Link href="/work/">work</Link> page has what I&rsquo;ve
              built. <Link href="/thoughts/">Thoughts</Link> is where the
              writing goes. If you want to reach me, the{' '}
              <Link href="/contact/">contact</Link> page has the details.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
