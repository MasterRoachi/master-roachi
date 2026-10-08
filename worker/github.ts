// Writing to the repo from the edge.
//
// The site is a static export, so there is no database behind the published
// pages — a blog post IS a file in content/writing, and changing one means
// changing the repo. The backend therefore commits, and the deploy happens by
// itself: Workers Builds is wired to this repository, and a push is what
// triggers a build. See .github/workflows/play-data.yml, which relies on the
// same thing.
//
// That makes GITHUB_TOKEN the most dangerous credential on this Worker. It can
// commit to a repository that publishes itself. It should be a fine-grained
// token scoped to this one repo with Contents: read and write, and nothing
// else — no other repo, no other permission.

const API = 'https://api.github.com';
const OWNER = 'MasterRoachi';
const REPO = 'master-roachi';
const BRANCH = 'main';

/** Where posts live. Everything this module touches is under here. */
export const WRITING_DIR = 'content/writing';

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
 * Cloudflare Workers Builds honours CI-skip tokens and scans the WHOLE
 * message, body included. A post committed with one of those in its title
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

/** Every post in the writing collection, newest filename last. */
export async function listPosts(token: string): Promise<GitFile[]> {
  const response = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${WRITING_DIR}?ref=${BRANCH}`,
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
    .filter((e) => e.type === 'file' && e.name.endsWith('.mdx'))
    .map((e) => ({ path: e.path, sha: e.sha }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** One post, with the sha that says which version this is. */
export async function readPost(token: string, path: string): Promise<GitPost> {
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
export async function writePost(
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
