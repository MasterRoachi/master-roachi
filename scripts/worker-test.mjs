// Exercises worker/index.ts against a fake KV, without wrangler dev — which
// holds a lock on out/ and is a nuisance to kill cleanly.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Run from the repo root: node scripts/worker-test.mjs

// os.tmpdir() rather than process.env.TMP, which is a Windows variable and is
// unset on Linux — the path then fell back to '.', and 'file://' + a relative
// path produced file://worker-bundle.mjs/, where Node reads the filename as a
// URL host and refuses it. An absolute path through pathToFileURL is correct
// on both, and also keeps the bundle out of the working tree.
const bundle = path.join(os.tmpdir(), 'master-roachi-worker-bundle.mjs');
execFileSync(
  'npx',
  ['esbuild', 'worker/index.ts', '--bundle', '--format=esm', '--platform=neutral', `--outfile=${bundle}`],
  { stdio: 'pipe', shell: true },
);

const { default: worker } = await import(pathToFileURL(bundle).href);

// The sketch format is pure and lives in lib/, but it is the one piece here
// whose breakage is invisible: a file that round-trips wrongly looks fine
// until a sketch is reopened and is not what was left. Bundled and tested in
// the same run so there is one command to trust.
const sketchBundle = path.join(os.tmpdir(), 'master-roachi-sketch-bundle.mjs');
execFileSync(
  'npx',
  ['esbuild', 'lib/sketch.ts', '--bundle', '--format=esm', '--platform=neutral', `--outfile=${sketchBundle}`],
  { stdio: 'pipe', shell: true },
);
const sketch = await import(pathToFileURL(sketchBundle).href);

// Same reasoning for the habit grid's week maths: pure, and wrong in a way
// nothing would announce — a misread weekday shifts the weekend shading and a
// misread week boundary miscounts every weekly habit.
const habitsBundle = path.join(os.tmpdir(), 'master-roachi-habits-bundle.mjs');
execFileSync(
  'npx',
  ['esbuild', 'lib/habits.ts', '--bundle', '--format=esm', '--platform=neutral', `--outfile=${habitsBundle}`],
  { stdio: 'pipe', shell: true },
);
const habits = await import(pathToFileURL(habitsBundle).href);

// monthDays decides how many columns a month has, and gets February wrong once
// every four years if it is done with a table of month lengths.
const dbBundle = path.join(os.tmpdir(), 'master-roachi-db-bundle.mjs');
execFileSync(
  'npx',
  ['esbuild', 'worker/db.ts', '--bundle', '--format=esm', '--platform=neutral', `--outfile=${dbBundle}`],
  { stdio: 'pipe', shell: true },
);
const dbLib = await import(pathToFileURL(dbBundle).href);

// The icon set, where a typo is silent: a malformed path renders as nothing
// and a duplicated name makes one icon unreachable.
const iconBundle = path.join(os.tmpdir(), 'master-roachi-icon-bundle.mjs');
execFileSync(
  'npx',
  ['esbuild', 'lib/habit-icons.ts', '--bundle', '--format=esm', '--platform=neutral', `--outfile=${iconBundle}`],
  { stdio: 'pipe', shell: true },
);
const icons = await import(pathToFileURL(iconBundle).href);

/** Just enough KV for these paths. */
function fakeKV() {
  const map = new Map();
  return {
    _map: map,
    async get(k) {
      return map.has(k) ? map.get(k) : null;
    },
    async put(k, v) {
      map.set(k, v);
    },
    async delete(k) {
      map.delete(k);
    },
    async list({ prefix = '', limit = 1000 } = {}) {
      const keys = [...map.keys()]
        .filter((k) => k.startsWith(prefix))
        .sort()
        .slice(0, limit)
        .map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

const ORDERS = fakeKV();
const env = {
  ASSETS: { fetch: async () => new Response('404 page', { status: 404 }) },
  ORDERS,
  ORDERS_KEY: 's3cret',
};

const post = (body) =>
  new Request('https://masterroachi.com/api/order', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-visitor': '{"scheme":"https"}' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const get = (url) =>
  new Request(url, { headers: { 'cf-visitor': '{"scheme":"https"}' } });

const results = [];
const check = (label, pass, detail = '') =>
  results.push({ label, pass, detail });

// --- a good order ----------------------------------------------------------
let res = await worker.fetch(
  post({
    product: 'Roachi Shirt',
    productId: '464722916',
    size: '2XL',
    price: 'R550',
    name: 'Test Buyer',
    email: 'test@example.com',
    phone: '0123456789',
    address: '1 Test Road\nCape Town\n8001\nSouth Africa',
  }),
  env,
);
let body = await res.json();
check('valid order accepted', res.status === 200 && body.stored === true, JSON.stringify(body));
check('reference returned', typeof body.ref === 'string' && body.ref.length === 8, body.ref);
check(
  'reference avoids 0/O/1/I',
  !/[01OI]/.test(body.ref ?? ''),
  body.ref,
);
const savedRef = body.ref;

// --- required fields -------------------------------------------------------
res = await worker.fetch(post({ name: 'Only a name' }), env);
check('missing address rejected', res.status === 400, String(res.status));

res = await worker.fetch(post({ name: 'x', email: 'y', address: 'z' }), env);
check('missing size rejected', res.status === 400, String(res.status));

// --- junk ------------------------------------------------------------------
res = await worker.fetch(post('not json'), env);
check('malformed JSON rejected', res.status === 400, String(res.status));

res = await worker.fetch(post({ name: 'a'.repeat(10000) }), env);
check('oversized body rejected', res.status === 413, String(res.status));

// --- field capping ---------------------------------------------------------
await worker.fetch(
  post({
    size: 'M',
    name: 'N'.repeat(500),
    email: 'e@x.com',
    address: 'A'.repeat(2000),
  }),
  env,
);
const capped = JSON.parse([...ORDERS._map.values()].at(-1));
check('name capped at 200', capped.name.length === 200, String(capped.name.length));
check('address capped at 600', capped.address.length === 600, String(capped.address.length));

// --- GET is not allowed ----------------------------------------------------
res = await worker.fetch(get('https://masterroachi.com/api/order'), env);
check('GET /api/order refused', res.status === 405, String(res.status));

// --- reading orders back ---------------------------------------------------
res = await worker.fetch(get('https://masterroachi.com/api/orders'), env);
check('no key serves the 404 page', res.status === 404, String(res.status));

res = await worker.fetch(get('https://masterroachi.com/api/orders?key=wrong'), env);
check('wrong key serves the 404 page', res.status === 404, String(res.status));

res = await worker.fetch(get('https://masterroachi.com/api/orders?key=s3cret'), env);
body = await res.json();
check('correct key lists orders', res.status === 200 && body.count === 2, JSON.stringify(body.count));
check(
  'newest first',
  body.orders[0]?.name?.startsWith('NNN'),
  body.orders[0]?.name?.slice(0, 6),
);
check('order carries its reference', body.orders.some((o) => o.ref === savedRef), savedRef);

// --- no KV bound -----------------------------------------------------------
res = await worker.fetch(post({ size: 'M', name: 'a', email: 'b@c.d', address: 'e' }), {
  ...env,
  ORDERS: undefined,
});
body = await res.json();
check(
  'unconfigured store does not block a sale',
  res.status === 200 && body.stored === false,
  JSON.stringify(body),
);

// --- the poll still works --------------------------------------------------
res = await worker.fetch(get('https://masterroachi.com/api/vote'), { ...env, VOTES: undefined });
body = await res.json();
check('poll endpoint unaffected', res.status === 200 && body.configured === false, JSON.stringify(body));

// --- the work hub ----------------------------------------------------------
//
// The gate is Cloudflare Access, but the endpoint has its own backstop, and
// the backstop is the thing worth testing: if it ever stops failing closed,
// the Trello board is served to anyone who guesses the path.

const workEnv = {
  ...env,
  TRELLO_KEY: 'k',
  TRELLO_TOKEN: 't',
};

const viaAccess = (url) =>
  new Request(url, { headers: { 'cf-access-jwt-assertion': 'stub-jwt' } });

res = await worker.fetch(get('https://masterroachi.com/api/work'), workEnv);
check(
  'work hub without Access serves the 404 page',
  (await res.text()) === '404 page',
  String(res.status),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/api/work'), env);
body = await res.json();
check(
  'work hub with no Trello secrets answers configured:false',
  res.status === 200 && body.configured === false,
  JSON.stringify(body),
);

// Trello stubbed: one board with real bucket lists, one board whose lists are
// named something the matcher does not know.
const realFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = String(input);
  const reply = (data) =>
    new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' },
    });

  if (url.includes('/members/me/boards')) {
    return reply([
      { id: 'b1', name: 'Shepherds' },
      { id: 'b2', name: 'Odd One' },
      { id: 'b3', name: 'North Star' },
      { id: 'b4', name: 'SensusAir Dev Tean' },
    ]);
  }
  if (url.includes('/boards/b1')) {
    return reply({
      id: 'b1',
      name: 'Shepherds',
      url: 'https://trello.com/b/x',
      lists: [
        { id: 'l1', name: 'Current Focus' },
        { id: 'l2', name: 'Review / Test' },
        { id: 'l3', name: 'Done' },
      ],
      cards: [
        {
          id: 'c1',
          name: 'Lock the four standards',
          url: 'https://trello.com/c/c1',
          idList: 'l1',
          due: null,
          dateLastActivity: '2026-09-23T23:30:40.261Z',
          labels: [{ name: 'Pixel Art' }, { name: '' }],
        },
        {
          id: 'c2',
          name: 'P7 dressed',
          url: 'https://trello.com/c/c2',
          idList: 'l2',
          due: null,
          dateLastActivity: '2026-09-16T12:38:59.100Z',
          labels: [],
        },
        {
          id: 'c3',
          name: 'Should not appear',
          url: 'https://trello.com/c/c3',
          idList: 'l3',
          due: null,
          dateLastActivity: null,
          labels: [],
        },
      ],
    });
  }
  if (url.includes('/boards/b3')) {
    return reply({
      id: 'b3',
      name: 'North Star',
      url: 'https://trello.com/b/z',
      // A team board's own workflow. None of these is a bucket name, and that
      // must not matter: the board is read by who a card is assigned to.
      lists: [
        { id: 'w1', name: 'Sprint backlog' },
        { id: 'w2', name: 'Blocked' },
      ],
      cards: [
        {
          id: 'w-mine',
          name: 'Ship the sensor firmware note',
          url: 'https://trello.com/c/wm',
          idList: 'w1',
          due: null,
          dateLastActivity: '2026-10-07T09:00:00.000Z',
          labels: [],
          idMembers: ['me-123', 'other-9'],
        },
        {
          id: 'w-theirs',
          name: "A colleague's card",
          url: 'https://trello.com/c/wt',
          idList: 'w1',
          due: null,
          dateLastActivity: '2026-10-07T09:00:00.000Z',
          labels: [],
          idMembers: ['other-9'],
        },
        {
          id: 'w-nobody',
          name: 'Unassigned card',
          url: 'https://trello.com/c/wn',
          idList: 'w2',
          due: null,
          dateLastActivity: '2026-10-07T09:00:00.000Z',
          labels: [],
        },
      ],
    });
  }
  if (url.includes('/boards/b2')) {
    return reply({
      id: 'b2',
      name: 'Odd One',
      url: 'https://trello.com/b/y',
      lists: [{ id: 'l9', name: 'Someday' }],
      cards: [],
    });
  }
  return realFetch(input);
};

res = await worker.fetch(viaAccess('https://masterroachi.com/api/work'), workEnv);
body = await res.json();
const shepherds = body.boards?.find((b) => b.name === 'Shepherds');
const odd = body.boards?.find((b) => b.name === 'Odd One');

check(
  'work hub reads the Trello account',
  res.status === 200 && body.configured === true,
  JSON.stringify({ configured: body.configured }),
);
check(
  'Done is not a bucket, so its card is dropped',
  shepherds?.cards.length === 2,
  JSON.stringify(shepherds?.cards.map((c) => c.name)),
);
check(
  'Current Focus maps to today, Review / Test to doing',
  shepherds?.cards.find((c) => c.id === 'c1')?.bucket === 'today' &&
    shepherds?.cards.find((c) => c.id === 'c2')?.bucket === 'doing',
  JSON.stringify(shepherds?.cards.map((c) => [c.id, c.bucket])),
);
check(
  'the real list name survives the bucket',
  shepherds?.cards.find((c) => c.id === 'c2')?.list === 'Review / Test',
  JSON.stringify(shepherds?.cards.find((c) => c.id === 'c2')),
);
check(
  'unnamed labels are dropped',
  JSON.stringify(shepherds?.cards.find((c) => c.id === 'c1')?.labels) ===
    JSON.stringify(['Pixel Art']),
  JSON.stringify(shepherds?.cards.find((c) => c.id === 'c1')?.labels),
);
// The typo board is hidden, so it must appear nowhere at all — not as a
// panel, and not in the unmatched footnote either.
check(
  'a hidden board is absent entirely',
  body.boards?.every((b) => b.name !== 'SensusAir Dev Tean') &&
    !body.unmatched.includes('SensusAir Dev Tean'),
  JSON.stringify({ boards: body.boards?.map((b) => b.name), unmatched: body.unmatched }),
);

const workBoard = body.boards?.find((b) => b.name === 'North Star');

check(
  'a work board is scoped day-job and read despite unknown list names',
  workBoard?.scope === 'day-job' && !body.unmatched.includes('North Star'),
  JSON.stringify({ scope: workBoard?.scope, unmatched: body.unmatched }),
);
check(
  'a day-job board is read whole, assigned or not',
  workBoard?.cards.length === 3,
  JSON.stringify(workBoard?.cards.map((c) => c.id)),
);
check(
  'a day-job card carries its real list and no bucket',
  workBoard?.cards[0].list === 'Sprint backlog' && workBoard.cards[0].bucket === null,
  JSON.stringify(workBoard?.cards[0]),
);
check(
  'his own board is scoped mine',
  shepherds?.scope === 'mine',
  JSON.stringify(shepherds?.scope),
);
check(
  'a board with no bucket list gets a name, not a panel',
  odd === undefined && JSON.stringify(body.unmatched) === JSON.stringify(['Odd One']),
  JSON.stringify({ odd, unmatched: body.unmatched }),
);

// Dev has no Access in front of it, so localhost must not be locked out.
res = await worker.fetch(get('http://localhost:8788/api/work'), workEnv);
check('work hub answers on localhost without Access', res.status === 200, String(res.status));

globalThis.fetch = realFetch;

// --- the content API -------------------------------------------------------
//
// This one commits to a repository that deploys itself, so the tests that
// matter are the ones about what it REFUSES.

const ghEnv = { ...env, GITHUB_TOKEN: 'ghtok' };
const commits = [];

const ghFetch = async (input, init = {}) => {
  const url = String(input);
  const reply = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  if (url.includes('/contents/notes?')) {
    // A missing directory, which is what notes/ is until the first note. The
    // listing must read as empty rather than failing the whole collection.
    return new Response('{"message":"Not Found"}', {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (url.includes('/contents/content/writing?')) {
    return reply([
      { name: 'the-road-in.mdx', path: 'content/writing/the-road-in.mdx', sha: 's1', type: 'file' },
      { name: 'notes.txt', path: 'content/writing/notes.txt', sha: 's2', type: 'file' },
    ]);
  }
  if (init.method === 'PUT') {
    const body = JSON.parse(init.body);
    commits.push({ url, ...body });
    return reply({ commit: { sha: 'abc123' } });
  }
  if (url.includes('/contents/content/writing/')) {
    // "Fróm — the road" round-tripped through UTF-8 base64.
    const text = '---\ntitle: Fróm — the road\n---\n\nIt’s a test.';
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return reply({ content: btoa(binary), sha: 's1' });
  }
  return new Response('nope', { status: 404 });
};

const preGh = globalThis.fetch;
globalThis.fetch = ghFetch;

res = await worker.fetch(get('https://masterroachi.com/work/api/content'), ghEnv);
check(
  'content API without Access serves the 404 page',
  (await res.text()) === '404 page',
  String(res.status),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/content?collection=writing'), env);
body = await res.json();
check(
  'no GitHub token answers configured:false',
  res.status === 200 && body.configured === false,
  JSON.stringify(body),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/content?collection=writing'), ghEnv);
body = await res.json();
check(
  'listing returns only .mdx posts',
  body.files?.length === 1 && body.files[0].path === 'content/writing/the-road-in.mdx',
  JSON.stringify(body.files),
);

// --- the path guard, which is the whole security story here ---------------
for (const bad of [
  '.github/workflows/play-data.yml',
  'content/writing/../../.github/workflows/x.mdx',
  'content/writing/UPPER.mdx',
  'content/writing/post.md',
  'wrangler.jsonc',
  'content/writing/nested/post.mdx',
]) {
  res = await worker.fetch(
    viaAccess(`https://masterroachi.com/work/api/content?collection=writing&path=${encodeURIComponent(bad)}`),
    ghEnv,
  );
  check(`read refuses ${bad}`, res.status === 400, String(res.status));
}

res = await worker.fetch(
  viaAccess(
    'https://masterroachi.com/work/api/content?collection=writing&path=content/writing/the-road-in.mdx',
  ),
  ghEnv,
);
body = await res.json();
check(
  'a post round-trips non-ASCII intact',
  body.file?.text.includes('Fróm — the road') && body.file.text.includes('It’s a test.'),
  JSON.stringify(body.file?.text),
);

// --- writing ---------------------------------------------------------------
const postContent = (payload, url = 'https://masterroachi.com/work/api/content') =>
  new Request(url, {
    method: 'POST',
    headers: { 'cf-access-jwt-assertion': 'stub-jwt', 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

res = await worker.fetch(
postContent(
  { collection: 'writing', path: '.github/workflows/evil.yml', text: 'jobs:' }),
  ghEnv,
);
check('write refuses a workflow path', res.status === 400, String(res.status));

res = await worker.fetch(
postContent({ collection: 'writing', text: '   ' }), ghEnv);
check('write refuses an empty body', res.status === 400, String(res.status));

res = await worker.fetch(
postContent({ collection: 'writing', title: '!!!', text: 'something' }), ghEnv);
check('write refuses a title that slugifies to nothing', res.status === 400, String(res.status));

commits.length = 0;
res = await worker.fetch(
postContent({
    collection: 'writing',
    title: 'A Néw Post — part [skip ci] two',
    text: '---\ntitle: x\n---\n\nBody.',
  }),
  ghEnv,
);
body = await res.json();
check(
  'a new post is named from its title',
  body.saved === true && body.path === 'content/writing/a-new-post-part-skip-ci-two.mdx',
  JSON.stringify(body),
);
check(
  'the commit message cannot skip its own deploy',
  commits.length === 1 && !/\[skip ci\]|\[ci skip\]/i.test(commits[0].message),
  JSON.stringify(commits[0]?.message),
);
check(
  'a new post is sent without a sha',
  commits[0].sha === undefined,
  JSON.stringify(Object.keys(commits[0])),
);

commits.length = 0;
res = await worker.fetch(
postContent({
    collection: 'writing',
    path: 'content/writing/the-road-in.mdx',
    text: 'edited',
    sha: 's1',
  }),
  ghEnv,
);
check(
  'an edit carries the sha it was loaded with',
  commits[0]?.sha === 's1' && commits[0].message === 'Update the-road-in.mdx',
  JSON.stringify(commits[0]),
);

globalThis.fetch = async (input, init = {}) =>
  init.method === 'PUT'
    ? new Response('{}', { status: 409 })
    : ghFetch(input, init);
res = await worker.fetch(
postContent({
    collection: 'writing',
    path: 'content/writing/the-road-in.mdx',
    text: 'x',
    sha: 'stale',
  }),
  ghEnv,
);
check('a stale sha reports a conflict, not a 500', res.status === 409, String(res.status));

globalThis.fetch = preGh;

// --- the rebuild button ----------------------------------------------------
//
// It changes what is deployed, so the tests are about who may fire it and
// what it must not do to the history.

const rebuildCalls = [];
globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  const reply = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  if (url.endsWith('/git/ref/heads/main')) return reply({ object: { sha: 'parent-sha' } });
  if (url.includes('/git/commits/parent-sha')) return reply({ tree: { sha: 'tree-sha' } });
  if (url.endsWith('/git/commits') && init.method === 'POST') {
    rebuildCalls.push({ step: 'commit', ...JSON.parse(init.body) });
    return reply({ sha: 'new-sha' });
  }
  if (url.endsWith('/git/refs/heads/main') && init.method === 'PATCH') {
    rebuildCalls.push({ step: 'ref', ...JSON.parse(init.body) });
    return reply({});
  }
  return new Response('nope', { status: 404 });
};

res = await worker.fetch(
  new Request('https://masterroachi.com/work/api/rebuild', { method: 'POST' }),
  ghEnv,
);
check(
  'rebuild without Access serves the 404 page',
  (await res.text()) === '404 page',
  String(res.status),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/rebuild'), ghEnv);
check('rebuild refuses GET', res.status === 405, String(res.status));

res = await worker.fetch(
  new Request('https://masterroachi.com/work/api/rebuild', {
    method: 'POST',
    headers: { 'cf-access-jwt-assertion': 'stub-jwt' },
  }),
  env,
);
body = await res.json();
check(
  'rebuild with no GitHub token answers configured:false',
  res.status === 200 && body.configured === false,
  JSON.stringify(body),
);

rebuildCalls.length = 0;
res = await worker.fetch(
  new Request('https://masterroachi.com/work/api/rebuild', {
    method: 'POST',
    headers: { 'cf-access-jwt-assertion': 'stub-jwt' },
  }),
  ghEnv,
);
body = await res.json();
const made = rebuildCalls.find((c) => c.step === 'commit');
const moved = rebuildCalls.find((c) => c.step === 'ref');

check('rebuild reports the new commit', body.started === true && body.commit === 'new-sha', JSON.stringify(body));
check(
  'the commit reuses the parent tree, so nothing is changed',
  made?.tree === 'tree-sha' && JSON.stringify(made.parents) === JSON.stringify(['parent-sha']),
  JSON.stringify(made),
);
check(
  'the ref is moved without force, so history cannot be rewritten',
  moved?.sha === 'new-sha' && moved.force === false,
  JSON.stringify(moved),
);
check(
  'the rebuild message cannot skip its own build',
  !/\[skip ci\]|\[ci skip\]/i.test(made?.message ?? ''),
  JSON.stringify(made?.message),
);

globalThis.fetch = preGh;

// --- collections, drafts and the version stamp -----------------------------

// The rebuild block restored the real fetch, so the GitHub stub goes back on.
globalThis.fetch = ghFetch;

// Unknown collections cannot be read or written, so a new directory is only
// reachable once lib/collections.ts says so.
res = await worker.fetch(
  viaAccess('https://masterroachi.com/work/api/content?collection=secrets'),
  ghEnv,
);
check('an unknown collection is refused', res.status === 400, String(res.status));

res = await worker.fetch(postContent({ collection: 'secrets', text: 'x' }), ghEnv);
check('writing to an unknown collection is refused', res.status === 400, String(res.status));

// The guard is per collection: a projects path is not a writing path.
res = await worker.fetch(
  viaAccess(
    'https://masterroachi.com/work/api/content?collection=writing&path=content/projects/terrath.mdx',
  ),
  ghEnv,
);
check(
  'a path from another collection is refused',
  res.status === 400,
  String(res.status),
);

// The single-file collection may touch exactly one path, and nothing else in
// its own directory either.
res = await worker.fetch(
  postContent({
    collection: 'store-copy',
    path: 'content/store/other.json',
    text: '{}',
  }),
  ghEnv,
);
check(
  'the single-file collection refuses a sibling file',
  res.status === 400,
  String(res.status),
);

res = await worker.fetch(
  postContent({
    collection: 'store-copy',
    path: 'content/store/copy.json',
    text: '{ "464722916": ["One." ',
    sha: 's1',
  }),
  ghEnv,
);
check(
  'malformed JSON is refused before it can fail a build',
  res.status === 400,
  String(res.status),
);

commits.length = 0;
res = await worker.fetch(
  postContent({
    collection: 'store-copy',
    path: 'content/store/copy.json',
    text: '{"464722916":["One."]}',
    sha: 's1',
  }),
  ghEnv,
);
body = await res.json();
check('valid JSON saves', body.saved === true, JSON.stringify(body));

// --- the draft flag --------------------------------------------------------
commits.length = 0;
res = await worker.fetch(
  postContent({
    collection: 'writing',
    path: 'content/writing/the-road-in.mdx',
    sha: 's1',
    text: '---\ntitle: x\ndraft: true\n---\n\nBody.',
    draft: false,
  }),
  ghEnv,
);
let saved = Buffer.from(commits[0].content, 'base64').toString('utf8');
check(
  'publishing clears draft: true in the file itself',
  saved.includes('draft: false') && !saved.includes('draft: true'),
  JSON.stringify(saved),
);

commits.length = 0;
res = await worker.fetch(
  postContent({
    collection: 'writing',
    path: 'content/writing/the-road-in.mdx',
    sha: 's1',
    text: '---\ntitle: x\nsummary: y\n---\n\nBody.',
    draft: true,
  }),
  ghEnv,
);
saved = Buffer.from(commits[0].content, 'base64').toString('utf8');
check(
  'a file with no draft line gets one inside the frontmatter',
  /^---\n[\s\S]*draft: true\n---/.test(saved) && saved.endsWith('Body.'),
  JSON.stringify(saved),
);

commits.length = 0;
res = await worker.fetch(
  postContent({
    collection: 'store-copy',
    path: 'content/store/copy.json',
    text: '{"a":["b"]}',
    sha: 's1',
    draft: true,
  }),
  ghEnv,
);
saved = Buffer.from(commits[0].content, 'base64').toString('utf8');
check(
  'a draft flag is never injected into JSON',
  saved === '{"a":["b"]}',
  JSON.stringify(saved),
);

// --- the version stamp -----------------------------------------------------
//
// Reads the deployment's own asset rather than the public URL, so a cache
// cannot answer for it.
const stampEnv = (commit) => ({
  ...ghEnv,
  ASSETS: {
    fetch: async (request) =>
      String(request.url).endsWith('/version.json') && commit
        ? new Response(JSON.stringify({ commit }), {
            headers: { 'content-type': 'application/json' },
          })
        : new Response('404 page', { status: 404 }),
  },
});

globalThis.fetch = async (input) =>
  String(input).endsWith('/git/ref/heads/main')
    ? new Response(JSON.stringify({ object: { sha: 'head-sha' } }), {
        headers: { 'content-type': 'application/json' },
      })
    : new Response('nope', { status: 404 });

res = await worker.fetch(
  viaAccess('https://masterroachi.com/work/api/version'),
  stampEnv('head-sha'),
);
body = await res.json();
check('a matching stamp reads as current', body.current === true, JSON.stringify(body));

res = await worker.fetch(
  viaAccess('https://masterroachi.com/work/api/version'),
  stampEnv('older-sha'),
);
body = await res.json();
check(
  'an older stamp reads as not current',
  body.current === false && body.live === 'older-sha' && body.head === 'head-sha',
  JSON.stringify(body),
);

res = await worker.fetch(
  viaAccess('https://masterroachi.com/work/api/version'),
  stampEnv(null),
);
body = await res.json();
check(
  'no stamp reads as unknown, not as out of date',
  body.current === null && body.live === null,
  JSON.stringify(body),
);

res = await worker.fetch(get('https://masterroachi.com/work/api/version'), stampEnv('x'));
check(
  'version without Access serves the 404 page',
  (await res.text()) === '404 page',
  String(res.status),
);

globalThis.fetch = preGh;

// --- habits ----------------------------------------------------------------
//
// The date rule is the thing worth testing. A tick belongs to a day in
// Africa/Johannesburg, and getting that wrong files a late-night tick under
// yesterday — which is exactly when someone ticks something.

/** Enough D1 to exercise the endpoint, holding ticks in a Set. */
function fakeD1() {
  const ticks = new Set();
  const habits = [{ id: 1, name: 'Read', cadence: 'daily', target: null }];
  const books = [
    {
      id: 1,
      title: 'On the Incarnation',
      author: 'Athanasius',
      status: 'reading',
      pages: 120,
      page: 40,
      started_on: '2026-09-01',
      finished_on: null,
      rating: null,
      notes: null,
    },
  ];
  const curriculums = [{ id: 1, name: 'Odin', source: null, status: 'active', position: 1 }];
  const modules = [{ id: 1, curriculum_id: 1, name: 'Foundations', position: 1 }];
  const lessons = [{ id: 1, module_id: 1, name: 'Intro', position: 1, done_on: null }];
  const sqlLog = [];

  const statement = (sql) => {
    let bound = [];
    const self = {
      bind(...values) {
        bound = values;
        return self;
      },
      async all() {
        sqlLog.push(sql);
        if (sql.includes('from books')) return { results: books };
        if (sql.includes('from curriculums')) return { results: curriculums };
        if (sql.includes('from modules')) return { results: modules };
        if (sql.includes('from lessons')) return { results: lessons };
        if (sql.includes('from habits')) return { results: habits };
        if (sql.includes('from habit_ticks')) {
          const since = bound[0];
          return {
            results: [...ticks]
              .map((key) => {
                const [habit_id, day] = key.split('@');
                return { habit_id: Number(habit_id), day };
              })
              .filter((row) => row.day >= since),
          };
        }
        return { results: [] };
      },
      async first() {
        sqlLog.push(sql);
        if (sql.includes('from books')) {
          return books.find((b) => b.id === bound[0]) ?? null;
        }
        if (sql.includes('max(position)') && sql.includes('from modules')) {
          return { at: modules.length };
        }
        if (sql.includes('from modules') && sql.includes('order by id desc')) {
          return modules.at(-1) ?? null;
        }
        if (sql.includes('from lessons')) {
          return lessons.find((l) => l.id === bound[0]) ?? null;
        }
        return ticks.has(`${bound[0]}@${bound[1]}`) ? { hit: 1 } : null;
      },
      async run() {
        sqlLog.push(sql);
        if (sql.startsWith('insert into habit_ticks')) ticks.add(`${bound[0]}@${bound[1]}`);
        if (sql.startsWith('delete from habit_ticks')) ticks.delete(`${bound[0]}@${bound[1]}`);
        if (sql.startsWith('insert into habits')) {
          habits.push({ id: habits.length + 1, name: bound[0], cadence: bound[1], target: bound[2], icon: bound[3] });
        }
        if (sql.startsWith('update habits')) habits.length = 0;
        if (sql.startsWith('insert into books')) {
          books.push({ id: books.length + 1, title: bound[0], author: bound[1], status: bound[2], started_on: bound[3] });
        }
        if (sql.startsWith('update books')) {
          const row = books.find((b) => b.id === bound[0]);
          if (row) Object.assign(row, { _update: bound });
        }
        if (sql.startsWith('insert into curriculums')) curriculums.push({ id: curriculums.length + 1, name: bound[0], source: bound[1] });
        if (sql.startsWith('insert into modules')) modules.push({ id: modules.length + 1, curriculum_id: bound[0], name: bound[1], position: bound[2] });
        if (sql.startsWith('insert into lessons')) lessons.push({ id: lessons.length + 1, module_id: bound[0], name: bound[1], position: bound[2], done_on: null });
        if (sql.startsWith('update lessons')) {
          const row = lessons.find((l) => l.id === bound[0]);
          if (row) row.done_on = bound[1];
        }
        if (sql.startsWith('delete from books')) {
          const at = books.findIndex((b) => b.id === bound[0]);
          if (at !== -1) books.splice(at, 1);
        }
        return {};
      },
    };
    return self;
  };

  return {
    prepare: statement,
    async batch() {},
    _ticks: ticks,
    _habits: habits,
    _books: books,
    _curriculums: curriculums,
    _modules: modules,
    _lessons: lessons,
    _sql: sqlLog,
  };
}

let DB = fakeD1();
const dbEnv = () => ({ ...env, DB });

const postJson = (url, payload) =>
  new Request(url, {
    method: 'POST',
    headers: { 'cf-access-jwt-assertion': 'stub-jwt', 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

res = await worker.fetch(get('https://masterroachi.com/work/api/habits'), dbEnv());
check(
  'habits without Access serves the 404 page',
  (await res.text()) === '404 page',
  String(res.status),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/habits'), env);
body = await res.json();
check(
  'habits with no database answers configured:false',
  res.status === 200 && body.configured === false,
  JSON.stringify(body),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/habits'), dbEnv());
body = await res.json();
const todayFromServer = body.today;
check(
  'with no month asked for, the current one comes back',
  body.month === todayFromServer.slice(0, 7) && /^\d{4}-\d{2}-\d{2}$/.test(todayFromServer),
  JSON.stringify({ month: body.month, today: todayFromServer }),
);
check(
  'and it carries that whole month, first day to last',
  body.days[0] === `${body.month}-01` && body.days.at(-1).startsWith(body.month),
  JSON.stringify({ first: body.days?.[0], last: body.days?.at(-1) }),
);
check(
  'the years offered include the current one',
  Array.isArray(body.years) && body.years.includes(Number(todayFromServer.slice(0, 4))),
  JSON.stringify(body.years),
);

res = await worker.fetch(
  viaAccess('https://masterroachi.com/work/api/habits?month=2026-02'),
  dbEnv(),
);
body = await res.json();
check(
  'a month that is asked for is the month that comes back',
  body.month === '2026-02' && body.days.length === 28,
  JSON.stringify({ month: body.month, days: body.days?.length }),
);

// A month the page could never render is not worth erroring over — the grid
// is readable either way, so it falls back rather than failing.
for (const bad of ['2026-13', 'February', '2026-2', '']) {
  res = await worker.fetch(
    viaAccess(`https://masterroachi.com/work/api/habits?month=${encodeURIComponent(bad)}`),
    dbEnv(),
  );
  body = await res.json();
  check(
    `a malformed month ${JSON.stringify(bad)} falls back to this one`,
    body.month === todayFromServer.slice(0, 7),
    JSON.stringify(body.month),
  );
}

// The page never names a date, so the default has to be today.
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', { action: 'toggle', id: 1 }),
  dbEnv(),
);
body = await res.json();
check(
  'a toggle with no day ticks today',
  body.ticked === true && body.day === todayFromServer,
  JSON.stringify(body),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', { action: 'toggle', id: 1 }),
  dbEnv(),
);
body = await res.json();
check('toggling again clears it', body.ticked === false, JSON.stringify(body));
check('and the row is gone', DB._ticks.size === 0, JSON.stringify([...DB._ticks]));

// Tomorrow is always a mistake, usually a timezone one. Refused, not clamped.
const tomorrow = new Date(Date.now() + 86_400_000 * 2).toISOString().slice(0, 10);
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', {
    action: 'toggle',
    id: 1,
    day: tomorrow,
  }),
  dbEnv(),
);
check('a future day is refused', res.status === 400, String(res.status));
check('and nothing was written', DB._ticks.size === 0, JSON.stringify([...DB._ticks]));

for (const bad of ['8 October', '2026-13-99x', '', '2026/10/08']) {
  res = await worker.fetch(
    postJson('https://masterroachi.com/work/api/habits', { action: 'toggle', id: 1, day: bad }),
    dbEnv(),
  );
  check(`a malformed day is refused: ${JSON.stringify(bad)}`, res.status === 400, String(res.status));
}

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', { action: 'toggle' }),
  dbEnv(),
);
check('a toggle with no habit is refused', res.status === 400, String(res.status));

// A daily habit must not be stored with a target, or it is half a weekly one.
DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', {
    action: 'add',
    name: '  Pray  ',
    target: 4,
  }),
  dbEnv(),
);
check(
  'a daily habit is trimmed and stored with no target',
  DB._habits.at(-1)?.name === 'Pray' &&
    DB._habits.at(-1)?.cadence === 'daily' &&
    DB._habits.at(-1)?.target === null,
  JSON.stringify(DB._habits.at(-1)),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', {
    action: 'add',
    name: 'Gym',
    cadence: 'weekly',
    target: 99,
  }),
  dbEnv(),
);
check(
  'a weekly target is clamped into a week',
  DB._habits.at(-1)?.cadence === 'weekly' && DB._habits.at(-1)?.target === 7,
  JSON.stringify(DB._habits.at(-1)),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', { action: 'add', name: '   ' }),
  dbEnv(),
);
check('a nameless habit is refused', res.status === 400, String(res.status));

// Archive, never delete: the ticks are the history.
DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', { action: 'archive', id: 1 }),
  dbEnv(),
);
check(
  'archiving updates rather than deletes',
  res.status === 200 && DB._sql.some((q) => q.startsWith('update habits')) &&
    !DB._sql.some((q) => q.startsWith('delete from habits')),
  JSON.stringify(DB._sql),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', { action: 'burn it all' }),
  dbEnv(),
);
check('an unknown action is refused', res.status === 400, String(res.status));

// An unknown icon name must not reach the database, where it would render as
// a blank cell with nothing saying why.
DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', {
    action: 'add',
    name: 'Read',
    icon: 'definitely-not-an-icon',
  }),
  dbEnv(),
);
check(
  'an unknown icon is stored as none, not as itself',
  res.status === 200 && DB._habits.at(-1)?.icon === null,
  JSON.stringify(DB._habits.at(-1)),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/habits', {
    action: 'add',
    name: 'Pray',
    icon: 'cross',
  }),
  dbEnv(),
);
check(
  'a known icon is kept',
  DB._habits.at(-1)?.icon === 'cross',
  JSON.stringify(DB._habits.at(-1)),
);

// --- reading ---------------------------------------------------------------
//
// The rule worth testing is that a date, once stamped, is never cleared
// automatically. Moving a finished book back to reading to add a few pages
// must not erase the day it was finished.

DB = fakeD1();

res = await worker.fetch(get('https://masterroachi.com/work/api/reading'), dbEnv());
check(
  'reading without Access serves the 404 page',
  (await res.text()) === '404 page',
  String(res.status),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/reading'), env);
body = await res.json();
check(
  'reading with no database answers configured:false',
  res.status === 200 && body.configured === false,
  JSON.stringify(body),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'add', title: '  Dune  ' }),
  dbEnv(),
);
check(
  'a book added without a status is queued, not started',
  DB._books.at(-1)?.title === 'Dune' &&
    DB._books.at(-1)?.status === 'want' &&
    DB._books.at(-1)?.started_on === null,
  JSON.stringify(DB._books.at(-1)),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', {
    action: 'add',
    title: 'Confessions',
    author: 'Augustine',
    status: 'reading',
  }),
  dbEnv(),
);
check(
  'a book added as open now is started today',
  DB._books.at(-1)?.started_on !== null && DB._books.at(-1)?.author === 'Augustine',
  JSON.stringify(DB._books.at(-1)),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'add', title: '   ' }),
  dbEnv(),
);
check('a titleless book is refused', res.status === 400, String(res.status));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'add', title: 'x', status: 'devoured' }),
  dbEnv(),
);
check(
  'an invalid status falls back rather than being stored',
  res.status === 200 && DB._books.at(-1)?.status === 'want',
  JSON.stringify(DB._books.at(-1)),
);

// Book 1 already has started_on 2026-09-01 and no finished_on.
DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', {
    action: 'update',
    id: 1,
    status: 'read',
  }),
  dbEnv(),
);
let bound = DB._books.find((b) => b.id === 1)?._update;
check(
  'finishing stamps finished_on and keeps the original started_on',
  bound?.[4] === '2026-09-01' && /^\d{4}-\d{2}-\d{2}$/.test(String(bound?.[5])),
  JSON.stringify({ started: bound?.[4], finished: bound?.[5] }),
);

// Now pretend it is finished, and move it back.
DB = fakeD1();
DB._books[0].status = 'read';
DB._books[0].finished_on = '2026-09-20';
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', {
    action: 'update',
    id: 1,
    status: 'reading',
  }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check(
  'going back to reading does not erase the day it was finished',
  bound?.[5] === '2026-09-20',
  JSON.stringify({ finished: bound?.[5] }),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', {
    action: 'update',
    id: 1,
    rating: 99,
  }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check('a rating is clamped to five', bound?.[7] === 5, JSON.stringify(bound?.[7]));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', {
    action: 'update',
    id: 1,
    rating: null,
  }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check(
  'a null rating clears it, rather than being ignored as absent',
  bound?.[6] === 1 && bound?.[7] === null,
  JSON.stringify({ touch: bound?.[6], rating: bound?.[7] }),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'update', id: 1, page: 55 }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check(
  'updating only the page leaves the rating untouched',
  bound?.[6] === 0 && bound?.[3] === 55,
  JSON.stringify({ touch: bound?.[6], page: bound?.[3] }),
);

// --- the two fields the interface could not reach -------------------------
//
// Both were storable and one was displayable, but nothing could set either:
// the page TOTAL, so "p.40 of 320" could never have its second half, and the
// note, a 4000-character field with no way in. Tested now that there is one.

DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'update', id: 1, pages: 320 }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check('the page total is settable', bound?.[2] === 320, JSON.stringify(bound?.[2]));

DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', {
    action: 'update',
    id: 1,
    notes: 'Slower than it looks. Worth the second read.',
  }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check(
  'a note is settable',
  bound?.[8] === 'Slower than it looks. Worth the second read.',
  JSON.stringify(bound?.[8]),
);
check(
  'and setting one does not disturb the page or the rating',
  bound?.[2] === null && bound?.[3] === null && bound?.[6] === 0,
  JSON.stringify({ pages: bound?.[2], page: bound?.[3], ratingTouched: bound?.[6] }),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'update', id: 1, notes: '' }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check('an empty note clears rather than being ignored', bound?.[8] === '', JSON.stringify(bound?.[8]));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', {
    action: 'update',
    id: 1,
    pages: 9999999,
  }),
  dbEnv(),
);
bound = DB._books.find((b) => b.id === 1)?._update;
check('an absurd page total is clamped', bound?.[2] === 100000, JSON.stringify(bound?.[2]));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'update', id: 404 }),
  dbEnv(),
);
check('updating a book that is not there is a 404', res.status === 404, String(res.status));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'remove', id: 1 }),
  dbEnv(),
);
check(
  'a book can be removed outright, unlike a habit',
  res.status === 200 && !DB._books.some((b) => b.id === 1),
  JSON.stringify(DB._books.map((b) => b.id)),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/reading', { action: 'incinerate' }),
  dbEnv(),
);
check('an unknown reading action is refused', res.status === 400, String(res.status));

// --- curriculums -----------------------------------------------------------
//
// Three levels, and an import that writes many rows from one paste — so the
// tests are about what it refuses to write and what it does not interpolate.

DB = fakeD1();

res = await worker.fetch(get('https://masterroachi.com/work/api/curriculums'), dbEnv());
check(
  'curriculums without Access serves the 404 page',
  (await res.text()) === '404 page',
  String(res.status),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/curriculums'), env);
body = await res.json();
check(
  'curriculums with no database answers configured:false',
  res.status === 200 && body.configured === false,
  JSON.stringify(body),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/curriculums'), dbEnv());
body = await res.json();
check(
  'the three levels come back nested, not as a flat join',
  body.curriculums?.[0]?.modules?.[0]?.lessons?.[0]?.name === 'Intro',
  JSON.stringify(body.curriculums),
);

// --- the import ------------------------------------------------------------
DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', {
    action: 'import',
    curriculum_id: 1,
    outline: 'Foundations\n  - Intro to Web\n  - Installations\n1. JavaScript\n   1) Organizing\nNodeJS\n* Mini Message Board',
  }),
  dbEnv(),
);
body = await res.json();
check(
  'an outline becomes modules and lessons, with numbered sections as sections',
  body.imported === true && body.modules === 3 && body.lessons === 4,
  JSON.stringify(body),
);
check(
  'the lessons landed under modules rather than at the top',
  DB._lessons.some((l) => l.name === 'Mini Message Board') &&
    DB._modules.some((m) => m.name === 'JavaScript'),
  JSON.stringify({ modules: DB._modules.map((m) => m.name), lessons: DB._lessons.map((l) => l.name) }),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', {
    action: 'import',
    curriculum_id: 1,
    outline: '   \n\n  ',
  }),
  dbEnv(),
);
check('an empty outline is refused', res.status === 400, String(res.status));

// A whole pasted web page must not write ten thousand rows unnoticed.
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', {
    action: 'import',
    curriculum_id: 1,
    outline: Array.from({ length: 300 }, (_, i) => `Module ${i}`).join('\n'),
  }),
  dbEnv(),
);
check('an oversized import is refused', res.status === 400, String(res.status));

// --- ticking a lesson ------------------------------------------------------
DB = fakeD1();
res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', { action: 'toggle-lesson', id: 1 }),
  dbEnv(),
);
body = await res.json();
check(
  'a lesson records the day it was done, not a flag',
  body.done === true && /^\d{4}-\d{2}-\d{2}$/.test(body.day),
  JSON.stringify(body),
);

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', { action: 'toggle-lesson', id: 1 }),
  dbEnv(),
);
body = await res.json();
check('ticking again clears the day', body.done === false && body.day === null, JSON.stringify(body));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', {
    action: 'toggle-lesson',
    id: 1,
    day: '2099-01-01',
  }),
  dbEnv(),
);
check('a lesson cannot be done in the future', res.status === 400, String(res.status));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', { action: 'toggle-lesson', id: 9999 }),
  dbEnv(),
);
check('ticking a lesson that is not there is a 404', res.status === 404, String(res.status));

// --- the kind map ----------------------------------------------------------
//
// `kind` chooses a table, so the one thing that must never happen is a table
// name coming out of the request body.
for (const kind of ['curriculums', 'sqlite_master', 'lessons; drop table lessons', '']) {
  res = await worker.fetch(
    postJson('https://masterroachi.com/work/api/curriculums', {
      action: 'remove',
      kind,
      id: 1,
    }),
    dbEnv(),
  );
  check(`remove refuses kind ${JSON.stringify(kind)}`, res.status === 400, String(res.status));
}

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', {
    action: 'rename',
    kind: 'lesson',
    id: 1,
    name: 'Renamed',
  }),
  dbEnv(),
);
check('a valid kind renames', res.status === 200, String(res.status));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', {
    action: 'set-status',
    id: 1,
    status: 'abandoned',
  }),
  dbEnv(),
);
check('an invalid curriculum status is refused', res.status === 400, String(res.status));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', { action: 'add-curriculum', name: '  ' }),
  dbEnv(),
);
check('a nameless curriculum is refused', res.status === 400, String(res.status));

res = await worker.fetch(
  postJson('https://masterroachi.com/work/api/curriculums', { action: 'add-module', name: 'x' }),
  dbEnv(),
);
check('a module with no curriculum is refused', res.status === 400, String(res.status));

// --- the scratchpad --------------------------------------------------------
//
// A note is Markdown and its drawing is a PNG beside it, so this is the first
// collection holding two kinds of file — and the first thing writing binary.

globalThis.fetch = ghFetch;

res = await worker.fetch(
  viaAccess('https://masterroachi.com/work/api/content?collection=notes'),
  ghEnv,
);
body = await res.json();
check(
  'a collection whose directory does not exist yet lists as empty',
  res.status === 200 && body.configured === true && body.files.length === 0,
  JSON.stringify(body),
);

// A sketch is one .svg, and nothing else is allowed in notes/.
commits.length = 0;
res = await worker.fetch(
  postContent({ collection: 'notes', path: 'notes/a-sketch.svg', text: '<svg/>' }),
  ghEnv,
);
check('notes accepts a .svg', res.status === 200, String(res.status));

for (const bad of [
  'notes/a-sketch.md',
  'notes/a-sketch.png',
  'notes/a-sketch.mdx',
  'notes/nested/a.svg',
  'content/writing/a.svg',
  'notes/../worker/index.ts',
]) {
  res = await worker.fetch(postContent({ collection: 'notes', path: bad, text: 'x' }), ghEnv);
  check(`notes refuses ${bad}`, res.status === 400, String(res.status));
}

// A sketch is text, not a published post, so the draft rewriting must not
// reach into it — it shares the endpoint with the writing collection.
commits.length = 0;
res = await worker.fetch(
  postContent({
    collection: 'notes',
    path: 'notes/a-sketch.svg',
    text: '<svg><metadata/></svg>',
    draft: true,
  }),
  ghEnv,
);
let written = Buffer.from(commits[0].content, 'base64').toString('utf8');
check(
  'a sketch never has a draft flag injected into it',
  !written.includes('draft:') && written === '<svg><metadata/></svg>',
  JSON.stringify(written),
);

commits.length = 0;
res = await worker.fetch(
  postContent({ collection: 'notes', title: 'Thoughts on Mondays', text: '<svg/>' }),
  ghEnv,
);
body = await res.json();
check(
  'a new sketch is named from its title, as .svg',
  body.path === 'notes/thoughts-on-mondays.svg',
  JSON.stringify(body),
);

globalThis.fetch = preGh;

// --- the sketch file format ------------------------------------------------
//
// One file holding ink and text, which has to come back exactly. A format that
// loses something on the round trip fails silently: the file renders, and the
// loss only shows when a sketch is reopened and is not what was left.

{
  const scene = {
    version: 1,
    background: '#16181d',
    items: [
      { kind: 'stroke', id: 'a', colour: '#f5f5f5', width: 4, points: [[10, 10], [20, 25]] },
      { kind: 'stroke', id: 'b', colour: '#d9a13b', width: 9, points: [[5, 5]] },
      {
        kind: 'text',
        id: 'c',
        x: 100,
        y: 200,
        size: 32,
        colour: '#9ece6a',
        // Every character that breaks XML, plus the one sequence CDATA cannot
        // carry — all three have been real bugs in formats like this.
        text: 'Tom & Jerry <3\n"quoted" line\nends with ]]> oddly',
      },
    ],
  };

  const svg = sketch.toSvg(scene);

  check(
    'the svg is a standalone document',
    svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"') && svg.includes('viewBox="0 0 1600 1200"'),
    svg.slice(0, 60),
  );
  check(
    'ampersands and angle brackets are escaped outside the metadata',
    !/&(?!amp;|quot;|lt;|gt;)/.test(svg.replace(/<!\[CDATA\[[\s\S]*?]]>/, '')),
    'unescaped character in the rendered svg',
  );
  check(
    'a single tap renders as a dot rather than nothing',
    svg.includes('<circle'),
    svg,
  );
  check(
    'each line of text is its own tspan',
    (svg.match(/<tspan/g) || []).length === 3,
    String((svg.match(/<tspan/g) || []).length),
  );

  const back = sketch.fromSvg(svg);
  check(
    'a sketch round-trips exactly',
    JSON.stringify(back) === JSON.stringify(scene),
    JSON.stringify(back),
  );
  check(
    'text with ]]> in it survives the CDATA boundary',
    back?.items[2].text === scene.items[2].text,
    JSON.stringify(back?.items[2]?.text),
  );

  // An SVG from somewhere else has no scene to restore. Returning an empty
  // one would invite saving that emptiness over a real file.
  check(
    'a foreign svg yields no scene',
    sketch.fromSvg('<svg><path d="M0 0"/></svg>') === null,
    'expected null',
  );
  check(
    'broken metadata yields no scene',
    sketch.fromSvg('<svg><metadata><sketch><![CDATA[{not json]]></sketch></metadata></svg>') === null,
    'expected null',
  );
  check(
    'a future version yields no scene',
    sketch.fromSvg('<svg><metadata><sketch><![CDATA[{"version":2,"items":[]}]]></sketch></metadata></svg>') === null,
    'expected null',
  );

  check(
    'an empty page and a page of blank text both count as blank',
    sketch.isBlank(sketch.emptyScene()) &&
      sketch.isBlank({ version: 1, background: '#000', items: [{ kind: 'text', id: 'x', x: 0, y: 0, size: 10, colour: '#fff', text: '   ' }] }),
    'expected both blank',
  );
  check(
    'a page with a stroke is not blank',
    !sketch.isBlank({ version: 1, background: '#000', items: [{ kind: 'stroke', id: 'x', colour: '#fff', width: 1, points: [[0, 0]] }] }),
    'expected not blank',
  );
}

// --- the habit grid's week maths -------------------------------------------

{
  // 2026-10-08 is a Thursday. Anything else here is wrong.
  check('a weekday is read in UTC, not the viewer zone', habits.weekday('2026-10-08') === 4, String(habits.weekday('2026-10-08')));
  check('Sunday is 0', habits.weekday('2026-10-11') === 0, String(habits.weekday('2026-10-11')));
  check('Monday is 1', habits.weekday('2026-10-12') === 1, String(habits.weekday('2026-10-12')));

  // Weeks start Monday, so a Sunday belongs to the week BEFORE it — starting
  // Sunday would split every weekend and score a weekly habit differently
  // depending on which day it was done.
  check('a Thursday maps to its Monday', habits.weekOf('2026-10-08') === '2026-10-05', habits.weekOf('2026-10-08'));
  check('a Monday maps to itself', habits.weekOf('2026-10-05') === '2026-10-05', habits.weekOf('2026-10-05'));
  check('a Sunday maps back, not forward', habits.weekOf('2026-10-11') === '2026-10-05', habits.weekOf('2026-10-11'));
  check('the next Monday is a new week', habits.weekOf('2026-10-12') === '2026-10-12', habits.weekOf('2026-10-12'));
  check('a week spanning a month boundary still resolves', habits.weekOf('2026-11-01') === '2026-10-26', habits.weekOf('2026-11-01'));

  const window = ['2026-10-05','2026-10-06','2026-10-07','2026-10-08'];

  check(
    'a streak counts back to the first gap',
    habits.streak(['2026-10-06','2026-10-07','2026-10-08'], window, '2026-10-08') === 3,
    String(habits.streak(['2026-10-06','2026-10-07','2026-10-08'], window, '2026-10-08')),
  );
  // The one that matters every morning: today unticked must not read as a
  // broken streak, because the day is not over.
  check(
    'an unticked today does not break the streak',
    habits.streak(['2026-10-06','2026-10-07'], window, '2026-10-08') === 2,
    String(habits.streak(['2026-10-06','2026-10-07'], window, '2026-10-08')),
  );
  check(
    'but a gap before today does',
    habits.streak(['2026-10-05','2026-10-08'], window, '2026-10-08') === 1,
    String(habits.streak(['2026-10-05','2026-10-08'], window, '2026-10-08')),
  );
  check('no ticks is no streak', habits.streak([], window, '2026-10-08') === 0, 'expected 0');

  check(
    'this week counts only the week containing today',
    habits.thisWeek(['2026-10-04','2026-10-06','2026-10-08'], '2026-10-08') === 2,
    String(habits.thisWeek(['2026-10-04','2026-10-06','2026-10-08'], '2026-10-08')),
  );
  check(
    'and a Sunday tick lands in the week it belongs to',
    habits.thisWeek(['2026-10-11'], '2026-10-08') === 1,
    String(habits.thisWeek(['2026-10-11'], '2026-10-08')),
  );
  check(
    'initials line up with the weekday numbers',
    habits.INITIALS[habits.weekday('2026-10-08')] === 'T' && habits.INITIALS[habits.weekday('2026-10-11')] === 'S',
    `${habits.INITIALS[habits.weekday('2026-10-08')]} ${habits.INITIALS[habits.weekday('2026-10-11')]}`,
  );
}

// --- month lengths ---------------------------------------------------------

{
  check('January has 31', dbLib.monthDays('2026-01').length === 31, String(dbLib.monthDays('2026-01').length));
  check('April has 30', dbLib.monthDays('2026-04').length === 30, String(dbLib.monthDays('2026-04').length));
  check('February 2026 has 28', dbLib.monthDays('2026-02').length === 28, String(dbLib.monthDays('2026-02').length));
  // The one a hardcoded table gets wrong.
  check('February 2028 has 29', dbLib.monthDays('2028-02').length === 29, String(dbLib.monthDays('2028-02').length));
  check('February 2100 has 28, not 29', dbLib.monthDays('2100-02').length === 28, String(dbLib.monthDays('2100-02').length));
  check('February 2000 had 29', dbLib.monthDays('2000-02').length === 29, String(dbLib.monthDays('2000-02').length));

  const march = dbLib.monthDays('2026-03');
  check(
    'days are padded date strings in order',
    march[0] === '2026-03-01' && march[8] === '2026-03-09' && march[30] === '2026-03-31',
    JSON.stringify([march[0], march[8], march[30]]),
  );

  check('a good month passes isMonth', dbLib.isMonth('2026-07'), 'expected true');
  for (const bad of ['2026-00', '2026-13', '2026-7', '26-07', '2026-07-01', 'July']) {
    check(`isMonth refuses ${JSON.stringify(bad)}`, !dbLib.isMonth(bad), 'expected false');
  }
}

// --- the icon set ----------------------------------------------------------
//
// Hand-written path data, which fails quietly: a malformed `d` draws nothing
// and the cell just looks empty.

{
  const all = icons.HABIT_ICONS;
  check('there is a set at all', Array.isArray(all) && all.length >= 30, String(all?.length));

  const names = all.map((i) => i.name);
  check(
    'every name is unique',
    new Set(names).size === names.length,
    names.filter((n, i) => names.indexOf(n) !== i).join(', ') || 'none',
  );
  check(
    'every name is a usable slug',
    names.every((n) => /^[a-z][a-z0-9-]*$/.test(n)),
    names.filter((n) => !/^[a-z][a-z0-9-]*$/.test(n)).join(', ') || 'none',
  );
  check(
    'every icon has a label',
    all.every((i) => typeof i.label === 'string' && i.label.trim().length > 1),
    all.filter((i) => !i.label?.trim()).map((i) => i.name).join(', ') || 'none',
  );

  // Path data starts with a move and contains only SVG path grammar. A stray
  // character makes the browser drop the whole path silently.
  const bad = all.filter((i) => !/^M[\s\d.-]/.test(i.d) || /[^MmLlHhVvCcSsQqTtAaZz\s\d.,-]/.test(i.d));
  check('every path is well formed', bad.length === 0, bad.map((i) => i.name).join(', ') || 'none');

  const short = all.filter((i) => i.d.length < 12);
  check('no path is suspiciously empty', short.length === 0, short.map((i) => i.name).join(', ') || 'none');

  // The ones asked for by name, so a rename does not quietly remove them.
  for (const wanted of ['cigarette', 'weed', 'glass', 'book', 'cross', 'weights']) {
    check(`the set has ${wanted}`, icons.iconFor(wanted) !== null, 'missing');
  }

  check('an unknown name resolves to nothing', icons.iconFor('nope') === null, 'expected null');
  check('a null name resolves to nothing', icons.iconFor(null) === null, 'expected null');
  check(
    'validIconName only passes names in the set',
    icons.validIconName('weed') === 'weed' &&
      icons.validIconName('weeeed') === null &&
      icons.validIconName(42) === null,
    'unexpected',
  );
}

// --- anything else falls through to the site -------------------------------
res = await worker.fetch(get('https://masterroachi.com/store/'), env);
check('other paths hit ASSETS', (await res.text()) === '404 page', '');

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`  ${r.pass ? 'pass' : 'FAIL'}  ${r.label}${r.pass ? '' : '   → ' + r.detail}`);
}
console.log(`\n  ${results.length - failed.length}/${results.length} passed`);
fs.rmSync(bundle, { force: true });
fs.rmSync(sketchBundle, { force: true });
fs.rmSync(habitsBundle, { force: true });
fs.rmSync(dbBundle, { force: true });
fs.rmSync(iconBundle, { force: true });
process.exit(failed.length ? 1 : 0);
