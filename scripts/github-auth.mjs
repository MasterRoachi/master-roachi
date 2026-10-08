// Checks the backend's GitHub token and stores it.
//
//   npm run github-auth
//
// Run it in your own terminal, not through an agent session: it asks for a
// token and that should not end up in a transcript. Nothing is printed back
// or written to the repo — the value goes straight into a Worker secret.
//
// Worth checking before storing because of how this fails. A fine-grained
// token without access to the right repository answers 404, not 403, so the
// editor would report "list: 404" and leave you guessing between a wrong
// repo, a wrong owner, a missing permission and a typo. Each of those is
// distinguished here instead.

import { createInterface } from 'node:readline/promises';
import { execFileSync } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';

const OWNER = 'MasterRoachi';
const REPO = 'master-roachi';
const WRITING = 'content/writing';

const rl = createInterface({ input, output });

const token = (await rl.question('Paste the GitHub token: '))
  .trim()
  .replace(/^['"]|['"]$/g, '');

if (token.length < 8 || /\s/.test(token)) {
  console.error('\nNothing usable pasted. Stopping.');
  rl.close();
  process.exit(1);
}

const gh = (path) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'master-roachi-setup',
    },
  });

console.log('\nChecking…\n');

// 1. Is it a token at all.
const who = await gh('/user');
if (!who.ok) {
  console.error(`  GitHub rejected the token itself (${who.status}). Nothing stored.`);
  rl.close();
  process.exit(1);
}
const { login } = await who.json();
console.log(`  · authenticates as ${login}`);

// 2. Can it see this repository. 404 here is the common misconfiguration: the
//    token exists and works, but its repository access does not include this
//    one, or its resource owner is the wrong account.
const repo = await gh(`/repos/${OWNER}/${REPO}`);
if (repo.status === 404) {
  console.error(`
  Cannot see ${OWNER}/${REPO} (404).

  For a fine-grained token that almost always means one of:
    · Repository access is "Public repositories" or the wrong selection —
      it needs "Only select repositories" with ${REPO} ticked
    · The resource owner is the wrong account
  Nothing stored.`);
  rl.close();
  process.exit(1);
}
if (!repo.ok) {
  console.error(`  Could not read the repository (${repo.status}). Nothing stored.`);
  rl.close();
  process.exit(1);
}
const { permissions, default_branch: branch } = await repo.json();
console.log(`  · sees ${OWNER}/${REPO}, default branch ${branch}`);

// 3. Can it write. Read-only is a valid token that would fail only on save —
//    after the editor had already let him type a whole post.
if (!permissions?.push) {
  console.error(`
  It can read but not write. The editor would let you write a post and then
  fail on save. Set Repository permissions → Contents: Read and write.
  Nothing stored.`);
  rl.close();
  process.exit(1);
}
console.log('  · can write (Contents: read and write)');

// 4. Can it see the posts, which is what the editor lists.
const dir = await gh(`/repos/${OWNER}/${REPO}/contents/${WRITING}?ref=${branch}`);
if (!dir.ok) {
  console.error(`  Could not read ${WRITING} (${dir.status}). Nothing stored.`);
  rl.close();
  process.exit(1);
}
const posts = (await dir.json()).filter((e) => e.name.endsWith('.mdx'));
console.log(`  · reads ${WRITING} — ${posts.length} post(s)`);

const ok = (await rl.question('\nStore it as a Worker secret? [y/N] ')).trim();
rl.close();

if (ok.toLowerCase() !== 'y') {
  console.log('Left alone. Nothing stored.');
  process.exit(0);
}

// On stdin, so it never appears in the process list.
execFileSync('npx', ['wrangler', 'secret', 'put', 'GITHUB_TOKEN'], {
  input: token,
  stdio: ['pipe', 'inherit', 'inherit'],
});

console.log(`
Done. Live on the next deploy:

  npm run build && npx wrangler deploy

Fine-grained tokens expire — note the date you set, because when it lapses the
editor will simply say it is not connected. Rotate by re-running this.
`);
