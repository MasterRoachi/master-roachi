# Master Roachi — Project Spec

Living spec for the personal site. Updated as decisions get made.

## Who / What

Personal site for Stephan Engelbrecht ("Master Roachi") — junior full-stack web
developer & junior technical project manager at SensusAir. Combines a coding
portfolio, writing/blog, and personal hub in one place. Audience: genuinely
anyone, no specific niche targeted.

## Visual Direction

Dark & atmospheric base — near-black background, Cinzel (display) + Manrope
(body), warm gold/amber accent, plus a second teal-blue accent (same
chroma/lightness, different hue) used for "coming soon" / future things vs.
gold for real, live work. No tag/role pills under the hero (tried, cut).

v1 read as "boring" once mocked up — too flat, too dead-center-symmetric.
v2 fixes that with:
- A recurring sigil (a small diamond/compass mark, hand-drawn as inline SVG)
  used in the nav, as a large faint watermark behind the hero, as small
  corner accents on the work cards, and as a section-divider motif —
  a consistent personal mark instead of generic dividers.
- A subtle grain texture over the whole page, and layered, asymmetric
  radial glows (gold + teal) at different points down the scroll, so
  atmosphere carries through past the hero instead of stopping there.
- Broke the dead-center symmetry: Work cards are offset/staggered, not a
  flat even grid; About is a two-column layout (sigil + bio) instead of a
  centered block.

Explored as a design canvas before any real code was written.

## Site Map (multi-page)

**Multi-page.** Reversed again — the single-page version was right for two
Work cards and a one-paragraph bio, but the site now carries a blog with two
tracks, per-project pages, and a game devlog. That does not fit one scroll.

Routes:
- `/` — hero, three most recent projects, bio, three most recent posts
- `/work` — all projects; `/work/<slug>` per project
- `/thoughts` — blog index, filterable by track; `/thoughts/<slug>` per post
- `/shepherds` — game hub and devlog index; `/shepherds/devlog/<slug>`
- `/about`, `/contact`
- `/rss.xml`, `/sitemap.xml`, `/robots.txt`

Nav is real routes again, not anchor links. Thoughts now has a nav entry — the
earlier "no dead links" rule is satisfied because the section exists and
builds; it is simply empty until there are published posts.

## Content Decisions

### Work
- Now a real collection rather than exactly two cards. Currently three
  entries: the Odin Project hub, Shepherds We Shall Be (planned), and this
  site.
- Gold = live and shipped, teal = still ahead. A `planned` project renders as
  a non-clickable card, since there is nothing to link to yet.
- Terrath remains excluded entirely — no mention anywhere.

### About
- Voice: casual first-person, plain and factual — not flowery.
- Approved bio, used verbatim on both `/` and `/about`:
  > My name is Stephan Engelbrecht. I go by Master Roachi. I'm a software
  > engineer, and outside of that I write — mostly about code, sometimes
  > about theology.
- Expanded with a "What I work with" list. Scope still software + writing
  only.
- Employer (SensusAir) is still never named anywhere on the site — verified
  against the build output.

### Thoughts
- **Unparked and shipped as a section.** Two tracks, Tech and Theology, with
  client-side filtering on the index.
- No real posts yet. The two files in `content/thoughts/` are clearly-labelled
  scaffolding marked `draft: true`, and do not appear on the deployed site.

### Contact
- Its own page. Email plus social links.
- Address is `roachi@masterroachi.com`, forwarded to a personal inbox by
  Cloudflare Email Routing — a forwarding address, not a mailbox.
- The page still degrades safely: if `contactEmail` is ever set back to null it
  hides the mailto rather than rendering a placeholder, which is what the Astro
  build did with a literal `[YOUR@EMAIL]` link that looked live and went nowhere.
- LinkedIn is still unset, and its link stays hidden until it is.

## Tech Stack

**Decided: Next.js (App Router) + React, statically exported.**

Superseded the earlier Astro decision. The reasoning for Astro — content
collections, near-zero JS, judgment about what hydrates — still held, but the
brief changed to "React, and far more comprehensive", and Next covers the same
ground with React as the component model.

- Static export (`output: 'export'`) to `out/`. No server runtime, nothing to
  patch, and it drops straight onto Cloudflare Pages.
- Content is MDX on disk read at build time through `lib/content.ts` — same
  shape as Astro's content collections, no CMS or database.
- Fonts are self-hosted via `next/font`, replacing the render-blocking
  Google Fonts stylesheet the Astro build linked.
- The only client component is the navigation. Everything else is a server
  component and ships no JS.

Rejected: plain React SPA (weak SEO, hand-rolled markdown pipeline) and
React Native / `react-native-web`, which was the original request — it targets
native apps, and on the web costs SEO, bundle size, and the MDX pipeline this
site is built around.

## Visual Direction — carried over, with fixes

The v2 design holds: recurring sigil, grain, layered gold/teal glows,
Cinzel + Manrope, broken symmetry. Three defects from the Astro build were
fixed rather than ported:

- **Responsive.** The Astro version had two media queries, both only flipping
  a grid column count. A fixed 72px gutter and unscaled display type carried
  down to 375px, clipping "CONTACT" off the nav and rendering the bio two or
  three words per line. Replaced with a shared `--pad` token and a fluid type
  scale; the nav collapses to a toggle below 820px.
- **Glow positioning.** Glows were absolutely positioned at hard-coded scroll
  offsets, so the last one extended the document 190px past the footer into
  dead scroll space, and the offsets only lined up at one viewport width. They
  now live in a fixed, clipped layer that cannot affect document height.
- **Horizontal overflow.** `overflow-x: hidden` was on `body` alone, which does
  not stop the root element panning sideways. Now on both.

## Open Items

- [x] Tech stack decision — Next.js + React, static export
- [x] Domain name / hosting — masterroachi.com (registered at domains.co.za),
      hosted on Cloudflare Pages. See DEPLOY.md.
- [x] Whether Thoughts ships — yes, the section is built
- [x] Real contact email address — roachi@masterroachi.com, forwarded to a
      personal inbox by Cloudflare Email Routing. The old domains.co.za
      mailboxes were stale and were abandoned rather than migrated
- [ ] **Real LinkedIn URL** — `lib/site.ts` `socials.linkedin` is null
- [ ] **Actual writing.** Thoughts and the devlog have scaffolding only
- [ ] Swap the sigil for an Orthodox cross — noted, deliberately later. Every
      use goes through `components/Sigil.tsx`, so it is a one-file change
- [ ] Still unresolved: the hero tagline "Code by trade, worlds by nature" is
      a soft nod to worldbuilding/Terrath, which is meant to stay unmentioned.
      Carried over unchanged; still flagged, still undecided
- [ ] First post topics for each track

## Status

Rewritten from Astro to Next.js. Builds clean: 17 static pages, `npm run build`
→ `out/`. Verified at 375px and desktop; no horizontal overflow, no dead
scroll space, nav usable on mobile.

Not yet deployed — the GitHub repo has not been created and the nameservers
have not been changed. DEPLOY.md has the steps.
