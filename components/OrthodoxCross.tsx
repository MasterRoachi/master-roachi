import styles from './ControllerIcon.module.css';

// The mark for the Foundations side of the site, paired with ControllerIcon.
//
// The eight-pointed cross: the titulus above, the main bar, and the slanted
// footrest below. The footrest rises to the viewer's left, which is Christ's
// right — the side of the thief who repented. Getting that backwards is the
// usual mistake, and the same one the 3D cross on the homepage had before it
// was corrected.
//
// Drawn rather than fetched, for the same reason the controller is: the icon
// set here is simple-icons, which carries brands and nothing else.

export default function OrthodoxCross({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <svg
      className={styles.icon}
      data-size={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      // Decorative: the words beside it already name the section.
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3v18" />
      <path d="M9 6.6h6" />
      <path d="M6.5 10.6h11" />
      {/* Left end higher: smaller y is further up the screen. */}
      <path d="M8.2 15.6 15.8 17.4" />
    </svg>
  );
}
