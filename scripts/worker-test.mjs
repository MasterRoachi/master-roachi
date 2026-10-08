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
        if (sql.startsWith('insert into habits')) habits.push({ id: habits.length + 1, name: bound[0], cadence: bound[1], target: bound[2] });
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
  'the server sends the window and its own idea of today',
  body.window.length === 35 && body.window[34] === todayFromServer && /^\d{4}-\d{2}-\d{2}$/.test(todayFromServer),
  JSON.stringify({ last: body.window?.at(-1), today: todayFromServer }),
);

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

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/habits?days=9999'), dbEnv());
body = await res.json();
check('the window is capped', body.window.length === 180, String(body.window?.length));

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

// Both extensions are allowed in notes/, and nothing else is.
for (const ok of ['notes/a-note.md', 'notes/a-note.png']) {
  commits.length = 0;
  res = await worker.fetch(
    postContent({ collection: 'notes', path: ok, text: ok.endsWith('.png') ? 'aGVsbG8=' : '# hi' }),
    ghEnv,
  );
  check(`notes accepts ${ok}`, res.status === 200, String(res.status));
}

for (const bad of [
  'notes/a-note.mdx',
  'notes/a-note.jpg',
  'notes/nested/a.md',
  'content/writing/a.md',
  'notes/../worker/index.ts',
]) {
  res = await worker.fetch(postContent({ collection: 'notes', path: bad, text: 'x' }), ghEnv);
  check(`notes refuses ${bad}`, res.status === 400, String(res.status));
}

// A .md path must not be treated as a published .mdx, so the draft rewriting
// must not touch it.
commits.length = 0;
res = await worker.fetch(
  postContent({
    collection: 'notes',
    path: 'notes/a-note.md',
    text: '---\ntitle: x\n---\n\nBody.',
    draft: true,
  }),
  ghEnv,
);
let written = Buffer.from(commits[0].content, 'base64').toString('utf8');
check(
  'a note never has a draft flag injected into it',
  !written.includes('draft:'),
  JSON.stringify(written),
);

// THE ONE THAT WOULD CORRUPT SILENTLY: a PNG arrives already base64, and
// encoding it a second time commits a file nothing can open.
commits.length = 0;
const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
res = await worker.fetch(
  postContent({ collection: 'notes', path: 'notes/a-note.png', text: pngBase64 }),
  ghEnv,
);
check(
  'a drawing is committed as the bytes it already is, not base64 of base64',
  commits[0]?.content === pngBase64,
  JSON.stringify({ sent: pngBase64.slice(0, 20), committed: String(commits[0]?.content).slice(0, 20) }),
);
check(
  'and those bytes really are a PNG',
  Buffer.from(commits[0].content, 'base64').subarray(1, 4).toString('ascii') === 'PNG',
  Buffer.from(commits[0].content, 'base64').subarray(0, 8).toString('hex'),
);

// A data-URI prefix left on the front is not image data.
res = await worker.fetch(
  postContent({
    collection: 'notes',
    path: 'notes/a-note.png',
    text: `data:image/png;base64,${pngBase64}`,
  }),
  ghEnv,
);
check('a stray data-URI prefix is refused', res.status === 400, String(res.status));

res = await worker.fetch(
  postContent({ collection: 'notes', path: 'notes/a-note.png', text: 'not base64 !!' }),
  ghEnv,
);
check('non-base64 image data is refused', res.status === 400, String(res.status));

// A new note is still named from its title, and gets .md rather than .mdx.
commits.length = 0;
res = await worker.fetch(
  postContent({ collection: 'notes', title: 'Thoughts on Mondays', text: 'x' }),
  ghEnv,
);
body = await res.json();
check(
  'a new note is named from its title with the collection extension',
  body.path === 'notes/thoughts-on-mondays.md',
  JSON.stringify(body),
);

globalThis.fetch = preGh;

// --- anything else falls through to the site -------------------------------
res = await worker.fetch(get('https://masterroachi.com/store/'), env);
check('other paths hit ASSETS', (await res.text()) === '404 page', '');

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`  ${r.pass ? 'pass' : 'FAIL'}  ${r.label}${r.pass ? '' : '   → ' + r.detail}`);
}
console.log(`\n  ${results.length - failed.length}/${results.length} passed`);
fs.rmSync(bundle, { force: true });
process.exit(failed.length ? 1 : 0);
