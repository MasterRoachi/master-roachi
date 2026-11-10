import styles from './Screens.module.css';

// A site as it really looks: the desktop view in a plain browser frame, and
// the phone view beside it. For client pages inside MDX bodies.
//
//   <Screens
//     desktop="/projects/prodromos/shop.webp"
//     phone="/projects/prodromos/home-phone.webp"
//     alt="The shop's icon sections on a computer and on a phone"
//     caption="The shop, on a computer and a phone."
//   />
//
// Added 2026-11-10. The client pages had a decorative image beside each
// paragraph and nothing that showed the work, which is the one thing a client
// page is for. These images carry information, so `alt` is required.
//
// The phone overlaps the desktop's corner at wide widths and sits under it,
// centred, on a phone, where an overlap would hide half of both.

export default function Screens({
  desktop,
  phone,
  alt,
  caption,
}: {
  desktop: string;
  phone?: string;
  /** What the screenshots show, for anyone who cannot see them. */
  alt: string;
  caption?: string;
}) {
  return (
    <figure className={styles.screens} data-phone={phone ? 'yes' : 'no'}>
      <div className={styles.stage}>
        <div className={styles.desktop}>
          <div className={styles.bar} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <img src={desktop} alt={alt} width={1600} height={1000} loading="lazy" decoding="async" />
        </div>
        {phone && (
          <div className={styles.phone}>
            {/* The pair is described once, by the desktop image's alt. */}
            <img src={phone} alt="" width={600} height={1300} loading="lazy" decoding="async" />
          </div>
        )}
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
