import styles from './Split.module.css';

// An image beside a block of text, for use inside MDX bodies.
//
//   <Split src="/projects/terrath-a.webp" side="right">
//   Some prose, which stays MDX and can contain links and emphasis.
//   </Split>
//
// The project pages previously had one large image at the top and nothing
// after it, which anchors a page but does nothing to break up what follows.
// This puts art next to the paragraph it belongs to instead, and pages use
// different numbers and sides so the set does not read as a template.
//
// Stacks to image-then-text on narrow screens regardless of `side`: text under
// its own image is the order that makes sense when there is only one column,
// and alternating it just makes a phone feel disorganised.

export default function Split({
  src,
  alt = '',
  side = 'right',
  children,
}: {
  src: string;
  /** Defaults to empty: the art beside prose is decorative, and the prose
      already says what the reader needs. Set it when the image carries
      information the text does not. */
  alt?: string;
  /** Which side the image sits on at desktop widths. */
  side?: 'left' | 'right';
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.split} data-side={side}>
      <figure className={styles.art}>
        <img
          src={src}
          alt={alt}
          width={1200}
          height={900}
          loading="lazy"
          decoding="async"
        />
      </figure>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
