'use client';

import { useState } from 'react';
import type { SizeGuide } from '@/lib/store';
import styles from './SizeTable.module.css';

/**
 * Garment measurements, laid flat, per size.
 *
 * Printful publishes these in centimetres. The conversion to inches is exact
 * arithmetic on a number already rounded by the supplier, so it is done here
 * rather than fetched twice — and the toggle exists because this store prices
 * in dollars and ships worldwide while being run from South Africa. Guessing
 * which unit the reader wants would be wrong for most of them.
 */
function show(cm: number | null, inches: boolean): string {
  if (cm == null) return '—';
  return inches ? (cm / 2.54).toFixed(1) : cm.toFixed(1);
}

function cell(
  v: { value: number | null; min: number | null; max: number | null },
  inches: boolean,
): string {
  // Length is one figure; anything measured around the body is a range.
  if (v.min != null && v.max != null) {
    return `${show(v.min, inches)}–${show(v.max, inches)}`;
  }
  return show(v.value, inches);
}

export default function SizeTable({
  guide,
  sizes,
}: {
  guide: SizeGuide;
  sizes: string[];
}) {
  const [inches, setInches] = useState(false);
  const unit = inches ? 'in' : 'cm';

  // Only sizes the guide actually measures, in the order the product lists
  // them — a guide covering a size that is not for sale would be noise.
  const rows = sizes.filter((size) =>
    guide.measurements.some((m) => m.values.some((v) => v.size === size)),
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.note}>
          The garment measured flat, not a body. Compare it against a shirt you
          already own.
        </p>
        <div className={styles.toggle} role="group" aria-label="Units">
          <button
            type="button"
            onClick={() => setInches(false)}
            aria-pressed={!inches}
          >
            cm
          </button>
          <button
            type="button"
            onClick={() => setInches(true)}
            aria-pressed={inches}
          >
            in
          </button>
        </div>
      </div>

      {/* The table can outgrow a phone, so it scrolls inside its own box
          rather than pushing the page sideways. */}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Garment measurements in {inches ? 'inches' : 'centimetres'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Size</th>
              {guide.measurements.map((m) => (
                <th key={m.label} scope="col">
                  {m.label} <span className={styles.unit}>({unit})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((size) => (
              <tr key={size}>
                <th scope="row">{size}</th>
                {guide.measurements.map((m) => {
                  const v = m.values.find((x) => x.size === size);
                  return (
                    <td key={m.label}>{v ? cell(v, inches) : '—'}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
