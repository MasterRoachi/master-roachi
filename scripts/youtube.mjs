// Pulls YouTube videos and writes data/videos.json.
//
//   node scripts/youtube.mjs
//
// Runs as part of prebuild, so every deploy refreshes the list.
//
// Reads YouTube's public RSS feeds rather than the Data API. That is a
// deliberate trade: the feeds need no API key, no Google Cloud project and no
// quota, which is three fewer things to configure and one fewer secret to
// leak. The cost is that a feed returns only the most recent 15 entries and
// no view counts — neither of which this page shows.
//
// Playlists, not the channel feed. A channel feed is one undifferentiated
// stream, so a gaming page and an Orthodoxy page reading the same feed would
// each have to guess which videos belong to them. A playlist per track makes
// that someone's explicit decision on YouTube instead of a guess here.
//
// Configure in lib/site.ts under `youtube.playlists`. Nothing configured
// means nothing fetched: the existing data/videos.json is left alone and the
// sections stay hidden.

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'data', 'videos.json');

function bail(why) {
  console.log(`youtube: ${why} — keeping the committed data/videos.json`);
  process.exit(0);
}

/**
 * The playlist ids, read out of lib/site.ts.
 *
 * Parsed rather than imported because this is a plain node script and site.ts
 * is TypeScript. The shape it looks for is a `playlists: { ... }` block of
 * `key: 'value'` or `key: null` pairs.
 */
function readPlaylists() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'lib', 'site.ts'),
    'utf8',
  );

  // Comments come out first, and both kinds matter. The block comment
  // documenting this setting contains the words `playlists: { }`, which the
  // search below would otherwise find before the real one. And a commented-out
  // placeholder such as `// gaming: 'PL...'` would otherwise be read as
  // configuration and fetched.
  //
  // Only whole-line `//` comments are dropped, never a trailing one, so the
  // `https://` inside the social URLs elsewhere in the file survives.
  const cleaned = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  const block = cleaned.match(/playlists:\s*\{([^}]*)\}/);
  if (!block) return {};

  const found = {};
  for (const line of block[1].split('\n')) {
    const pair = line.match(/([A-Za-z0-9_]+)\s*:\s*'([^']+)'/);
    if (pair) found[pair[1]] = pair[2];
  }
  return found;
}

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  '#34': '"',
};

/** Feed titles arrive XML-escaped; rendered raw they would show `&amp;`. */
function decode(text) {
  return text.replace(/&(#?[a-zA-Z0-9]+);/g, (whole, name) => {
    if (ENTITIES[name] !== undefined) return ENTITIES[name];
    if (name.startsWith('#')) {
      const code = Number.parseInt(name.slice(1), 10);
      if (Number.isFinite(code)) return String.fromCodePoint(code);
    }
    return whole;
  });
}

function field(entry, tag) {
  const match = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decode(match[1].trim()) : null;
}

async function playlist(id) {
  const url = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`playlist ${id} returned ${res.status}`);
  const xml = await res.text();

  // The feed is small, predictable and machine-generated, so it is split
  // rather than parsed with a dependency.
  return xml
    .split('<entry>')
    .slice(1)
    .map((entry) => {
      const videoId = field(entry, 'yt:videoId');
      if (!videoId) return null;
      const thumb = entry.match(/<media:thumbnail\s+url="([^"]+)"/);
      return {
        id: videoId,
        title: field(entry, 'title'),
        published: field(entry, 'published'),
        // i.ytimg.com serves these directly; no API call needed.
        thumbnail: thumb
          ? thumb[1]
          : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter(Boolean);
}

const playlists = readPlaylists();
const tracks = Object.keys(playlists);

if (tracks.length === 0) bail('no playlists configured in lib/site.ts');

try {
  const byTrack = {};

  for (const track of tracks) {
    try {
      byTrack[track] = await playlist(playlists[track]);
      console.log(`youtube: ${track} — ${byTrack[track].length} videos`);
    } catch (err) {
      // One bad playlist id should not cost the others their data.
      console.log(`youtube: ${track} failed (${err.message})`);
      byTrack[track] = [];
    }
  }

  if (Object.values(byTrack).every((list) => list.length === 0)) {
    bail('every playlist came back empty');
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ fetchedAt: new Date().toISOString(), tracks: byTrack }, null, 2) +
      '\n',
  );
  console.log(`youtube: wrote ${tracks.length} playlists`);
} catch (err) {
  bail(`fetch failed (${err.message})`);
}
