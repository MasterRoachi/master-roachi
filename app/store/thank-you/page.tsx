import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import HalftoneField from '@/components/HalftoneField';
import PageHeader from '@/components/PageHeader';
import OrderDetails from '@/components/OrderDetails';
import { site } from '@/lib/site';
import styles from './thanks.module.css';

// Where PayFast sends someone after they pay.
//
// It knows nothing about the order. PayFast's return URL is a plain redirect
// with no reliable order detail attached, and this site has no server to
// receive one — so the page cannot say "your 2XL is on its way" and does not
// pretend to. What it can do is say what happens next, in order, with real
// timings, so the gap between paying and the parcel arriving is not silence.
//
// Deliberately not indexed: it is the end of a transaction, not a page anyone
// should arrive at from a search result.

export const metadata: Metadata = pageMeta({
  path: '/store/thank-you/',
  title: 'Thank you',
  description: `Your order with ${site.store.name} has been received.`,
  noIndex: true,
});

const ACCENT = 'oklch(72% 0.26 350)';
const ACCENT_2 = 'oklch(80% 0.14 230)';

export default function ThankYouPage() {
  return (
    <div
      className={styles.page}
      style={
        {
          '--accent-a': ACCENT,
          '--accent-b': ACCENT_2,
        } as React.CSSProperties
      }
    >
      <HalftoneField />

      <div className={`shell ${styles.body}`}>
        <PageHeader
          eyebrow={site.store.name}
          title="Thank you — that worked"
          lede="Your payment went through. There is one thing left for you to do."
        />

        {/* First, not last. Nothing can be posted until this arrives, so it
            goes above the timeline rather than after it. */}
        <OrderDetails email={site.contactEmail ?? ''} />

        <h2 className={styles.thenWhat}>Then what happens</h2>
        <ol className={styles.steps}>
          <li>
            <h2>PayFast emails you a receipt</h2>
            <p>
              Within a few minutes, from PayFast rather than from me. That is
              your proof of payment — keep it.
            </p>
          </li>
          <li>
            <h2>I raise the order, once I have your address</h2>
            <p>
              By hand, usually the same day your email arrives. There is no
              automated pipeline between this site and the printer yet, which
              is the honest reason this step has my name on it rather than a
              robot&rsquo;s. You will get a note back confirming the size and
              where it is going.
            </p>
          </li>
          <li>
            <h2>It gets made</h2>
            <p>
              Two to seven working days. Nothing here is held in stock — the
              shirt does not exist until you order it, which is why this step
              takes as long as it does.
            </p>
          </li>
          <li>
            <h2>It ships</h2>
            <p>
              With tracking where the carrier provides it. Delivery time depends
              on where you are: a few days across Europe and North America,
              longer to South Africa and Australia. Delivery is already paid —
              there is nothing more to settle, and nothing to pay the courier.
            </p>
          </li>
        </ol>

        <section className={styles.section}>
          <h2 className="section-title">If something is wrong</h2>
          <div className={styles.prose}>
            <p>
              Email{' '}
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>{' '}
              and you will get a person. Wrong size chosen, wrong address typed,
              or a change of heart before it is printed — the earliest message
              is the easiest to act on, because once it is made it cannot be
              unmade.
            </p>
            <p>
              If it turns up faulty, damaged or simply not what you ordered, it
              is replaced or refunded in full. The{' '}
              <Link href="/policies/#returns">returns policy</Link> spells out
              the detail.
            </p>
          </div>
        </section>

        <p className={styles.back}>
          <Link href="/store/">← Back to {site.store.name}</Link>
        </p>
      </div>
    </div>
  );
}
