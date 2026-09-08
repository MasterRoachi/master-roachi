'use client';

import { useState } from 'react';
import type { BuyOption } from '@/lib/store';
import styles from './BuyPanel.module.css';

/**
 * Choose a size, then pay for that size.
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
}: {
  options: BuyOption[];
  soldOut: boolean;
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
        <a
          className={styles.buy}
          href={chosen.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy {chosen.label} ↗
        </a>
      ) : (
        // Disabled rather than absent, so the button does not appear from
        // nowhere once a size is picked and move everything below it.
        <span className={styles.buy} data-disabled="true" aria-disabled="true">
          {chosen ? 'Not available in that size' : 'Buy ↗'}
        </span>
      )}

      <p className={styles.note}>
        Payment is taken by PayFast. You will be asked for a delivery address
        after paying — or reply to the confirmation email with it.
      </p>
    </div>
  );
}
