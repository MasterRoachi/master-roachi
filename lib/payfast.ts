// PayFast's checkout signature and its payment notification, as pure code.
//
// Taken from PayFast's own PHP SDK (github.com/Payfast/payfast-php-sdk,
// lib/Auth.php and lib/PaymentIntegrations/Notification.php), because the
// rules are fussy and a signature that is wrong by one character fails with
// nothing but "signature mismatch":
//
//   CHECKOUT  The fields in PayFast's documented order — NOT sorted — skipping
//             empty ones, each `key=urlencode(trim(value))`, joined with `&`,
//             then `&passphrase=urlencode(trim(passphrase))`. MD5 of that.
//   NOTIFY    The fields in the order they were POSTed, up to `signature`,
//             each `key=urlencode(value)`, then the passphrase the same way.
//             MD5 again.
//
// `urlencode` here is PHP's: spaces become `+`, and everything but letters,
// digits and `-_.` is percent-encoded with upper-case hex — which is not what
// encodeURIComponent does with `!'()*~`.
//
// MD5 is written out below rather than taken from WebCrypto: Cloudflare's
// WebCrypto has it, Node's (which runs the tests) does not, and the one place
// a disagreement between the two would show is a customer's payment.

/** PHP's urlencode(). */
export function phpUrlencode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+');
}

/** The checkout fields PayFast signs, in the order it signs them. */
export const CHECKOUT_FIELDS = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
] as const;

export type CheckoutField = (typeof CHECKOUT_FIELDS)[number];

/** The fields of a checkout, in signing order, with its signature last. */
export function signCheckout(
  fields: Partial<Record<CheckoutField, string>>,
  passphrase: string,
): [string, string][] {
  const ordered = CHECKOUT_FIELDS.filter((key) => (fields[key] ?? '').trim() !== '').map(
    (key) => [key, (fields[key] as string).trim()] as [string, string],
  );
  let base = ordered.map(([key, value]) => `${key}=${phpUrlencode(value)}`).join('&');
  if (passphrase.trim()) base += `&passphrase=${phpUrlencode(passphrase.trim())}`;
  return [...ordered, ['signature', md5(base)]];
}

/**
 * A payment notification's own fields as PayFast signed them: everything
 * before `signature`, in the order received. Also exactly what is posted
 * back to /eng/query/validate.
 */
export function notificationString(entries: [string, string][]): string {
  const parts: string[] = [];
  for (const [key, value] of entries) {
    if (key === 'signature') break;
    parts.push(`${key}=${phpUrlencode(value)}`);
  }
  return parts.join('&');
}

export function notificationSigned(entries: [string, string][], passphrase: string): boolean {
  const given = entries.find(([key]) => key === 'signature')?.[1];
  if (!given) return false;
  let base = notificationString(entries);
  if (passphrase) base += `&passphrase=${phpUrlencode(passphrase)}`;
  return md5(base) === given;
}

/** Where the checkout form posts, and where a notification is confirmed. */
export function payfastHost(sandbox: boolean): string {
  return sandbox ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';
}

/** Rands as PayFast wants an amount: two decimals, a dot, no grouping. */
export function amountString(rands: number): string {
  return rands.toFixed(2);
}

// --- MD5 (RFC 1321), over the UTF-8 bytes of a string -----------------------

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const length = bytes.length;
  const padded = new Uint8Array((((length + 8) >>> 6) + 1) * 64);
  padded.set(bytes);
  padded[length] = 0x80;
  const bits = length * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bits >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bits / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const m = Array.from({ length: 16 }, (_, i) => view.getUint32(offset + i * 4, true));
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const sum = (a + f + K[i] + m[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << S[i]) | (sum >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [a0, b0, c0, d0]
    .map((word) =>
      Array.from({ length: 4 }, (_, i) => ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')).join(''),
    )
    .join('');
}
