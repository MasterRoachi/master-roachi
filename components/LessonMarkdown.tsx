'use client';

import { blocksOf, inlineTokens, tableOf, type Inline } from '@/lib/lesson-markdown';
import styles from './LessonMarkdown.module.css';

/**
 * The Markdown subset the backend teaches in.
 *
 * Shared by the curriculum lesson card and the cards page, which is the whole
 * reason it is a component rather than a function inside one of them: two
 * renderers for the same subset diverge, and the one that diverges is always
 * the one the material was not written against.
 *
 * Rendered here rather than with the site's MDX pipeline, which is a server
 * component compiled at build and cannot run in the browser. A subset is
 * enough for what these contain, and anything it does not understand comes out
 * as its own paragraph rather than as nothing.
 *
 * THE SUBSET IS THE CEILING ON WHAT A LESSON CAN TEACH, now that the material
 * itself lives in the lesson rather than in a book it points at. Headings,
 * lists, bold, italic, inline code, images, fenced code blocks, pipe tables
 * and ruby. Reading the blocks out of the text is in lib/lesson-markdown.ts,
 * where it is tested: the failure mode is not a crash, it is hundreds of
 * lessons quietly showing something other than what was written.
 */
export default function LessonMarkdown({ source }: { source: string }) {
  return (
    <div className={styles.prose}>
      {blocksOf(source).map((block, at) => {
        if (block.kind === 'code') {
          return (
            <div key={at} className={styles.codeBlock}>
              {/* Outside the <pre>, so that dragging across the code and
                  copying it does not come away with the word "gdscript" on
                  the front of the first line. */}
              {block.lang && <span className={styles.codeLang}>{block.lang}</span>}
              <pre>
                <code>{block.text}</code>
              </pre>
            </div>
          );
        }

        // Images are lifted out into Visual examples, so a block that is only
        // an image renders as nothing here rather than as its own markup. Only
        // prose: image syntax inside a fence is code and stays put.
        const text = block.text.replace(/!\[[^\]]*\]\([^)\s]+\)/g, '').trim();
        if (text === '') return null;

        const heading = /^(#{1,4})\s+(.*)$/.exec(text);
        if (heading) {
          return (
            <h3 key={at} className={styles.heading}>
              <Line text={heading[2]} />
            </h3>
          );
        }

        const table = tableOf(text);
        if (table) {
          return (
            <div key={at} className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {table.head.map((cell, column) => (
                      <th key={column} style={{ textAlign: table.align[column] ?? 'left' }}>
                        <Line text={cell} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, column) => (
                        <td key={column} style={{ textAlign: table.align[column] ?? 'left' }}>
                          <Line text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const lines = text.split('\n');
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={at} className={styles.list}>
              {lines.map((line, index) => (
                <li key={index}>
                  <Line text={line.replace(/^\s*[-*]\s+/, '')} />
                </li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
          return (
            <ol key={at} className={styles.list}>
              {lines.map((line, index) => (
                <li key={index}>
                  <Line text={line.replace(/^\s*\d+[.)]\s+/, '')} />
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={at}>
            <Line text={text} />
          </p>
        );
      })}
    </div>
  );
}

/** One line of inline markup, as elements rather than as injected HTML. */
export function Line({ text }: { text: string }) {
  return <>{inlineTokens(text).map(render)}</>;
}

function render(token: Inline, at: number) {
  switch (token.kind) {
    case 'bold':
      return <strong key={at}>{token.text}</strong>;
    case 'italic':
      return <em key={at}>{token.text}</em>;
    case 'code':
      return <code key={at}>{token.text}</code>;
    case 'ruby':
      // <rp> for the browsers and copy-paste paths that do not understand
      // ruby: without it 日本にほん is what comes out, with no way to tell
      // which half was the reading.
      return (
        <ruby key={at}>
          {token.text}
          <rp>(</rp>
          <rt>{token.reading}</rt>
          <rp>)</rp>
        </ruby>
      );
    default:
      return token.text;
  }
}
