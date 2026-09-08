'use client';

import { useEffect, useState } from 'react';
import { LAST_ORDER_KEY } from './BuyPanel';
import styles from './OrderDetails.module.css';

// The delivery address, collected the only way this site can collect it.
//
// PayFast's shareable links do not ask for one, and there is no server here to
// receive an order — so the address arrives by email or not at all. That makes
// this the most important thing on the thank-you page rather than a footnote,
// and it opens a pre-addressed, pre-filled message so the customer types an
// address rather than composing a letter.
//
// What was bought is read back out of localStorage, written on the way to
// PayFast. When it is missing — private window, cleared storage, a different
// browser — the template asks for the product and size too, which is the same
// email with two more blanks in it.

interface LastOrder {
  product: string;
  size: string;
  price: string;
  /** Set when the Worker stored the address; null when it could not. */
  ref?: string | null;
  at: number;
}

/** Older than this and it is probably a different purchase, or a stale tab. */
const STALE_AFTER = 1000 * 60 * 60 * 6;

export default function OrderDetails({ email }: { email: string }) {
  // Rendered only after mount: this is static HTML, and reading storage during
  // render would make the server and client markup disagree.
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LastOrder;
        if (parsed?.size && Date.now() - (parsed.at ?? 0) < STALE_AFTER) {
          setOrder(parsed);
        }
      }
    } catch {
      // No storage, or nothing worth reading. The blank template covers it.
    }
    setReady(true);
  }, []);

  const known = order
    ? `${order.product} — ${order.size} (${order.price})`
    : null;

  const subject = known
    ? `Delivery details — ${order?.product} ${order?.size}`
    : 'Delivery details for my order';

  const body = [
    known ? `Order: ${known}` : 'Product:\nSize:',
    '',
    'Deliver to:',
    'Name:',
    'Street address:',
    'Suburb:',
    'City:',
    'Postal code:',
    'Country:',
    'Phone (couriers ask for one):',
    '',
  ].join('\n');

  const href = `mailto:${email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  // The address is normally taken before payment, so this usually confirms
  // rather than asks. It only asks when the Worker could not store it — a
  // failure that is deliberately allowed through rather than blocking a sale.
  if (ready && order?.ref) {
    return (
      <div className={styles.box} data-confirmed="true">
        <p className="eyebrow">Nothing else to do</p>
        <h2 className={styles.title}>I have your address</h2>
        <p className={styles.why}>
          Your order is <strong>{known}</strong>, reference{' '}
          <code className={styles.ref}>{order.ref}</code>. Quote that if you
          need to write about it. Everything below happens without you.
        </p>
        <p className={styles.fallback}>
          Something wrong, or need to change the address?{' '}
          <a href={`mailto:${email}?subject=${encodeURIComponent(
            `Order ${order.ref}`,
          )}`}>
            Email me
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <p className="eyebrow">Do this now</p>
      <h2 className={styles.title}>Send me your delivery address</h2>

      <p className={styles.why}>
        Your address did not reach me before payment — that is my end, not
        yours. PayFast does not pass one on, so nothing can be posted until it
        arrives. One email, and the template is already written.
      </p>

      {/* Shown only once storage has been checked, so the line does not flip
          from "we do not know" to a size a moment later. */}
      {ready && (
        <p className={styles.what} aria-live="polite">
          {known ? (
            <>
              Your order: <strong>{known}</strong>. Already filled in below.
            </>
          ) : (
            <>
              Please include the product and size — this browser did not keep a
              note of them.
            </>
          )}
        </p>
      )}

      <a className={styles.button} href={href}>
        Email my address ↗
      </a>

      <p className={styles.fallback}>
        Or write to <a href={`mailto:${email}`}>{email}</a> yourself, with your
        size and where it should go.
      </p>
    </div>
  );
}
