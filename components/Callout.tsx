import styles from './Callout.module.css';

// A boxed aside inside a post body.
//
//   <Callout type="warning" title="This one is permanent">
//   Text.
//   </Callout>
//
// Written for the BioShock walkthrough, where a warning genuinely needs to stop
// a reader — "do not kill Sander Cohen" is a different kind of sentence from
// the paragraph around it, and setting it in the same grey prose is how someone
// skims past it and loses two achievements.
//
// Three kinds and no more. A palette of eight boxes is a design that has given
// up deciding what matters.

const KINDS = {
  note: { label: 'Note', colour: 'oklch(74% 0.15 250)' },
  tip: { label: 'Tip', colour: 'oklch(80% 0.17 145)' },
  warning: { label: 'Careful', colour: 'oklch(76% 0.19 45)' },
} as const;

export default function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: keyof typeof KINDS;
  title?: string;
  children?: React.ReactNode;
}) {
  const kind = KINDS[type] ?? KINDS.note;

  return (
    <aside
      className={styles.callout}
      style={{ '--kind': kind.colour } as React.CSSProperties}
    >
      <p className={styles.label}>{title ?? kind.label}</p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
