# Design: one look for the backend, the CRM and Kame

The written spec shared by everything behind masterroachi.com that is not the public site itself:

- the backend apps (admin, learn and tools, kept in this repo);
- the CRM on clients.masterroachi.com (Sigma's);
- Kame (Omega's).

It is drawn from the public site's own source, so the source is the reference wherever this doc is silent:
- `app/globals.css`
- `components/Card.module.css`
- `components/Nav.module.css`
- `components/Starfield.tsx`

**Who rules.** Master Roachi rules. Fjord (this repo) holds the doc and referees where the products differ. A change goes here first and then into the products.

**His rulings, 11 Nov 2026:**
1. A parallax starfield, not a static one.
2. See-through cards, with the site's card hover effects.
3. A different colour per nav link, as the site's nav has, never all one colour.
4. Rounded corners, not sharp.
5. No cards inside cards.
6. State is shown by the colour of the words, not by coloured backgrounds.
7. A colour per app (his answer to "one gold or a colour per app").
8. Buttons are bordered, like the site's. No filled buttons.

## Tokens

The greys have zero chroma, as the site's do.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `oklch(12% 0 0)` | the page |
| `--bg-raised` | `oklch(16% 0 0)` | a raised surface |
| `--bg-hover` | `oklch(21% 0 0)` | a raised surface under the pointer |
| `--ink` | `oklch(97% 0 0)` | text |
| `--muted` | `oklch(66% 0 0)` | secondary text |
| `--muted-2` | `oklch(48% 0 0)` | tertiary text |
| `--line` | `oklch(26% 0 0)` | hairlines |
| `--line-bright` | `oklch(38% 0 0)` | a hairline that has to show, such as a button's |

### The app's colour: `--accent`

Each app answers in one colour, the way each section of the public site does. That colour is used for:
- the app's eyebrows;
- the primary button's border and text;
- focus rings;
- the current nav link and the selected tab;
- what needs him.

| App | `--accent` | Where it comes from |
| --- | --- | --- |
| Admin | `oklch(82% 0.16 85)` | the site's gold |
| Learn | `oklch(74% 0.15 250)` | Thoughts |
| Tools | `oklch(80% 0.12 190)` | Hire me |
| Clients (CRM) | `oklch(72% 0.26 350)` | pink, the Store's sheen (his ruling in Sigma's session, 11 Nov, relayed by Omega) |
| Kame | `oklch(97% 0 0)` | white, the site's Work sheen: monochrome like Kame's 悟 sigil (his ruling in Omega's session, 11 Nov) |

### The nav sheens: `--sheen`

Each nav link carries one, in this order, repeating if there are more links:

1. `oklch(97% 0 0)`
2. `oklch(86% 0.20 135)`
3. `oklch(84% 0.16 92)`
4. `oklch(72% 0.26 350)`
5. `oklch(74% 0.15 250)`
6. `oklch(80% 0.12 190)`
7. `oklch(76% 0.17 55)`

**A sheen is decoration and never state.**

### Meaning colours

These are a separate set, never a sheen and never an app colour. They are chosen so they can't be mistaken for the pink or orange sheens:

| Token | Value | Means |
| --- | --- | --- |
| `--ok` | `oklch(76% 0.16 155)` | done, live, paid |
| `--warn` | `oklch(82% 0.15 75)` | worth a look |
| `--bad` | `oklch(66% 0.20 25)` | late, down, refused, error |

## Type

- Archivo for everything. Use the local OFL woff2 in `app/fonts/`.
- Reggae One only for a product's wordmark, and in this repo for curriculum names.
- Headings: weight 700–800, letter-spacing `-0.03em`, line-height about 1.02.
- Labels (eyebrows): `0.7rem`, weight 600, letter-spacing `0.2em`, uppercase.
- Body text: the site's `--step-body`. Secondary text is `--muted`.

## Background

- **Density 0.55** of the site's star counts, in all three (ruled 11 Nov: the CRM had 0.25, the backend 0.35, Kame 0.55).
- The site's Starfield is fixed behind the whole page:
  - four layers with drift and pointer parallax;
  - about 9% warm stars;
  - the soft warm radial wash under it.
- It draws at about 30 fps.
- It pauses when the tab is hidden.
- It is still under `prefers-reduced-motion`.
- **The drift stops after about a minute with no pointer movement or scroll**, and starts again on input.
- A shell that never scrolls gets only the pointer parallax. That is expected.

## Surfaces

### Card, two kinds

**`.panel`** holds things: a form, a table, a list.
- background `oklch(16% 0 0 / 0.84)`
- `1px solid var(--line)`
- radius 16px
- It does not move on hover.

**`.card-link`** is a card that is itself a link or a button. On hover it does what the site's `Card.module.css` does:
- the border takes the card's `--accent-a`, or `--accent` where none is set;
- the background goes to `oklch(18% 0 0 / 0.92)`;
- shadow `0 18px 50px oklch(0% 0 0 / 0.5)` plus a 1px ring of the accent at 22%;
- a radial light that follows the cursor, in `::before`;
- a small perspective tilt of at most 5°, with none under reduced motion.

Only `.card-link` gets these effects.

### Overlays

A dropdown, a sheet or a dialog lies over the page rather than beside it. It uses `oklch(16% 0 0 / 0.92)` with `backdrop-filter: blur(12px)`, a `1px solid var(--line-bright)` edge and 16px corners. A sheet from the bottom of a phone has 22px top corners and a grab handle. Ruled 11 Nov.

### No cards inside cards

Inside a card, items are rows separated by a 1px `--line` hairline or by space. Never use another bordered or filled box.

### Corners

- Cards: 16px.
- Buttons, inputs, selects and chips: 10px.
- Small marks: 6px.
- Round controls: 50%.

### No side stripes

- No one-sided border or inset edge as an accent.
- A hairline all round is fine.
- A hairline between rows is fine.

### No visible scrollbars

Panes scroll with the wheel, the trackpad and the keyboard, and show no bar.

## State

Selected, active, current, held, needs-you and error all change the **text colour**, with at most a border or an underline. Never a tinted fill.

| State | How it shows |
| --- | --- |
| Current nav link, selected tab | text in its sheen or `--accent`, with an underline |
| Selected row | text in `--accent`, plus a hairline all round in the accent |
| Needs you | text in `--accent` |
| Late or error | text in `--bad` |
| Counts and status pills | coloured text, no background. A pill may have a 1px border in the same colour. |

## Controls

**Buttons** are the site's `.button`:
- bordered;
- spaced capitals: `0.75rem`, weight 600, letter-spacing `0.12em`;
- radius 10px.

**Hover** turns the text and the border `--accent`, never the background (ruled 11 Nov: the CRM went to `--ink`, the backend and Kame to `--accent`). The primary, already in `--accent`, lightens to `color-mix(in oklch, var(--accent) 70%, white)`.

**The primary button** (one per view) has its border and text in `--accent`. It is never filled.

**Quiet buttons** are muted text, turning `--ink` on hover.

**Inputs** are a dark well, `oklch(10% 0 0 / 0.7)`, with a `--line` hairline that takes the `--accent` on focus. Radius 10px.

**Focus** is always visible: `2px solid var(--accent)`, offset 2px.

## Nav

- Text only. Never a pill or a background behind a link.
- Each link sets `--sheen` from the list above.
- On hover and when current, the lettering takes the site's radial sheen: `background-clip: text` with a 90px radial at the pointer, from `color-mix(sheen 55%, white)` through the sheen to `color-mix(sheen 72%, black)`.
- Outside a supporting browser, the link is simply coloured in its sheen.

## The frame (rulings, 11 Nov, second pass)

These rulings close the small differences between the three products. Measurements are exact; copy them.

### Sidebar (from 900px)

- **Size and surface.**
  - 232px wide; padding `1.1rem 0.9rem 1rem`.
  - Background `color-mix(in oklch, var(--bg) 78%, transparent)` with `backdrop-filter: blur(12px)`.
  - A hairline on its right, as a shadow: `box-shadow: 1px 0 0 color-mix(in oklch, var(--line) 60%, transparent)`.
- **Brand block, at the top.**
  - The product's own mark, 30px tall, its width its own. All but Kame's are drawn in the lantern's line-art style, each with its one touch of colour in the app's accent (his picks, 11 Nov):
    - Admin: a ring of keys, a gold Orthodox cross on one key.
    - Learn: an open book with a candle, its flame blue.
    - Tools: a hand drawing an arc with a compass, the arc teal.
    - Clients: the lantern, its flame pink.
    - Kame: the 悟 sigil, as it was.
  - The mark is a transparent cut-out of the light lines only. The same mark leads the phone top bar. The app's icon (manifest, home screen, tab) is the same drawing on solid `#060606`.
  - Beside it, the product's own name in Reggae One, `1.15rem`, `--ink`: Admin, Learn, Tools, Clients or Kame.
  - Under the name, a `0.8rem` `--muted` line reading **Master Roachi ↗**, linking to masterroachi.com. It turns `--accent` on hover.
  - Nothing else: no extra eyebrow repeating the app's name.
- **Nav links.**
  - Rows 38px tall, padding `0 0.6rem`, `0.9rem` at weight 500, `--muted`.
  - Each link has its `--sheen` (see Nav).
  - The current link is in its sheen, weight 600, with a 2px underline offset 6px.
  - Groups are split by a `--line` hairline with `0.5rem` of space either side.
- **Counts:** coloured numbers, right-aligned, `0.8rem`, weight 700, tabular. `--accent` for waiting, `--bad` for late. No ring and no pill.
- **One primary action** may sit under the nav: a full-width bordered primary (e.g. "+ Add a business").
- **The foot** is pushed down with `margin-top: auto`, with a `--line` hairline above it. What sits there is the product's own: the other apps, a sync state, a streak. A status line is an 8px dot and `0.8rem` `--muted` text.

### Page head (from 900px)

- Max-width 1180px; padding `2.2rem 2rem 1.4rem`.
- **On the left, stacked top to bottom:**
  1. An eyebrow with the product's name in `--accent`. No icon above it (ruled 11 Nov, third look).
  2. The title: weight 800, `clamp(2.25rem, 3.6vw, 3rem)`, letter-spacing `-0.03em`, `--ink`.
  3. One line under the title at `1.05rem`, `--muted`.
- **The "N need you now" line** is in `--accent`. Use `--bad` only when the line itself names something broken.
- **The date** is on the right, as an eyebrow in `--muted-2`, written "Wednesday 11 November".
- A search bar may come first, above the head, as its own row.
- A focus screen (Kame's Now) may centre the head; it keeps the same type.

### Tiles

- A grid of `repeat(auto-fit, minmax(150px, 1fr))` with a gap of `0.6rem`.
- Padding `1rem 1.15rem 1.1rem`.
- **Label:** an eyebrow (`0.66rem`, weight 600, `0.2em`, uppercase, `--muted`) after an 8px dot. The dot is `--accent` for needs you, `--bad`, `--ok`, or `--line-bright` for nothing.
- **Value:** `2.25rem`, weight 800, `-0.03em`, tabular. It is coloured only for state.
- **Line under the value:** `0.8rem`, `--muted`.

### Panels and rows

- **Panel:** padding `1.1rem 1.15rem 1.2rem`.
- **Panel head:** an eyebrow (`0.7rem`) with an optional note on the right at `0.8rem`, normal case, `--muted`.
- **Columns:** `minmax(0, 1.6fr) minmax(0, 1fr)` from 1100px, with a gap of `1rem`.
- **Row:**
  - padding `0.75rem 0.25rem`, with an 8px dot on the left;
  - title at weight 600, `--ink`;
  - the line under it at `0.85rem`, `--muted`;
  - the note on the right at `0.85rem`.
- **Round icon button** (snooze, done): 36px, `1px solid var(--line-bright)`, 50% radius. On hover its border and icon turn `--accent`.
- **Dates** in rows are written "09 Nov", or "Sat, 07 Nov" with the weekday.

### Phone (under 900px)

- **The frames differ on purpose.**
  - The backend keeps its title-that-opens-the-doors header and nothing fixed at the foot (his pick, 10 Nov). Cards and the Sketchpad need the full height.
  - The CRM and Kame keep their bottom tab bars.
- **The top bar starts with the product's mark.**
- **A bottom tab** is an icon and a label at `0.7rem`. The current tab is in `--accent`, with no fill.

## In this repo

- `app/work/ui.module.css` holds the backend's building blocks.
- `app/work/WorkShell.tsx` sets the app's `--accent`, mounts the starfield, and runs the `.card-link` pointer light.
- `components/WorkHeader.tsx` holds the sidebar and the page title.
