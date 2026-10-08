// Gets the work hub its Trello credentials, and proves them before storing.
//
//   node scripts/trello-auth.mjs
//
// Run it in your own terminal, not through an agent session: it asks for a key
// and a token, and neither should end up in a transcript. Nothing here is
// printed back, logged, or written to the repo — both values go straight into
// Worker secrets, which is the only place the hub reads them from.
//
// Why a script rather than four steps in a document: the authorize URL has to
// carry the right scope and expiry, and getting either wrong is quiet. `read`
// and not `read,write` because the hub only ever reads — a token that can move
// cards is a token that can empty a board by accident. `never` because the
// default is 30 days, and an expiring token means the hub works for a month
// and then shows an empty page with no obvious cause.

import { createInterface } from 'node:readline/promises';
import { execFileSync } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';

const rl = createInterface({ input, output });

/**
 * What someone actually pastes.
 *
 * Deliberately NOT a format check. The first version of this script matched
 * both values against a hex regex, which rejected a valid token outright:
 * Trello issues Atlassian-style credentials now, with mixed case and
 * characters that are not hex, and the format has changed more than once. A
 * guessed shape is a credential this script refuses for no reason, so the
 * only gate is the live call to Trello further down — the one check that
 * tests the thing we actually care about.
 *
 * What this does handle is paste accidents: surrounding quotes, stray
 * whitespace, and the whole redirect URL instead of just the token, which is
 * easy to grab by mistake when the browser is showing one.
 */
function clean(raw) {
  let value = raw.trim().replace(/^['"]|['"]$/g, '');
  const fromUrl = value.match(/[?&#](?:token|key)=([^&#\s]+)/);
  if (fromUrl) value = fromUrl[1];
  return value.trim();
}

/** Non-empty, one piece, not absurd. Everything else is Trello's to judge. */
function plausible(value) {
  return value.length >= 8 && value.length <= 512 && !/\s/.test(value);
}

const KEY_PAGE = 'https://trello.com/power-ups/admin';

console.log(`
Trello credentials for the work hub
===================================

1. Open ${KEY_PAGE}
   Create an integration (Trello calls it a Power-Up) if there isn't one, open
   it, and find its API key. Trello has reorganised this page more than once,
   so go by what you see rather than by any remembered button name.
`);

const key = clean(await rl.question('   Paste the API key: '));
if (!plausible(key)) {
  console.error('\n   Nothing usable pasted. Stopping.');
  rl.close();
  process.exit(1);
}

const authorize =
  'https://trello.com/1/authorize?' +
  new URLSearchParams({
    key,
    name: 'Master Roachi work hub',
    scope: 'read',
    expiration: 'never',
    response_type: 'token',
  }).toString();

console.log(`
2. Open this and approve it. It asks for read access only:

   ${authorize}
`);

// Best effort — on a desktop this puts it on screen, and if there is no opener
// the URL above is right there to paste.
try {
  execFileSync('xdg-open', [authorize], { stdio: 'ignore' });
} catch {
  /* no opener; the printed URL is the fallback */
}

const token = clean(await rl.question('   Paste the token it shows: '));
if (!plausible(token)) {
  console.error('\n   Nothing usable pasted. Stopping.');
  rl.close();
  process.exit(1);
}

// Prove it before storing it. A typo saved as a secret fails at page load with
// a 401 the page can only report as "Trello could not be read", which is a
// long way from "you pasted it short".
console.log('\n3. Checking what it can see…\n');

const response = await fetch(
  `https://api.trello.com/1/members/me/boards?${new URLSearchParams({
    key,
    token,
    fields: 'name',
    filter: 'open',
  })}`,
  { headers: { accept: 'application/json' } },
);

if (!response.ok) {
  console.error(`   Trello refused it (${response.status}). Nothing stored.`);
  if (response.status === 401) {
    console.error(
      '   A 401 does not say which of the two is wrong — re-check the API key\n' +
        '   on the Power-Up page as well as the token.',
    );
  }
  rl.close();
  process.exit(1);
}

const boards = await response.json();
for (const board of boards) console.log(`   · ${board.name}`);
console.log(`\n   ${boards.length} board(s).`);

const ok = (await rl.question('\n   Store these as Worker secrets? [y/N] ')).trim();
rl.close();

if (ok.toLowerCase() !== 'y') {
  console.log('   Left alone. Nothing stored.');
  process.exit(0);
}

// Piped on stdin so neither value appears in the process list, where every
// other user on the machine could read it off `ps`.
for (const [name, value] of [
  ['TRELLO_KEY', key],
  ['TRELLO_TOKEN', token],
]) {
  execFileSync('npx', ['wrangler', 'secret', 'put', name], {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}

console.log(`
Done. The hub will read on the next deploy:

  npm run build && npx wrangler deploy

Revoke it any time at https://trello.com/my/account under Applications.
`);
