---
title: Aseprite and Pixel Art — Learning Path
written: 2026-10-09
---

# Aseprite and Pixel Art — Learning Path

## Goal

Produce a Shepherds asset that passes its own art contract, unassisted.

That is a deliberately narrow goal and it is the right one. "Learn pixel art"
has no finish line; `design/art-and-animation.md` has §10.1, and an asset
either satisfies it or does not — three or four purposeful values per material,
a dark *coloured* one-pixel outline, key light from the upper-left, identity
surviving solid black and greyscale, 112 × 112 at pivot (56, 96), eight
authored directions with no mirroring.

## Where this came from

Designed, but not invented. There is no pixel art curriculum on the machine
and no pixel art book in the library, so the structure is mine — but every
standard it teaches is quoted from Shepherds' own documents:

| Document | What it fixes |
| --- | --- |
| `design/art-and-animation.md` §2 | three-quarter top-down, warm and weathered, silhouette over detail |
| §3.1 | where masters live, `<asset-key>_<action>_<direction>.aseprite`, one tag per file |
| §4 | 960 × 540 viewport, 112 × 112 frame, pivot (56, 96), ~80 px adult |
| §5.1–5.2 | 24-frame idle at 12 fps, 12-frame run, eight directions, no mirroring |
| §5.3 | one-shot tags begin with `_`; loops versus one-shots |
| §10.1 | values per material, outlines, key light, readability, colour counts |
| §10.2 | an asset brief before drawing anything |
| `design/colour-palette.md` | the palette and its ramps |

So the curriculum is in two threads that converge: **the tool**, which is
learnable in a week, and **the craft**, which is not.

## Two things, not one

Aseprite is a small program and the whole of it can be learned deliberately in
a few sittings — stage 1 exists to get that out of the way rather than
absorbing it accidentally over a year of bad habits.

Everything after stage 1 is pixel art, which the tool does not teach. Drawing
at 1× with deliberate clusters, deciding four values for a material, keeping a
silhouette readable in black — none of that is a menu item.

## What is not here

No pixel art book is on the machine. These are the references worth having and
none of them is required by the path:

- **Pixel Logic** (Michafrar) — the closest thing to a textbook for this
- **Slynyrd** (slynyrd.com) — the best free writing on pixel art palettes,
  lighting and tiles
- **Pedro Medeiros** (saint11.org) — short, precise technique cards
- **Aseprite's own docs** (aseprite.org/docs) — for stage 1

Eastward and Sea of Stars are named in §2 as references for composition and
value organisation. They are the study material for stage 8, and §2 is explicit
that they are references and not templates — individual designs are not copied.

## The stages

1. **The tool** — all of Aseprite, once, deliberately.
2. **The pixel** — clusters, lines, curves, and the discipline of working at 1×.
3. **Value and light** — three or four values per material, key light
   upper-left, and the two readability tests that decide whether a sprite works.
4. **Colour and the palette** — the Terrath palette, hue-shifted shadows, the
   coloured outline, and the colour-count ranges in §10.1.
5. **The sprite, standing still** — a prop, then a character, then the same
   character in eight authored directions.
6. **The sprite, moving** — the approved 24-frame idle and 12-frame run, then a
   one-shot action with real gameplay timing.
7. **Into the game** — file layout, naming, tags, Aseprite Wizard, and checking
   it in Godot at native scale under `Light2D`.
8. **Production** — the open art work in §11, which is the real test: the sheep
   that are still grey boxes, the placeholder menu window, the greybox terrain.

## References

- `design/art-and-animation.md` and `design/colour-palette.md` in Shepherds
- `media/reference/Animation/README.md` — the per-direction idle variations
- `media/README.md` — the one-master rule
