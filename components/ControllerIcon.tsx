import styles from './ControllerIcon.module.css';

// The mark for the Fun side of the site.
//
// Drawn here rather than pulled from the icon set, because that set is
// simple-icons and simple-icons is brands only — there is no logo for "games"
// in general. Kept to the same 24-unit grid and the same rendered size as the
// stack marks on a project page, so it reads as part of the same family.
//
// Inherits colour from the element around it, so a hero can tint it with the
// page accent and a card can leave it plain.

export default function ControllerIcon({
  size = 'md',
}: {
  size?: 'sm' | 'md';
}) {
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
      // Decorative in both places it appears: the hero already says "Fun" and
      // the carousel card already says "Gaming", so a label here only made the
      // heading read "GamesGaming" to a screen reader.
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" />
      <path d="M6.5 12h3M8 10.5v3" />
      <circle cx="15.4" cy="13.1" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="17.9" cy="10.9" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  );
}
