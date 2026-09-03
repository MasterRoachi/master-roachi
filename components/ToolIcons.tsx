import { TOOL_ICONS, TOOL_WORDMARKS } from '@/lib/toolIcons';
import styles from './ToolIcons.module.css';

// The tools, as their own marks in their own colours.
//
// Paths come from simple-icons via scripts/tool-icons.mjs, which extracts only
// the dozen used here — importing the package at runtime would ship 3,457
// icons to render eleven.
//
// Anything with no brand mark in that set is rendered as a wordmark rather
// than given an invented logo.
export default function ToolIcons() {
  return (
    <ul className={styles.tools}>
      {TOOL_ICONS.map((tool) => (
        <li key={tool.label} className={styles.tool}>
          <svg
            viewBox="0 0 24 24"
            width="26"
            height="26"
            role="img"
            aria-label={tool.label}
          >
            <title>{tool.label}</title>
            {/* Two-toned where the real mark is, flat everywhere else. */}
            {tool.layers ? (
              tool.layers.map((layer) => (
                <path key={layer.color} d={layer.path} fill={layer.color} />
              ))
            ) : (
              <path d={tool.path} fill={tool.color} />
            )}
          </svg>
          <span className={styles.name}>{tool.label}</span>
        </li>
      ))}

      {TOOL_WORDMARKS.map((label) => (
        <li key={label} className={styles.tool}>
          <span className={styles.wordmark} aria-hidden="true">
            {label.slice(0, 2)}
          </span>
          <span className={styles.name}>{label}</span>
        </li>
      ))}
    </ul>
  );
}
