/**
 * oklch → sRGB hex, for the build scripts.
 *
 * The conversion itself moved to lib/oklch.ts, which the projects editor also
 * uses — it needs the reverse direction for its colour pickers, and two copies
 * of a colour-space conversion is two things to get subtly wrong. Node strips
 * the types on import, so this plain .mjs re-export costs nothing.
 *
 * Kept as a file rather than repointing scripts/covers.mjs at lib/, so that
 * the scripts keep importing from ./ and the move is invisible to them.
 */
export { oklchToHex, hexToOklch, isOklch } from '../lib/oklch.ts';
