'use client';

import { useEffect, useState } from 'react';
import type { CheckoutMode } from '@/lib/price';
import type { BuyOption } from '@/lib/store';
import { COUNTRIES, countryOf } from '@/lib/address';
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
  checkout,
  page,
}: {
  options: BuyOption[];
  soldOut: boolean;
  /** The product's name, carried into the order note. */
  name: string;
  /** Printful's id, so an order can be tied back to a product. */
  productId: string;
  /** How a customer pays: lib/pricing.json's `checkout`. */
  checkout: CheckoutMode;
  /** This product's own path, where PayFast sends a customer who cancels. */
  page: string;
}) {
  // Nothing preselected. A size chosen for someone is a size they did not
  // choose, and this is the one decision on the page that must be theirs.
  const [size, setSize] = useState<string | null>(null);
  const chosen = options.find((o) => o.size === size) ?? null;

  // The PayFast checkout, where pricing.json says so — or on this one page
  // load when the URL asks (?checkout=payfast), so it can be tried against
  // PayFast's sandbox on the live site before anyone else sees it. Read after
  // mount: the page is static HTML.
  const [mode, setMode] = useState<CheckoutMode>(checkout);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('checkout') === 'payfast') setMode('payfast');
  }, []);

  const anyLink = mode === 'payfast' ? options.some((o) => o.available) : options.some((o) => o.href);

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
            {/* The price on the chip, so the size and what it costs are read
                in one place — the separate price ladder went for this. */}
            <span className={styles.sizeName}>{o.size}</span>
            <span className={styles.sizePrice}>{o.label}</span>
          </button>
        ))}
      </div>

      {/* The price of the chosen size, so the figure on the button is the
          figure that gets charged and the customer has seen it before they
          leave the site. */}
      <p className={styles.chosen} aria-live="polite">
        {chosen
          ? mode === 'payfast'
            ? `${chosen.size} — delivery is quoted for your address below`
            : `${chosen.size} — ${chosen.label}, delivery included`
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
      ) : mode === 'payfast' && chosen?.available ? (
        <CheckoutForm
          product={name}
          productId={productId}
          option={chosen}
          page={page}
          onSent={(ref) => remember(name, chosen, ref)}
        />
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
 * The address is asked in Printful's own fields — country first, because it
 * decides whether a state is needed — so an order can go to Printful without
 * being split by hand. lib/address.ts is the one definition, shared with the
 * Worker that checks it.
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
  const [country, setCountry] = useState('ZA');
  const [problem, setProblem] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setProblem(null);

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
          address: addressFrom(data, country),
          note: data.get('note'),
        }),
      });
      const body = (await res.json()) as { ref?: string; error?: string };
      // A 400 is the address being refused, and the customer can fix that
      // here — so it stops them, where a Worker that is down does not.
      if (res.status === 400) {
        setProblem(body.error ?? 'Something in the address is missing.');
        setSending(false);
        return;
      }
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

      <AddressFields country={country} onCountry={setCountry} />

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

      {problem && (
        <p className={styles.problem} role="alert">
          {problem}
        </p>
      )}

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

/**
 * The address, in Printful's fields. Country first, because it decides
 * whether a state is asked for at all. Shared by both ways of paying.
 */
function AddressFields({ country, onCountry }: { country: string; onCountry: (code: string) => void }) {
  const states = countryOf(country)?.states ?? [];
  return (
    <>
      <label className={styles.field}>
        <span>Country</span>
        <select
          name="country_code"
          required
          autoComplete="country"
          value={country}
          onChange={(event) => onCountry(event.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Street address</span>
        <input name="address1" required autoComplete="address-line1" maxLength={200} />
      </label>

      <label className={styles.field}>
        <span>
          {country === 'ZA' ? 'Suburb, unit or complex' : 'Apartment, unit or building'} <em>optional</em>
        </span>
        <input name="address2" autoComplete="address-line2" maxLength={200} />
      </label>

      <div className={styles.pair}>
        <label className={styles.field}>
          <span>City</span>
          <input name="city" required autoComplete="address-level2" maxLength={100} />
        </label>

        <label className={styles.field}>
          <span>Postal code</span>
          <input name="zip" required autoComplete="postal-code" maxLength={16} />
        </label>
      </div>

      {/* Only where Printful needs one: the US, Canada, Australia, Japan and
          Brazil. Keyed by country so switching country clears the choice. */}
      {states.length > 0 && (
        <label className={styles.field} key={country}>
          <span>{country === 'CA' ? 'Province' : 'State'}</span>
          <select name="state_code" required autoComplete="address-level1" defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

/** The address fields of a form, as /api/order and /api/checkout take them. */
function addressFrom(data: FormData, country: string) {
  return {
    address1: data.get('address1'),
    address2: data.get('address2'),
    city: data.get('city'),
    state_code: data.get('state_code') ?? '',
    zip: data.get('zip'),
    country_code: country,
  };
}

interface Quote {
  item: number;
  delivery: number;
  total: number;
  currency: string;
  method: { id: string; name: string; minDays: number | null; maxDays: number | null };
}

/** Rands as the page shows them: R1 250, no cents. */
function rand(amount: number): string {
  return `R${Math.round(amount).toLocaleString('en-ZA').replace(/[\s\u00a0\u202f]/g, ' ')}`;
}

/**
 * Where it goes, what delivery costs, then PayFast.
 *
 * His ruling, 2026-10-19: delivery is not inside the price any more but
 * quoted live from Printful for this address. So the form asks the address,
 * shows the item, the delivery and the total, and only then offers to pay.
 * Any change to the address throws the quote away — a total for somewhere
 * else is not this total.
 *
 * The Worker works the amount out again when paying; what is shown here is
 * never what is charged on its own say-so. Unlike the payment-link form, a
 * failure to store the order DOES stop the sale: here the stored order is
 * what PayFast's payment is checked against.
 */
function CheckoutForm({
  product,
  productId,
  option,
  page,
  onSent,
}: {
  product: string;
  productId: string;
  option: BuyOption;
  page: string;
  onSent: (ref: string | null) => void;
}) {
  const [country, setCountry] = useState('ZA');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setProblem(null);
    const data = new FormData(event.currentTarget);
    const address = addressFrom(data, country);

    try {
      if (!quote) {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ productId, size: option.size, address }),
        });
        const body = (await res.json().catch(() => ({}))) as { quote?: Quote; error?: string };
        if (!res.ok || !body.quote) throw new Error(body.error ?? 'Delivery could not be quoted just now.');
        setQuote(body.quote);
        setBusy(false);
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          product,
          productId,
          size: option.size,
          page,
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          address,
          note: data.get('note'),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ref?: string;
        action?: string;
        fields?: [string, string][];
        error?: string;
      };
      if (!res.ok || !body.action || !body.fields) throw new Error(body.error ?? 'Checkout could not start just now.');

      onSent(body.ref ?? null);
      // A real form post, because that is what PayFast takes: built from the
      // signed fields exactly as the Worker returned them, in that order.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = body.action;
      for (const [name, value] of body.fields) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Something went wrong.');
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  return (
    <form className={styles.form} onSubmit={ask} onChange={() => quote && setQuote(null)}>
      <p className={styles.formHead}>Where should it go?</p>

      <label className={styles.field}>
        <span>Full name</span>
        <input name="name" required autoComplete="name" maxLength={200} />
      </label>

      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" maxLength={200} />
      </label>

      <AddressFields country={country} onCountry={(code) => { setCountry(code); setQuote(null); }} />

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

      {quote && (
        <dl className={styles.quote} aria-live="polite">
          <div>
            <dt>{product}, {option.size}</dt>
            <dd>{rand(quote.item)}</dd>
          </div>
          <div>
            <dt>
              Delivery — {quote.method.name}
              {quote.method.minDays && quote.method.maxDays
                ? `, ${quote.method.minDays}–${quote.method.maxDays} days`
                : ''}
            </dt>
            <dd>{rand(quote.delivery)}</dd>
          </div>
          <div className={styles.quoteTotal}>
            <dt>Total</dt>
            <dd>{rand(quote.total)}</dd>
          </div>
        </dl>
      )}

      {problem && (
        <p className={styles.problem} role="alert">
          {problem}
        </p>
      )}

      <button className={styles.buy} type="submit" disabled={busy}>
        {busy ? 'One moment…' : quote ? `Pay ${rand(quote.total)} with PayFast ↗` : 'Work out delivery'}
      </button>

      <p className={styles.formNote}>
        Delivery is the printer&rsquo;s own rate for your address. You pay on PayFast&rsquo;s page; card
        details never touch this site.
      </p>
    </form>
  );
}
