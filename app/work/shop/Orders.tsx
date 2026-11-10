'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { orderWaiting } from '@/lib/order-waiting';
import styles from './orders.module.css';
import ui from '../ui.module.css';

// The orders, from D1 through /work/api/orders.
//
// An order is written when the customer submits the address form, BEFORE they
// reach PayFast, so a Received order is a filled-in form and not a sale. Paid
// is his mark, made after seeing the money in PayFast, or PayFast's own when
// its notice comes through. Hence Received sits in Needs you: it wants
// checking against PayFast.
//
// Laid out by what he does next — his pick, 2026-11-10 (redesign page, Shop
// orders: A). Three groups, Needs you, On its way and Done, with Dismissed
// behind a link; tapping an order opens a bottom sheet on a phone and the
// right-hand pane on a computer, with the few facts that decide the next step
// and one gold button for it. Every other step and the full detail list are
// under More.
//
// DRESSED AS THE PUBLIC SITE, his call, 2026-11-10 (design pass: the public
// site's styling, the CRM's desktop layout). On a computer a row of tiles
// counts what is on the page already (no request of its own), then the list
// in one panel and the open order in a second beside it, which stays in view.
// What waits on him has an accent hairline all round, the open one the
// accent fill; never a side stripe. On a phone the structure is as it was.
//
// Personal details are blanked 30 days after an order is submitted — his
// ruling, 2026-10-19 — so an old order shows what sold and not who bought it.

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

/*
 * Which group an order sits in: what he does next with it. His pick,
 * 2026-11-10 (redesign page, Shop orders: A) — three groups in place of the
 * six filter pills. Needs you is exactly `waiting` below; On its way is a
 * paid order already with Printful and not his move; Done is fulfilled.
 * Dismissed is a fourth, kept behind a link under Done, because a form that
 * was never paid for is not something he needs to see by default.
 */
type Group = 'needs' | 'way' | 'done' | 'dismissed';

const GROUPS: { key: Group; name: string; empty?: string }[] = [
  { key: 'needs', name: 'Needs you', empty: 'Nothing waiting on you.' },
  { key: 'way', name: 'On its way' },
  { key: 'done', name: 'Done' },
  { key: 'dismissed', name: 'Dismissed' },
];

function groupOf(order: Order): Group {
  if (waiting(order)) return 'needs';
  if (order.status === 'paid') return 'way';
  if (order.status === 'fulfilled') return 'done';
  return 'dismissed';
}

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

/** Whether an order is waiting on him: the gold ones. See lib/order-waiting.ts. */
const waiting = (order: Order): boolean => orderWaiting(order);

/** The status as one short phrase, with where it is in Printful when that matters. */
function stateOf(order: Order): string {
  if (order.status === 'paid' && order.printful_status === 'draft') return 'Paid · confirm in Printful';
  if (order.status === 'paid' && order.printful_id !== null) return `Paid · Printful ${order.printful_status ?? ''}`.trim();
  if (order.status === 'paid') return 'Paid · to send';
  return LABEL[order.status];
}

/** The one big next step for an order, if it has one. */
type Primary = { kind: 'send' } | { kind: 'mark'; to: Status; label: string } | null;

/*
 * One gold button per order (his pick, 2026-11-10, Shop orders: A). Received:
 * Mark paid. Paid and not yet sent: Send to Printful where Printful is set up
 * and the address is still there, Mark fulfilled otherwise. An order already
 * with Printful has no button of its own, because the next move is Printful's
 * or is made in Printful; Mark fulfilled for it is under More.
 */
function primaryOf(order: Order, printful: boolean): Primary {
  if (order.status === 'received') return { kind: 'mark', to: 'paid', label: 'Mark paid' };
  if (order.status === 'paid' && order.printful_id === null) {
    return printful && !order.redacted_at
      ? { kind: 'send' }
      : { kind: 'mark', to: 'fulfilled', label: 'Mark fulfilled' };
  }
  return null;
}

/** Where an order without a gold button stands, in a line. */
function hintOf(order: Order): string | null {
  if (order.status === 'paid' && order.printful_status === 'draft') {
    return 'In Printful as a draft. Confirm it there to have it printed and charged.';
  }
  if (order.status === 'paid' && order.printful_id !== null) {
    return `With Printful (${order.printful_status ?? 'unknown'}). It is marked fulfilled when Printful ships it.`;
  }
  if (order.status === 'fulfilled') return `Fulfilled ${stamp(order.fulfilled_at)}.`;
  if (order.status === 'dismissed') return `Dismissed ${stamp(order.dismissed_at)}: never paid.`;
  return null;
}

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

/** The short date on a row: day and month only, as the row has no room for more. */
const day = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  day: 'numeric',
  month: 'short',
});

function stamp(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : when.format(date);
}

function shortStamp(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : day.format(date);
}

function amountOf(order: Order): string {
  if (order.total !== null) return `R${order.total}`;
  return order.price;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /** Whether the search box is out. It hides behind the ⌕ until wanted. */
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [showDismissed, setShowDismissed] = useState(false);
  /** The order open in the sheet (phone) or the right-hand pane (computer). */
  const [open, setOpen] = useState<string | null>(null);
  /** Whether the open order's More section is out. Shut again for each order. */
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  /** The order whose Send form is open, and what it holds. */
  const [sending, setSending] = useState<{ ref: string; recipient: Recipient } | null>(null);
  const [printful, setPrintful] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  /* The tiles over the list on a computer, from the orders already here. */
  const tally = useMemo(() => {
    const out = { needs: 0, unsent: 0, way: 0, fulfilled: 0 };
    for (const order of orders ?? []) {
      if (waiting(order)) out.needs += 1;
      if (order.status === 'paid' && order.printful_id === null) out.unsent += 1;
      if (groupOf(order) === 'way') out.way += 1;
      if (order.status === 'fulfilled') out.fulfilled += 1;
    }
    return out;
  }, [orders]);

  /* Search runs across every group, dismissed included: looking for a name
     is looking everywhere. Here rather than in SQL, as the list is tens of
     rows and arrives in one request. */
  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const out: Record<Group, Order[]> = { needs: [], way: [], done: [], dismissed: [] };
    for (const order of orders ?? []) {
      if (
        needle &&
        ![order.ref, order.name, order.email, order.product, order.size, order.phone, order.address]
          .join('\n')
          .toLowerCase()
          .includes(needle)
      ) {
        continue;
      }
      out[groupOf(order)].push(order);
    }
    return out;
  }, [orders, query]);

  const current = open ? (orders ?? []).find((order) => order.ref === open) ?? null : null;

  function choose(ref: string | null) {
    setOpen(ref);
    setMore(false);
    if (sending && sending.ref !== ref) setSending(null);
  }

  function close() {
    const was = open;
    choose(null);
    // Back to the row it came from, so the keyboard does not lose its place.
    if (was) {
      requestAnimationFrame(() =>
        listRef.current?.querySelector<HTMLButtonElement>(`[data-ref="${CSS.escape(was)}"]`)?.focus(),
      );
    }
  }

  // Focus the open order's heading, so a screen reader and the keyboard both
  // land in it, on the phone's sheet as on the computer's pane.
  useEffect(() => {
    if (open) headRef.current?.focus();
  }, [open]);

  // Esc shuts the open order — unless the Send form is open, where Esc
  // would be an easy way to lose a corrected address.
  useEffect(() => {
    if (!open || sending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (document.activeElement === searchRef.current) return;
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

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

  const searchingFor = query.trim() !== '';
  const matched = GROUPS.reduce((sum, g) => sum + grouped[g.key].length, 0);

  function row(order: Order) {
    const selected = open === order.ref;
    return (
      <li key={order.ref}>
        <button
          type="button"
          data-ref={order.ref}
          className={`${styles.row} ${styles[order.status] ?? ''}`}
          data-waiting={waiting(order) || undefined}
          aria-current={selected || undefined}
          onClick={() => (selected ? close() : choose(order.ref))}
        >
          <span className={styles.rowRef}>{order.ref}</span>
          <span className={`${waiting(order) ? ui.chipAccent : ui.chip} ${styles.rowChip}`}>{stateOf(order)}</span>
          <span className={styles.rowWhat}>
            {order.redacted_at ? 'Details removed' : order.name} · {order.product || 'Unknown product'} ·{' '}
            {order.size}
            {amountOf(order) ? ` · ${amountOf(order)}` : ''}
          </span>
          <span className={styles.rowWhen}>{shortStamp(order.created_at)}</span>
        </button>
      </li>
    );
  }

  const tiles = [
    { key: 'needs', name: 'Needs you', n: tally.needs, sub: 'to check, send or confirm', lit: true },
    { key: 'unsent', name: 'Paid, not sent', n: tally.unsent, sub: 'not yet with Printful', lit: true },
    { key: 'way', name: 'On its way', n: tally.way, sub: 'with Printful', lit: false },
    { key: 'done', name: 'Fulfilled', n: tally.fulfilled, sub: `of ${orders.length} in all`, lit: false },
  ];

  return (
    <div className={styles.orders}>
      {/* A computer only; the phone keeps its one line of counts. */}
      <ul className={styles.tiles} aria-label="Orders at a glance">
        {tiles.map((tile) => (
          <li key={tile.key} className={styles.tile}>
            <span className={styles.tileK}>
              <i className={tile.lit && tile.n > 0 ? styles.dotOn : styles.dot} /> {tile.name}
            </span>
            <span className={styles.tileV}>{tile.n}</span>
            <span className={styles.tileS}>{tile.sub}</span>
          </li>
        ))}
      </ul>

      <div className={styles.layout} data-open={current ? '' : undefined}>
        <div className={styles.listSide} ref={listRef}>
          <div className={styles.toolbar}>
            <p className={styles.counts}>
              {orders.length} order{orders.length === 1 ? '' : 's'}
              <span className={styles.sep}>·</span>
              {counts.fulfilled} fulfilled
            </p>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={searching ? 'Close search' : 'Search orders'}
              aria-expanded={searching}
              onClick={() => {
                if (searching) setQuery('');
                setSearching(!searching);
              }}
            >
              {searching ? '×' : '⌕'}
            </button>
          </div>

          {searching && (
            <input
              ref={searchRef}
              type="search"
              className={styles.search}
              placeholder="Search name, email, reference…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setQuery('');
                  setSearching(false);
                }
              }}
              aria-label="Search orders"
            />
          )}

          {/* The note sits with the open order when there is one, which on a
              phone is the only thing on screen. */}
          {note && !current && <p className={styles.message}>{note}</p>}

          {orders.length === 0 ? (
            <p className={styles.message}>
              No orders yet. One appears here the moment a customer submits the address form.
            </p>
          ) : searchingFor && matched === 0 ? (
            <p className={styles.message}>Nothing matches.</p>
          ) : (
            GROUPS.map((group) => {
              const list = grouped[group.key];
              // Dismissed is behind its link unless a search is looking for it.
              if (group.key === 'dismissed' && !showDismissed && !searchingFor) return null;
              // Needs you always shows, so "nothing waiting" is said out loud;
              // an empty other group is just left out.
              if (list.length === 0 && (group.key !== 'needs' || searchingFor)) return null;
              return (
                <section key={group.key} className={styles.group} aria-label={group.name}>
                  <h2 className={group.key === 'needs' && list.length > 0 ? styles.groupHeadGold : styles.groupHead}>
                    {group.name} · {list.length}
                  </h2>
                  {list.length === 0 ? (
                    <p className={styles.groupEmpty}>{group.empty}</p>
                  ) : (
                    <ul className={styles.rows}>{list.map(row)}</ul>
                  )}
                </section>
              );
            })
          )}

          {!searchingFor && counts.dismissed > 0 && (
            <button type="button" className={ui.quiet} onClick={() => setShowDismissed(!showDismissed)}>
              {showDismissed ? 'Hide dismissed' : `Show dismissed (${counts.dismissed})`}
            </button>
          )}
        </div>

        {/* The phone's dimmed backdrop; a click on it shuts the sheet. Not shown
            on a computer, where the pane sits beside the list. */}
        {current && <div className={styles.backdrop} onClick={close} aria-hidden="true" />}

        <div className={styles.pane} role="region" aria-label={current ? `Order ${current.ref}` : 'Open order'}>
          {current ? (
            detail(current)
          ) : (
            <p className={styles.paneEmpty}>Pick an order to see it here.</p>
          )}
        </div>
      </div>
    </div>
  );

  function detail(order: Order) {
    const primary = primaryOf(order, printful);
    const hint = primary ? null : hintOf(order);
    const steps = NEXT[order.status]
      // In Printful, stepping back to Received would leave an order there
      // this page no longer admits to.
      .filter((step) => order.printful_id === null || step.to !== 'received')
      // The gold button's step is not repeated under More.
      .filter((step) => !(primary?.kind === 'mark' && primary.to === step.to));
    const isSending = sending?.ref === order.ref;

    return (
      <div className={styles.sheet}>
        <div className={styles.grab} aria-hidden="true" />
        <div className={styles.sheetHead}>
          <h2 ref={headRef} tabIndex={-1} className={styles.sheetRef}>
            {order.ref}
          </h2>
          <span className={waiting(order) ? ui.chipAccent : ui.chip}>
            {stateOf(order)}
          </span>
          <button type="button" className={styles.iconButton} aria-label="Close" onClick={close}>
            ×
          </button>
        </div>

        {/* Only the facts that decide the next step. The rest is under More. */}
        <dl className={styles.kv}>
          <dt>Customer</dt>
          <dd>{order.redacted_at ? <span className={styles.muted}>Details removed</span> : order.name}</dd>
          <dt>Item</dt>
          <dd>
            {order.product || 'Unknown product'} · {order.size}
          </dd>
          {(order.total !== null || order.price) && (
            <>
              <dt>Charged</dt>
              <dd>
                {order.total !== null
                  ? `R${order.total} (R${order.item_amount} + R${order.shipping_amount} delivery)`
                  : order.price}
              </dd>
            </>
          )}
          {!order.redacted_at && (
            <>
              <dt>To</dt>
              <dd className={styles.address}>{order.address}</dd>
            </>
          )}
          {order.paid_at && (
            <>
              <dt>Paid</dt>
              <dd>{stamp(order.paid_at)}</dd>
            </>
          )}
          {!order.paid_at && (
            <>
              <dt>Submitted</dt>
              <dd>{stamp(order.created_at)}</dd>
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

        {note && <p className={styles.sheetNote}>{note}</p>}

        {isSending ? (
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
            <div className={styles.sendActions}>
              <button type="submit" className={`${ui.primary} ${styles.wide}`} disabled={busy === order.ref}>
                {busy === order.ref ? 'Sending…' : 'Send as a draft'}
              </button>
              <button type="button" className={`${ui.button} ${styles.wide}`} onClick={() => setSending(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : primary ? (
          <button
            type="button"
            className={`${ui.primary} ${styles.wide}`}
            disabled={busy === order.ref}
            onClick={() =>
              primary.kind === 'send'
                ? setSending({ ref: order.ref, recipient: guessRecipient(order) })
                : void mark(order.ref, primary.to)
            }
          >
            {busy === order.ref ? 'Saving…' : primary.kind === 'send' ? 'Send to Printful…' : primary.label}
          </button>
        ) : (
          hint && <p className={styles.hint}>{hint}</p>
        )}

        <div className={styles.sheetLinks}>
          {!order.redacted_at ? (
            <button
              type="button"
              className={ui.quiet}
              onClick={() => void copy(`${order.name}\n${order.address}`, 'Address')}
            >
              Copy address
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className={ui.quiet}
            aria-expanded={more}
            onClick={() => setMore(!more)}
          >
            More {more ? '▴' : '▾'}
          </button>
        </div>

        {more && (
          <div className={styles.more}>
            {steps.length > 0 && (
              <div className={styles.actions}>
                {steps.map((step) => (
                  <button
                    key={step.to}
                    type="button"
                    className={ui.button}
                    disabled={busy === order.ref}
                    onClick={() => void mark(order.ref, step.to)}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            )}

            <dl className={styles.fields}>
              <dt>Reference</dt>
              <dd className={styles.ref}>{order.ref}</dd>
              {order.redacted_at ? (
                <>
                  <dt>Customer</dt>
                  <dd className={styles.muted}>Removed {stamp(order.redacted_at)}, 30 days after the order.</dd>
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
            </dl>
          </div>
        )}
      </div>
    );
  }
}
