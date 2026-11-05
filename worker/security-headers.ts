// The security headers for everything the Worker answers itself.
//
// public/_headers sets these on static assets, and they arrive intact through
// env.ASSETS.fetch. But _headers is applied by the asset layer only, so every
// response the Worker builds — /api/*, /work/api/*, /share/ohana/*, the www and
// http redirects — went out with none of them. This fills in whichever are
// missing, so an asset response passes through untouched and nothing is set
// twice. (_headers appends rather than overrides; two Content-Security-Policy
// headers would be enforced as two policies, not merged into one.)
//
// The values match _headers except the policy. Nothing the Worker writes is a
// page: it is JSON, an image or a redirect, so the policy allows nothing at all
// and refuses framing outright. Should one of these ever be opened directly as
// a document, no script, style or frame can run inside it.

const HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

export function secured(response: Response): Response {
  const missing = Object.keys(HEADERS).filter((name) => !response.headers.has(name));
  if (missing.length === 0) return response;

  // Response.redirect() and fetched responses have immutable headers, so the
  // response is rebuilt around the same body rather than edited in place.
  const out = new Response(response.body, response);
  for (const name of missing) out.headers.set(name, HEADERS[name]);
  return out;
}
