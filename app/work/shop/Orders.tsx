'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './orders.module.css';

// The orders, from D1 through /work/api/orders.
//
// An order is written when the customer submits the address form, BEFORE they
// reach PayFast, so a Received order is a filled-in form and not a sale. Paid
// is his mark, made after seeing the money in PayFast; nothing tells this site
// a payment happened. Hence "Open" as the default view — received and paid,
// the two that still want something from him — rather than everything.
//
// Personal details are blanked 30 days after an order is submitted — his
// ruling, 2026-10-19 — so an old order shows what sold and not who bought it.
//
// Search and filtering are here rather than in SQL: one product and a fixed
// payment link make this tens of rows, and the whole list is one request.

type Status = 'received' | 'paid' | 'fulfilled' | 'dismissed';

interface Order {
  id: number;
  ref: string;
  created_at: string;
  product: string;
  product_id: string;
  size: string;
  price: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  note: string;
  status: Status;
  paid_at: string | null;
  fulfilled_at: string | null;
  dismissed_at: string | null;
  /** When the personal details were blanked: 30 days after submission. */
  redacted_at: string | null;
  /** Set once it has been sent to Printful, as a draft. */
  printful_id: number | null;
  printful_status: string | null;
  sent_at: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  /** The address in Printful's fields, for orders from the form since 2026-10-19. */
  address1: string | null;
  address2: string | null;
  city: string | null;
  state_code: string | null;
  zip: string | null;
  country_code: string | null;
  /** What a PayFast checkout charged, worked out by the Worker. Null for a payment-link order. */
  item_amount: number | null;
  shipping_amount: number | null;
  total: number | null;
  shipping_name: string | null;
  pf_payment_id: string | null;
}

/** The address as Printful wants it, filled in from the one box and checked by hand. */
interface Recipient {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state_code: string;
  zip: string;
  country_code: string;
}

/* Country names a customer is likely to type, to the code Printful wants.
   Anything else is left for him to fill in; South Africa is the default
   because it is where nearly every order goes. */
const COUNTRIES: Record<string, string> = {
  'south africa': 'ZA',
  'rsa': 'ZA',
  'za': 'ZA',
  'namibia': 'NA',
  'botswana': 'BW',
  'united kingdom': 'GB',
  'uk': 'GB',
  'united states': 'US',
  'usa': 'US',
  'australia': 'AU',
  'new zealand': 'NZ',
  'canada': 'CA',
  'greece': 'GR',
};

/**
 * The address as Printful wants it.
 *
 * Exact for an order from the buy form since 2026-10-19, which asks in these
 * fields. For an older one, which has only the free-text box, a first guess at
 * the parts — he reads it and corrects it before anything is sent, which is
 * the point of the form either way.
 */
function guessRecipient(order: Order): Recipient {
  if (order.address1 && order.city && order.zip && order.country_code) {
    return {
      name: order.name,
      address1: order.address1,
      address2: order.address2 ?? '',
      city: order.city,
      state_code: order.state_code ?? '',
      zip: order.zip,
      country_code: order.country_code,
    };
  }
  const lines = order.address
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
  let country_code = 'ZA';
  const last = lines.at(-1)?.toLowerCase();
  if (last && COUNTRIES[last]) {
    country_code = COUNTRIES[last];
    lines.pop();
  }
  let zip = '';
  // The last line that is only a postcode. Not findLastIndex: the project's
  // TypeScript lib stops short of ES2023.
  const zipAt = lines.map((line) => /^\d{4,6}$/.test(line)).lastIndexOf(true);
  if (zipAt >= 0) {
    zip = lines[zipAt];
    lines.splice(zipAt, 1);
  } else {
    // "Cape Town 8001" — a postcode at the end of the city line.
    const match = lines.at(-1)?.match(/^(.*\S)\s+(\d{4,6})$/);
    if (match) {
      zip = match[2];
      lines[lines.length - 1] = match[1];
    }
  }
  const city = lines.length > 1 ? (lines.pop() ?? '') : '';
  return {
    name: order.name,
    address1: lines.shift() ?? '',
    address2: lines.join(', '),
    city,
    state_code: '',
    zip,
    country_code,
  };
}

type View = 'open' | Status | 'all';

const VIEWS: { key: View; name: string }[] = [
  { key: 'open', name: 'Open' },
  { key: 'received', name: 'Received' },
  { key: 'paid', name: 'Paid' },
  { key: 'fulfilled', name: 'Fulfilled' },
  { key: 'dismissed', name: 'Dismissed' },
  { key: 'all', name: 'All' },
];

const LABEL: Record<Status, string> = {
  received: 'Received',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  dismissed: 'Dismissed',
};

/** What can be done to an order from where it stands. Undo is one step back. */
const NEXT: Record<Status, { to: Status; label: string }[]> = {
  received: [
    { to: 'paid', label: 'Mark paid' },
    { to: 'dismissed', label: 'Dismiss — never paid' },
  ],
  // Fulfilled by hand is still here for an order shipped some other way;
  // one sent to Printful is marked fulfilled when Printful ships it.
  paid: [
    { to: 'fulfilled', label: 'Mark fulfilled' },
    { to: 'received', label: 'Undo paid' },
  ],
  fulfilled: [{ to: 'paid', label: 'Undo fulfilled' }],
  dismissed: [{ to: 'received', label: 'Restore' }],
};

/* South African time, which is the only time he reads these in. Fixed to the
   zone rather than the browser's, for the same reason worker/db.ts does. */
const when = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function stamp(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : when.format(date);
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [view, setView] = useState<View>('open');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  /** The order whose Send form is open, and what it holds. */
  const [sending, setSending] = useState<{ ref: string; recipient: Recipient } | null>(null);
  const [printful, setPrintful] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const response = await fetch('/work/api/orders', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Could not read the orders (${response.status}).`);
        const data = (await response.json()) as {
          configured: boolean;
          orders: Order[];
          swept?: number;
          sweepFailed?: boolean;
          refreshFailed?: boolean;
          printful?: boolean;
        };
        if (!live) return;
        if (!data.configured) {
          setProblem('Not switched on — the D1 binding is missing.');
          setOrders([]);
          return;
        }
        setOrders(data.orders);
        setPrintful(Boolean(data.printful));
        if (data.sweepFailed) {
          setNote('Orders still in KV could not be carried across this time. Those in D1 are all here.');
        } else if (data.refreshFailed) {
          setNote('Printful did not answer for every order sent, so some statuses may be behind.');
        }
      } catch (error) {
        if (live) setProblem(error instanceof Error ? error.message : 'Could not read the orders.');
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const counts = useMemo(() => {
    const out: Record<Status, number> = { received: 0, paid: 0, fulfilled: 0, dismissed: 0 };
    for (const order of orders ?? []) out[order.status] += 1;
    return out;
  }, [orders]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (orders ?? []).filter((order) => {
      const inView =
        view === 'all' ||
        (view === 'open' ? order.status === 'received' || order.status === 'paid' : order.status === view);
      if (!inView) return false;
      if (!needle) return true;
      return [order.ref, order.name, order.email, order.product, order.size, order.phone, order.address]
        .join('\n')
        .toLowerCase()
        .includes(needle);
    });
  }, [orders, view, query]);

  async function mark(ref: string, status: Status) {
    setBusy(ref);
    setNote(null);
    try {
      const response = await fetch('/work/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'status', ref, status }),
      });
      const data = (await response.json().catch(() => ({}))) as { order?: Order; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? `Could not save (${response.status}).`);
      setOrders((current) => (current ?? []).map((o) => (o.ref === ref ? data.order! : o)));
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Could not save.');
    } finally {
      setBusy(null);
    }
  }

  async function send(ref: string, recipient: Recipient) {
    setBusy(ref);
    setNote(null);
    try {
      const response = await fetch('/work/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'send', ref, recipient }),
      });
      const data = (await response.json().catch(() => ({}))) as { order?: Order; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? `Could not send (${response.status}).`);
      setOrders((current) => (current ?? []).map((o) => (o.ref === ref ? data.order! : o)));
      setSending(null);
      setNote('Sent to Printful as a draft. Confirm it in Printful to have it printed and charged.');
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Could not send.');
    } finally {
      setBusy(null);
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote(`${what} copied.`);
    } catch {
      setNote(`Could not copy the ${what.toLowerCase()}.`);
    }
  }

  if (problem && !orders?.length) return <p className={styles.message}>{problem}</p>;
  if (!orders) return <p className={styles.message}>Loading orders…</p>;

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.counts}>
          <strong>{orders.length}</strong> orders
          <span className={styles.sep}>·</span>
          <span className={counts.received ? styles.warn : undefined}>{counts.received} received</span>
          <span className={styles.sep}>·</span>
          <span className={counts.paid ? styles.warn : undefined}>{counts.paid} paid, not fulfilled</span>
          <span className={styles.sep}>·</span>
          {counts.fulfilled} fulfilled
        </p>
        <input
          type="search"
          className={styles.search}
          placeholder="Search name, email, reference…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search orders"
        />
      </div>

      <div className={styles.views} role="group" aria-label="Show">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={view === v.key ? styles.pillOn : styles.pill}
            aria-pressed={view === v.key}
            onClick={() => setView(v.key)}
          >
            {v.name}
          </button>
        ))}
      </div>

      {note && <p className={styles.message}>{note}</p>}

      {shown.length === 0 ? (
        <p className={styles.message}>
          {orders.length === 0
            ? 'No orders yet. One appears here the moment a customer submits the address form.'
            : 'Nothing matches.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((order) => {
            const expanded = open === order.ref;
            return (
              <li key={order.ref} className={`${styles.order} ${styles[order.status]}`}>
                <button
                  type="button"
                  className={styles.row}
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : order.ref)}
                >
                  <span className={styles.badge}>{LABEL[order.status]}</span>
                  <span className={styles.who}>{order.redacted_at ? 'Details removed' : order.name}</span>
                  <span className={styles.what}>
                    {order.product || 'Unknown product'} · {order.size}
                    {order.price ? ` · ${order.price}` : ''}
                  </span>
                  <span className={styles.when}>{stamp(order.created_at)}</span>
                </button>

                {expanded && (
                  <div className={styles.detail}>
                    <dl className={styles.fields}>
                      <dt>Reference</dt>
                      <dd className={styles.ref}>{order.ref}</dd>
                      {order.redacted_at ? (
                        <>
                          <dt>Customer</dt>
                          <dd className={styles.muted}>
                            Removed {stamp(order.redacted_at)}, 30 days after the order.
                          </dd>
                        </>
                      ) : (
                        <>
                          <dt>Email</dt>
                          <dd>
                            <a href={`mailto:${order.email}?subject=${encodeURIComponent(`Your order ${order.ref}`)}`}>
                              {order.email}
                            </a>
                          </dd>
                        </>
                      )}
                      {order.phone && (
                        <>
                          <dt>Phone</dt>
                          <dd>{order.phone}</dd>
                        </>
                      )}
                      {!order.redacted_at && (
                        <>
                          <dt>Address</dt>
                          <dd className={styles.address}>{order.address}</dd>
                        </>
                      )}
                      {order.note && (
                        <>
                          <dt>Note</dt>
                          <dd className={styles.address}>{order.note}</dd>
                        </>
                      )}
                      <dt>Product</dt>
                      <dd>
                        {order.product}
                        {order.product_id && <span className={styles.muted}> · Printful {order.product_id}</span>}
                      </dd>
                      {order.total !== null && (
                        <>
                          <dt>Charged</dt>
                          <dd>
                            R{order.total} — R{order.item_amount} for the item, R{order.shipping_amount} delivery
                            {order.shipping_name && <span className={styles.muted}> ({order.shipping_name})</span>}
                          </dd>
                          <dt>PayFast</dt>
                          <dd>
                            {order.pf_payment_id ? (
                              `Paid, payment ${order.pf_payment_id}`
                            ) : (
                              <span className={styles.muted}>
                                No payment yet — PayFast marks it Paid here itself when one comes through.
                              </span>
                            )}
                          </dd>
                        </>
                      )}
                      <dt>Submitted</dt>
                      <dd>{stamp(order.created_at)}</dd>
                      {order.paid_at && (
                        <>
                          <dt>Paid</dt>
                          <dd>{stamp(order.paid_at)}</dd>
                        </>
                      )}
                      {order.fulfilled_at && (
                        <>
                          <dt>Fulfilled</dt>
                          <dd>{stamp(order.fulfilled_at)}</dd>
                        </>
                      )}
                      {order.dismissed_at && (
                        <>
                          <dt>Dismissed</dt>
                          <dd>{stamp(order.dismissed_at)}</dd>
                        </>
                      )}
                      {order.printful_id !== null && (
                        <>
                          <dt>Printful</dt>
                          <dd>
                            Order {order.printful_id} · {order.printful_status ?? 'unknown'}
                            {order.sent_at && <span className={styles.muted}> · sent {stamp(order.sent_at)}</span>}
                            {order.printful_status === 'draft' && (
                              <span className={styles.muted}> — confirm it in Printful to have it printed</span>
                            )}
                          </dd>
                        </>
                      )}
                      {order.tracking_number && (
                        <>
                          <dt>Tracking</dt>
                          <dd>
                            {order.carrier && `${order.carrier} · `}
                            {order.tracking_url ? (
                              <a href={order.tracking_url} target="_blank" rel="noreferrer">
                                {order.tracking_number}
                              </a>
                            ) : (
                              order.tracking_number
                            )}
                          </dd>
                        </>
                      )}
                    </dl>

                    {sending?.ref === order.ref && (
                      <form
                        className={styles.send}
                        onSubmit={(event) => {
                          event.preventDefault();
                          void send(order.ref, sending.recipient);
                        }}
                      >
                        <p className={styles.sendNote}>
                          {order.address1
                            ? 'As the customer entered it — check it once more.'
                            : 'Split from the address as typed — check every field.'} It goes to Printful as a
                          draft; nothing is printed or charged until you confirm it there.
                        </p>
                        {(
                          [
                            ['name', 'Name'],
                            ['address1', 'Street'],
                            ['address2', 'More (optional)'],
                            ['city', 'City'],
                            ['state_code', 'State (US, CA, AU only)'],
                            ['zip', 'Postcode'],
                            ['country_code', 'Country (two letters)'],
                          ] as [keyof Recipient, string][]
                        ).map(([key, label]) => (
                          <label key={key} className={styles.sendField}>
                            <span>{label}</span>
                            <input
                              type="text"
                              value={sending.recipient[key]}
                              maxLength={key === 'country_code' ? 2 : 200}
                              onChange={(event) =>
                                setSending({
                                  ref: order.ref,
                                  recipient: { ...sending.recipient, [key]: event.target.value },
                                })
                              }
                            />
                          </label>
                        ))}
                        <div className={styles.actions}>
                          <button type="submit" disabled={busy === order.ref}>
                            {busy === order.ref ? 'Sending…' : 'Send as a draft'}
                          </button>
                          <button type="button" onClick={() => setSending(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className={styles.actions}>
                      {order.status === 'paid' && order.printful_id === null && printful && !order.redacted_at && (
                        <button
                          type="button"
                          disabled={busy === order.ref || sending?.ref === order.ref}
                          onClick={() => setSending({ ref: order.ref, recipient: guessRecipient(order) })}
                        >
                          Send to Printful…
                        </button>
                      )}
                      {NEXT[order.status]
                        // In Printful, stepping back to Received would leave
                        // an order there this page no longer admits to.
                        .filter((step) => order.printful_id === null || step.to !== 'received')
                        .map((step) => (
                        <button
                          key={step.to}
                          type="button"
                          disabled={busy === order.ref}
                          onClick={() => void mark(order.ref, step.to)}
                        >
                          {step.label}
                        </button>
                      ))}
                      {!order.redacted_at && (
                        <button
                          type="button"
                          onClick={() => void copy(`${order.name}\n${order.address}`, 'Address')}
                        >
                          Copy address
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
