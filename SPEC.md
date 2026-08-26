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

**Single page.** Reversed from the earlier multi-page decision after seeing
it mocked up — with this little content (two Work cards, a one-paragraph
bio), three separate page-loads felt sparse; one scroll reads as complete.
Sections, in order: Hero, Work, About, Contact. Footer.
- Nav is now anchor-links (#work, #about, #contact), not routes.
- No nav link to Thoughts — it's parked, and a dead link is worse than no
  link. Add it back if/when Thoughts actually ships.
- If Work ever grows into a real list of many projects, split it back into
  its own page then — not a problem to solve now.
- Thoughts, if it ever ships, would still be its own page regardless (a blog
  needs individual post pages either way).

## Content Decisions

### Work
- Exactly TWO cards on this page, nothing more:
  1. "Odin Project" — one card linking out to the existing GitHub repo hub:
     github.com/MasterRoachi/odin-projects (it already has its own index.html
     linking all 8 exercises — no individual projects get their own card
     here, the hub covers that).
  2. "Shepherds We Shall Be" — dimmed "coming soon" teaser. Terrath is
     excluded entirely for now — no mention.

### About
- Voice: casual first-person, plain and factual — not flowery.
- Approved bio draft:
  > My name is Stephan Engelbrecht. I go by Master Roachi. I'm a software
  > engineer, and outside of that I write — mostly about code, sometimes
  > about theology.
- Scope: software + writing only. No mention of the game or tutoring here —
  the Work page teaser is the only hint of anything else going on.
- Employer (SensusAir) is never named directly anywhere on the site — it's
  discoverable via the LinkedIn link if someone wants it, not stated outright.

### Thoughts
- PARKED (as of this session) — may not launch with this section at all,
  decide later. If it does happen: two visible tracks, Tech and
  Theology / Apologetics. No pressure to seed it with posts before launch.

### Contact
- Dedicated section (not just footer links). Possibly doubles as a tutoring
  inquiry point.
- Contact method: email, plus social links (GitHub, LinkedIn).

## Tech Stack

**Decided: Astro, with Vue components for anything genuinely interactive.**

Reasoning:
- Content collections (typed markdown/MDX) fit future growth perfectly — a
  devlog for Shepherds We Shall Be, Terrath lore pages, or Thoughts (if it
  ever ships) are each just a new collection, not a restructure.
- Ships ~zero JS by default, hydrates only the islands that need it — fast
  by default, and choosing what's static vs. interactive is itself a signal
  of engineering judgment worth showing on a portfolio.
- Reuses real Vue/TypeScript knowledge from SensusAir while picking up a
  currently-relevant tool, rather than just reaching for Nuxt out of habit.
- Explicitly chosen over Nuxt (same result, more framework overhead than
  this site needs) and over plain HTML/CSS/JS (would mean hand-rolling a
  markdown pipeline whenever a blog/devlog eventually happens).

Style references given (also informing this decision):
- tamalsen.dev — WordPress + Slider Revolution plugin. Sticky nav, filterable
  project gallery, testimonials carousel. Not a relevant stack reference
  (WordPress), but the info architecture (expertise / work / experience /
  contact) is a useful shape reference.
- lars-olson.com — designer/game-dev portfolio, personality-forward, playful
  tone ("never take myself too seriously"). Stack undetermined from a fetch.
- ryanritzenthaler.com — Next.js + Tailwind CSS. Minimalist black/white,
  high-contrast, card/list toggle for a large work gallery.
- bepatrickdavid.com — self-described minimal/brutalist. Black theme, premium
  custom type (Neue Montreal, Migra, Maelstrom, Tusker Grotesk), WebGL 3D
  model via Sketchfab. Stack undetermined from a fetch, likely a custom
  React/JS build given the production values.

## Open Items

- [ ] Decide whether Thoughts ships at all; if so, first post topics
- [ ] Actual contact email/handle
- [ ] Domain name / hosting
- [ ] Tech stack decision
- [x] Design settled well enough to move to real code (see "Status" below).
- [ ] Swap the sigil mark for an Orthodox cross — noted, deliberately later.
- [ ] Actual GitHub/LinkedIn URLs to use in Contact
- [ ] Real contact email address
- [ ] Still unresolved: hero tagline says "Code by trade, worlds by nature" —
      a soft nod to worldbuilding/Terrath, which is supposed to stay
      unmentioned for now. Flagged, not yet decided whether to change it.
- [ ] Domain name / hosting


## Status

Real code has started. `package.json`, `astro.config.mjs`, `tsconfig.json`,
`src/components/Sigil.astro`, `src/components/Divider.astro`, and
`src/pages/index.astro` are written and committed — the homepage, built for
real from the finalized mockup (same sigil motif, grain, glows, colors,
copy).

**To actually run it: `npm install` then `npm run dev`, from a normal
terminal on this machine** — not through the Claude device bridge. That
sandboxed shell has no access to the npm registry (confirmed: both `npm
ping` and `npm install` came back 403 Forbidden), so package installation
has to happen from a real terminal with normal internet access. Once
`node_modules` exists, further edits can go back to happening through the
bridge as usual.
