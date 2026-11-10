'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './EnquiryForm.module.css';

// The contact form on /hire. The page is static, so whether the form is
// switched on is asked of the Worker (GET /api/enquiry): until it is, the page
// gives the email address instead and loads nothing from Cloudflare. See
// worker/enquiry.ts.

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void; theme?: string }): string;
      reset(id?: string): void;
    };
  }
}

const EMAIL = 'roachi@masterroachi.com';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type State =
  | { kind: 'checking' }
  | { kind: 'off' }
  | { kind: 'ready'; siteKey: string }
  | { kind: 'sent' };

function newId(): string {
  return crypto.randomUUID().toLowerCase();
}

export default function EnquiryForm() {
  const [state, setState] = useState<State>({ kind: 'checking' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  // One id per submission, kept across retries so the CRM records it once.
  const enquiryId = useRef<string>('');

  useEffect(() => {
    let live = true;
    fetch('/api/enquiry', { cache: 'no-store' })
      .then((r) => r.json())
      .then((b: { configured?: boolean; siteKey?: string }) => {
        if (!live) return;
        setState(b.configured && b.siteKey ? { kind: 'ready', siteKey: b.siteKey } : { kind: 'off' });
      })
      .catch(() => live && setState({ kind: 'off' }));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (state.kind !== 'ready' || !widget.current) return;
    const el = widget.current;
    const draw = () => {
      if (!window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: state.siteKey,
        theme: 'dark',
        callback: setToken,
        'expired-callback': () => setToken(''),
      });
    };
    if (window.turnstile) return draw();
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = draw;
    document.head.appendChild(script);
  }, [state]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    if (!enquiryId.current) enquiryId.current = newId();
    setBusy(true);
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enquiryId: enquiryId.current,
          name: data.get('name'),
          business: data.get('business'),
          email: data.get('email'),
          phone: data.get('phone'),
          website: data.get('website'),
          message: data.get('message'),
          marketing: data.get('marketing') === 'yes',
          nickname: data.get('nickname'),
          token,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { sent?: boolean; error?: string };
      if (res.ok && body.sent) {
        setState({ kind: 'sent' });
        return;
      }
      setError(body.error ?? `That did not go through. Try again, or email ${EMAIL}.`);
      // A token is good for one check only.
      setToken('');
      window.turnstile?.reset(widgetId.current);
    } catch {
      setError(`That did not go through. Check your connection and try again, or email ${EMAIL}.`);
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === 'checking') return <div className={styles.placeholder} aria-hidden="true" />;

  if (state.kind === 'off') {
    return (
      <div className={styles.off}>
        <p>
          Email me at <a href={`mailto:${EMAIL}`}>{EMAIL}</a> with your business&apos;s name and
          what you&apos;re after, and I&apos;ll get back to you.
        </p>
      </div>
    );
  }

  if (state.kind === 'sent') {
    return (
      <div className={styles.sent} role="status">
        <p className={styles.sentTitle}>Thanks, that&apos;s with me.</p>
        <p>I&apos;ll get back to you by email.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate={false}>
      <div className={styles.row}>
        <label htmlFor="enquiry-name">Your name</label>
        <input id="enquiry-name" name="name" required maxLength={100} autoComplete="name" />
      </div>
      <div className={styles.row}>
        <label htmlFor="enquiry-business">Business</label>
        <input id="enquiry-business" name="business" required maxLength={120} autoComplete="organization" />
      </div>
      <div className={styles.pair}>
        <div className={styles.row}>
          <label htmlFor="enquiry-email">Email</label>
          <input id="enquiry-email" name="email" type="email" required maxLength={254} autoComplete="email" />
        </div>
        <div className={styles.row}>
          <label htmlFor="enquiry-phone">
            Phone <span className={styles.optional}>optional</span>
          </label>
          <input id="enquiry-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </div>
      </div>
      <div className={styles.row}>
        <label htmlFor="enquiry-website">
          Current website <span className={styles.optional}>if you have one</span>
        </label>
        <input id="enquiry-website" name="website" type="url" maxLength={300} placeholder="https://" />
      </div>
      <div className={styles.row}>
        <label htmlFor="enquiry-message">What do you need?</label>
        <textarea id="enquiry-message" name="message" required maxLength={2000} rows={5} />
      </div>

      {/* Hidden from people, there for bots. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="enquiry-nickname">Leave this empty</label>
        <input id="enquiry-nickname" name="nickname" tabIndex={-1} autoComplete="off" />
      </div>

      <p className={styles.notice}>
        We&apos;ll use these details to answer your enquiry and, if you go ahead, to quote and work
        with you. Our <a href="/privacy/">privacy notice</a> explains how, and your rights.
      </p>
      <div className={styles.check}>
        <input id="enquiry-marketing" name="marketing" type="checkbox" value="yes" />
        <label htmlFor="enquiry-marketing">
          Yes, Master Roachi may also email me now and then about website services and offers. I can
          ask him to stop at any time.
        </label>
      </div>

      <div ref={widget} className={styles.widget} />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button className={styles.send} type="submit" disabled={busy || !token}>
        {busy ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
