import fs from 'node:fs';
import path from 'node:path';

// Reads the YouTube snapshot written by scripts/youtube.mjs at build time.
// Nothing here runs at request time.

export interface Video {
  id: string;
  title: string;
  published: string | null;
  thumbnail: string;
  url: string;
}

export interface VideoSnapshot {
  fetchedAt: string | null;
  tracks: Record<string, Video[]>;
}

const EMPTY: VideoSnapshot = { fetchedAt: null, tracks: {} };

function all(): VideoSnapshot {
  try {
    const file = path.join(process.cwd(), 'data', 'videos.json');
    if (!fs.existsSync(file)) return EMPTY;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as VideoSnapshot;
  } catch {
    return EMPTY;
  }
}

/**
 * The videos for one track — 'gaming', 'orthodoxy' — newest first.
 *
 * An unconfigured or empty playlist returns nothing, and the calling section
 * hides itself rather than showing an empty shelf.
 */
export function getVideos(track: string, limit = 6): Video[] {
  const list = all().tracks[track] ?? [];
  return [...list]
    .sort((a, b) => Date.parse(b.published ?? '0') - Date.parse(a.published ?? '0'))
    .slice(0, limit);
}
