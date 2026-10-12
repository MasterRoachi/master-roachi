# Master Roachi

Personal site for Master Roachi — software engineer, occasional writer. Built
with [Next.js](https://nextjs.org) (App Router) and React, statically exported,
served by a Cloudflare Worker.

Two halves, and the split is worth knowing before reading anything else:

- **The public site** is static. MDX on disk, read at build time, exported to
  `out/`. No CMS and no server runtime.
- **A private backend at `/work`**, behind Cloudflare Access. It keeps its
  state in D1 and edits this repository's content through the GitHub API, so
  an edit made in the browser becomes a commit, and the commit rebuilds the
  site. See `SPEC.md` for the constraints that are not obvious from the code.

`SPEC.md` is the decision log — content, structure, visual direction, and why
each choice was made. `DEPLOY.md` is how it gets to masterroachi.com, and how
to reach D1.

## Setup

```
npm install
npm run dev
```

Then open http://localhost:3000. Drafts are visible in dev and excluded from a
build.

`/work` needs more than the dev server — it needs Access in front of it and
the bindings behind it, so it is worked on against the deployed Worker. The
one part that runs locally is the database, via `--local` (see `DEPLOY.md`).

## Scripts

- `npm run dev` — dev server with hot reload (drafts visible)
- `npm run build` — static export to `out/` (drafts excluded)
- `npm run preview` — serve the built `out/` directory locally
- `npm run typecheck` — TypeScript, no emit
- `npm run test:worker` — the Worker suite, which is where the backend's
  routing, the Access gate and the content allow-list are actually tested
- `npm run curriculum <name>` — build a curriculum and apply it to D1. See
  **Curriculums** below; this is the only safe way to apply one.
- `npm run github-auth` — check and store the backend's GitHub token. Run it
  in your own terminal, not through an agent session: it asks for a token.
- `npm run trello-auth` — the same, for the Trello credentials `/work/boards`
  reads.

`prebuild` runs a row of generators before every build — Steam,
RetroAchievements, YouTube, Printful, store art, achievements, covers, OG
images and the version stamp. Each is also its own script (`npm run steam`,
`npm run og`, …) for running one on its own.

## Structure

```
app/                    routes (App Router)
  page.tsx              home
  projects/             projects index + [slug] pages
  writing/              posts index + [slug] pages
  store/                store, [slug], thank-you
  gaming/ orthodoxy/    standalone pages
  about/ policies/      static pages
  work/                 THE PRIVATE BACKEND — boards, habits, reading,
                        curriculums, sketchpad, writing, projects, store
  rss.xml/route.ts      RSS feed
  sitemap.ts robots.ts  generated at build
components/             shared UI (Sigil, Nav, cards, MDX renderer)
worker/
  index.ts              the Worker: store, votes, and all of /work's API
  db.ts                 D1 helpers, and the fixed-timezone local day
  github.ts             committing to this repo from the backend
  trello.ts             what /work/boards reads
lib/
  site.ts               contact details, nav, metadata — edit this first
  content.ts            reads content/ at build time
  collections.ts        what the backend may edit. The whole write boundary
  curriculum.ts habits.ts work-hub.ts   backend domain logic
content/
  projects/*.mdx        project entries
  writing/*.mdx         posts
  store/copy.json       per-design copy, keyed by Printful id
migrations/             D1 schema, applied in order
scripts/
  curriculums/          one script per curriculum, plus apply.mjs
```

## Writing content

Every entry is an `.mdx` file with YAML frontmatter. Add a file, and the page
and its listing appear on the next build — there is no CMS.

```yaml
---
title: The title
summary: One or two sentences, used on index pages and in the RSS feed.
date: 2026-09-02
draft: true        # optional
---
```

Project entries take `status` (`live`, `in-progress`, `planned`), plus optional
`link` and `stack`.

`/work/writing` and `/work/projects` edit these same files through the GitHub
API, which means the browser and the working tree are two ways into one set of
files. Pull before editing locally if something was written from the backend.

### Drafts

`draft: true` keeps an entry out of every listing — index pages, the sitemap,
and the RSS feed — and marks its page `noindex`. It still shows normally in
`npm run dev` so it can be previewed while being written.

The page itself is still generated at its URL. That is deliberate: static
export refuses to build a dynamic route that generates zero pages, so a
section with nothing published yet would otherwise break the build. Practical
consequence: **keep at least one `.mdx` file in `content/writing/`**, even if
it is a draft.

## Curriculums

Eight study routes live in `scripts/curriculums/`, one `.mjs` and a `.md`
beside it. Each script **prints SQL and executes nothing** — the SQL is worth
reading before it runs — and `apply.mjs` is what gets it into D1:

```
npm run curriculum piano              # the live database
npm run curriculum all
npm run curriculum godot -- --dry-run # compose the SQL, execute nothing
npm run curriculum godot -- --local   # the wrangler dev database
```

**Do not apply a curriculum's SQL by hand.** A rebuild is `delete from
lessons` + re-insert, so it discards everything the dashboard wrote and the
script cannot know: completion dates, route changes, detail typed into the
editor. `apply.mjs` reads those out first and writes them back, rehearses the
SQL against a throwaway SQLite database before touching the remote, and
reports anything that exists only in the database and is about to be deleted.
Running the bare output through `wrangler d1 execute --file` throws the lot
away, which is why the generated SQL now says so in its own header.

A curriculum keeps its position across a rebuild, because the order of the
curriculums is the route through all of them.
