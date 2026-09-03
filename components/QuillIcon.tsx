import styles from './ControllerIcon.module.css';

// The mark for Thoughts, alongside the laptop on Work, the controller on Fun
// and the cross on Foundations.
//
// A feather quill: the shaft running corner to corner, the vane swept off one
// side of it, and the barbs suggested rather than drawn — at 26px a feather
// rendered honestly turns to mush, so the strokes stand in for far more of
// them than are there.
//
// Shares ControllerIcon's stylesheet so all four marks are guaranteed the same
// size as each other and as the stack icons on a project page.

export default function QuillIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <svg
      className={styles.icon}
      data-size={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative: the words beside it already name the section.
      aria-hidden="true"
      focusable="false"
    >
      {/* The shaft, from the nib at the bottom left to the tip at the top. */}
      <path d="M3.6 20.4 19.6 4.4" />
      {/* The vane, swept off the upper side of the shaft. */}
      <path d="M19.6 4.4c1.2 4.6.3 8.4-2.2 11-2.4 2.4-5.7 3.3-9.4 2.7" />
      {/* Barbs — three strokes standing in for a great many. */}
      <path d="M15.6 6.6c.8 1.5.9 3 .2 4.4" />
      <path d="M12.4 9.8c.7 1.4.8 2.8.2 4.1" />
      <path d="M9.2 13c.6 1.2.7 2.4.2 3.5" />
    </svg>
  );
}
