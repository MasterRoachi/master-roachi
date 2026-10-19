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
| `/work/cards` | Flashcards. A deck is a curriculum, and two buttons |
| `/work/sketchpad` | Write and draw on one page, saved as one file |
| `/work/writing` | Posts. Editing one commits it, and the commit publishes it |
| `/work/projects` | The project pages behind `/projects` |
| `/work/shop` | Orders, and what each design is in your own words |

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

**It caught the curriculum overlays too, and in two forms at once.** The lesson
pane is `height: 100%` in a grid row that was `auto` — and a percentage height
against an indefinite row means nothing, so the row grew with its content and
pushed the tick button off the bottom of the screen. The overlay's row is now
`minmax(0, 1fr)`, which makes it definite; the lesson body gained the missing
`min-height: 0`; and both only showed up once a lesson ran to a few thousand
characters, which stage one of Japanese is the first material in the system to
do. These panes also **scroll without showing a bar** — his rule, and the right
one, since a bar that appears and disappears as lessons change length is the
page moving under the cursor.

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

Eight, in `scripts/curriculums/`. **2,142 lessons, 2,005 carrying detail** as
of 2026-10-15 — 694 and 341 before the rewrites. Odin is the only one without
detail, and that is deliberate: see below. In order, because **the order of the
curriculums is the route through all of them**:
Japanese, Piano, Greek, Odin, Godot, Aseprite, Drawing, South African politics.
That is the order he asked for, set on 2026-10-12; until then they sat in the
order they happened to be built in.

**The rewrites are finished, 2026-10-15.** Seven were rewritten between
2026-10-13 and 2026-10-15 — Japanese, Piano, Greek, Godot, Aseprite, Drawing
and South African politics — and **Odin is exempt**, because it is a
transcription of someone else's course and has nothing to teach on its own.
Drawing was the last, at 157 lessons across seventeen modules; Aseprite before
it at 211 lessons and 587 cards.

**All eight were being rewritten, one at a time, from 2026-10-13.** Not expanded
at the edges: re-researched and re-planned to teach their subject from nothing
to mastery, in three phases per curriculum — research the subject and the free
resources that teach it, plan the whole thing and have it approved, then
implement. Length is per subject; none of them has to match another's.

The rule that shaped the existing eight is therefore **gone**: 0007 drew a line
between a transcribed curriculum, whose substance sits in the resource, and a
designed one, which carries its own. His ruling replaces it — *"i dont want to
open the sources, the material itself should be accessible here"* — so every
lesson is to teach on its own, and a source becomes attribution and further
reading rather than the place the substance lives. **Every curriculum but Odin
now meets it.**

Two consequences, built on 2026-10-13 before any of the rewriting:

- **Lesson names must be unique within a curriculum, and `apply.mjs` now
  refuses one where they are not.** `<name>-detail.json` is keyed by lesson
  name alone, not module plus name, so two lessons called "Review" are one
  entry: they would show identical material, and editing either at the
  dashboard would rewrite both. Harmless while the curriculums were small;
  not while they are being written to teach a subject from nothing, where
  "Review" and "Drills" want to appear in every module. Odin already had two —
  "Conclusion" ×4 and "How This Course Will Work" ×3 — which is how the guard
  found its first catch on the day it was written.
- **Sources have two grains.** See below.

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

137 and not 151, because **Getting Hired is deleted** as of 2026-10-13, at his
word: *"delete it"*. Six of the path's seven courses. The route existed for
that one course — 0006 was added for it, *"what is being asked is '18 of the 41
I am actually doing'"* — and when the route went, its fourteen lessons started
counting. A flag saying "not these" and no rows saying it reach the same
number, and only one of them needs maintaining. None of the fourteen was
ticked, so the rebuild lost no date.

### Cards

Flashcards, because Anki was not going to be used. Every modern approach to
Japanese assumes a spaced-repetition system running daily and 2,136 kanji
cannot be held any other way, so the backend grew one.

**His four objections are the whole specification**, and each is a constraint
rather than a preference:

| He said | So |
|---|---|
| "it's in a separate window" | it is a page in the backend |
| "finding the right decks is almost impossible" | **a deck is a curriculum**, and its lessons make its cards |
| "i have no idea how it works" | there is nothing to understand: no deck options, no intervals, no ease factors on screen |
| "learning it takes as long as learning godot" | **two buttons** |

**A deck is a curriculum, which is why there is no decks table.** Eight
curriculums are eight decks; they are already named, ordered and coloured, and
a second list of the same things would have to be kept in step by hand. Where a
curriculum has cards, a **gold card** sits under its name on the stages screen
and links to the deck. A second gold card beside it opens the curriculum's
**sources**.

They are deliberately **not stages**, and they are **horizontal**: the same card
as a stage, the same area and corner radius, turned on its side — 11rem by 8rem
where a stage is 8 by 11, and the CSS is those two measurements swapped rather
than numbers of its own. His design. Out of the list because neither opens a
stage: one leaves the page and the other opens a list. Filled gold rather than
outlined, in the same gold a finished curriculum wears.

**A track runs beside the route rather than on it.** Japanese's kanji modules
are worked through in parallel rather than at a point in the sequence, so they
are drawn as their own row of **white** horizontal cards below the search,
leaving the stage fan to the stages. Three kinds of card on that screen now,
and the colour says which: gold leaves the page, white runs alongside, dark is
a step on the route.

The convention is the name, not a column, because it is a presentational
distinction: a curriculum that names any module "Stage …" is declaring that it
uses stages, and in such a curriculum anything that is not one is a track. A
curriculum that never says "Stage" — Drawing, Godot, Odin — has no tracks and
draws every module in the fan, exactly as before. See `splitModules()`.

**There is no longer a way to add a stage from the page.** Every curriculum is
built by its script now, and a button that inserts a module the script does not
know about creates a row that the next rebuild reports as an orphan.

**The curriculum's sources live behind that card and nowhere else.** They used
to sit under every lesson, below the lesson's own, which made a bibliography of
them — true of all 35 lessons and pointing none of them anywhere. A lesson now
shows only its own sources: the chapter, the page, the one video.

**Scheduling is FSRS, through `ts-fsrs`** — the algorithm Anki itself moved to,
open source, zero dependencies, and a pure function of the card and the rating.
The columns in `cards` are named exactly as the library names its `Card`
fields, so there is no mapping to get wrong in either direction: the row goes
in and the next row comes back. Writing "double the interval on a correct
answer" would have been fifteen lines and would have had to be replaced by this
the first time the intervals felt wrong.

**Two buttons, mapped to the library's four ratings.** FSRS schedules better
with Again/Hard/Good/Easy, and it gets Again/Good: deciding between Hard and
Good is the micro-judgement that turns reviewing into admin. They are stored as
the library's numbers anyway, so a third button later is a change to one map
and not a migration over a year of history.

**Every review is logged, although FSRS does not need it.** The card's own
state is enough to schedule the next review. `card_reviews` exists because
without it the scheduler can never be re-optimised against his own answers —
the one thing that would make this better than Anki rather than merely less
annoying — and a history not kept cannot be recovered later. The log stores the
state the card was in *before* the answer, which is what an optimiser needs and
what the update destroys.

**A card is unlocked by ticking the lesson that teaches it.** Cards exist from
the moment a curriculum is built and wait; `unlocked_on` is what makes one
reviewable. That is how 2,136 kanji can sit in the database without 2,136 cards
arriving on day one, and it is why seeding is automatic rather than a button —
his choice. Unticking does not lock a card again: it may already have a review
history, and hiding it because a tick was clicked twice is the worse answer.

**One setting: how many new cards a day, per deck.** On `curriculums` rather
than in a settings table, and per deck because Japanese is 2,136 kanji and
Greek is a vocabulary list. Null means the default, so changing the default
later changes every deck that never had an opinion. The allowance is counted
from the **review log**, on reviews where the card was new at the time — not
from the cards whose state is new now. A card introduced this morning is in
learning by lunchtime, so counting the pile would let the allowance refill
itself all day.

**A rebuild must never touch a card.** `cards.lesson_id` is `ON DELETE SET
NULL` and not `CASCADE`, because `npm run curriculum` deletes every lesson and
re-inserts it: a cascade would take months of review history with it, and no
script could put it back. The rebuild empties the link, the card survives
whole, and the build script re-points it by the card's natural key —
`(curriculum, kind, front)`, which is also what stops the same question being
asked twice in one deck. A card left pointing at nothing is reported by
`apply.mjs`: its history is intact but nothing will ever unlock it again.

**The note beside the card.** A kanji card says *write it from memory*, and his
question was the obvious one: where. So the card has a note panel beside it,
the same size — "the card and sketchpad are equal size" — taking pen and text
with a tablet. One card has exactly one note, enforced by `card_notes.card_id`
being the primary key, because "one card and one note always live together".

It **saves when the card is answered**, on the same request that records the
review. There is no Save button to forget, and the write that records the
answer is the write that records what was written. A note that will not parse
is dropped and reported rather than stored: it would otherwise overwrite
attempts already saved with something that cannot be read back. The review
still lands — refusing the answer because the drawing was malformed would lose
both.

**One section is visible at a time, and the next appears when the card comes
round again.** A note is a whole number of sections, a section being exactly
what the panel shows, and paging between them is the viewBox moving — nothing
scrolls, so nothing can be left half way between two. The note becomes every
attempt at that character in order, with the previous one there to compare
against, which is most of the reason for writing kanji by hand at all.

How many sections exist is decided **once, when the card arrives**, and frozen
while it is on screen. The first version derived it continuously and was wrong
in a way only using it shows: a fresh section appeared the instant a stroke was
made, because the stroke was what made the count go up — "whenever i write
anything it immediately spawns another note section below". Now the next
section appears the next time the card is reached, which is also the moment the
last attempt becomes worth comparing against.

`sectionsWritten()` counts what is on the page and `sectionsToShow()` adds the
one empty section to write on. Only the first is stored, in `height`: how many
sections are *shown* is a question about when the card was opened, so it
belongs to the page and is never written down.

**The note is adopted in the same update as its card, never in an effect
afterwards.** It was an effect, and that was the bug behind three separate
symptoms: the render that handed the panel a new card still held the previous
card's note, so the panel counted that note's sections and the next answer
posted it back against the wrong card. One card showing the one before it,
sections appearing from nowhere, and writing landing in neither were all the
same fault. The panel is also keyed by card id, so a new card gets a new panel
rather than one carrying the last card's tool and position.

**A section is the measured shape of the panel**, not a fixed one. A fixed 4:3
section sat centred in a taller cell and left a bar of dead space above and
below it, which a writing area cannot afford. The measurement travels with the
note when it is saved, so the sections the server records are the sections the
page drew, and it is bounded on the way in because it arrives from a browser.
The cost is that resizing the window moves where sections divide — a fair trade
for a scratch pad on one rig against making the geometry permanent, which would
mean every note carrying the shape of the window it was first opened in.

**One dot per section**, on the right and vertically centred, and hidden
entirely while there is only one — a single dot would be saying there is
somewhere else to be when there is not. Up for the previous attempt, down for
the next, by wheel or by swipe, with the same sign for both so the two cannot
disagree. A dot can also just be clicked.

The scene format is the sketchpad's own (`lib/sketch.ts`) — the same strokes
and text items, so the surface and the renderer are the same idea in both
places. Stored as JSON rather than as the SVG the sketchpad writes, because a
card note is dashboard data and never opened as a file; `toSvg()` still turns
one into a file if that is ever wanted. There is a size limit, because a note
that grows forever by design eventually stops being a row D1 will take.

A surface full of paths and text is, to a browser, a picture worth dragging —
which is where a grab cursor came from, and why the stroke after the first one
started a drag instead of a line. The answer is three rules together: no text
selection, no native image drag, and the drawn items take no pointer events at
all, so only the surface is ever the target.

**A finger pages and a pen draws**, decided on `pointerType`. Without the split
there is no way to reach an earlier attempt on a tablet at all, since the panel
has nothing to scroll. And there is **no eraser**: a note is the record of the
attempts, and rubbing out a bad one throws away the comparison. Undo exists for
the stroke that went wrong on the way out of the pen.

**Nothing can be drawn past the edge of a section.** A dotted line sits five
pixels in from the panel's border and every point is clamped inside it. Without
the clamp a stroke carried on past the bottom of the panel into the section
below, so one drawing of 中 occupied two sections and came back as three dots
— a second attempt that was really the tail of the first. Dragging past the
edge flattens the stroke onto the line rather than continuing beyond it, which
is what refusing has to mean for a pen that has already left the panel. The
five pixels are converted at whatever the panel is currently scaled to, so they
are five pixels on screen rather than five at one window size.

**The card and the panel are equal halves, side by side.** That arrangement
was arrived at by elimination: a band across the full width is a header rather
than a card, and a square above the panel was too small to read a revealed
answer in. Halves are the only shape tried that has room for both jobs.

**The card fills its half, so revealing cannot change its size**, and what is
inside it is centred vertically rather than pinned to the top. The buttons have
a row of their own at the foot and do not move when the middle grows — a card
that moves its own buttons does so at the exact moment a hand is on its way to
them. A long extra scrolls the middle; it does not make one card bigger than
another.

The page stays in the site's `.shell` content column like every other backend
page. It was briefly full-bleed, to give the panel the whole screen, and that
was further than he wanted.

**The panel has no border and no toolbar.** It is the writing surface and
nothing else — "the panel does not need a border, it can just be the actual
writing panel". The pen, T and undo buttons are three small round buttons in a
column, floating in its top-right corner rather than in a band of their own: a
row across the top would reach into the middle of the writing, and a band below
would take height from the thing that wanted to be bigger. Both panels were
made drastically larger at the same time, which meant taking the page's own
padding down to almost nothing.

Cards are typed — `kanji`, `word`, `grammar`, `sentence` — rather than a free
front and back. A blank rectangle has to be filled in by hand every time,
whereas a kanji card already knows it wants readings, words and a stroke count,
and it is the type that decides the card asks for the hand as well as the
memory. Handwriting stayed a goal, so a kanji card says *write it from memory*.

### What a lesson can show

The lesson card renders Markdown with a hand-written subset — the site's MDX
pipeline is a server component compiled at build and cannot run in the browser.
**That subset is the ceiling on what a lesson can teach**, which stopped being
a detail the moment the material itself moved into `detail`: a curriculum
written around a renderer that cannot show a working example or a paradigm is
written to the renderer instead of to the subject.

So it has fenced code blocks and pipe tables, as of 2026-10-13, alongside the
headings, lists, bold, italic, inline code and images it already had.

**Code blocks were not merely missing, they were being mangled.** The renderer
split the whole string on blank lines before looking at anything, which cannot
see a fence: a sample containing a blank line arrived as two or three unrelated
blocks with its backticks in different ones, and every sample, blank line or
not, came out as a single run-together inline code span — ``` is three
backticks and the inline pattern matches a pair of them, so it read the fence
as a delimiter and the whole program as its contents. **88 of Godot's 92
lessons were shipping their code that way.** Fences are now found by walking
lines, and only what is left over is split on blank lines.

Tables are decided by the delimiter row, not by lines that merely begin with a
pipe, and it carries the column alignment with it. There are none in the
curriculums yet, for the obvious reason. There will be: kana against their
romanisation, a Greek noun's cases across both numbers, the three spheres of
government against what each may legislate on.

**Ruby**, as `[漢字]{かんじ}`, added when the cards page arrived: Japanese wants
readings printed above the characters rather than beside them, because a card
showing 日本 with にほん on the next line is two things to read. The syntax is
explicit at both ends so it cannot be confused with a link — the difference
between `](` and `]{` is the whole grammar. Aozora Bunko's own 漢字《かんじ》
was rejected for having no opening delimiter: the reader has to guess how far
back the reading reaches, and Aozora settles that with a second marker nobody
would type by hand.

Reading the blocks out of the text lives in `lib/lesson-markdown.ts` rather
than in the component, so it can be tested. Its failure mode is not a crash —
it is hundreds of lessons quietly displaying something other than what was
written, which is what had already happened.

The renderer itself is `components/LessonMarkdown.tsx`, shared by the lesson
card and the cards page. Shared rather than copied because two renderers for
the same subset diverge, and the one that diverges is always the one the
material was not written against.

Both a code block and a table **scroll sideways inside their own box**. The
shell is exactly 100dvh and the page never scrolls, so a line of code that will
not wrap has to be absorbed where it occurs or it widens its grid track,
widens the readable column past its 46rem, and puts a horizontal scrollbar on a
page whose whole design is that it has none. `min-width: 0` is what makes that
work — the same trap as the `min-height: 0` one, in the other axis.

### Two grains of source

A source belongs to a curriculum or to one lesson, and migration 0009 is a
nullable `lesson_id` rather than a second table, because they are the same
rows: null means the curriculum's own list, set means that one lesson's.

0008's grain was right for the question it answered — what is this studied FROM,
where Japanese runs fourteen books at once. It is the wrong grain for the
question a lesson asks. "Thompson, *A History of South Africa*" is true of all
thirty-two lessons and points none of them anywhere; the lesson wants chapter 4,
and the next one wants chapter 5. A curriculum-wide list shown under every
lesson is a bibliography, and a bibliography is what you consult once you have
already decided what to read. So the card shows the lesson's own first, with the
curriculum's underneath.

**A build script owns the rows that name a lesson** and deletes its own on a
rebuild. It does not own the rows where `lesson_id` is null: the sixteen already
there for Japanese, Greek and Odin exist in no script, nothing could regenerate
them, and a rebuild leaves them alone.

`add-source` takes an optional lesson and **checks it against the curriculum**,
because a row carries both ids — a lesson id from somewhere else would file the
source under one curriculum and display it under another's lesson, and no later
read could tell that was wrong.

The dashboard's detail editor now holds **32,000 characters rather than 8,000,
and says so when it cuts**. `detail` stopped being a note and became the
material, so a lesson runs to a few thousand words, and a paste that lost its
last third to a `slice()` while the editor said *Saved* is a loss nothing
afterwards can see.

## Plan: the Shop, then Projects, then Writing

Written 2026-10-14, after Habits and Reading were rebuilt. This is the
remaining backend work in the order it is to be done. **One page at a time**,
and each page starts with a question round before anything is built.

Four decisions are still open — they are listed at the end, and the
assumptions this plan runs on are stated there. Rule on them before Stage 1
step 3 and step 4, which are the two that depend on them.

### Stage 1 — Shop

**Products is renamed Shop**, and stops being a copy editor. It becomes the
store's admin: fulfilment, orders and shipping as well as the words. Product
copy is one part of it, not the whole of it.

How the shop worked when this plan was written, which is what the stages
below are shaped around (steps 1 and 2 have since replaced the admin line):

```
customer → /store/<slug> → PayFast payment link (a FIXED sum)
                         → POST /api/order → KV, 180-day TTL
                         → /store/thank-you
him      → curl /api/orders?key=<secret>      ← this is the entire admin
```

Three facts drive the order of the work:

- **There is no admin page.** `worker/index.ts` says so in a comment on
  `/api/orders`. The orders exist and have no interface.
- **Orders expire.** `ORDER_TTL` is 180 days, so a sale and the customer's
  name, email and address vanish six months later.
- **Printful is catalogue-only.** `lib/printful.ts` fetches and merges
  products; it does not create orders. Fulfilment is entirely manual and
  Printful never hears about a sale.

**Steps 1 and 2 are built and live, 2026-10-19** — migration `0015_orders.sql`
applied to live D1, the worker deployed at `1b1fbb0`, and the `ORDERS_KEY`
secret deleted. Orders are a D1 table;
`/api/order` writes there and falls back to KV only when D1 fails;
`/work/api/orders` sweeps KV into D1 on every read (idempotent on the
reference) and sets status; `/work/shop/` has the Orders and Products tabs;
`/work/store` redirects there; `/api/orders` and `ORDERS_KEY` are gone. The
privacy text on `/policies/` now says orders are kept as the record of the sale
rather than deleted after six months, which follows open decision 3's
assumption — change it if that is ruled otherwise. Tested in
`scripts/worker-test.mjs` against real SQLite with the real migration.

**1. Orders, under `/work/shop/`.** List, detail, search, and a fulfilled
mark. Behind Access with the rest of the backend, which also retires the
`ORDERS_KEY`-in-the-query-string guard — that exists only because the endpoint
is public. The biggest gap on the page: the data is already there.

**2. Orders into D1.** A migration and a move off KV, so an order is a
permanent record rather than one with six months to live. Carry across
whatever is still in KV at the time. Keep the KV write as a fallback for the
same reason the buy flow already treats it as non-fatal: losing the
convenience is better than blocking a sale.

**3. Fulfilment.** Push a stored order to Printful's Orders API and read
status and tracking back onto the order. New ground — `lib/printful.ts` has no
orders code. **Blocked until `PRINTFUL_TOKEN` is set as a Worker secret**,
which is his to run, and the Sync button is blocked on the same thing.

**Ruled 2026-10-19, in the question round for steps 1 and 2:**

- **Steps 1 and 2 are one piece of work.** The page is built on D1 from the
  start: migration first, the KV orders copied across, then the page reads D1.
  Nothing is built over KV only to be moved.
- **An order has three states: Received, Paid, Fulfilled.** `/api/order`
  writes the order *before* the customer reaches PayFast, so a stored order is
  a filled-in form, not a sale. He marks Paid by hand after checking PayFast;
  unpaid ones can be filtered out or dismissed.
- **`/work/store` becomes `/work/shop`**, one page with two tabs, Orders and
  Products (the copy editor). Orders opens first.
- **`/api/orders?key=` is removed in the same change**, along with
  `ORDERS_KEY` from the code and docs. Deleting the secret from Cloudflare is
  his to do.

**4. Product copy, expanded.** Add **tagline**, **the story behind the
design**, a **care/fit note**, and **alt text** for the art. Delete the ten
planned designs from `site.store.planned` — they cannot hold copy, because
copy is keyed by Printful id and they have none. That also removes the section
from the public store page, which is built to vanish when the list is empty, so
nothing breaks. Add **manual product ordering**, and a **warning when the
catalogue is stale**: `fetchedAt` is 2026-09-07 and the page says nothing
about it.

**Step 3 is built, 2026-10-19**, on his rulings that day: a **Send to
Printful…** button on a Paid order (nothing automatic); the order is created
in Printful as a **draft**, which he confirms in Printful's dashboard, so a
wrong click costs nothing; and status and tracking are **read back when
`/work/shop` loads**, not by webhook — an order Printful reports shipped, or
with a tracking number, becomes Fulfilled. Migration `0017`,
`lib/printful-orders.ts`. Because the buy form takes the address as one box,
Send opens a form with it split into Printful's fields, guessed from the text
and checked by him. **Since later the same day the buy form asks in those
fields** — country first (any of the 245 Printful ships to, South Africa
first), then street, unit or suburb, city, postal code, and a state only for
the US, Canada, Australia, Japan and Brazil. `lib/address.ts` is the one
definition the form and the Worker both check against; `data/countries.json`
comes from Printful's public `/countries` (`npm run countries`). Migration
`0018` stores the fields; the Send form fills from them exactly, and still
guesses for older orders. The old one-box address is still accepted, from
pages cached before the change. The variant is found by size, and a size that
exists in more than one colour is refused rather than guessed, since the
order does not record colour. An order in Printful cannot be stepped back to
Received or Dismissed here. `PRINTFUL_TOKEN` is set (single-store token); its
`orders` scope is first exercised by the first real Send.

**Step 4 is built, 2026-10-19.** `lib/product-copy.ts` owns the shape: an
entry is `{ tagline, description, story, care, alt }`, every field optional,
and an old array entry still reads as the description, so `copy.json` was not
converted — the editor writes the new shape on its next save. `$order` holds
his store order; `getStore()` applies it, so the store index, the sitemap and
the editor all follow it. The public page shows the tagline under the name,
the story as its own section, the care note above the size guide, and the alt
text on the product image. The ten planned designs are gone from `site.ts`,
with the "Still being drawn" section and the editor's unsynced rows. The
catalogue warning shows past 14 days. Two editor changes he should know about:
the list is now in store order rather than no-copy-first, because a list
sorted by one rule cannot also be the one you reorder; and the numbered
paragraph-split list under the box is gone — the preview column on the right
shows the same paragraphs.

**Step 5 is built, 2026-10-19**, as he chose it: the real page with the
draft in it, and no gallery. **Preview the page** in the Products tab opens
the deployed `/store/<slug>/?preview=1` in a frame, desktop or phone width,
and sends the unsaved copy into it as he types. The page's tagline,
description, story and fit-and-care are client components
(`components/LiveCopy.tsx`) that render the built copy and, only in that
framed `?preview=1` state and only from this origin, swap in a draft.
Everything else in the frame is the live page. Art and a re-sync reach it
after the deploy, as they reach everyone.

**5. Live preview** of the real product page, showing what a visitor sees.
Images on it: Printful's two or three mockups, his own uploaded artwork, and a
3D model where one exists.

**Step 6, the design run — started 2026-10-19.** His order: `/work/shop`
first, then the public pages. His rulings: the backend in the Habits and
Reading language, literally — **orders and products are shut cards**, a pill
in the middle of the page that opens to the width of the column, as a Reading
shelf does; tabs and filters are centred pills; **gold only for what waits on
him** (an order Received, Paid and unsent, or a Printful draft to confirm; a
product with no description), a gold count of those at the top, and the one
next-step button gold; a **round +** for uploading art. An open product card
holds everything about it: art, the five fields, and the preview and SEO
column beside them. **Done for `/work/shop`.** The public store, product,
thank-you and policies pages stay **Fabled Threads' own look, refined** — its
pink and blue, halftone and cartoon voice kept, layout, type and spacing
tightened. Not started.

**6. The design run.** The new look — round `+`, shut cards, gold — applied
once everything that should be on the page is on it. His sequencing, and the
right one: there is no point styling a page whose contents are still growing.

The SEO panel stays. It scores his own words, because the meta description
prefers them (`lib/product-meta.ts`).

**What will still make the Shop look thin, and is not a layout problem:**
Printful holds **one** product. Until there are more, most of the page is one
row.

### Stage 2 — Projects

Question round, then build. **Decide first whether Projects and Writing stay
one component**: both render `app/work/CollectionEditor.tsx` with different
props, so a change to one lands on the other. One editor is one place for a
bug about saving, which is why it was built that way.

Frontmatter editing stays **line-oriented** (`lib/frontmatter.ts`). Nothing
parses and reserialises a document; a control replaces one field's lines and
unknown keys are shown raw and left alone. The one-textarea editor existed to
stop a field form silently dropping keys it does not model.

### Stage 3 — Writing

Question round, then build.

### Stage 4 — Loose ends

- ~~**Sync Printful, scheduled posts, Rebuild and every editor's Save did not
  reach the site by themselves.**~~ Each commits and expects the push to
  deploy, and nothing deployed a push. Ruled 2026-10-19: pushing `main` deploys,
  through `.github/workflows/deploy.yml` (lint, tests, build, D1 migrations,
  deploy). Both GitHub secrets were set 2026-10-19, which switched it on.
- ~~`npm run lint` is broken and was before any of this work.~~ Fixed 2026-10-16.
- **Odin reads 112 of 151.** Its fourteen Getting Hired lessons count now the
  route is gone. Deleting that course is the only way to stop them, and that
  is his call: one statement of SQL.
- ~~**The sprite-acus summary** still describes the retired pipeline.~~ Fixed
  2026-10-15: the page now records the 2026-09-22 retirement.
- **North Star and Sales on `/work/boards/`** — probably moot, since Boards
  was skipped on 2026-10-14.
- ~~**Three curriculums have an empty curriculum-level Sources card**~~ Filled
  2026-10-19 in live D1 from each curriculum's most-cited lesson sources, with
  their existing notes: Aseprite 18 (all of them), Drawing 16 (cited 9+ times),
  South African politics 21 (cited 16+ times). Those lists are dashboard-owned
  and no script writes them, so they survive a rebuild.
- ~~**Two stale curriculum rows, ids 9 and 10**~~ — already gone when checked
  on 2026-10-19; no curriculum name is duplicated. Live D1 holds **13**
  curriculums, not the eight this spec describes: Zulu, Shona, Theology,
  Philosophy and History exist there with no script in `scripts/curriculums/`
  and no curriculum-level sources.

### His alone

- `npm run github-auth` when the GitHub token lapses.
- More than one product in Printful.
- **PayFast: set a passphrase**, then the steps in DEPLOY.md under "Switching
  on the PayFast checkout" — sandbox first, then live, then flip `checkout`.

### Open decisions

Ruled 2026-10-19, except 2.

1. **Build order.** ~~Orders and fulfilment first, or copy and preview
   first?~~ Settled by doing it: orders first, and fulfilment waits on
   `PRINTFUL_TOKEN`, which he will set after step 4.
2. **Shipping — live quotes at a PayFast checkout**, ruled later on
   2026-10-19, with the delivery built into today's prices taken out
   (`deliveryUsd` stops being added) and Printful's real rate quoted on top,
   converted at `usdToZar` and rounded up. **Built, and off** until his
   PayFast passphrase and keys are set: `checkout` in `lib/pricing.json` is
   `"links"`, and one change to `"payfast"` switches prices, wording and the
   buy form together — the payment links are keyed by exact amounts, so the
   two must not move separately. `/api/quote`, `/api/checkout` (amounts worked
   out by the Worker, order stored before PayFast, signed form returned) and
   `/api/payfast/notify` (signature, PayFast's validate, amount — then Paid by
   itself). Migration `0019`. `?checkout=payfast` on a product page shows the
   new form on that one load, for trying it against the sandbox on the live
   site. DEPLOY.md has the switch-on steps. The draft sent to Printful names
   the shipping method that was quoted.
3. **Order retention — 30 days from submission, then the personal details
   are removed.** Name, email, phone, address and note are blanked; product,
   size, price, status and dates stay, so what sold is still on record. Chosen
   over "30 days after the order is closed", knowing that an order still in
   the post on day 30 loses its address. Migration `0016`, `redactOrders` in
   the daily cron and on every read of `/work/api/orders`, the KV fallback's
   TTL on the same 30 days, and the wording on `/policies/`.
4. **The public `/store/<slug>` page changes too.** Tagline, story, care/fit
   note and alt text appear on the real page, not only in the preview.

### Settled: the library index lives in D1

Ruled 2026-10-14. The Calibre index (3,623 books) was never committed, because
**this repository is public on GitHub** and Access gates only the served path.
It now lives in D1: `library_books` and `library_covers` (migration `0014`),
served from `/work/api/library` and `/work/api/book-cover` behind Access.
`npm run library` and `npm run book-covers` write to D1, and `public/work/` is
gone. Nothing about his books goes into git.

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
- [ ] **Japanese: the kanji track.** All eleven stages are written and live —
      381 lessons, 397 lesson sources, 466 cards — but the kanji track is 159
      of 2,136. Four modules of eight-character sets exist; roughly 250 more
      lessons would finish it, frequency-ordered, each set taught through the
      words its readings appear in. That is the only part of
      `scripts/curriculums/japanese.md` still outstanding.
- [ ] **FSRS is unoptimised**, and will be until there is a review history
      worth optimising against. `ts-fsrs` ships an optimiser that takes one;
      `card_reviews` exists to be handed to it. Nothing to do yet except keep
      the log.
- [x] **Rewrite the remaining seven curriculums.** Finished 2026-10-15 —
      see "The rewrites are finished" under Curriculums. Odin is exempt. The
      original item, in route order:
      Piano, Greek, Odin, Godot, Aseprite, Drawing, SA politics.
      Three phases each — research the subject and the free resources that
      teach it, plan the whole curriculum and have it approved, then implement.
      Zero to mastery, comprehensive, length per subject, and the material
      itself in the lesson rather than a pointer to a book. Through
      `scripts/curriculums/<name>.mjs` and `-detail.json`, so a rebuild keeps
      it. The prerequisites are done (code blocks, tables, lesson sources, the
      duplicate-name guard).
- [ ] **`PRINTFUL_TOKEN` is not set as a Worker secret**, so the store's Sync
      button reports "not switched on". The feature is built and unreachable
      until `npx wrangler secret put PRINTFUL_TOKEN` is run.
- [x] **Five curriculums have no sources.** Answered by the rewrites, which
      gave every lesson its own sources. What is left is smaller and is under
      Stage 4: Aseprite, Drawing and SA politics have an empty
      *curriculum-level* Sources card. The original item: Japanese, Greek and Odin carry real
      ones; Piano, Godot, Aseprite, Drawing and SA politics were carrying the
      path of the document that DESIGNED them, which is not something he
      studies from, so those rows were deleted rather than replaced with
      invented book titles. Answered by the rewriting above, which researches
      free resources per subject — and now at two grains, so a lesson can name
      its own chapter.
- [x] **`npm run lint` works.** Fixed 2026-10-16. Next 16 removed `next lint`,
      and the repo had no eslint config at all; `eslint` plus
      `eslint-config-next` on a flat `eslint.config.mjs` restore what that
      subcommand used to supply. 34 errors to 0 — nineteen fixed, fifteen
      examined and recorded as warnings with the reasoning in the config.

      **Three decisions live in `eslint.config.mjs`, so do not undo them by
      tidying.** `@next/next/no-assign-module-variable` is off: a curriculum
      has modules, so `for (const module of ...)` is this project's own
      vocabulary, not the CommonJS global the rule guards. `no-img-element`
      stays a warning: the site is statically exported and pulls remote images
      from Steam, Printful and YouTube. And three React Compiler rules are
      warnings because `reactCompiler: true` is not set in `next.config.mjs`,
      so the compiler they speak for does not run here — revisit when it does.
- [ ] **Which board holds the unfamiliar Trello cards.** Not North Star and not
      Sales, by his own check. The folded "can see N boards" line on
      `/work/boards` names every board the token reaches, including the ones no
      panel is drawn for.
- [ ] **Reading holds one book.** *The Odyssey*, marked reading since
      2026-10-08. The page was rebuilt on 2026-10-14 against the Calibre
      library in `~/Media/Books` — 3,623 books, with covers — so adding one is
      now a search rather than retyping. The shelves still want what he is
      actually reading, and only he can put it there.
- [x] **The library index is not committed, and the repo is public.** Settled
      2026-10-14: it moved into D1 behind Access. See "Settled: the library
      index lives in D1" under the Shop plan.
