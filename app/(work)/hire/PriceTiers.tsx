'use client';

import { useState } from 'react';
import styles from './hire.module.css';

// The four priced kinds of job on both hire tabs, restyled 18 Nov 2026 to
// match the support cards: the number large, the words short.
//
// Websites sells each build two ways, once-off or monthly with nothing
// upfront (outreach docs/PLAN.md §1.1), and a switch shows one way at a time,
// each with its own number and its own terms (his ask, the same day). Software
// has one way, so it gets no switch. Every card shares the same rows
// (subgrid), so the names, prices, terms, lists and buttons line up.

type Price = {
  /** Over the number: "From", "A month". */
  label: string;
  /** Rand, without the R: "3,950". */
  amount: string;
  /** After the number, small: "/month". */
  unit?: string;
  /** One line of terms under the number. */
  note: string;
};

export type Tier = {
  name: string;
  for: string;
  gets: string[];
  pick?: boolean;
  once: Price;
  monthly?: Price;
};

type Mode = 'once' | 'monthly';

export default function PriceTiers({
  tiers,
  small,
  cta,
}: {
  tiers: Tier[];
  /** The small print under the cards, per way of paying. */
  small: Partial<Record<Mode, string>> & { once: string };
  cta: string;
}) {
  const [mode, setMode] = useState<Mode>('once');
  const switchable = tiers.some((t) => t.monthly);

  return (
    <>
      {switchable && (
        <div className={styles.payWay} role="group" aria-label="How to pay">
          <button type="button" aria-pressed={mode === 'once'} onClick={() => setMode('once')}>
            Once-off
          </button>
          <button type="button" aria-pressed={mode === 'monthly'} onClick={() => setMode('monthly')}>
            Monthly
            <span>nothing upfront</span>
          </button>
        </div>
      )}

      <ul className={styles.tiers} data-mode={mode}>
        {tiers.map((t) => {
          const p = (mode === 'monthly' && t.monthly) || t.once;
          return (
            <li key={t.name} className={`${styles.tier} ${t.pick ? styles.pick : ''}`}>
              {t.pick && <span className={`${styles.careTag} ${styles.tierTag}`}>Recommended</span>}
              <p className={styles.tierName}>{t.name}</p>
              <p className={styles.for}>{t.for}</p>
              {/* Keyed by the way of paying, so the number fades in afresh on a switch. */}
              <div className={styles.price} key={mode}>
                <span className={styles.from}>{p.label}</span>
                <span className={styles.amount}>
                  <span className={styles.careRand}>R</span>
                  {p.amount}
                  {p.unit && <span className={styles.careMonth}>{p.unit}</span>}
                </span>
              </div>
              <p className={styles.terms}>{p.note}</p>
              <ul className={styles.gets}>
                {t.gets.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <a className={`${styles.btn} ${t.pick ? styles.primary : ''}`} href="#contact">
                {cta}
              </a>
            </li>
          );
        })}
      </ul>
      <p className={styles.small}>{small[mode] ?? small.once}</p>
    </>
  );
}
