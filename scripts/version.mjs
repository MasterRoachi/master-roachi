// Stamps the build with the commit it was built from.
//
// Writes public/version.json, which the backend reads to answer one question:
// is the site I am looking at the newest commit on main? Comparing a stamp
// against GitHub's head catches a build that FAILED as well as one still
// running — asking Cloudflare for the last build's status would report the
// failure but still leave you working out what is actually deployed.
//
// It needs no credential, which is the point.
//
// Workers Builds clones the repo, so git is available there. The env vars are
// tried first because a shallow clone or a detached head can make git the less
// reliable of the two, and CI sets these deliberately.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function commit() {
  const fromEnv =
    process.env.WORKERS_CI_COMMIT_SHA ??
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv.trim();

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    // A tarball with no git and no CI vars. Unknown is a valid answer and the
    // hub renders it as unknown rather than as out of date.
    return null;
  }
}

const file = path.join(process.cwd(), 'public', 'version.json');
const stamp = { commit: commit(), builtAt: new Date().toISOString() };

fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(stamp, null, 2) + '\n');

console.log(`version.json → ${stamp.commit ?? 'unknown'}`);
