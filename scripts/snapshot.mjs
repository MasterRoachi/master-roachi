import fs from 'node:fs';
import path from 'node:path';

/**
 * Write a generated data snapshot, but only when the data actually changed.
 *
 * Every one of these scripts stamps a fresh `fetchedAt` and writes
 * unconditionally, so a local build rewrote four files in data/ even when
 * Steam and Printful had returned byte-identical answers. That is not
 * cosmetic: the nightly Action commits the same files, so two runs an hour
 * apart produce two commits that differ only in a timestamp and conflict with
 * each other. It has cost a rebase twice.
 *
 * So the timestamp is compared out. If everything else matches what is on
 * disk, the existing file is left exactly as it is — which incidentally makes
 * `fetchedAt` mean "when this data last changed" rather than "when a build
 * last ran", and the first is the more useful of the two. Nothing renders it,
 * so nothing regresses either way.
 *
 * `compare` projects both sides down to just the part this script owns, for
 * files a later step enriches — data/store.json gains an `art` path per
 * product from store-art.mjs, so the raw catalogue never matches what is on
 * disk and printful would rewrite on every build regardless.
 *
 * Returns true if it wrote.
 */
export function writeSnapshot(out, payload, { compare = (x) => x } = {}) {
  const next = JSON.stringify(payload, null, 2) + '\n';

  if (fs.existsSync(out)) {
    try {
      const { fetchedAt: _was, ...settled } = JSON.parse(
        fs.readFileSync(out, 'utf8'),
      );
      const { fetchedAt: _now, ...fresh } = payload;
      // Both sides go through JSON.stringify with the same key order, which
      // is the object's own insertion order — stable here because both come
      // from the same code shaping the same API response.
      if (JSON.stringify(compare(settled)) === JSON.stringify(compare(fresh))) {
        return false;
      }
    } catch {
      // Unreadable or malformed on disk. Overwrite it; that is the repair.
    }
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, next);
  return true;
}
