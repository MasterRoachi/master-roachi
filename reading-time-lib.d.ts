// The reading-time calculation, imported from its lib rather than its entry.
//
// `reading-time`'s own entry point re-exports a stream helper that requires
// node:stream, which breaks a browser bundle. The calculation itself is a
// plain function in lib/reading-time.js and bundles in about 4kb — so the
// editor's live figure comes from the identical code the build uses, rather
// than from a reimplementation that would disagree with it by a minute.
//
// Typed here because the package ships declarations for its entry only.
declare module 'reading-time/lib/reading-time' {
  interface ReadingTimeResult {
    text: string;
    minutes: number;
    time: number;
    words: number;
  }
  export default function readingTime(
    text: string,
    options?: { wordsPerMinute?: number },
  ): ReadingTimeResult;
}
