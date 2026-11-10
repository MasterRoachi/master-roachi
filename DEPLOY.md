# Deploying masterroachi.com

**Cloudflare Workers static assets**, deployed from `main`. DNS is on
Cloudflare, mail is Cloudflare Email Routing, state is D1 and KV, and the
private backend at `/work` sits behind Cloudflare Access.

Not Pages. This said "Cloudflare Pages" until October 2026 and that had been
wrong since the Worker started answering for the store.

```
npm run build && npx wrangler deploy --dry-run
```

is the check to run before deploying anything that touches `wrangler.jsonc`. It
should report reading files from `out` and exit without mentioning OpenNext.

## Pushing `main` deploys

His ruling, 2026-10-19. `.github/workflows/deploy.yml` runs on every push to
`main`: lint, the worker tests, `npm run build` (which is also the typecheck),
then `wrangler d1 migrations apply --remote`, then `wrangler deploy`. One run at
a time, never cancelled half-way.

**It needs two repository secrets**, under GitHub → Settings → Secrets and
variables → Actions:

| | |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → *Edit Cloudflare Workers* template, **plus Account → D1 → Edit** for the migrations |
| `CLOUDFLARE_ACCOUNT_ID` | the account id `npx wrangler whoami` prints |

Without the token the workflow still checks and builds, then skips the deploy
with a notice — so until both exist, **pushing does not deploy**, as before.

What it means, said plainly:

- **Pushing is deploying.** From the rig, from an agent session, from the
  backend's own commits. That last is the point: Save in the editors, Rebuild
  the site, Sync Printful and the daily scheduled-post check all commit and
  were written expecting a deploy to follow.
- **Migrations go out with the code**, before it. A migration is now applied
  by pushing it; write one as if it were being run against live, because it
  is.
- **A broken commit is not deployed** if lint, the tests or the build catch
  it. The live site stays on the last good deploy and the run goes red.
- **What deploys is what is committed.** The build has no Steam,
  RetroAchievements or Printful keys, so each fetch script keeps the committed
  `data/*.json`. Fresh data arrives by commit: `play-data.yml` nightly, which
  starts this workflow after it pushes (a `GITHUB_TOKEN` push fires no other
  workflow by itself), or Sync Printful.

By hand still works, and is the fallback when Actions is down:

```
npm run build && npx wrangler deploy
```

run from this directory. Wrangler is authenticated on the rig. It has twice
answered a D1 call with `7403 The given account is not valid or is not
authorized` and then succeeded on the next try; `npx wrangler login` refreshes
it if that stops being occasional.

**History.** Until 2026-10-19 this was by hand only, and for a stretch before
that this file claimed pushing deployed when nothing did: eight commits sat on
`main` from 13–15 October 2026 while the live site served none of them.

---

## What is deployed

| | |
| --- | --- |
| Worker | `master-roachi`, entry `worker/index.ts` |
| Static assets | `out/`, bound as `ASSETS`, served first for anything the Worker does not handle |
| Hostnames | `masterroachi.com` and `www.masterroachi.com`, both custom domains |
| `workers.dev` | **off** — verified returning 404 |
| D1 | `master-roachi`, bound as `DB`, migrations in `migrations/` |
| KV | one namespace, bound twice as `VOTES` and `ORDERS` under different key prefixes |
| Access | one application covering `/work`, by path prefix |

`wrangler.jsonc` is load-bearing and its comments carry the reasoning for each
of those. Read it before changing any of them.

**Security headers come from two places.** `public/_headers` covers the static
assets, and `worker/security-headers.ts` covers everything the Worker answers
itself. Each page's inline scripts are pinned by hash in a `<meta>` policy that
`scripts/csp.mjs` writes into `out/` as `postbuild`. `npm run build` runs it
on its own, but a bare `next build` skips it. **Deploy only an `out/` built
with `npm run build`**, or the pages go out with only the header's
`'unsafe-inline'` standing guard.

Without it, `wrangler deploy` runs its own framework detection, sees Next.js,
assumes a server-rendered app, and hits an interactive prompt it answers on
your behalf:

```
? Proceed with setup?
🤖 Using fallback value in non-interactive context: yes
```

It then installs OpenNext, rewrites the project config, and fails looking for
`.next/standalone/` — a directory that only exists for non-static builds. Those
edits happen inside the throwaway build container, so the repository is
unharmed, but the deploy fails every time.

### Other names on the zone

Since 2026-11-03 the zone also carries names that are not the site. They belong
to other projects, which are deliberately not named in this public repository;
the dashboard shows them. Leave them alone when working on this one.

| Kind | Record | Rule |
| --- | --- | --- |
| Two A records | another project's own server, **DNS only** | **never proxy them**: the service needs UDP and issues its own certificates |
| A Worker custom domain | made by another Worker, behind its own Access app | never add a record for it by hand; a custom domain fails if one exists |
| `clients` | Custom Domain on another Worker, behind its own Access app | the `/work` Clients door links here; never add a record by hand |
| `pay` | Custom Domain on another Worker (public, no Access) | never add a record by hand |

**Mail**, as public DNS answered on 2026-11-04. Email Routing still receives
(`route1–3.mx.cloudflare.net`, its DKIM key at `cf2024-1._domainkey`). Another
project is moving its sending from Brevo to **Resend**. Resend's records are in:
`resend._domainkey` (TXT) and a `send` subdomain with its own MX and SPF TXT.
Brevo's are still there until that move finishes: DKIM CNAMEs
`brevo1._domainkey` and `brevo2._domainkey` (DNS only), a `brevo-code:` TXT at
the apex, `include:spf.brevo.com` in the apex SPF, and DMARC `p=none` reporting
to Brevo. There is **one SPF record** at the apex; whatever a sender needs is
merged into it, never added as a second `v=spf1`.

Zone changes (DNS, Access) are made **by hand in the dashboard**. Wrangler's
login on the rig has no DNS or Access scope, and no other token exists.

### Cloudflare's own Git connection is disconnected

`deploy.yml` is the deploy path. Cloudflare's **Workers Builds** connection
turned out to be live after all: on 2026-10-19 every push carried a "Workers
Builds: master-roachi" check beside the Action, so each push deployed twice —
and Workers Builds deploys without applying migrations first, so new code
could go live ahead of the column it reads. He disconnected it the same day.
If it is ever reconnected, the two will both deploy every push again.

**What the build fetches is all committed**, so nothing is lost with it:
`play-data.yml` refreshes `data/steam.json`, `data/retro.json` and, since
2026-10-19, the achievement grids (`data/achievements/`,
`public/achievements/`) nightly and commits them; `data/store.json` comes by
Sync Printful; `data/shared-games.json` is hand-kept. A Cloudflare build that
had the keys refreshed these for that one deploy and committed nothing.

`wrangler.jsonc` declares `./out/`, and that is what governs. Routing is
declared there too, deliberately: **a deploy overwrites the dashboard**, which
is how `workers.dev` kept coming back on after being switched off by hand.

### The daily cron

`wrangler.jsonc` declares one trigger, `10 2 * * *`, and `worker/index.ts`
answers it in `scheduled()`. It exists for one job: a post dated in the future
is withheld by whichever build ran, so something has to make a build happen on
the day it is due. The handler reads `/scheduled.json` — written by the build,
naming the earliest date it withheld something for — and calls `rebuild()` only
when that date has arrived.

So it costs one empty commit on the day a post is due and nothing on every
other day. The nightly `play-data.yml` Action is not a substitute: it pushes
only when play data actually changed.

Without `GITHUB_TOKEN` the handler returns silently, which is the same
fail-closed behaviour as everything else here.

### Secrets

Nine on 2026-11-04, none of them in the repo. `npx wrangler secret list` names
them:

| | What it is for | Set it with |
| --- | --- | --- |
| `GITHUB_TOKEN` | the backend committing to this repo | `npm run github-auth` |
| `TRELLO_KEY`, `TRELLO_TOKEN` | what `/work/boards` reads | `npm run trello-auth` |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` | the PayFast checkout — see "Switching on the PayFast checkout" below. Set, with the live values, since 2026-10-21 | `npx wrangler secret put PAYFAST_…` |
| `PAYFAST_SANDBOX` | the sandbox switch from step 2 below. **Still listed on 2026-11-04**; step 3 says delete it or set it to anything but `true`. A secret's value cannot be read back, so whether it is `true` is unconfirmed | `npx wrangler secret delete PAYFAST_SANDBOX` |
| `PRINTFUL_TOKEN` | Sync Printful, and sending orders to Printful as drafts. A single-store private token from developers.printful.com/tokens, scopes `orders` and `sync_products/read` | `npx wrangler secret put PRINTFUL_TOKEN` |
| `VOTE_SALT` | salting the voter hash, which is guessable without it | `npx wrangler secret put VOTE_SALT` |
| `OHANA_ACCESS_TEAM`, `OHANA_ACCESS_AUD` | verifying Ohana's Access token on `/share/ohana` — see "Ohana's way in" below. Not set yet | `npx wrangler secret put OHANA_ACCESS_…` |

Every one of them **fails closed**: a missing secret makes its endpoint serve
the 404 page rather than answer. `GITHUB_TOKEN` expires — when the backend's
editor starts reporting a failure to list files, rotate it with
`npm run github-auth`, and run that in your own terminal rather than through an
agent session, since it asks for a token.

`ORDERS_KEY` was another. It guarded the public `/api/orders` list, which was
removed on 2026-10-19 when orders moved into D1 and `/work/shop/`; by
2026-11-04 it was gone from `wrangler secret list`.

### Switching on the PayFast checkout

Built 2026-10-19, tested in the sandbox and **switched on 2026-10-21**. Delivery is then quoted live
from Printful for the customer's address and paid at PayFast's checkout,
instead of being built into a fixed payment link.

1. In the PayFast dashboard, **Settings → Developer Settings** (the sandbox calls it Integration): set a **passphrase**,
   and note the merchant ID and merchant key there.
2. Try it in the sandbox first, on the live site, without customers seeing
   it. Set the sandbox merchant (sandbox.payfast.co.za → your sandbox
   account's Integration page) as the three secrets, plus
   `npx wrangler secret put PAYFAST_SANDBOX` with the value `true`. Then open
   a product page with `?checkout=payfast` on the end: that one page load
   shows the new form. Pay with the sandbox's test card, and the order should
   turn **Paid** on `/work/shop` by itself.
3. Set the three secrets again with the **live** values, and
   `npx wrangler secret delete PAYFAST_SANDBOX` (or set it to anything but `true`). Pay with an email that is not the merchant's own: PayFast refuses a merchant paying itself.
4. Set `"checkout": "payfast"` in `lib/pricing.json` and push. That one value
   drops delivery out of the prices, switches the product pages, the store and
   `/policies/` to "delivery quoted for your address", and gives every visitor
   the checkout. The old payment links in `lib/site.ts` stop being used.

How it is kept honest: `/api/checkout` works out every amount itself
(`lib/price.ts`, the same function the pages use) and stores the order before
the customer leaves; `/api/payfast/notify` believes a payment only when the
signature is right, PayFast's `/eng/query/validate` confirms it, and the amount
matches what was stored. The signature code is `lib/payfast.ts`, from PayFast's
own PHP SDK, tested against an independently computed value.

### One till

His ruling, 2026-11-10: **pay.masterroachi.com takes every payment, for every
project.** That Worker lives in another repository. The store keeps its
prices, quotes and orders in this Worker's D1. Only the payment goes through
pay. Built 2026-11-10 and **switched on the same day**, at his word.

- **Out:** with `TILL_CHECKOUT` set to `"on"` and the `TILL` Service Binding
  present, `/api/checkout` stores the order as before, then asks pay's `Till`
  entrypoint for the signed form, in cents. The browser is sent only to
  PayFast's own process page; any other `action` is refused. PayFast then
  notifies pay, not this site.
- **Back:** pay calls this Worker's `Orders.markPaid` (`worker/entry.ts`,
  logic in `worker/orders.ts`). The gross must equal the order's own total,
  checked again here, and the update is the same received→paid one
  `/api/payfast/notify` runs.
- **Contract:** `worker/till-rpc.ts`, copied unchanged from pay's side. The
  project id is `store`, and pay's binding back to here is `ORDERS_STORE`.

Switching on, in this order, each step on his word, after pay's first live
payment has passed:

1. Deploy this Worker as it is. `Orders` then exists, with the flag off.
2. pay creates its till database and deploys with its `ORDERS_STORE` binding.
   That deploy fails if step 1 hasn't happened.
3. In `wrangler.jsonc`, uncomment the `TILL` service and set `TILL_CHECKOUT`
   to `"on"`, in one commit. Then make one small real order, end to end.

Switching back is `TILL_CHECKOUT` set to `"off"`. Keep `/api/payfast/notify`
and the three PayFast secrets for some weeks after step 3, because forms
issued before the switch carry the old notify address. Only then remove them
and the signing code.

### The contact form

His ruling, 2026-11-10: the form on `/hire` sends each enquiry to the
CRM's `Leads` entrypoint (Worker `work-clients`) over a Service Binding, and
**this site keeps nothing personal**. Built and **switched on 2026-11-10**.

- **Contract:** `worker/enquiry-rpc.ts`, copied unchanged from the CRM's
  side. The handler is `worker/enquiry.ts`, the form
  `components/EnquiryForm.tsx`.
- **Spam:** Cloudflare Turnstile is checked here before anything is sent on,
  plus a hidden field. `public/_headers` and `scripts/csp.mjs` allow
  `challenges.cloudflare.com` for it.
- **Consent:** the form shows a notice and an optional, unticked box for
  later marketing email (version `web-v1`, wording held by the CRM). An
  enquiry goes through without the box.
- **While off,** `GET /api/enquiry` answers `configured: false`, and the page
  shows the email address instead of the form.

Switching on, in this order, each step on his word:

1. The CRM is deployed with `Leads` (its own `ENQUIRIES` still off).
2. Here: uncomment the `LEADS` service in `wrangler.jsonc` and deploy. The
   form stays off.
3. The privacy notice goes live at `/privacy`.
4. Create a Turnstile widget for masterroachi.com in the Cloudflare
   dashboard. Put its site key in `TURNSTILE_SITE_KEY` and run
   `npx wrangler secret put TURNSTILE_SECRET`. Set `ENQUIRIES` to `"on"`,
   with the CRM's flag switched on at the same time.

---

## The database

Database `master-roachi`, id in `wrangler.jsonc`. An id is an identifier and
not a credential, so it belongs in the repo; reaching it still needs the
account's own auth.

**Schema changes are migrations.** Add a numbered `.sql` to `migrations/` and
apply it from this directory, because that is where the config and
`migrations_dir` are:

```
npx wrangler d1 migrations apply master-roachi --remote     # live
npx wrangler d1 migrations apply master-roachi --local      # the dev database
```

`migrations apply` takes no `--yes`; it skips its own confirmation when it is
not attached to a terminal.

Reading it, which is how most questions about the backend get answered:

```
npx wrangler d1 execute master-roachi --remote --json \
  --command "select name, position from curriculums order by position"
```

A SQL error comes back on **stdout** as `{"error":{"text":…}}` with exit code 1
and an empty stderr, so anything wrapping this command needs to report stdout
or it reports nothing at all.

### Applying a curriculum

This is the step that used to exist only in Master Roachi's head, and the cost
showed up in the data: Odin sat finished in the repo and absent from the site,
and Drawing's 64 lessons were live with every `detail` null, a week after the
detail was written.

```
npm run curriculum piano              # the live database
npm run curriculum all
npm run curriculum godot -- --dry-run # compose the SQL, execute nothing
npm run curriculum godot -- --local   # the wrangler dev database
```

**Never apply a curriculum's printed SQL by hand.** Each
`scripts/curriculums/<name>.mjs` prints SQL and executes nothing, which is
right — the SQL is worth reading first — but a rebuild is `delete from lessons`
+ `delete from modules` + re-insert, so running it through
`wrangler d1 execute --file` destroys everything the dashboard wrote and the
script cannot know: completion dates, route changes, detail typed into the
editor, modules and lessons added by hand.

`scripts/curriculums/apply.mjs` is what makes it safe:

1. runs the curriculum script and **rehearses its SQL** against a throwaway
   SQLite database built from `migrations/`, so bad SQL fails before the
   remote is touched — and so the new lesson set is known exactly rather than
   parsed back out of the script's own output;
2. reads `done_on`, `on_route` and any dashboard-written `detail` out of D1,
   matched on module name + lesson name, the only identity that survives a
   rebuild;
3. rebuilds, then writes all of that back;
4. names anything that exists only in the database and is about to be deleted,
   and writes the SQL that would re-create it to a file beside the apply;
5. reads the row counts back afterwards and complains if they are not what was
   built.

Detail is the one field the repo wins: `<name>-detail.json` is the source of
truth, so editing it has to be able to change a lesson. Where the script
supplies no detail — Greek, Japanese and Odin, the transcribed curriculums, by
the rule in `migrations/0007` — anything typed at the dashboard is kept. A
dashboard edit that differs from the script is named before it is overwritten.

It is not atomic and cannot be: D1 rejects an explicit `BEGIN` inside
`execute`. The composed SQL is left on disk, so a half-applied rebuild can be
re-run.

---

## The private backend

Everything under `/work` is covered by **one Cloudflare Access application**,
matched by path prefix. Two consequences worth knowing:

- **An endpoint cannot go live before its policy covers it.** That is why the
  content API is at `/work/api/content` rather than `/api/content` — moving it
  out from under the prefix would move it out from under Access.
- **A page under `/work` redirects an unauthenticated visitor** (302, to the
  Access login) because Access answers before the Worker does. The Worker's
  own gate is the second line: it checks for `cf-access-jwt-assertion` and,
  failing, hands the request to `env.ASSETS.fetch`, so a protected endpoint
  reached without Access looks like a 404 rather than a locked door. Nothing
  announces that there is something there.

Writes are confined by `lib/collections.ts`, which is the whole write
boundary — the backend commits to a repository that deploys itself, so
anything not listed there must be unreachable. `.github/workflows` above all,
where a write would turn a stolen Access session into arbitrary CI.

`npm run test:worker` is where the routing, the Access gate and that
allow-list are actually tested. Run it before deploying a change to
`worker/`.

---

### Ohana's way in

Built 2026-11-04. Ohana, the household app, reads the curriculums marked his,
hers or both (`curriculums.audience`, migration 0021; set from the dashboard's
curriculum card) and ticks lessons and answers cards there, through
`/share/ohana/*` (`worker/share-ohana.ts`). It changes his study history, so
the Worker **verifies** the Access token there — signature against the team's
keys, audience, issuer, expiry — unlike `/work`, which only checks the header
is present. Until the steps below are done it answers with the 404 page.

Done by hand in the Zero Trust dashboard, since Wrangler has no Access scope:

1. **Access → Service Auth → Service Tokens**: create one for Ohana. Its
   Client ID and Client Secret go to Ohana, never into this repo.
2. **Access → Applications → Add → Self-hosted**: domain `masterroachi.com`,
   path `share/ohana`. One policy, action **Service Auth**, include that
   service token and nothing else.
3. Copy the application's **Audience (AUD) tag**, and the team domain
   (`<team>.cloudflareaccess.com`), then:

```
npx wrangler secret put OHANA_ACCESS_TEAM   # <team>.cloudflareaccess.com
npx wrangler secret put OHANA_ACCESS_AUD    # the AUD tag
```

Ohana then sends `CF-Access-Client-Id` and `CF-Access-Client-Secret`; Access
swaps them for the token the Worker checks.

### The three apps: admin, learn, tools

His ruling, 2026-11-10: the backend becomes three apps on their own
addresses, each installed on his phone with its own icon, and each opening on
its own page of doors. One Worker and one build serve all three.
`lib/work-tools.ts` lists what each app holds. `worker/apps.ts` gives each
address only its own pages and APIs, its own `/manifest.webmanifest`, and its
own icon at `/icon.png` and `/apple-icon.png` (from `public/app-icons/`, cut
from `design/app-icons/`). A page belonging to another app forwards there.

**Built 2026-11-10; no address points here yet.** What's left, in order:

1. **Access application:** one, covering `admin.masterroachi.com`,
   `learn.masterroachi.com` and `tools.masterroachi.com`, allowing only him,
   with a session of one month. Set from his own terminal (not through `!`,
   which uploads empty values):
   `npx wrangler secret put WORK_ACCESS_TEAM` (the team domain) and
   `npx wrangler secret put WORK_ACCESS_AUD` (the new app's Audience tag and
   the old `/work` app's, comma-separated). From then on every private API
   verifies the token. See `privateAllowed()` in `worker/index.ts`.
2. **The addresses:** add the three as `custom_domain` routes in
   `wrangler.jsonc` and push. Only after step 1, so no address ever answers
   without Access in front.
3. **Install** each app on his phone. Then forward `masterroachi.com/work/...`
   to the apps, and remove the old `/work` Access application.
4. **Ohana's link** moves to `learn.masterroachi.com/share/ohana` from Ohana's
   side. The old address is retired after that.


## Afterwards

- Confirm `/rss.xml`, `/sitemap.xml` and `/robots.txt` resolve.
- Send a test mail to `roachi@masterroachi.com` and confirm it arrives.
  The site itself sends nothing; replies come from the destination inbox's
  own address. (Another project sends from the domain, through Resend as it
  moves off Brevo — see "Other names on the zone".)
- Submit the sitemap in Google Search Console.

---

## History: the move off domains.co.za

Done in September 2026, kept here because `DNS-SNAPSHOT.md` refers to it.

`masterroachi.com` was registered through domains.co.za with live mail — MX,
SPF and a DKIM key. **Those addresses were stale and were dropped rather than
migrated**, so nothing from the old zone needed preserving; the pre-migration
records are in `DNS-SNAPSHOT.md` purely as a record. Cloudflare Email Routing
forwards `roachi@masterroachi.com` to an existing inbox instead, and
`contactEmail` in `lib/site.ts` expects exactly that spelling.

The one record carried over was the OpenAI domain verification TXT, which is
unrelated to mail:

```
TXT  @  openai-domain-verification=dv-J9mcphUlvkvKb8AgoBQfeIWa
```

Keep it unless you know what it verified and no longer need it.

The steps were: add the site to Cloudflare on the Free plan; delete every
imported record pointing at `41.222.32.24`, the old host (`@`, `www`, `mail`,
`webmail`, `ftp`, and any wildcard); replace all four domains.co.za
nameservers (`ns1.tld-ns.net`, `ns2.tld-ns.com`, `ns3.tld-ns.net`,
`ns4.tld-ns.com`) with the two Cloudflare issues; wait for the zone-active
email, because both Email Routing and the custom domains need the zone live;
then set up Email Routing and let Cloudflare add the MX and SPF records
itself.

The old hand-written HTML version of the site is preserved on the
`archive/html-site` branch. GitHub Pages has been disabled on the repo —
verified returning 404.
