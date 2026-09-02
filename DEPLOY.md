# Deploying masterroachi.com

Target: **Cloudflare Pages**, with DNS moved from domains.co.za to Cloudflare,
and **Cloudflare Email Routing** replacing the old domains.co.za mailboxes.

The site is a static export, so there is no server runtime.

`masterroachi.com` is a `.com` registered through domains.co.za, so this is a
standard gTLD nameserver change — no ZACR-specific steps apply.

---

## Decision: the old email is being abandoned

The domain had live mail on domains.co.za — MX, SPF, and a DKIM key. Those
addresses are stale and are being dropped rather than migrated. Cloudflare
Email Routing forwards a fresh address to an existing inbox instead.

Consequence: **nothing from the old zone needs preserving.** The pre-migration
records are captured in `DNS-SNAPSHOT.md` purely as a record, in case something
turns out to have depended on them.

The one record worth carrying over is the OpenAI domain verification TXT, which
is unrelated to mail:

```
TXT  @  openai-domain-verification=dv-J9mcphUlvkvKb8AgoBQfeIWa
```

Keep it unless you know what it verified and no longer need it.

---

## 1. Repository — done

`main` at github.com/MasterRoachi/master-roachi is the Next.js site. The old
hand-written HTML version is preserved on the `archive/html-site` branch.

## 2. Add the site to Cloudflare

1. Dashboard → **Add a site** → `masterroachi.com` → **Free** plan.
2. Its scan of the existing DNS came back mostly empty. That does not matter
   now — the records it missed were all mail records being abandoned.
3. Delete any imported records pointing at `41.222.32.24` (the old
   domains.co.za host): `@`, `www`, `mail`, `webmail`, `ftp`, and any
   wildcard. None of them are wanted.
4. Add the OpenAI TXT record above, if you are keeping it.
5. Copy the **two assigned nameservers** Cloudflare shows.

At this point the zone should be nearly empty. That is correct — Pages and
Email Routing create their own records in steps 4 and 5.

## 3. Repoint the nameservers at domains.co.za

1. In the domains.co.za client area, open the domain and find the nameserver
   section.
2. Replace all four existing entries (`ns1.tld-ns.net`, `ns2.tld-ns.com`,
   `ns3.tld-ns.net`, `ns4.tld-ns.com`) with the two from Cloudflare. Remove
   the extras — Cloudflare issues exactly two.
3. Save.

Propagation is usually under an hour, up to 48 in the worst case. Cloudflare
emails when the zone goes active. **Wait for that email before step 4** — both
Email Routing and the Pages custom domain need the zone live.

> Check first: if your domains.co.za *account* contact address is
> `something@masterroachi.com`, change it to a working address before this
> step, or you will stop receiving domain renewal notices.

## 4. Set up Email Routing

Cloudflare → **Email → Email Routing → Get started**.

1. Add a destination address (your existing inbox) and confirm the
   verification mail Cloudflare sends to it.
2. Create the custom address `roachi@masterroachi.com`, forwarding there.
3. Accept when Cloudflare offers to **add the required MX and SPF records
   automatically**. This is what replaces the old mail setup.

Receive-only: mail arrives in your inbox, but replies come from that inbox's
own address unless an outbound provider is added later.

The site already expects this exact address: `contactEmail` in `lib/site.ts`
is set to `roachi@masterroachi.com`. Create it with that spelling or the
contact page will point at a dead address.

## 5. Connect the Cloudflare project

The repo contains a `wrangler.jsonc` declaring an **assets-only Worker** — no
server code, just the static files from `out/`. Committing that file is
load-bearing, for a reason worth knowing.

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
unharmed, but the deploy fails every time. With `wrangler.jsonc` present the
detection never runs.

**Workers & Pages → Create → Connect to Git**, pick the repository:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build output directory | `out` |
| Node version | 20 or newer |

The dashboard's output directory is advisory here — `wrangler.jsonc` declares
`./out/`, and that is what governs.

Validate any change to that config locally before pushing:

```bash
npm run build && npx wrangler deploy --dry-run
```

It should report reading files from `out` and exit without mentioning OpenNext.
If OpenNext appears, the config is not being picked up.

## 6. Attach the custom domain

Worker project → **Settings → Domains & Routes → Add → Custom domain** → add
`masterroachi.com`, then repeat for `www.masterroachi.com`.

DNS is on Cloudflare by now, so the records are created automatically and the
TLS certificate issues within a few minutes. Pick one as canonical and redirect
the other.

## 7. Afterwards

- GitHub Pages has been disabled on the repo — verified returning 404.
- Set `site.url` in `lib/site.ts` if the canonical host ends up being `www`.
- Confirm `/rss.xml`, `/sitemap.xml`, and `/robots.txt` resolve.
- Send a test mail to the new address and confirm it arrives.
- Submit the sitemap in Google Search Console.

Every push to `main` triggers a rebuild from then on.
