import Link from 'next/link';
import Sigil from '@/components/Sigil';

export default function NotFound() {
  return (
    <div
      className="shell"
      style={{
        textAlign: 'center',
        paddingBlock: 'clamp(80px, 16vw, 160px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <Sigil size={56} color="var(--gold)" opacity={0.5} />
      <p className="eyebrow" style={{ margin: 0 }}>
        404
      </p>
      <h1 className="section-title" style={{ margin: 0 }}>
        Nothing here
      </h1>
      <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '42ch' }}>
        That page doesn&rsquo;t exist — or it moved when the site was rebuilt.
      </p>
      <Link
        href="/"
        style={{
          border: '1px solid var(--gold)',
          padding: '12px 26px',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginTop: '8px',
        }}
      >
        Back home
      </Link>
    </div>
  );
}
