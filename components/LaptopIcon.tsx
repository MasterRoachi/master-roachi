import styles from './ControllerIcon.module.css';

// The mark for the Work side of the site, paired with ControllerIcon on Fun
// and OrthodoxCross on Foundations.
//
// Drawn rather than fetched, for the same reason as the other two: the icon
// set here is simple-icons, which carries brands and nothing else — there is
// no logo for "building things" in general.
//
// Shares ControllerIcon's stylesheet so the three marks are guaranteed to be
// the same size as each other and as the stack icons on a project page. A
// second copy of those rules is a second thing to keep in step.

export default function LaptopIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <svg
      className={styles.icon}
      data-size={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative: the words beside it already name the section.
      aria-hidden="true"
      focusable="false"
    >
      {/* The screen. */}
      <rect x="4.5" y="5" width="15" height="10" rx="1.6" />
      {/* The base, wider than the screen the way a real one is. */}
      <path d="M2.5 18.4h19" />
      {/* A prompt on the screen, so it reads as a machine being worked on
          rather than a blank slab. */}
      <path d="M8.4 8.8 10.6 10.6 8.4 12.4" />
      <path d="M12.4 12.4h3.2" />
    </svg>
  );
}
