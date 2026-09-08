import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import { site } from '@/lib/site';
import styles from './policies.module.css';

// Terms, delivery and returns.
//
// Written because PayFast asked for them during merchant verification, which
// is the regulator's requirement rather than theirs: South Africa's ECT Act
// obliges an online seller to publish who they are, what they sell, what it
// costs, how it arrives and how it can be sent back.
//
// One page rather than three. A reviewer, and a customer with a problem, both
// want to find all of it in one place — and three near-empty pages for a store
// with one product would be filing rather than disclosure. Each section has
// its own anchor so it can still be linked to directly.
//
// The tone is the site's: plain sentences, no defensive throat-clearing, and
// the awkward parts said out loud rather than buried in a sub-clause.

export const metadata: Metadata = pageMeta({
  path: '/policies/',
  title: 'Terms, delivery and returns',
  description:
    'Who you are buying from, what it costs, how it ships, and how to send it back — for Fabled Threads, the store at masterroachi.com.',
});

const { legal, store, contactEmail, name, url } = site;

/** Nothing on this page is decorative, so the mail link is used repeatedly. */
function Mail() {
  return <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;
}

export default function PoliciesPage() {
  return (
    <div className={styles.page}>
      <div className={`shell ${styles.body}`}>
        <PageHeader
          eyebrow="The small print"
          title="Terms, delivery and returns"
          lede={
            <>
              Everything about buying from {store.name} that is not on the
              product page. Last updated {legal.updated}.
            </>
          }
        />

        <nav className={styles.toc} aria-label="On this page">
          <a href="#who">Who you are buying from</a>
          <a href="#terms">Terms and conditions</a>
          <a href="#delivery">Delivery</a>
          <a href="#returns">Returns and refunds</a>
          <a href="#privacy">Privacy</a>
        </nav>

        <section className={styles.section} id="who">
          <h2 className="section-title">Who you are buying from</h2>
          <dl className={styles.facts}>
            <div>
              <dt>Seller</dt>
              <dd>
                {legal.proprietor} — {legal.status.toLowerCase()}, trading as{' '}
                {store.name}. Not a registered company.
              </dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {legal.address.map((line) => (
                  <span key={line} className={styles.addressLine}>
                    {line}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <Mail />
              </dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{url.replace('https://', '')}</dd>
            </div>
            <div>
              <dt>Payments taken by</dt>
              <dd>
                {legal.paymentProcessor}. Card details are entered on their
                system and never touch this site.
              </dd>
            </div>
            <div>
              <dt>Printed and shipped by</dt>
              <dd>
                {legal.fulfilment}, a print-on-demand manufacturer, on my
                instruction.
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.section} id="terms">
          <h2 className="section-title">Terms and conditions</h2>
          <div className={styles.prose}>
            <h3>What is sold here</h3>
            <p>
              Original illustrations, printed onto clothing and paper. Every
              item is made to order — nothing is held in stock, and nothing is
              printed until it has been paid for.
            </p>

            <h3>Ordering</h3>
            <p>
              Placing an order is an offer to buy, not a completed sale. The
              sale is concluded when payment clears and the order is confirmed
              by email. An order can be declined — a design withdrawn, a size
              discontinued by the manufacturer, or a price displayed in error —
              and anything already paid is refunded in full.
            </p>

            <h3>Prices</h3>
            <p>
              Prices are shown per size on each product page, in the currency
              displayed there. The price that applies is the one shown when the
              order is placed. Delivery is shown or confirmed before payment;
              nothing is charged afterwards.
            </p>
            <p>
              Import duties and taxes on international orders are set by the
              destination country, are not collected here, and are the
              customer&rsquo;s responsibility.
            </p>

            <h3>What the pictures are</h3>
            <p>
              Product images are manufacturer mockups and, on some pages, a 3D
              render of the garment with the design projected onto it. They are
              an honest representation and not a photograph of the item you will
              receive. Colour varies between screens and between production
              batches.
            </p>

            <h3>The artwork</h3>
            <p>
              The designs remain the property of {legal.proprietor}. Buying a
              printed item does not transfer any right in the artwork: it may
              not be reproduced, resold, or used commercially. Wearing it,
              obviously, is the entire point.
            </p>

            <h3>Everything else on this site</h3>
            <p>
              The writing, project pages and other content at {url.replace('https://', '')}{' '}
              are published free, are not for sale, and are not part of any
              purchase.
            </p>

            <h3>Liability</h3>
            <p>
              Responsibility is limited to the value of the order concerned.
              Nothing here limits any right that South African law does not
              allow to be limited, including rights under the Consumer
              Protection Act.
            </p>

            <h3>Governing law</h3>
            <p>
              These terms are governed by the law of South Africa. They may
              change; the version that applies to an order is the one published
              when the order was placed, and the date at the top of this page
              says which that is.
            </p>
          </div>
        </section>

        <section className={styles.section} id="delivery">
          <h2 className="section-title">Delivery</h2>
          <div className={styles.prose}>
            <h3>Where</h3>
            <p>Worldwide.</p>

            <h3>How long</h3>
            <p>
              Every item is made after the order is placed, so there are two
              waits rather than one: production, typically two to seven business
              days, and then shipping, which depends on the destination. South
              African orders are usually the slower half of that; European and
              North American ones are often quicker, because the item is printed
              nearer to where it is going.
            </p>
            <p>
              An estimate is given when the order is confirmed. If something
              slips badly, you will hear it from me rather than have to ask.
            </p>

            <h3>Cost</h3>
            <p>
              Delivery is shown or confirmed before you pay. There is no
              surcharge afterwards.
            </p>

            <h3>Tracking</h3>
            <p>
              A tracking number is sent when one is available. Not every
              shipping method to every country provides one, and where it does
              not, you will be told that instead of being left waiting.
            </p>

            <h3>Addresses</h3>
            <p>
              A parcel is shipped to the address given at checkout. If that
              address is wrong and the parcel is returned or lost as a result,
              reshipping is at the customer&rsquo;s cost — the item has already
              been made and posted. Tell me quickly if you have made a mistake
              and it can usually be corrected before printing starts.
            </p>
          </div>
        </section>

        <section className={styles.section} id="returns">
          <h2 className="section-title">Returns and refunds</h2>
          <div className={styles.prose}>
            <h3>If it arrives faulty, damaged or wrong</h3>
            <p>
              Email <Mail /> within {legal.faultWindowDays} days of delivery
              with a photograph and your order number. A misprint, a flaw in the
              garment, a damaged parcel or the wrong item is replaced or
              refunded in full, including delivery, at no cost to you. You will
              not normally be asked to send it back — photographs are enough.
            </p>

            <h3>If it never arrives</h3>
            <p>
              Once the expected delivery window has clearly passed, it is
              reshipped or refunded. Lost post is not the customer&rsquo;s
              problem.
            </p>

            <h3>Changing your mind</h3>
            <p>
              Because each item is printed for one order and cannot be put back
              on a shelf, change-of-mind returns are not generally accepted.
              That is why the size guide, the garment specification and the
              per-size pricing are on every product page — please use them
              before ordering, and ask if anything is unclear.
            </p>

            <h3>The cooling-off right</h3>
            <p>
              South African consumers have a right under the Electronic
              Communications and Transactions Act to cancel certain electronic
              transactions within {legal.coolingOffDays} days of delivery,
              without giving a reason. Whether made-to-order printing falls
              inside that right is arguable. Rather than argue it, it is
              offered: cancel within {legal.coolingOffDays} days of receiving
              the item, return it unworn and in the condition it arrived, and
              the purchase price is refunded. The cost of returning it is
              yours, which the Act allows.
            </p>

            <h3>How refunds are paid</h3>
            <p>
              To the card or account that paid, through{' '}
              {legal.paymentProcessor}, within 30 days of the refund being
              agreed. Refunds are not paid in credit or vouchers.
            </p>

            <h3>Complaints</h3>
            <p>
              To <Mail />, and to a person rather than a queue. This is a
              one-person operation; if something has gone wrong, saying so
              directly is the fastest way to have it fixed.
            </p>
          </div>
        </section>

        <section className={styles.section} id="privacy">
          <h2 className="section-title">Privacy</h2>
          <div className={styles.prose}>
            <p>
              This site sets no cookies, runs no analytics, and embeds no
              advertising or tracking scripts. Nothing you read here is
              recorded against you.
            </p>
            <p>
              Ordering means giving a name, delivery address and email address.
              That goes to {legal.paymentProcessor} to take the payment and to{' '}
              {legal.fulfilment} to print and post the item — the two parties
              who cannot do their job without it — and is not sold, shared or
              used for marketing. Payment card details are entered on{' '}
              {legal.paymentProcessor}&rsquo;s system and are never seen by this
              site or by me.
            </p>
            <p>
              The one thing stored about visitors is on the games poll: voting
              saves a one-way hash of your address and browser, salted, so the
              same person cannot vote twice. The address itself is never
              written down, the hash cannot be turned back into one, and it is
              deleted after six months.
            </p>
            <p>
              To ask what is held about you, or to have it deleted, email{' '}
              <Mail />.
            </p>
          </div>
        </section>

        <p className={styles.back}>
          <Link href="/store/">← Back to {store.name}</Link>
        </p>
      </div>
    </div>
  );
}
