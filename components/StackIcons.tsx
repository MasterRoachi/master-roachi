import { TOOL_ICONS } from '@/lib/toolIcons';
import styles from './StackIcons.module.css';

// Renders a project's stack as brand marks rather than words in boxes,
// matching the tools row on About.
//
// A stack value with no mark in the icon set falls back to a text chip —
// GDScript, for one, has no logo of its own. Better an honest chip than an
// invented logo or a silently dropped entry.

const BY_LABEL = new Map(
  TOOL_ICONS.map((icon) => [icon.label.toLowerCase(), icon]),
);

/** Stack values that name the same thing as an icon under another label. */
const ALIASES: Record<string, string> = {
  html5: 'html',
  css3: 'css',
  js: 'javascript',
  ts: 'typescript',
  'godot engine': 'godot',
  'next.js': 'next.js',
  nextjs: 'next.js',
};

export default function StackIcons({
  stack,
  size = 'md',
}: {
  stack: string[];
  size?: 'sm' | 'md';
}) {
  return (
    <ul className={styles.stack} data-size={size}>
      {stack.map((label) => {
        const key = ALIASES[label.toLowerCase()] ?? label.toLowerCase();
        const icon = BY_LABEL.get(key);

        return (
          <li key={label} className={styles.item} title={label}>
            {icon ? (
              <svg viewBox="0 0 24 24" role="img" aria-label={label}>
                <title>{label}</title>
                {/* Two-toned where the real mark is, flat everywhere else. */}
                {icon.layers ? (
                  icon.layers.map((layer) => (
                    <path key={layer.color} d={layer.path} fill={layer.color} />
                  ))
                ) : (
                  <path d={icon.path} fill={icon.color} />
                )}
              </svg>
            ) : (
              <span className={styles.chip}>{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
