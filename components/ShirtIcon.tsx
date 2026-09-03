import styles from './ControllerIcon.module.css';

// The mark for the store, completing the set with the laptop on Work, the
// controller on Fun, the cross on Foundations and the quill on Thoughts.
//
// A tee, because that is what the shop sells and it is legible at 26px where
// a hanger or a tag would collapse into a squiggle.
//
// Shares ControllerIcon's stylesheet so all five marks are guaranteed the same
// size as each other and as the stack icons on a project page.

export default function ShirtIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
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
      {/* Shoulders out to the sleeves, then straight down the body. */}
      <path d="M8.5 3.4 4 6.1l1.7 4 2-1v9.5h8.6V9.1l2 1 1.7-4-4.5-2.7Z" />
      {/* The collar, cut between the shoulders. */}
      <path d="M8.5 3.4a3.5 3.5 0 0 0 7 0" />
    </svg>
  );
}
