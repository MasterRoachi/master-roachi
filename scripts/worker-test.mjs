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

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/content'), env);
body = await res.json();
check(
  'no GitHub token answers configured:false',
  res.status === 200 && body.configured === false,
  JSON.stringify(body),
);

res = await worker.fetch(viaAccess('https://masterroachi.com/work/api/content'), ghEnv);
body = await res.json();
check(
  'listing returns only .mdx posts',
  body.posts?.length === 1 && body.posts[0].path === 'content/writing/the-road-in.mdx',
  JSON.stringify(body.posts),
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
    viaAccess(`https://masterroachi.com/work/api/content?path=${encodeURIComponent(bad)}`),
    ghEnv,
  );
  check(`read refuses ${bad}`, res.status === 400, String(res.status));
}

res = await worker.fetch(
  viaAccess('https://masterroachi.com/work/api/content?path=content/writing/the-road-in.mdx'),
  ghEnv,
);
body = await res.json();
check(
  'a post round-trips non-ASCII intact',
  body.post?.text.includes('Fróm — the road') && body.post.text.includes('It’s a test.'),
  JSON.stringify(body.post?.text),
);

// --- writing ---------------------------------------------------------------
const postContent = (payload, url = 'https://masterroachi.com/work/api/content') =>
  new Request(url, {
    method: 'POST',
    headers: { 'cf-access-jwt-assertion': 'stub-jwt', 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

res = await worker.fetch(
postContent({ path: '.github/workflows/evil.yml', text: 'jobs:' }),
  ghEnv,
);
check('write refuses a workflow path', res.status === 400, String(res.status));

res = await worker.fetch(
postContent({ text: '   ' }), ghEnv);
check('write refuses an empty body', res.status === 400, String(res.status));

res = await worker.fetch(
postContent({ title: '!!!', text: 'something' }), ghEnv);
check('write refuses a title that slugifies to nothing', res.status === 400, String(res.status));

commits.length = 0;
res = await worker.fetch(
postContent({ title: 'A Néw Post — part [skip ci] two', text: '---\ntitle: x\n---\n\nBody.' }),
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
postContent({ path: 'content/writing/the-road-in.mdx', text: 'edited', sha: 's1' }),
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
postContent({ path: 'content/writing/the-road-in.mdx', text: 'x', sha: 'stale' }),
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
