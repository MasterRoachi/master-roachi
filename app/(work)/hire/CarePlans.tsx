import styles from './hire.module.css';

// The monthly plans on both hire tabs, drawn alike (his ask, 18 Nov 2026:
// "the numbers large, with short descriptions"). The price leads, big, in the
// tab's colour; then two figures that tell the plans apart (time a month and
// how soon it is done); then one short line. A plan can be marked as the one
// recommended, which Websites does and Software does not: its three are for
// three different kinds of product.

export type Plan = {
  name: string;
  /** Rand a month, without the R: "290". */
  price: string;
  time: string;
  done: string;
  what: string;
  pick?: boolean;
};

export default function CarePlans({ plans }: { plans: Plan[] }) {
  return (
    <ul className={styles.care}>
      {plans.map((p) => (
        <li key={p.name} className={p.pick ? styles.carePick : undefined}>
          <p className={styles.careName}>
            {p.name}
            {p.pick && <span className={styles.careTag}>Recommended</span>}
          </p>
          <p className={styles.carePrice}>
            <span className={styles.careRand}>R</span>
            {p.price}
            <span className={styles.careMonth}>/month</span>
          </p>
          <dl className={styles.careSpecs}>
            <div>
              <dt>Changes</dt>
              <dd>{p.time}</dd>
            </div>
            <div>
              <dt>Done</dt>
              <dd>{p.done}</dd>
            </div>
          </dl>
          <p className={styles.careWhat}>{p.what}</p>
        </li>
      ))}
    </ul>
  );
}
