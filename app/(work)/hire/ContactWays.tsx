import styles from './hire.module.css';

// The three ways in beside the form, on both hire tabs, restyled 18 Nov 2026
// to match the price and support cards: an icon in the tab's colour, what the
// way is, the number or address large enough to read off the screen, one
// short line. WhatsApp first and lit, as the business's chosen channel.

const PHONE = '076 389 4279';
const PHONE_INTL = '27763894279';
const EMAIL = 'roachi@masterroachi.com';

function Icon({ kind }: { kind: 'whatsapp' | 'call' | 'email' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'whatsapp' && <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z" />}
      {kind === 'call' && (
        <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
      )}
      {kind === 'email' && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      )}
    </svg>
  );
}

export default function ContactWays({ whatsappText, emailNote }: { whatsappText: string; emailNote: string }) {
  const ways = [
    {
      kind: 'whatsapp' as const,
      label: 'WhatsApp',
      value: PHONE,
      note: `Opens with “${whatsappText}” ready to send.`,
      href: `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(whatsappText)}`,
      primary: true,
    },
    { kind: 'call' as const, label: 'Call', value: PHONE, note: 'Weekdays, 8 to 5.', href: `tel:+${PHONE_INTL}` },
    { kind: 'email' as const, label: 'Email', value: EMAIL, note: emailNote, href: `mailto:${EMAIL}` },
  ];

  return (
    <div className={styles.ways}>
      {ways.map((w) => (
        <a
          key={w.kind}
          className={`${styles.way} ${w.primary ? styles.primaryWay : ''}`}
          href={w.href}
          rel={w.kind === 'whatsapp' ? 'noopener' : undefined}
        >
          <span className={styles.wayIcon}>
            <Icon kind={w.kind} />
          </span>
          <span className={styles.wayText}>
            <span className={styles.wayLabel}>{w.label}</span>
            <b>{w.value}</b>
            <span className={styles.wayNote}>{w.note}</span>
          </span>
          <span className={styles.wayArrow} aria-hidden="true">
            →
          </span>
        </a>
      ))}
      <p className={styles.reply}>
        <b>I reply within one working day</b>, usually the same day.
      </p>
    </div>
  );
}
