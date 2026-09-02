import styles from './Logo.module.css';

// The brand mark: line-art portrait with the Orthodox cross on the hoodie.
//
// Served as WebP with a PNG fallback. The source is a 1305x1206 / 666KB PNG,
// which is larger than the entire JS bundle — static export does no image
// optimisation, so the variants in public/ are pre-generated (see
// scripts/logo.mjs) and the raw file is deliberately not shipped.
export default function Logo({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Intrinsic aspect of the trimmed mark, 128x117.
  const width = Math.round(size * (128 / 117));

  return (
    <picture>
      <source srcSet="/logo-mark.webp" type="image/webp" />
      <img
        src="/logo-mark.png"
        alt=""
        width={width}
        height={size}
        className={`${styles.logo} ${className ?? ''}`}
        decoding="async"
      />
    </picture>
  );
}
