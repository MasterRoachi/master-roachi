// Editing one field of a file's frontmatter without touching the rest of it.
//
// THE WHOLE POINT IS WHAT IT DOES NOT DO. The obvious way to put a form in
// front of frontmatter is to parse the YAML, hand the object to the fields and
// serialise it back on save. That is also how you lose work: every key the
// form does not model is dropped, every comment goes, quoting style changes,
// key order changes, and all of it commits and deploys itself. The old
// CollectionEditor refused to have fields at all for exactly this reason, and
// it was right to.
//
// So nothing here parses a whole document. Frontmatter is held as its own
// LINES, a field is a range of those lines, and setting a field replaces only
// that range. A key this module has never heard of is not edited, not
// reserialised, and not reordered — it is simply still there, byte for byte,
// because nothing ever looked at it.
//
// The YAML understood is the subset these files actually use:
//
//   title: Cultus Botanicus          a scalar
//   accent: "oklch(86% 0.20 135)"    a quoted scalar
//   stack: ["Godot", "Python"]        a flow list of strings
//   pieces:                           a block list of flat objects
//     - title: Odin Recipes
//       tags: ["HTML"]
//
// Anything else — anchors, multi-line scalars, nested maps, lists of lists —
// is out of scope BY DESIGN rather than by omission: it is left alone as an
// unknown field and shown raw, which is the safe failure. gray-matter and
// js-yaml do the real parsing at build time; this only has to agree with them
// about what it writes.

export interface SplitFile {
  /** Every line between the fences, fences excluded. */
  frontmatter: string[];
  /** Everything after the closing fence, verbatim. */
  body: string;
  /** The newline this file uses, so a save does not convert the whole file. */
  eol: string;
}

/**
 * Pull a file apart. Null when there is no frontmatter block at all, which the
 * caller must treat as "leave this file alone" rather than as "add one".
 */
export function splitFile(text: string): SplitFile | null {
  const source = String(text ?? '');
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return null;

  const close = lines.findIndex((line, at) => at > 0 && line.trim() === '---');
  if (close === -1) return null;

  return {
    frontmatter: lines.slice(1, close),
    body: lines.slice(close + 1).join(eol),
    eol,
  };
}

export function joinFile(file: SplitFile): string {
  return ['---', ...file.frontmatter, '---', file.body].join(file.eol);
}

/** The indentation of a line, in spaces. Tabs are not YAML indentation. */
function indentOf(line: string): number {
  return line.length - line.replace(/^ +/, '').length;
}

/** Whether a line starts a top-level key. */
function keyLine(line: string): string | null {
  if (indentOf(line) !== 0) return null;
  const match = /^([A-Za-z_][\w-]*)\s*:/.exec(line);
  return match ? match[1] : null;
}

/** Every top-level key, in the order the file has them. */
export function keysOf(lines: string[]): string[] {
  return lines.map(keyLine).filter((key): key is string => key !== null);
}

/**
 * Where a field lives: its own line, plus every following line that belongs to
 * it — anything indented, and blank lines inside the block.
 *
 * This is what makes a nested `pieces:` list one field rather than
 * twenty-four stray lines that a naive replace would strand.
 */
export function fieldRange(lines: string[], key: string): { start: number; end: number } | null {
  const start = lines.findIndex((line) => keyLine(line) === key);
  if (start === -1) return null;

  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    // A blank line only belongs to the block if something indented follows it;
    // otherwise it is separating this field from the next.
    if (line.trim() === '') {
      const next = lines.slice(end + 1).find((l) => l.trim() !== '');
      if (next && indentOf(next) > 0) {
        end += 1;
        continue;
      }
      break;
    }
    if (indentOf(line) === 0) break;
    end += 1;
  }
  return { start, end };
}

/** The raw text after `key:` on its own line, or null. */
export function rawValue(lines: string[], key: string): string | null {
  const range = fieldRange(lines, key);
  if (!range) return null;
  const match = /^[A-Za-z_][\w-]*\s*:\s?(.*)$/.exec(lines[range.start]);
  return match ? match[1] : null;
}

/** Strip one layer of matching quotes, and nothing else. */
function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 1)
  ) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

/** A scalar field's value, unquoted. Null for a field that is not there. */
export function readScalar(lines: string[], key: string): string | null {
  const raw = rawValue(lines, key);
  if (raw === null) return null;
  // A block field has nothing useful on its own line.
  if (raw.trim() === '') return '';
  return unquote(raw);
}

/**
 * Quote only where YAML needs it, and keep what the file already chose.
 *
 * Both appear in these files — `title: Cultus Botanicus` bare and
 * `accent: "oklch(86% 0.20 135)"` quoted — and rewriting one style into the
 * other would churn every file the first time any field was touched.
 */
function quoteScalar(value: string, wasQuoted: boolean): string {
  const needs =
    value === '' ||
    /^[\s]|[\s]$/.test(value) ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
    /:\s/.test(value) ||
    /\s#/.test(value) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(value) ||
    // A bare value that looks like a number but is meant as text.
    (/^[\d.+-]+$/.test(value) && Number.isNaN(Number(value)));
  if (!needs && !wasQuoted) return value;
  if (!needs && wasQuoted) return `"${value.replace(/"/g, '\\"')}"`;
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Set, add or remove one scalar field.
 *
 * Null removes it. A field that is not there is appended at the end rather
 * than inserted somewhere clever: the order of frontmatter keys is the
 * author's, and guessing where a new one belongs is how a diff becomes
 * unreadable.
 */
export function setScalar(lines: string[], key: string, value: string | null): string[] {
  const range = fieldRange(lines, key);

  if (value === null) {
    if (!range) return lines;
    return [...lines.slice(0, range.start), ...lines.slice(range.end)];
  }

  const wasQuoted = (() => {
    const raw = range ? rawValue(lines, key) : null;
    return raw !== null && /^\s*["']/.test(raw);
  })();
  const line = `${key}: ${quoteScalar(value, wasQuoted)}`;

  if (!range) return [...lines, line];
  return [...lines.slice(0, range.start), line, ...lines.slice(range.end)];
}

/** `["Godot", "Python"]` → the strings. Empty for a field that is not there. */
export function readFlowList(lines: string[], key: string): string[] {
  const raw = rawValue(lines, key);
  if (raw === null) return [];
  const inside = /^\s*\[(.*)\]\s*$/.exec(raw);
  if (!inside) {
    // A block list of plain strings, which these files do not use for `stack`
    // but which is still valid YAML and must not come back as nonsense.
    const range = fieldRange(lines, key);
    if (!range) return [];
    return lines
      .slice(range.start + 1, range.end)
      .map((line) => /^\s*-\s*(.*)$/.exec(line)?.[1])
      .filter((item): item is string => item !== undefined)
      .map(unquote);
  }
  if (inside[1].trim() === '') return [];
  return splitTopLevel(inside[1]).map(unquote);
}

/** Split on commas that are not inside quotes or brackets. */
function splitTopLevel(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === '[' || char === '{') depth += 1;
    if (char === ']' || char === '}') depth -= 1;
    if (char === ',' && depth === 0) {
      out.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim() !== '') out.push(current);
  return out;
}

export function setFlowList(lines: string[], key: string, items: string[]): string[] {
  const clean = items.map((item) => String(item).trim()).filter(Boolean);
  if (clean.length === 0) {
    // An empty list is written as [] rather than removed: `stack: []` is in
    // the project template, so the key existing and being empty is a state
    // the author chose.
    const range = fieldRange(lines, key);
    if (!range) return lines;
    const line = `${key}: []`;
    return [...lines.slice(0, range.start), line, ...lines.slice(range.end)];
  }
  const line = `${key}: [${clean.map((item) => `"${item.replace(/"/g, '\\"')}"`).join(', ')}]`;
  const range = fieldRange(lines, key);
  if (!range) return [...lines, line];
  return [...lines.slice(0, range.start), line, ...lines.slice(range.end)];
}

/**
 * A block list of flat objects — `pieces:` and nothing else so far.
 *
 * Each entry's values come back as raw strings, flow lists included, because
 * the editor above renders them as text inputs and a tag box. Anything that is
 * not a scalar or a flow list inside an entry is kept as its raw text so that
 * writing the list back cannot destroy it.
 */
export interface BlockEntry {
  [key: string]: string;
}

export function readBlockList(lines: string[], key: string): BlockEntry[] {
  const range = fieldRange(lines, key);
  if (!range) return [];

  const entries: BlockEntry[] = [];
  let current: BlockEntry | null = null;

  for (const line of lines.slice(range.start + 1, range.end)) {
    const item = /^\s*-\s+([A-Za-z_][\w-]*)\s*:\s?(.*)$/.exec(line);
    if (item) {
      if (current) entries.push(current);
      current = { [item[1]]: item[2].trim() };
      continue;
    }
    const pair = /^\s+([A-Za-z_][\w-]*)\s*:\s?(.*)$/.exec(line);
    if (pair && current) {
      current[pair[1]] = pair[2].trim();
      continue;
    }
    // A line that is neither is something this subset does not model. Kept
    // under a key nothing writes, so the entry survives a round trip.
    if (current && line.trim()) {
      current.__raw = `${current.__raw ?? ''}${current.__raw ? '\n' : ''}${line}`;
    }
  }
  if (current) entries.push(current);
  return entries;
}

export function setBlockList(lines: string[], key: string, entries: BlockEntry[]): string[] {
  const written: string[] = [`${key}:`];
  for (const entry of entries) {
    const pairs = Object.entries(entry).filter(([name]) => name !== '__raw');
    if (pairs.length === 0) continue;
    pairs.forEach(([name, value], at) => {
      // Two spaces for the dash, four for the keys under it — the indentation
      // the existing files use, so a touched file does not reformat wholesale.
      written.push(`${at === 0 ? '  - ' : '    '}${name}: ${value}`);
    });
    if (entry.__raw) written.push(...entry.__raw.split('\n'));
  }

  const range = fieldRange(lines, key);
  if (entries.length === 0) {
    if (!range) return lines;
    return [...lines.slice(0, range.start), ...lines.slice(range.end)];
  }
  if (!range) return [...lines, ...written];
  return [...lines.slice(0, range.start), ...written, ...lines.slice(range.end)];
}

/**
 * The fields a form does not model, as their own raw text.
 *
 * Shown in the editor as a plain textarea so that everything in the file is
 * reachable and nothing is hidden — the thing a form usually gets wrong is
 * not losing a field, it is not admitting the field is there.
 */
export function unknownFields(lines: string[], known: readonly string[]): string {
  const out: string[] = [];
  for (const key of keysOf(lines)) {
    if (known.includes(key)) continue;
    const range = fieldRange(lines, key);
    if (range) out.push(...lines.slice(range.start, range.end));
  }
  return out.join('\n');
}

/**
 * Replace every unknown field with the text from that textarea.
 *
 * Known fields keep their positions; the unknown block is rewritten at the
 * position of the first one it replaces, so moving a field in that box does
 * not move the fields around it.
 */
export function setUnknownFields(
  lines: string[],
  known: readonly string[],
  text: string,
): string[] {
  const unknown = keysOf(lines).filter((key) => !known.includes(key));
  let out = [...lines];
  let at = out.length;

  // Removed back to front so each range is still valid as it is cut.
  const ranges = unknown
    .map((key) => fieldRange(out, key))
    .filter((range): range is { start: number; end: number } => range !== null)
    .sort((a, b) => b.start - a.start);
  for (const range of ranges) {
    at = Math.min(at, range.start);
    out = [...out.slice(0, range.start), ...out.slice(range.end)];
  }

  const added = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (added.length === 0) return out;
  return [...out.slice(0, at), ...added, ...out.slice(at)];
}
