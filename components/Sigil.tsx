// The site's recurring mark — a diamond/compass sigil. Used small in the nav,
// huge and faint as a hero watermark, tiny on card corners, and as the
// section-divider motif. One shape reused everywhere, rather than a different
// generic icon per spot. See SPEC.md "Visual Direction".
//
// SPEC open item: this is slated to be swapped for an Orthodox cross later.
// Every use goes through this component, so that swap is a one-file change.

interface SigilProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  /** `full` adds the crosshair + centre dot; `mark` is the outline alone. */
  variant?: 'full' | 'mark';
  className?: string;
}

export default function Sigil({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.3,
  opacity = 1,
  variant = 'full',
  className,
}: SigilProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      style={{ opacity }}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14 2 L24 14 L14 26 L4 14 Z" />
      {variant === 'full' && (
        <>
          <path d="M14 9 L14 19 M9 14 L19 14" />
          <circle cx="14" cy="14" r="1.8" fill={color} stroke="none" />
        </>
      )}
    </svg>
  );
}
