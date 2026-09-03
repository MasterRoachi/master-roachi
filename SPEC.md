# Master Roachi — Project Spec

Living spec for masterroachi.com. Updated as decisions get made.

## Who / What

Personal site and public record for Stephan Engelbrecht — Master Roachi. It
covers what he builds (games, worlds, software), what he plays, and what he
studies.

**This is a personal brand site, not a portfolio for job applications.** An
earlier version of this spec was written around "junior full-stack developer"
positioning, with scope deliberately cut to "software and writing only". That
framing is dead. Decisions should not be justified by what a hiring manager
would think.

Audience: anyone. No specific niche targeted.

## Identity

The tagline, carried over from the original site and deliberately kept:

> Work Hard, Study Well, Eat and Sleep Plenty. That is the Turtle Hermit Way.

It is not decoration — it names the three sides of the project:

- **Work Hard** — building. Games, worlds, and the code underneath them.
- **Study Well** — Orthodoxy, taken as a real question rather than an aesthetic.
- **Rest Plenty** — gaming, done attentively enough to be worth writing about.

It replaced the previous hero line, "Code by trade, worlds by nature", which
this spec had flagged as unresolved because it hinted at worldbuilding an
earlier scope decision wanted hidden. That constraint no longer applies —
Terrath is now a listed project.

The ethos, also recovered from the original site:

> Do the work, tell the truth, improve over time, and repeat. Everything is
> public. Nothing is hidden.

That is a design constraint as much as a mission statement. Unfinished work is
shown as unfinished rather than omitted.

## History: the three branches

The original site split Master Roachi into three sub-brands — **Arkitecture**
(coding), **Questicles** (gaming), and **South African Sinner** (Orthodox
apologetics), each with its own logo and page.

**Those branches are scrapped as a structure.** The activities continue, but
under Master Roachi directly rather than as separate brands. Do not build
navigation around those names. They survive, with their artwork, on the
`archive/html-site` branch.

Questicles became `/gaming`. South African Sinner became `/orthodoxy`.
Arkitecture's content is simply the projects.

## Site Map

```
/            hero, projects, gaming + orthodoxy, recent writing
/projects    all projects with status
/projects/<slug>
/gaming      streaming, now playing, up next, finished, tier list, reviews
/orthodoxy   published, in the works, articles
/writing     all posts, filterable by track
/writing/<slug>
/about       the ethos, tools, contact
/rss.xml  /sitemap.xml  /robots.txt
```

There is no `/contact` page — three links do not fill one, so contact lives at
the end of About and in the footer. There is no `/shepherds` page either; it is
one project among several, not a section.

## Content Decisions

### Projects

Five, with more coming. Status vocabulary: `released`, `building`, `ongoing`,
`concept`, `parked`. The earlier live-or-coming-soon binary could not describe
a store that is open, a world being written, or a game in early development —
which is most of what there is.

| Project | Status | What |
| --- | --- | --- |
| Shepherds We Shall Be | building | 2D pixel art ARPG, solo, Godot |
| Fabled Threads | building | Print-on-demand store — anime and early-2000s cartoon inspired illustrations |
| Project Greenhouse | building | Reboot of Plant Tycoon. Working name |
| Terrath | ongoing | Worldbuilding |
| The Odin Project | released | Eight foundations exercises |

Ordering is by explicit `weight`, so active work leads rather than whatever is
newest.

Every project links to its own page whatever its status — a concept still has
something to say about itself. The old build made unreleased cards
non-clickable, which left them looking like broken UI.

Tutoring is **not** a project and is not listed. The website itself was briefly
listed and removed — it is not a real project.

### Writing

One collection, several views. A post carries a `track` — `code`, `gaming`,
`theology`, or `devlog` — and optionally a `project` slug.

- `/writing` shows everything, filterable
- `/gaming` shows the `gaming` track
- `/orthodoxy` shows the `theology` track
- A project page shows posts pointing at it via `project`

One pipeline rather than three parallel ones. Devlog entries are just posts with
`track: devlog` and a project attached.

No real posts yet — `content/writing/` holds clearly-labelled scaffolding marked
`draft: true`, which never reaches the deployed site.

### Gaming and Orthodoxy

Ongoing pursuits, not projects, so their pages are driven by structured data in
`lib/pursuits.ts` rather than prose. That file is **seeded from the archived
site (July 2026) and needs confirming** — achievement counts in particular will
have moved. Finished games, the tier list and the RetroAchievements URL are
empty pending real data.

### Contact

`roachi@masterroachi.com`, forwarded to a personal inbox by Cloudflare Email
Routing — a forwarding address, not a mailbox. Verified working end to end.

The UI hides a contact link rather than rendering a dead one when a value is
null, which is why an earlier build's literal placeholder mailto cannot recur.

## Visual Direction

**Minimal and high-contrast**, after the references originally listed here —
ryanritzenthaler.com and bepatrickdavid.com.

This replaced an ornate pass (Cinzel display caps, a diamond sigil used as a
recurring motif, grain, layered gold and teal glows). That pass was a reaction
to v1 reading as "boring", and it overcorrected into dark fantasy — a long way
from the minimal, typography-led references actually cited.

- **Type.** Archivo alone, replacing Cinzel plus Manrope. Heavy and tight at
  display sizes, readable at body sizes, which is what lets one family do
  everything. Self-hosted via `next/font`.
- **Colour.** Neutral greys at zero chroma rather than blue-tinted. One accent,
  used sparingly enough that it still signifies — `released` is accented,
  everything else greyscale.
- **Structure.** Rules and borders, not ornament. The sigil survives only as a
  small footer mark; watermark, card corners and divider motif are gone.
- **Space.** Generous and asymmetric. The Turtle Hermit line is set as large as
  the viewport allows and is the one place type dominates.

### Fixed, not ported

Three defects from the Astro build were fixed rather than carried across:

- **Responsive.** Two media queries only flipped grid columns, so a fixed 72px
  gutter and unscaled display type reached 375px — clipping nav items and
  setting the bio two or three words per line. Now a shared `--pad` token and a
  fluid type scale; the nav collapses to a toggle below 820px.
- **Glows** sat at hard-coded scroll offsets, extending the document 190px past
  the footer into dead scroll space. Removed entirely with the ornate pass.
- **overflow-x** was set on `body` alone, which does not stop the root element
  panning sideways. Now on both.

## Tech Stack

**Next.js (App Router) + React, statically exported.** Superseded Astro when the
brief changed to React.

- Static export to `out/`. No server runtime.
- Content is MDX on disk, read at build time via `lib/content.ts`. No CMS.
- The nav is the only client component — but that is **not** the same as
  shipping no JS. The App Router ships its own runtime regardless: seven chunks,
  ~175 KB brotli-compressed on the homepage. Unremarkable for Next, but a real
  regression against Astro, which shipped zero bytes.
- Fonts self-hosted via `next/font`.

Rejected: plain React SPA (weak SEO, hand-rolled markdown pipeline) and
React Native, the original request — it targets native apps and costs SEO,
bundle size and the MDX pipeline on the web.

### Drafts

`draft: true` withholds an entry from every listing, the sitemap and the feed,
and marks its page noindex. The page is still generated: static export refuses
to build a dynamic route producing zero pages, so a section with nothing
published would otherwise break the build. Keep at least one `.mdx` file in
`content/writing/`.

## Hosting

Cloudflare Workers static assets, deployed from `main` via `wrangler.jsonc`.
Domain moved from domains.co.za. The old mailboxes were stale and abandoned
rather than migrated. See DEPLOY.md; pre-migration DNS in DNS-SNAPSHOT.md.

`wrangler.jsonc` is load-bearing — without it `wrangler deploy` detects Next.js,
assumes a server-rendered app, silently runs the OpenNext migration, and fails.

## Open Items

- [ ] **Terrath, Fabled Threads and Project Greenhouse descriptions** are
      placeholders written from one line each. Each carries a TODO comment
      marking what to replace. Terrath is the thinnest.
- [ ] **Fabled Threads storefront URL**, and confirm whether it is actually
      building or already open
- [ ] **Project Greenhouse engine/stack**, and the real name
- [ ] **lib/pursuits.ts needs confirming** — seeded from July 2026 data
- [ ] Finished games, tier list, RetroAchievements URL
- [ ] **Actual writing.** Scaffolding only
- [ ] Swap the sigil for an Orthodox cross — every use goes through
      `components/Sigil.tsx`, so it stays a one-file change
- [ ] Attach the custom domain, then disable the workers.dev route so the site
      is not served from two hostnames
