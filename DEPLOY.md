# Deploying masterroachi.com

**Cloudflare Workers static assets**, deployed from `main`. DNS is on
Cloudflare, mail is Cloudflare Email Routing, state is D1 and KV, and the
private backend at `/work` sits behind Cloudflare Access.

Not Pages. This said "Cloudflare Pages" until October 2026 and that had been
wrong since the Worker started answering for the store.

```
npm run build && npx wrangler deploy --dry-run
```

is the check to run before pushing anything that touches `wrangler.jsonc`. It
should report reading files from `out` and exit without mentioning OpenNext.
Every push to `main` triggers a build and deploy from then on.

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

### Build settings

Set once on the Cloudflare project, under **Workers & Pages → Connect to Git**:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build output directory | `out` |
| Node version | 20 or newer |

The dashboard's output directory is advisory — `wrangler.jsonc` declares
`./out/`, and that is what governs. Routing is declared there too, deliberately:
**a deploy overwrites the dashboard**, which is how `workers.dev` kept coming
back on after being switched off by hand.

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

Five, none of them in the repo. `npx wrangler secret list` names them:

| | What it is for | Set it with |
| --- | --- | --- |
| `GITHUB_TOKEN` | the backend committing to this repo | `npm run github-auth` |
| `TRELLO_KEY`, `TRELLO_TOKEN` | what `/work/boards` reads | `npm run trello-auth` |
| `ORDERS_KEY` | reading store orders back out of KV | `npx wrangler secret put ORDERS_KEY` |
| `VOTE_SALT` | salting the voter hash, which is guessable without it | `npx wrangler secret put VOTE_SALT` |

Every one of them **fails closed**: a missing secret makes its endpoint serve
the 404 page rather than answer. `GITHUB_TOKEN` expires — when the backend's
editor starts reporting a failure to list files, rotate it with
`npm run github-auth`, and run that in your own terminal rather than through an
agent session, since it asks for a token.

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

## Afterwards

- Confirm `/rss.xml`, `/sitemap.xml` and `/robots.txt` resolve.
- Send a test mail to `roachi@masterroachi.com` and confirm it arrives.
  Receive-only: replies come from the destination inbox's own address.
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
