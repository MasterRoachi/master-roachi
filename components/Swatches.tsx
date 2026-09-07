import type { ProductColor } from '@/lib/store';
import styles from './Swatches.module.css';

/**
 * The colourways a garment comes in.
 *
 * Colour is never carried by the swatch alone. A dot on its own is unreadable
 * to anyone who cannot distinguish it — and "Black Heather" and "Black" are a
 * pair no swatch separates anyway — so the name is always present: spelled out
 * when there is one colour, and on each dot's tooltip and accessible label
 * when there are several.
 *
 * A colour with no hex still gets a dot, drawn as an empty ring. Printful's
 * catalogue is missing codes here and there, and dropping the colour entirely
 * would understate what is for sale.
 */
export default function Swatches({
  colors,
  compact = false,
}: {
  colors: ProductColor[];
  compact?: boolean;
}) {
  if (colors.length === 0) return null;

  const dots = colors.map((c) => (
    <span
      key={c.name}
      className={styles.dot}
      style={c.hex ? { background: c.hex } : undefined}
      data-empty={c.hex ? undefined : true}
      title={c.name}
    />
  ));

  // A span, not a paragraph: on a grid card this renders inside the card's
  // own <span>, which may only contain phrasing content. The flex layout
  // comes from the stylesheet either way.
  return (
    <span className={styles.row} data-compact={compact || undefined}>
      <span className={styles.dots} aria-hidden="true">
        {dots}
      </span>
      <span className={styles.label}>
        {colors.length <= 3
          ? colors.map((c) => c.name).join(', ')
          : `${colors.length} colours`}
      </span>
    </span>
  );
}
