// Which icon a curriculum gets, matched on its name.
//
// Pure and separate from the component that draws it, so the matching is
// testable: the component is JSX and a test that had to bundle JSX to ask
// "what does Piano resolve to" would be testing the wrong thing.
//
// Matched on KEYWORDS rather than stored, for the same reason the card colour
// and the pile's scatter are derived — a new curriculum should look like
// something without anyone choosing an icon for it. Anything unrecognised gets
// a book, which is what most study is.

export type IconKey =
  | 'piano'
  | 'torii'
  | 'column'
  | 'raven'
  | 'controller'
  | 'pixels'
  | 'pencil'
  | 'protea'
  | 'book';

/** First match wins, so the order is the precedence. */
const MATCHES: { pattern: RegExp; key: IconKey }[] = [
  { pattern: /piano|keyboard/i, key: 'piano' },
  { pattern: /japanese|nihongo|kana|kanji/i, key: 'torii' },
  { pattern: /greek|hellenic/i, key: 'column' },
  { pattern: /odin/i, key: 'raven' },
  { pattern: /godot|game engine|gamedev/i, key: 'controller' },
  { pattern: /aseprite|pixel|sprite/i, key: 'pixels' },
  { pattern: /drawing|draw|sketch/i, key: 'pencil' },
  { pattern: /politic|south africa/i, key: 'protea' },
];

export const ICON_TITLES: Record<IconKey, string> = {
  piano: 'A piano keyboard',
  torii: 'A torii gate',
  column: 'A classical column',
  raven: 'A raven',
  controller: 'A game controller',
  pixels: 'A pixel grid',
  pencil: 'A pencil',
  protea: 'A protea',
  book: 'A book',
};

export function iconFor(name: string): IconKey {
  return MATCHES.find((entry) => entry.pattern.test(name))?.key ?? 'book';
}
