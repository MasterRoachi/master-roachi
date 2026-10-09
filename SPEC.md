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

/work        PRIVATE — the back of the house. See The Backend.
/work/<tool>
```

There is no `/contact` page — three links do not fill one, so contact lives at
the end of About and in the footer. There is no `/shepherds` page either; it is
one project among several, not a section.

`/work` is the one part of the site that is not public, and the only part with
a server behind it. Everything else above is a static file.

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
| Cultus Botanicus | building | Reboot of Plant Tycoon |
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

## The Backend

Built 8–9 October 2026. The public site is still a static export; this is a
private set of tools that lives at `/work` and is served by the same Worker.

**Everything is under `/work` for one reason.** A single Cloudflare Access
application covers the path `work` as a **prefix**, so every page and every
endpoint added under it inherits the gate without a new rule — no trip to the
Zero Trust dashboard per endpoint, and no endpoint that is live before its
policy is. That is why the content API is at `/work/api/content` rather than
`/api/content`, and it is the constraint to respect when adding anything.

The check is two lines, repeated on every protected route: a
`cf-access-jwt-assertion` header, or a hostname that is not the apex (which is
local development). Anything else falls through to the static assets, so a
protected URL looks like a 404 rather than a locked door.

### The tools

`/work` itself is a list of ways in and nothing else — it used to be the Trello
boards, which made the page opened every morning also the longest in the
backend.

| | What it is |
|---|---|
| `/work/boards` | Trello across the account, and the day job |
| `/work/habits` | A year opens into months, a month into its own days |
| `/work/reading` | A bookcase of four shelves; a book's notes can become a post |
| `/work/curriculums` | What is being studied, and how far through it you are |
| `/work/sketchpad` | Write and draw on one page, saved as one file |
| `/work/writing` | Posts. Editing one commits it, and the commit publishes it |
| `/work/projects` | The project pages behind `/projects` |
| `/work/store` | What each design is, in your own words |

Writing, Projects and Product copy edit files in this repository through the
GitHub API, so an edit is a commit and the commit triggers the deploy — MDX for
the first two, the single `content/store/copy.json` for the third. Habits,
Reading and Curriculums are rows in D1 and change nothing on the public site.

`lib/collections.ts` decides what is editable and currently lists a fourth,
**Notes** (`notes/`), which has no page yet. The `/work` index carries only
tools that exist, on the rule that a link to a page which is not built is a bug
report.

### Storage, and one opinion in the schema

**D1**, database `master-roachi`, migrations in `migrations/`. Also KV for store
orders and for votes.

**Completion is a date, never a boolean** — habit ticks, reading dates,
`lessons.done_on`. The reasoning is in `0003_curriculums.sql`: knowing a lesson
is done is worth less than knowing when, and a boolean cannot be widened into a
date later without losing every tick already recorded. Dates are
`YYYY-MM-DD` in Africa/Johannesburg, fixed rather than read from the browser.

Two columns carry decisions worth knowing about:

- **`lessons.on_route`** (`0006`) — a course is not a list you finish, it is a
  list you take a line through. Odin forks and plenty of its lessons are
  optional, so the number wanted is "18 of the 41 I am actually doing". An
  imported outline is on the route until something is taken off it.
- **`lessons.detail`** (`0007`) — what a lesson actually teaches, in Markdown.
  Nullable on a rule: a **transcribed** curriculum keeps its substance in the
  resource, a **designed** one has nowhere else to keep it. So Godot, Drawing,
  Aseprite and SA politics carry detail; Greek, Japanese and Odin do not.

### Curriculums

Eight, in `scripts/curriculums/`: Aseprite, Drawing, Godot, Greek, Japanese,
Odin, Piano, South African politics. 708 lessons, 694 on the route.

Each is a `.mjs` that **prints SQL and executes nothing**, with a `.md` beside
it where the curriculum is designed rather than transcribed. Re-running one
rebuilds it in place without losing its position — curriculum order is the
route through all the routes — and deletes its lessons explicitly before its
modules rather than relying on `ON DELETE CASCADE`, which does nothing wherever
foreign keys are not enforced.

**Not written down anywhere: how the printed SQL reaches D1.** See Open Items.

## Tech Stack

**Next.js (App Router) + React, statically exported.** Superseded Astro when the
brief changed to React.

- Static export to `out/`, served by a Cloudflare Worker. The public site has no
  server runtime; the Worker exists for the store, the vote endpoint and the
  private backend at `/work`.
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

- [ ] **Terrath, Fabled Threads and Cultus Botanicus descriptions** are
      placeholders written from one line each. Each carries a TODO comment
      marking what to replace. Terrath is the thinnest.
- [ ] **Fabled Threads storefront URL**, and confirm whether it is actually
      building or already open
- [ ] **Cultus Botanicus engine/stack** — the name itself is now settled
- [ ] **lib/pursuits.ts needs confirming** — seeded from July 2026 data
- [ ] Finished games, tier list, RetroAchievements URL
- [ ] **Actual writing.** Scaffolding only
- [ ] Swap the sigil for an Orthodox cross — every use goes through
      `components/Sigil.tsx`, so it stays a one-file change
- [ ] Attach the custom domain, then disable the workers.dev route so the site
      is not served from two hostnames
- [ ] **Write down how a curriculum's SQL reaches D1.** The scripts print it
      and execute nothing, deliberately — but no npm script, no line in
      DEPLOY.md and no line in any of the curriculum documents says what to do
      with the output. It is the one step of the whole system that exists only
      in his head.
- [ ] **The Odin backfill.** Five courses and the first NodeJS project are
      finished and none of it is ticked, because the dates are not recoverable
      — `odin-projects` stamps 2026-09-03 on twenty of its twenty-four folders,
      the day it was reorganised. The statement is written out at the foot of
      `scripts/curriculums/odin.mjs` and wants one date from him.
- [ ] **README.md and DEPLOY.md are from 2 September** and describe neither the
      Worker, D1, nor anything under `/work`.
