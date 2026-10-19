// Writing to the repo from the edge.
//
// The site is a static export, so there is no database behind the published
// pages — a blog post IS a file in content/writing, and changing one means
// changing the repo. The backend therefore commits, and the deploy happens by
// itself: .github/workflows/deploy.yml deploys every push to main (since
// 2026-10-19 — before that nothing did, and every commit here waited for a
// hand deploy).
//
// That makes GITHUB_TOKEN the most dangerous credential on this Worker. It can
// commit to a repository that publishes itself. It should be a fine-grained
// token scoped to this one repo with Contents: read and write, and nothing
// else — no other repo, no other permission.

const API = 'https://api.github.com';
const OWNER = 'MasterRoachi';
const REPO = 'master-roachi';
const BRANCH = 'main';

// Which directories are editable is not decided here — see lib/collections.ts.
// This module takes a path it has already been told is allowed.

export interface GitFile {
  /** Path within the repo. */
  path: string;
  /** Blob sha. Required to update an existing file, and proves we saw this version. */
  sha: string;
}

export interface GitPost extends GitFile {
  /** The file's full text, frontmatter included. */
  text: string;
}

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    // GitHub rejects API requests with no user agent.
    'user-agent': 'master-roachi-work-hub',
  };
}

/**
 * Base64 for text that is not ASCII.
 *
 * `btoa` throws on anything above U+00FF and silently mangles the rest, and
 * his prose is full of curly quotes and em dashes — the existing product copy
 * alone has three kinds. Encoding to UTF-8 bytes first is the only correct
 * way, and getting this wrong would corrupt a post on save rather than fail
 * loudly, which is the worst sort of bug to ship into a publishing tool.
 */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** The same trip back. */
function fromBase64(encoded: string): string {
  const binary = atob(encoded.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Commit messages that cannot suppress their own deploy.
 *
 * GitHub Actions honours CI-skip tokens in the commit message, and so did
 * Cloudflare Workers Builds before it — which scanned the WHOLE message, body
 * included. A post committed with one of those in its title
 * would land in the repo and then cancel the build that was meant to publish
 * it — the content would be saved and the site would never show it, with
 * nothing anywhere saying why. The tokens are defused rather than rejected,
 * because the title is his to write and a legitimate post could contain one.
 */
function safeMessage(message: string): string {
  return message
    .replace(/\[(ci|skip ci|skip-ci|cf-pages-skip|no ci)\]/gi, '(ci)')
    .replace(/\[(ci skip|skip)\]/gi, '(ci)')
    .slice(0, 500);
}

/** Every file of one extension in a directory, by name. */
export async function listFiles(
  token: string,
  dir: string,
  ext: string,
): Promise<GitFile[]> {
  const response = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURI(dir)}?ref=${BRANCH}`,
    { headers: headers(token) },
  );
  if (!response.ok) throw new Error(`list: ${response.status}`);

  const entries = (await response.json()) as {
    name: string;
    path: string;
    sha: string;
    type: string;
  }[];

  return entries
    .filter((e) => e.type === 'file' && e.name.endsWith(ext))
    .map((e) => ({ path: e.path, sha: e.sha }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** One post, with the sha that says which version this is. */
export async function readFile(token: string, path: string): Promise<GitPost> {
  const response = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`,
    { headers: headers(token) },
  );
  if (!response.ok) throw new Error(`read: ${response.status}`);

  const file = (await response.json()) as { content: string; sha: string };
  return { path, sha: file.sha, text: fromBase64(file.content) };
}

/**
 * Create or replace a post, and let the push publish it.
 *
 * `sha` is the version being replaced; omitting it means "this is new". Pass
 * a stale one and GitHub answers 409 rather than overwriting — which is the
 * behaviour we want if the file changed under us between load and save.
 */
export async function writeFile(
  token: string,
  path: string,
  text: string,
  message: string,
  sha?: string,
): Promise<{ commit: string }> {
  const response = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'content-type': 'application/json' },
    body: JSON.stringify({
      message: safeMessage(message),
      content: toBase64(text),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (response.status === 409 || response.status === 422) {
    throw new Error('conflict: the file changed since it was loaded');
  }
  if (!response.ok) throw new Error(`write: ${response.status}`);

  const result = (await response.json()) as { commit?: { sha?: string } };
  return { commit: result.commit?.sha ?? '' };
}

/**
 * The sha of a file, without its contents.
 *
 * For a binary collection, which is the whole reason this exists: reading a
 * WebP through readFile() would push it through fromBase64() and a
 * TextDecoder, and hand back a mangled string that nothing can use. All the
 * uploader actually needs is whether the file is there and which version it
 * is replacing.
 *
 * Null for a file that does not exist yet, which is the normal state for a
 * product nobody has uploaded art for.
 */
export async function statFile(token: string, path: string): Promise<string | null> {
  const response = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`,
    { headers: headers(token) },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`stat: ${response.status}`);
  const file = (await response.json()) as { sha?: string };
  return file.sha ?? null;
}

/**
 * Create or replace a file from bytes the browser already encoded.
 *
 * Deliberately not writeFile with a different argument: that one takes text
 * and encodes it, and the two must not be confusable, because passing a
 * base64 string to it would base64 it a second time and commit something that
 * looks like a successful upload and is not an image.
 *
 * The content is passed through untouched and never decoded here. The Worker
 * has no business parsing a WebP; it checks the size and the extension, and
 * the browser is what produced the bytes.
 */
export async function writeBytes(
  token: string,
  path: string,
  base64: string,
  message: string,
  sha?: string,
): Promise<{ commit: string }> {
  const response = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'content-type': 'application/json' },
    body: JSON.stringify({
      message: safeMessage(message),
      content: base64,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (response.status === 409 || response.status === 422) {
    throw new Error('conflict: the file changed since it was loaded');
  }
  if (!response.ok) throw new Error(`write: ${response.status}`);

  const result = (await response.json()) as { commit?: { sha?: string } };
  return { commit: result.commit?.sha ?? '' };
}

/**
 * Write several text files as ONE commit.
 *
 * Reordering the projects is why this exists. `weight` lives in each
 * project's own frontmatter, so dragging six projects into a new order changes
 * six files — and six calls to writeFile() is six commits, six pushes and six
 * two-minute deploys for one decision. The contents API cannot express a
 * multi-file commit; the git database can, which is the same reason rebuild()
 * is written against it.
 *
 * Four steps: a blob per file, one tree on top of the current one, a commit,
 * then move the branch. Unchanged files are not mentioned — the tree is built
 * with `base_tree`, so everything not listed is inherited rather than deleted.
 *
 * Not forced, for the same reason as rebuild(): if anything landed on the
 * branch in between, this is no longer a fast-forward and GitHub refuses it.
 * The nightly play-data Action commits to this branch, so that is a real
 * collision and losing it to a force push would be worse than failing.
 */
export async function writeFiles(
  token: string,
  files: { path: string; text: string }[],
  message: string,
): Promise<{ commit: string; written: number }> {
  if (files.length === 0) return { commit: '', written: 0 };

  const base = `${API}/repos/${OWNER}/${REPO}/git`;
  const h = headers(token);
  const json = { ...h, 'content-type': 'application/json' };

  const refResponse = await fetch(`${base}/ref/heads/${BRANCH}`, { headers: h });
  if (!refResponse.ok) throw new Error(`ref: ${refResponse.status}`);
  const { object } = (await refResponse.json()) as { object: { sha: string } };

  const headResponse = await fetch(`${base}/commits/${object.sha}`, { headers: h });
  if (!headResponse.ok) throw new Error(`head: ${headResponse.status}`);
  const head = (await headResponse.json()) as { tree: { sha: string } };

  // A blob each. Sent as base64 rather than as utf-8 so that a file with a
  // non-ASCII character in it — which is most of them, this site is full of
  // em dashes — cannot be mangled by the API guessing an encoding.
  const blobs: { path: string; sha: string }[] = [];
  for (const file of files) {
    const made = await fetch(`${base}/blobs`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ content: toBase64(file.text), encoding: 'base64' }),
    });
    if (!made.ok) throw new Error(`blob ${file.path}: ${made.status}`);
    const blob = (await made.json()) as { sha: string };
    blobs.push({ path: file.path, sha: blob.sha });
  }

  const tree = await fetch(`${base}/trees`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({
      base_tree: head.tree.sha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      })),
    }),
  });
  if (!tree.ok) throw new Error(`tree: ${tree.status}`);
  const built = (await tree.json()) as { sha: string };

  const commit = await fetch(`${base}/commits`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({
      message: safeMessage(message),
      tree: built.sha,
      parents: [object.sha],
    }),
  });
  if (!commit.ok) throw new Error(`commit: ${commit.status}`);
  const made = (await commit.json()) as { sha: string };

  const moved = await fetch(`${base}/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify({ sha: made.sha, force: false }),
  });
  if (moved.status === 409 || moved.status === 422) {
    throw new Error('conflict: the branch moved while this was being written');
  }
  if (!moved.ok) throw new Error(`ref update: ${moved.status}`);

  return { commit: made.sha, written: files.length };
}

/**
 * Make the site rebuild, by giving deploy.yml a push to build.
 *
 * What a rebuild is for changed on 2026-10-19. The build in deploy.yml runs
 * without the Steam, RetroAchievements and Printful keys, so it deploys the
 * committed data/*.json rather than fetching fresh — fresh data arrives by
 * commit (play-data.yml, Sync Printful). A rebuild is now for what depends on
 * the DATE rather than on data: a post scheduled for today is withheld by
 * whichever build ran before today, and only a new build lets it out.
 *
 * So this commits nothing. It writes a new commit pointing at the SAME tree
 * as its parent — an empty commit — which is a new sha, which is a push, which
 * is a build. The cost is a bookkeeping commit in the history, which the
 * repository already has plenty of under "Refresh play data".
 *
 * Four calls, because the contents API cannot express a commit with no
 * changes in it; the git database can.
 */
export async function rebuild(token: string, message: string): Promise<{ commit: string }> {
  const base = `${API}/repos/${OWNER}/${REPO}/git`;
  const h = headers(token);

  const refResponse = await fetch(`${base}/ref/heads/${BRANCH}`, { headers: h });
  if (!refResponse.ok) throw new Error(`ref: ${refResponse.status}`);
  const { object } = (await refResponse.json()) as { object: { sha: string } };

  const headResponse = await fetch(`${base}/commits/${object.sha}`, { headers: h });
  if (!headResponse.ok) throw new Error(`head: ${headResponse.status}`);
  const head = (await headResponse.json()) as { tree: { sha: string } };

  const made = await fetch(`${base}/commits`, {
    method: 'POST',
    headers: { ...h, 'content-type': 'application/json' },
    body: JSON.stringify({
      message: safeMessage(message),
      tree: head.tree.sha,
      parents: [object.sha],
    }),
  });
  if (!made.ok) throw new Error(`commit: ${made.status}`);
  const commit = (await made.json()) as { sha: string };

  // Not forced. If anything landed on the branch between reading the ref and
  // here, this is no longer a fast-forward and GitHub refuses it — which is
  // the right outcome: a rebuild is never worth rewriting history for.
  const moved = await fetch(`${base}/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    headers: { ...h, 'content-type': 'application/json' },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  if (!moved.ok) throw new Error(`ref update: ${moved.status}`);

  return { commit: commit.sha };
}

/** The newest commit on the branch, which is what a healthy deploy should be serving. */
export async function headCommit(token: string): Promise<string> {
  const response = await fetch(`${API}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, {
    headers: headers(token),
  });
  if (!response.ok) throw new Error(`head ref: ${response.status}`);
  const { object } = (await response.json()) as { object: { sha: string } };
  return object.sha;
}

/** A slug that is safe as a filename and as a URL. */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
