# Master Roachi — Project Spec

Living spec for the personal site. Updated as decisions get made.

## Who / What

Personal site for Stephan Engelbrecht ("Master Roachi") — junior full-stack web
developer & junior technical project manager at SensusAir. Combines a coding
portfolio, writing/blog, and personal hub in one place. Audience: genuinely
anyone, no specific niche targeted.

## Visual Direction

Dark & atmospheric base — near-black background, Cinzel (display) + Manrope
(body), warm gold/amber accent — with a little personality pulled from a more
eclectic direction: slight tilt/rotation on the work cards. No tag/role pills
under the hero (tried, cut). No "Selected Work" heading — the three cards
speak for themselves. Explored as a design canvas before any real code was
written.

## Site Map (multi-page)

- **Home** — hero/intro, Work cards, and Contact section. Just a nav link
  out to Thoughts (not embedded on the homepage itself).
- **Work** — portfolio
- **Thoughts** — its own dedicated page, two tracks: Tech, Theology / Apologetics
- **About** — bio
- **Contact** — dedicated section (lives on the homepage for now)

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

TBD — deliberately deferred until content was settled. Default instinct is
Nuxt/Vue/TS (what's used at SensusAir), but open to reconsidering for this
project specifically.

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
- [ ] Full page-by-page design pass (Work, Thoughts, About, Contact) once
      content above is locked — the design canvas so far only covers Home.
- [ ] Actual GitHub/LinkedIn URLs to use in Contact
