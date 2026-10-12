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
the first two, the single `content/store/copy.json` for the third.

### The backend is its own app shell

Nothing under `/work` wears the site. The nav and the footer hide themselves on
those paths — a two-line guard in each, rather than lifting every public page
into a route group to change the chrome on nine of them — and `app/work/layout.tsx`
supplies one centred row of links instead. Every page lost its "Private"
eyebrow, its own title and its back link: each one opened by telling you where
you were, which the header now does once, above a link to a home page that is
one of those links anyway.

**The shell is exactly `100dvh` and the page never scrolls.** `main` is
unstyled and `body` is a flex column with `min-height: 100dvh`, so a wrapper of
exactly the viewport fills it and leaves nothing to scroll. The content wrapper
scrolls instead — one rule rather than nine stylesheets — and that is the
honest compromise: an editor with a textarea, a frontmatter form and a preview
column cannot fit a laptop screen, but it can be stopped from moving the page
under the cursor. Curriculums and Boards are sized to need neither.

`min-height: 0` on the flex children is what makes all of it work, and is the
thing that is easy to leave out and impossible to debug by looking: without it
a flex child grows to fit its content and pushes the shell past the viewport,
whatever the parent's height says.

### Boards

A pill per board, one open at a time. Every board rendered at once, stacked,
which made this the longest page in the backend and put the board being read
somewhere in the middle of four others.

**Cards are grouped by the board's own lists, not by the hub's buckets.** That
was the first attempt and it was wrong in a way worth recording: North Star
runs nine lists — Continuing, Blocked / Waiting, To Plan, Strategic Backlog,
Next Sprint, Current 2-Week Sprint, In Progress, Review / Approval, Completed
— and exactly one matches a bucket pattern, so grouping by bucket showed two
cards and silently dropped the rest of the board. The buckets still decide what
the morning check-in reads; they are just the wrong thing to lay a board out
with, because a board's lists are the board's own language.

A card is drawn as a chip about three words wide — the glue is dropped rather
than the title truncated, since truncation spends the width on the words
carrying least — and clicking one opens it dead centre with the page dimmed.
Boards are ordered by their soonest due card; one with nothing due sorts last,
because no deadline is not the same as an imminent one.

`Waiting` is a bucket: blocked on somebody else is the state that goes quiet
and is forgotten. `Inbox`, `Done` and Command's `Projects` list are not — Inbox
is uncategorised capture and showing it makes the hub a second inbox, Done is
the past, and Projects holds twelve cards that are the NAMES of his projects.

**Moving a card is the only thing this site writes to Trello.** The page is
opened in the morning to decide what today is, and deciding meant going to
Trello to drag three cards and coming back. Card and list ids are checked
against 24 hex characters before they reach a URL: a Trello token is a bearer
credential for an entire account, so an id straight off the wire is how a move
becomes somebody else's request. Nothing else is written — no creating, no
labels, no comments, no archiving — because Trello is still where the work is
written down.

### Editing frontmatter without losing it

`CollectionEditor` was one textarea holding a whole file, and the comment
defending that was right about the danger: a field-per-key form means
modelling every frontmatter key and silently dropping the ones it does not
know, and losing a field on save is the worst failure this tool can have —
quiet, committed and self-deploying. It is now a form anyway, because Odin's
file is 106 lines of YAML before a word of prose, two thirds of it a nested
`pieces` list, and hand-editing that is how a stray indent fails a build two
minutes later.

What makes it safe is that **nothing parses and reserialises a document**.
`lib/frontmatter.ts` holds frontmatter as its own lines; a control replaces one
field's lines; a key with no control is untouched, unreordered and shown as raw
text in a box of its own. Setting one field changes exactly one line, and the
quoting style the file already chose is kept, so a touched file does not
reformat wholesale. `lib/editor-fields.ts` is the schema, and it is
deliberately not exhaustive: it decides what gets a nice control, never what is
allowed to exist.

**The style checks are local and there is no fact checking.** `lib/prose-check.ts`
runs on every keystroke for nothing — doubled words, a straight quote in a site
written with curly ones, a hyphen standing in for an em dash, filler, a
forty-word sentence. The hard part is not firing on code, so everything that is
not prose is masked out first with a sentinel that is neither whitespace nor a
word character; masking with spaces made `[guide](url).` read as a space before
a full stop and produced 82 findings on one real post, almost none of them in
the prose. A capitalisation check was written and then removed: with regex it
cannot tell a proper noun from a word starting a heading, and it was wrong
thirty-two times on one post, which buries the findings that are right.

Fact checking is deliberately absent. It cannot be done offline, and done at
all it can only list claims worth checking rather than return verdicts — so it
would need a key, a cost per run and a button, and the backend stays
self-contained instead.

**Scheduling.** A post dated in the future is withheld from every listing, the
feed and the sitemap, and marked noindex — its page is still generated, because
static export refuses a dynamic route that produces zero pages, so linked from
nowhere is not the same as not published. The subtlety is that a static site
has no "now" at read time: the withholding is a decision made by whichever
build ran. So the build writes `/scheduled.json` saying the earliest date it
withheld something for, and a Cloudflare cron on the Worker reads it daily and
rebuilds only when that date has arrived — one empty commit on the day a post
is due, rather than a commit a day forever. The nightly play-data Action was
not a candidate: it pushes only when play data actually changed.

**js-yaml parses an unquoted `date:` into a Date, not a string**, which is worth
knowing because it made scheduling a no-op first time: a
`typeof date === 'string'` guard matched nothing and a post dated 2027
published immediately. The rest of `lib/content.ts` gets away with it because
`Date.parse()` coerces either; a text comparison does not.

Three things are not fields. **`weight` is dragged**, because it is a sort key
with no meaning of its own, and `/work/api/reorder` redistributes the existing
numbers into the new order as ONE commit through the git database — six saves
would be six deploys for one decision. **`draft` is a button**, and distinct
from `status`: one asks whether the page is on the site, the other what stage
the work is at, and no project has ever used `draft`. **Images are uploaded**,
converted to WebP in the browser and capped, into `public/projects/` — where
`generatedCoverNames()` names the three files `covers.mjs` rewrites on every
build, which an upload must never be saved over. Habits,
Reading and Curriculums are rows in D1 and change nothing on the public site.

A project page's `hero` is a second image and not the `cover` reused: a card in
the grid wants something that reads at thumbnail size and the top of a page
wants something wide, and sharing one field would mean choosing which of the
two to do badly. `summary` is the page's meta description, so editing it is an
SEO change — which is why the projects editor carries the same live checklist
as product copy.

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

**Habits are one per practice, not one broad "studied".** Four, seeded
2026-10-12, in the same order as the curriculum route: Japanese, Piano, Greek,
Drawing. The trade was deliberate — four streaks to keep alive, against one
streak that survives a day of Greek instead of piano. The two archived `asd`
rows from 8 October are test habits, moved to the end of the order rather than
deleted, because archived-never-deleted is the schema's own rule.

Two columns carry decisions worth knowing about:

- **`lessons.on_route`** (`0006`) — a course is not a list you finish, it is a
  list you take a line through. Odin forks and plenty of its lessons are
  optional, so the number wanted is "18 of the 41 I am actually doing". An
  imported outline is on the route until something is taken off it.
- **`lessons.detail`** (`0007`) — what a lesson actually teaches, in Markdown.
  Nullable on a rule: a **transcribed** curriculum keeps its substance in the
  resource, a **designed** one has nowhere else to keep it. So Godot, Drawing,
  Aseprite and SA politics carry detail; Greek, Japanese and Odin do not.

### The curriculums dashboard

**A deck of cards.** It was a column of wide cards each carrying a ring, a
count, a fortnight figure, a source line and the next lesson — all true, and it
meant the page answered five questions at once, none of them the one being
asked. Now a card per curriculum shows its progress and its name and nothing
else, and everything further is reached by going into it: stages fan out, a
stage opens to its lessons, a lesson opens its detail beside it. Three levels,
three depths of card, at most two side by side.

**The only number on the page is a percentage in a ring.** No counts, no
fortnight figure, no "N of M" — except the one Up next line, which is the route
through all the routes and the reason curriculum order exists.

A card's colour is **derived from its name** (`lib/curriculum-card.ts`), using
the book spines' own palette and hash, so a new curriculum has an identity with
nothing to choose and renaming one changes its colour. Lightness and chroma are
fixed: varying them by hash as well is how a deck ends up with one unreadably
dark card and one that glares. Status is one round button cycling
active → paused → done, because three values do not need a menu, and paused and
done sit at the back of the deck, greyed.

**`detail` is written to D1 and to the repo.** For a designed curriculum
`scripts/curriculums/<name>-detail.json` is the source of truth — `apply.mjs`
lets the repo win wherever it has detail — so writing only D1 meant anything
typed at the dashboard was overwritten by the next rebuild. Both are written
now, through the same `lib/collections.ts` guard as every other write; the D1
write lands first, deliberately, so a GitHub outage costs a future overwrite
rather than refusing the edit. A transcribed curriculum has no detail file and
needs none: `apply.mjs` already preserves dashboard-written detail wherever the
script supplies none, and the response says which of the two happened.

**Detail is rendered, not printed.** It is authored as Markdown and the page
used to emit the string raw, which made the substance of a lesson a wall of
asterisks — the opposite of the point, since `detail` exists because a name
"tells me what is learned conceptually, but what wrist level means, what
posture to use is a mystery". Rendered by a small subset renderer in the
component, because the site's MDX pipeline is a server component compiled at
build and cannot run in a browser.

**`sources` is a table** (`0008`), not the one `curriculums.source` line: Greek
runs Pimsleur and the Basic Course in tandem. That column still exists and
records which document *designed* a curriculum, which the build scripts read —
a different fact, and dropping a column in SQLite rewrites the table.

Taking a lesson off the route lives on its detail card rather than on the
lesson row, so a decision made rarely is not sitting next to one pressed
constantly. There is no outline import and no reordering from the page: every
curriculum is built through this UI from now on, which is what the blank card
at the back of each deck is for.

### Curriculums

Eight, in `scripts/curriculums/`. 708 lessons, 694 on the route, 341 carrying
detail. In order, because **the order of the curriculums is the route through
all of them**: Japanese, Piano, Greek, Odin, Godot, Aseprite, Drawing, South
African politics. That is the order he asked for, set on 2026-10-12; until then
they sat in the order they happened to be built in.

Each is a `.mjs` that **prints SQL and executes nothing**, with a `.md` beside
it where the curriculum is designed rather than transcribed. Re-running one
rebuilds it in place without losing its position, and deletes its lessons
explicitly before its modules rather than relying on `ON DELETE CASCADE`, which
does nothing wherever foreign keys are not enforced.

**How the SQL reaches D1: `npm run curriculum <name>`, and nothing else.**
Printing and not executing is the right default, but it left the last step
written down nowhere, and the cost was visible in the data — Odin sat finished
in the repo and absent from the site, and Drawing's 64 lessons were live with
every `detail` null, a week after the detail was written and committed. Work
that is generated and never applied is work that did not happen.

It is a script rather than a documented `wrangler` line because a rebuild
deletes and re-inserts every lesson, and so throws away everything the
dashboard writes and the script cannot know: `done_on`, `on_route`, detail
typed into the editor, rows added by hand. Documenting
`wrangler d1 execute --file` would have been documenting a way to lose them,
and it would have looked safe for exactly as long as nothing was ticked.
`apply.mjs` reads that state out first, matched on module name + lesson name —
ids are new after a rebuild and names are the only identity that survives —
rebuilds, and writes it back. It also rehearses the SQL against a throwaway
SQLite database built from `migrations/` before touching the remote, which is
where the new lesson set comes from rather than from parsing the script's own
output.

**Detail is the one field the repo wins**, because `<name>-detail.json` is the
source of truth and editing it has to be able to change a lesson. Where the
script supplies none, dashboard-written detail is kept; where it differs, the
lesson is named before it is overwritten. Comparing the text and not merely its
presence is the whole point — a warning that fires on all 64 lessons every
rebuild hides the one edit it exists to catch.

Rows that exist only in the database are **reported and then deleted**, his
call, with the SQL that would re-create them written out beside the apply so
that "warn and continue" does not mean "gone".

Odin carries the system's only real progress: **112 of 137**, backfilled
2026-09-03 — the day its repository was reorganised, so the day the work was
provably already finished rather than the day it happened. The alternative was
leaving 112 lessons untickable. Those ticks survived a rebuild of the live
database, which is how the preservation was verified.

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
      placeholders written from one line each. Terrath is the thinnest. The
      TODO comments this item used to point at do not exist — there is no TODO
      anywhere in `content/` or `lib/`, so the only record of which three are
      thin is this line.
- [ ] **Fabled Threads storefront URL**, and confirm whether it is actually
      building or already open
- [ ] **Cultus Botanicus engine/stack** — the name itself is now settled
- [ ] **lib/pursuits.ts needs confirming** — seeded from July 2026 data
- [ ] **Sprite-acus needs rewriting, not just parking.** Set to
      `status: parked` on 2026-10-12 so it stops reading as live work; its
      summary still says "Built because I cannot draw", which stopped being the
      story when the Shepherds art went fully hand-drawn in September.
- [ ] Finished games, tier list, RetroAchievements URL
- [ ] **Actual writing.** Scaffolding only
- [ ] Swap the sigil for an Orthodox cross — every use goes through
      `components/Sigil.tsx`, so it stays a one-file change
- [ ] **Expand the curricula.** Asked for twice (12 and 13 October), after the
      backend rework. Which of the eight and how far is his call; it should go
      through `scripts/curriculums/<name>.mjs` and `-detail.json` so a rebuild
      keeps it.
- [ ] **`PRINTFUL_TOKEN` is not set as a Worker secret**, so the store's Sync
      button reports "not switched on". The feature is built and unreachable
      until `npx wrangler secret put PRINTFUL_TOKEN` is run.
- [ ] **Five curriculums have no sources.** Japanese, Greek and Odin carry real
      ones; Piano, Godot, Aseprite, Drawing and SA politics were carrying the
      path of the document that DESIGNED them, which is not something he
      studies from, so those rows were deleted rather than replaced with
      invented book titles.
- [ ] **`npm run lint` is broken**, and was before any of this work: Next 16
      removed `next lint`, and the repo has no eslint config. Fixing it means
      choosing one.
- [ ] **Odin reads 112 of 151 now the route is gone.** Its fourteen formerly
      off-route lessons are the whole Getting Hired course, and they count.
      Deleting that course is the only way to stop them, and that is a decision
      rather than a bug.
- [ ] **Which board holds the unfamiliar Trello cards.** Not North Star and not
      Sales, by his own check. The folded "can see N boards" line on
      `/work/boards` names every board the token reaches, including the ones no
      panel is drawn for.
- [ ] **Reading holds one book.** *The Odyssey*, marked reading since
      2026-10-08, and nothing else — the shelves are a bookcase with one book
      on it. `~/Media/Books` is 3,586 files filed by author, which is a
      library and not a reading list, so it is the wrong thing to seed from:
      the shelves want what he is actually reading.
