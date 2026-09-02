import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="shell"
      style={{ paddingBlock: 'clamp(96px, 18vw, 200px)' }}
    >
      <p className="eyebrow">404</p>
      <h1 style={{ fontSize: 'var(--step-hero)', margin: '0 0 24px', maxWidth: '16ch' }}>
        There&rsquo;s nothing here.
      </h1>
      <p className="lede" style={{ marginBottom: '40px' }}>
        That page doesn&rsquo;t exist, or it moved when the site was rebuilt.
      </p>
      <Link href="/" className="button button--accent">
        Back home
      </Link>
    </div>
  );
}
