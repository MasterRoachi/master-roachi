import styles from './ControllerIcon.module.css';

// The mark for Thoughts, completing the set with the laptop on Work, the
// controller on Fun and the cross on Foundations.
//
// A nib rather than a pen: it is the end that does the work, and it reads at
// 26px where a whole pen would be a diagonal line.
//
// Shares ControllerIcon's stylesheet so all four marks are guaranteed the same
// size as each other and as the stack icons on a project page.

export default function PenNibIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
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
      {/* The nib's outline — shoulders high, tapering to the point. */}
      <path d="M12 3c3.2 3.4 4.8 6.4 4.8 9.2L12 21l-4.8-8.8C7.2 9.4 8.8 6.4 12 3Z" />
      {/* The slit, which is what actually lays the ink down. */}
      <path d="M12 13.4V20" />
      {/* The breather hole above it. */}
      <circle cx="12" cy="11" r="1.15" />
    </svg>
  );
}
