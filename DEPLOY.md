# Deploying masterroachi.com

Target: **Cloudflare Pages**, with the domain's DNS moved from domains.co.za to
Cloudflare. The site is a static export, so there is no server runtime.

`masterroachi.com` is a `.com` registered through domains.co.za, so this is a
standard gTLD nameserver change — no ZACR-specific steps apply.

---

## 1. Push the repository to GitHub

Cloudflare Pages builds from a connected Git repository.

```bash
git remote add origin git@github.com:MasterRoachi/master-roachi.git
git push -u origin master
```

Create the repo first (`gh repo create MasterRoachi/master-roachi --public --source=. --push`
does both steps at once).

## 2. Add the site to Cloudflare

1. Sign in at https://dash.cloudflare.com and choose **Add a site**.
2. Enter `masterroachi.com` and pick the **Free** plan.
3. Cloudflare scans the existing DNS records and shows what it imported.
   Check the list before continuing — anything currently in use (an MX record
   for email, in particular) must be present, or that service breaks when the
   nameservers switch.
4. Cloudflare then shows **two assigned nameservers**, unique to the account.
   They look like `alice.ns.cloudflare.com` / `bob.ns.cloudflare.com`. Copy
   both.

## 3. Repoint the nameservers at domains.co.za

1. Log in to the domains.co.za client area and open the domain.
2. Find the nameserver section — their control panel labels it under domain
   management as nameserver / DNS management.
3. Replace the existing domains.co.za nameservers (`ns1.tld-ns.net`,
   `ns2.tld-ns.com`, `ns3.tld-ns.net`, `ns4.tld-ns.com`) with the two
   Cloudflare nameservers from step 2. Remove the extra entries — Cloudflare
   issues exactly two.
4. Save.

Propagation is usually well under an hour but can take up to 48. Cloudflare
emails when the zone goes active.

> **Note on email.** Changing nameservers moves *all* DNS for the domain, not
> just the website. If any mail or subdomain currently resolves through
> domains.co.za, those records have to exist in Cloudflare before the switch,
> or they stop resolving. This matters directly here: the site's contact
> address is still unset, and if the plan is `something@masterroachi.com`, set
> the mail records up in Cloudflare at the same time.

## 4. Connect the Pages project

In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages →
Connect to Git**, pick the repository, and set:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Node version | 20 or newer (this project is developed on 24) |

If the Node version needs pinning, add an environment variable
`NODE_VERSION` = `20` in the project's build settings.

Deploy. The first build publishes to `<project>.pages.dev`.

## 5. Attach the custom domain

In the Pages project: **Custom domains → Set up a custom domain**, add
`masterroachi.com`, and repeat for `www.masterroachi.com`.

Because DNS is now on Cloudflare, the required records are created
automatically and the TLS certificate is issued within a few minutes. Pick one
of the two as canonical and redirect the other — a bulk redirect, or a
`www` → apex CNAME, both work.

## 6. After it is live

- Set `site.url` in `lib/site.ts` if the canonical host ends up being the
  `www` variant; it currently says `https://masterroachi.com`.
- Confirm `https://masterroachi.com/rss.xml`, `/sitemap.xml`, and `/robots.txt`
  all resolve.
- Submit the sitemap in Google Search Console.

Every push to `master` triggers a rebuild from then on.
