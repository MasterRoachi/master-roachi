'use client';

import { useState } from 'react';
import type { BuyOption } from '@/lib/store';
import styles from './BuyPanel.module.css';

/** Where the thank-you page looks for what was just bought. */
export const LAST_ORDER_KEY = 'fabled-threads:last-order';

/**
 * Note the choice on the way out to PayFast.
 *
 * A shareable payment link carries nothing back and cannot collect a delivery
 * address, so what arrives is a sum of money with no name on it — and R500
 * covers XS, S, M, L and XL, so the amount does not even identify the size.
 * The one moment the size is known is this click, on this device, and PayFast
 * returns to this same browser afterwards. So it is written down here and read
 * on the way back.
 *
 * Best effort by design: private windows and blocked storage both throw, and
 * the thank-you page asks for the details in full when nothing comes back.
 */
function remember(product: string, option: BuyOption, ref: string | null) {
  try {
    window.localStorage.setItem(
      LAST_ORDER_KEY,
      JSON.stringify({
        product,
        size: option.size,
        price: option.label,
        ref,
        at: Date.now(),
      }),
    );
  } catch {
    // No storage. The thank-you page has a path for that.
  }
}

/**
 * Choose a size, say where it goes, then pay.
 *
 * A PayFast link is a fixed sum, so there is one link per price rather than
 * one per product — which means the customer has to say which size before
 * there is anything to click. The size chips used to be decoration with a
 * comment explaining they were not buttons; now they are buttons, because the
 * choice genuinely belongs here.
 *
 * This is the shape a store takes when it has payment links and no cart. It
 * cannot do quantities, it cannot combine two shirts into one payment, and the
 * order is raised by hand afterwards. All of that is why a real checkout is
 * the next thing to build — but a page that can take one order beats a page
 * that can take none.
 */
export default function BuyPanel({
  options,
  soldOut,
  name,
  productId,
}: {
  options: BuyOption[];
  soldOut: boolean;
  /** The product's name, carried into the order note. */
  name: string;
  /** Printful's id, so an order can be tied back to a product. */
  productId: string;
}) {
  // Nothing preselected. A size chosen for someone is a size they did not
  // choose, and this is the one decision on the page that must be theirs.
  const [size, setSize] = useState<string | null>(null);
  const chosen = options.find((o) => o.size === size) ?? null;

  const anyLink = options.some((o) => o.href);

  if (soldOut) {
    return <p className={styles.pending}>Sold out</p>;
  }

  return (
    <div className={styles.panel}>
      <p className={styles.label} id="size-label">
        Choose a size
      </p>
      <div className={styles.sizes} role="group" aria-labelledby="size-label">
        {options.map((o) => (
          <button
            key={o.size}
            type="button"
            className={styles.size}
            aria-pressed={o.size === size}
            disabled={!o.available}
            onClick={() => setSize(o.size)}
          >
            {o.size}
          </button>
        ))}
      </div>

      {/* The price of the chosen size, so the figure on the button is the
          figure that gets charged and the customer has seen it before they
          leave the site. */}
      <p className={styles.chosen} aria-live="polite">
        {chosen
          ? `${chosen.size} — ${chosen.label}, delivery included`
          : 'Sizes are priced individually; the price appears here.'}
      </p>

      {!anyLink ? (
        <div className={styles.notYet}>
          <p className={styles.pending}>Not on sale yet</p>
          <p className={styles.notYetWhy}>
            Payment is still being set up. The design is finished and this is a
            real product — there is just nowhere to take your money yet.
          </p>
        </div>
      ) : chosen?.href ? (
        <DeliveryForm
          product={name}
          productId={productId}
          option={chosen}
          onSent={(ref) => remember(name, chosen, ref)}
        />
      ) : (
        // Disabled rather than absent, so the button does not appear from
        // nowhere once a size is picked and move everything below it.
        <span className={styles.buy} data-disabled="true" aria-disabled="true">
          {chosen ? 'Not available in that size' : 'Buy ↗'}
        </span>
      )}

      <p className={styles.note}>
        Payment is taken by PayFast; card details never touch this site.
      </p>
    </div>
  );
}

/**
 * Where it goes, asked before the money moves.
 *
 * PayFast's shareable links collect no delivery address, and the amount does
 * not identify the size — R500 covers XS to XL. Asking afterwards worked, in
 * the sense that a customer who replied to an email got a shirt; this asks
 * while they are still here and still paying attention.
 *
 * The address is posted to the Worker and then the customer goes to PayFast.
 * A failure to store is deliberately not fatal: the link opens anyway and the
 * thank-you page falls back to asking by email, because losing an address is
 * recoverable and losing a sale is not.
 */
function DeliveryForm({
  product,
  productId,
  option,
  onSent,
}: {
  product: string;
  productId: string;
  option: BuyOption;
  onSent: (ref: string | null) => void;
}) {
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);

    const data = new FormData(event.currentTarget);
    let ref: string | null = null;

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          product,
          productId,
          size: option.size,
          price: option.label,
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          address: data.get('address'),
          note: data.get('note'),
        }),
      });
      const body = (await res.json()) as { ref?: string };
      ref = body.ref ?? null;
    } catch {
      // Offline, blocked, or the Worker is down. Carry on to PayFast.
    }

    onSent(ref);
    // Opened after the await rather than as a link, so the reference is stored
    // before the customer leaves. Same tab: a payment is not something to
    // lose behind a popup blocker.
    window.location.href = option.href as string;
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.formHead}>Where should it go?</p>

      <label className={styles.field}>
        <span>Full name</span>
        <input name="name" required autoComplete="name" maxLength={200} />
      </label>

      <label className={styles.field}>
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
        />
      </label>

      <label className={styles.field}>
        <span>Delivery address</span>
        <textarea
          name="address"
          required
          rows={4}
          maxLength={600}
          autoComplete="street-address"
          placeholder={'Street\nSuburb\nCity\nPostal code\nCountry'}
        />
      </label>

      <label className={styles.field}>
        <span>
          Phone <em>couriers ask for one</em>
        </span>
        <input name="phone" autoComplete="tel" maxLength={40} />
      </label>

      <label className={styles.field}>
        <span>
          Anything else <em>optional</em>
        </span>
        <input name="note" maxLength={600} />
      </label>

      <button className={styles.buy} type="submit" disabled={sending}>
        {sending ? 'One moment…' : `Continue to pay ${option.label} ↗`}
      </button>

      <p className={styles.formNote}>
        Sent to me, not to PayFast — they do not pass on an address. You pay on
        the next screen.
      </p>
    </form>
  );
}
