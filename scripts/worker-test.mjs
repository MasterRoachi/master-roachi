// Exercises worker/index.ts against a fake KV, without wrangler dev — which
// holds a lock on out/ and is a nuisance to kill cleanly.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Run from the repo root: node scripts/worker-test.mjs

const bundle = path.join(process.env.TMP ?? '.', 'worker-bundle.mjs');
execFileSync(
  'npx',
  ['esbuild', 'worker/index.ts', '--bundle', '--format=esm', '--platform=neutral', `--outfile=${bundle}`],
  { stdio: 'pipe', shell: true },
);

const { default: worker } = await import('file://' + bundle.replace(/\\/g, '/'));

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
