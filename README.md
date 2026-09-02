# Master Roachi

Personal site for Stephan Engelbrecht ("Master Roachi") — software engineer,
occasional writer. Built with [Next.js](https://nextjs.org) (App Router) and
React, statically exported.

See `SPEC.md` for the decision log — content, structure, visual direction, and
why each choice was made. See `DEPLOY.md` for putting it on masterroachi.com.

## Setup

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

- `npm run dev` — dev server with hot reload (drafts visible)
- `npm run build` — static export to `out/` (drafts excluded)
- `npm run preview` — serve the built `out/` directory locally
- `npm run typecheck` — TypeScript, no emit

## Structure

```
app/                    routes (App Router)
  page.tsx              home
  work/                 work index + [slug] project pages
  thoughts/             blog index + [slug] post pages
  shepherds/            game hub + devlog/[slug]
  about/  contact/      static pages
  rss.xml/route.ts      RSS feed
  sitemap.ts robots.ts  generated at build
components/             shared UI (Sigil, Nav, cards, MDX renderer)
lib/
  site.ts               contact details, nav, metadata — edit this first
  content.ts            reads content/ at build time
  format.ts             client-safe formatting helpers
content/
  projects/*.mdx        work entries
  thoughts/*.mdx        blog posts
  devlog/*.mdx          Shepherds devlog entries
```

## Writing content

Every entry is an `.mdx` file with YAML frontmatter. Add a file, and the page
and its listing appear on the next build — there is no CMS.

```yaml
---
title: The title
summary: One or two sentences, used on index pages and in the RSS feed.
date: 2026-09-02
track: tech        # thoughts only — "tech" or "theology"
draft: true        # optional
---
```

Project entries take `status` (`live`, `in-progress`, `planned`), plus optional
`link` and `stack`.

### Drafts

`draft: true` keeps an entry out of every listing — index pages, the sitemap,
and the RSS feed — and marks its page `noindex`. It still shows normally in
`npm run dev` so it can be previewed while being written.

The page itself is still generated at its URL. That is deliberate: static
export refuses to build a dynamic route that generates zero pages, so a
section with nothing published yet would otherwise break the build. Practical
consequence: **keep at least one `.mdx` file in each of `content/thoughts/`
and `content/devlog/`**, even if it is a draft.

## Before deploying

Placeholder content and unset details, all of which need attention:

- `lib/site.ts` — `contactEmail` is `null`; the contact page hides the mailto
  link until a real address is set. `socials.linkedin` is also `null`.
- `content/thoughts/example-*.mdx` and `content/devlog/example-*.mdx` are
  scaffolding, marked draft. Replace them with real writing or delete them
  (but see the note about keeping one file per collection above).
