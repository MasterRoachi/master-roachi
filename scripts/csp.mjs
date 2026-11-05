// Pins every page's inline scripts by hash, after `next build`.
//
// The static export puts a dozen inline <script> tags in every page (React's
// bootstrap and the RSC payload, self.__next_f.push(...)), and they differ per
// page and per build. There is no server to stamp a nonce on them, which is why
// public/_headers has had to say script-src 'unsafe-inline' — and that lets an
// injected inline script run as freely as Next's own.
//
// So each HTML file in out/ gets its own policy as a <meta> tag, listing the
// SHA-256 of exactly the inline scripts that file contains. The header policy
// stays as it is: a browser given two policies enforces both, so a script
// runs only if the header AND the meta allow it, and the meta allows only
// 'self' and these hashes. 'unsafe-inline' in the header becomes a floor that
// no longer decides anything. The meta speaks only to script-src; the header
// keeps everything a meta policy cannot carry (frame-ancestors among them).
//
// Next's experimental `sri` option is not this. It adds integrity attributes
// to the external chunks and does nothing for the inline scripts, which are
// the ones 'unsafe-inline' exists for.
//
// Run from the repo root, after the build: node scripts/csp.mjs
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'out';
const MARK = 'data-inline-hashes';

// Executable script types. Anything else — application/ld+json in
// StructuredData.tsx — is a data block the browser never runs, and CSP does
// not govern it.
const RUNS = new Set(['', 'text/javascript', 'application/javascript', 'module']);

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

function typeOf(attrs) {
  const m = /\stype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
  return (m ? (m[1] ?? m[2] ?? m[3]) : '').trim().toLowerCase();
}

if (!fs.existsSync(OUT)) {
  console.error('csp: no out/ — run next build first.');
  process.exit(1);
}

let pages = 0;
let scripts = 0;

for (const file of htmlFiles(OUT)) {
  // A rebuild without a clean out/ would otherwise stack a second meta.
  let html = fs.readFileSync(file, 'utf8').replace(new RegExp(`<meta ${MARK}[^>]*>`, 'g'), '');

  const hashes = new Set();
  for (const [, attrs, body] of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    if (attrs && /\ssrc\s*=/i.test(attrs)) continue;
    if (!RUNS.has(typeOf(attrs ?? ''))) continue;
    // The browser hashes the script's text as written; raw text inside
    // <script> is not entity-decoded, so the bytes in the file are the bytes
    // it hashes.
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }

  const policy = ["script-src 'self'", ...hashes].join(' ');
  const meta = `<meta ${MARK} http-equiv="Content-Security-Policy" content="${policy}"/>`;

  // Before every script, so the policy is in force when the first one is
  // parsed. After the charset meta where there is one, which wants to stay in
  // the first kilobyte.
  const charset = /<meta charSet="utf-8"\/>/i;
  if (charset.test(html)) html = html.replace(charset, (m) => m + meta);
  else if (/<head(\s[^>]*)?>/i.test(html)) html = html.replace(/<head(\s[^>]*)?>/i, (m) => m + meta);
  else {
    console.error(`csp: ${file} has no <head>, so its scripts cannot be pinned.`);
    process.exit(1);
  }

  fs.writeFileSync(file, html);
  pages += 1;
  scripts += hashes.size;
}

console.log(`csp: pinned ${scripts} inline scripts across ${pages} pages.`);
