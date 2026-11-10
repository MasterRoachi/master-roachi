// /api/enquiry — the contact form on /hire.
//
// The enquiry is checked here and handed straight to the CRM over a Service
// Binding. Nothing about the person is stored on this side, in D1, KV or a
// log: the CRM is where prospects live, under its consent ledger.
//
// Off until all four are in place: ENQUIRIES = "on", the LEADS binding,
// TURNSTILE_SECRET and TURNSTILE_SITE_KEY. GET says whether it is, and the
// form shows itself only then, so the page works the same while it is off.
// Switching on waits on the privacy notice being live at /privacy.

import { ENQUIRY_LIMITS as LIMITS, type Enquiry, type EnquiryResult, type LeadsRpc } from './enquiry-rpc';

/** The browser makes one per submission and sends it again on a retry, so the
    CRM records a resent form once. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface EnquiryEnv {
  ENQUIRIES?: string;
  LEADS?: LeadsRpc;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
}

const MAX_BYTES = 8192;
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits, spaces, a leading +, brackets and dashes. The CRM normalises it.
const PHONE = /^\+?[0-9 ()-]{9,40}$/;

function answer(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function text(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > max ? null : trimmed;
}

export function enquiriesOn(env: EnquiryEnv): boolean {
  return env.ENQUIRIES === 'on' && !!env.LEADS && !!env.TURNSTILE_SECRET && !!env.TURNSTILE_SITE_KEY;
}

/** What the form needs to know, and nothing else. */
export function enquiryStatus(env: EnquiryEnv): Response {
  return enquiriesOn(env)
    ? answer({ configured: true, siteKey: env.TURNSTILE_SITE_KEY }, 200)
    : answer({ configured: false }, 200);
}

const TRY_AGAIN = 'That did not go through. Try again in a minute, or email roachi@masterroachi.com.';

export async function handleEnquiry(request: Request, env: EnquiryEnv): Promise<Response> {
  if (request.method === 'GET') return enquiryStatus(env);
  if (request.method !== 'POST') return answer({ error: 'POST only.' }, 405);
  if (!enquiriesOn(env)) return answer({ error: 'The form is not switched on yet.' }, 503);

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return answer({ error: 'That is too long.' }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return answer({ error: 'Expected a JSON body.' }, 400);
  }

  // A field no person sees. Anything filled in here is a bot: thank it and
  // send nothing on.
  if (typeof body.nickname === 'string' && body.nickname.trim() !== '') {
    return answer({ sent: true }, 200);
  }

  const enquiryId = typeof body.enquiryId === 'string' ? body.enquiryId : '';
  if (!UUID.test(enquiryId)) return answer({ error: 'Reload the page and try again.' }, 400);

  const name = text(body.name, LIMITS.name);
  const business = text(body.business, LIMITS.business);
  const email = text(body.email, LIMITS.email);
  const phone = text(body.phone, LIMITS.phone);
  const website = text(body.website, LIMITS.website);
  const message = text(body.message, LIMITS.message);
  if (!name || !business || !email || !message) {
    return answer({ error: 'Your name, business, email and a message are all needed.' }, 400);
  }
  if (phone === null || website === null) return answer({ error: 'One of the fields is too long.' }, 400);
  if (!EMAIL.test(email)) return answer({ error: 'That email address does not look right.' }, 400);
  if (phone && !PHONE.test(phone)) return answer({ error: 'That phone number does not look right.' }, 400);
  if (website) {
    let ok = false;
    try {
      ok = ['http:', 'https:'].includes(new URL(website).protocol);
    } catch {
      ok = false;
    }
    if (!ok) return answer({ error: 'The website should start with http:// or https://.' }, 400);
  }

  // Cloudflare's own check that a person sent this, asked of Cloudflare.
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) return answer({ error: 'Please complete the check above the button.' }, 400);
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET as string, response: token });
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) form.set('remoteip', ip);
  const human = await fetch(SITEVERIFY, { method: 'POST', body: form, signal: AbortSignal.timeout(10000) })
    .then(async (r) => (r.ok ? ((await r.json()) as { success?: boolean }).success === true : false))
    .catch(() => false);
  if (!human) return answer({ error: 'The check did not pass. Reload the page and try again.' }, 400);

  const enquiry: Enquiry = {
    enquiryId,
    name,
    email,
    business,
    message,
    ...(phone ? { phone } : {}),
    ...(website ? { website } : {}),
    consent: { version: 'web-v1', given: body.marketing === true, at: new Date().toISOString() },
    source: 'masterroachi.com/hire',
  };

  let result: EnquiryResult;
  try {
    result = await (env.LEADS as LeadsRpc).createEnquiry(enquiry);
  } catch {
    return answer({ error: TRY_AGAIN }, 502);
  }
  if (result.ok) return answer({ sent: true }, 200);
  return result.retry
    ? answer({ error: TRY_AGAIN }, 502)
    : answer({ error: 'Something in the form was not accepted. Check it and try again, or email roachi@masterroachi.com.' }, 400);
}
