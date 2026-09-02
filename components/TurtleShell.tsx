// A turtle carapace, seen from above — the Turtle Hermit mark.
//
// Drawn rather than imported so it inherits colour from CSS and stays crisp at
// any size. Deliberately reduced to what survives at ~20px: the shell outline,
// the marginal ring, three vertebral scutes down the spine, and four costal
// divisions. More detail than that turns to mush at the size it is used.

interface TurtleShellProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  className?: string;
}

export default function TurtleShell({
  size = 22,
  color = 'currentColor',
  strokeWidth = 1.2,
  opacity = 1,
  className,
}: TurtleShellProps) {
  return (
    <svg
      viewBox="0 0 28 24"
      width={size}
      height={(size * 24) / 28}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      style={{ opacity }}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Carapace outline */}
      <path d="M14 1.4 C20 1.4 26.2 6 26.2 12 C26.2 18 20 22.6 14 22.6 C8 22.6 1.8 18 1.8 12 C1.8 6 8 1.4 14 1.4 Z" />
      {/* Marginal scute ring */}
      <path
        d="M14 4.6 C18.6 4.6 22.8 7.9 22.8 12 C22.8 16.1 18.6 19.4 14 19.4 C9.4 19.4 5.2 16.1 5.2 12 C5.2 7.9 9.4 4.6 14 4.6 Z"
        opacity="0.75"
      />
      {/* Vertebral scutes down the spine, sharing edges as real scutes do */}
      <path d="M12.7 5.7 L15.3 5.7 L16.6 7.8 L15.3 9.9 L12.7 9.9 L11.4 7.8 Z" />
      <path d="M12.7 9.9 L15.3 9.9 L16.6 12 L15.3 14.1 L12.7 14.1 L11.4 12 Z" />
      <path d="M12.7 14.1 L15.3 14.1 L16.6 16.2 L15.3 18.3 L12.7 18.3 L11.4 16.2 Z" />
      {/* Costal divisions, left and right */}
      <path
        d="M11.4 7.8 L6.2 8.6 M11.4 16.2 L6.2 15.4 M16.6 7.8 L21.8 8.6 M16.6 16.2 L21.8 15.4"
        opacity="0.75"
      />
    </svg>
  );
}
