# Godot

Built by `scripts/curriculums/godot.mjs`. 10 stages, 92 lessons.

## Why this one starts at zero

Shepherds and Cultus hold roughly 143,000 lines of GDScript between them —
535 script files and 114,394 lines in Shepherds, 68 files and about 29,000 in
Cultus, across 82 scenes, 205 resources and 10 shaders, on Godot 4.7 with the
Compatibility renderer.

**Master Roachi wrote none of it. I did.** So none of that is evidence of what
he knows, and the obvious shape for this curriculum — "skip the basics, go
straight to the gaps" — was wrong. I drafted it that way first and it was
built on a false premise.

What the codebase *is* is the finish line. It is a real, large, working Godot
project he owns and cannot yet read. That makes this an ordinary beginner
curriculum with an unusually distant end point: by stage 10 there should be
nothing those 143,000 lines do that has not been met deliberately.

## Shape

Ordered so no lesson depends on a later one.

| Stage | Lessons | What it is for |
|---|---|---|
| 1 · The editor | 8 | The tool itself, before any code. Includes the remote Scene tree, which most people never find. |
| 2 · Scenes and nodes | 8 | The one idea the whole engine is built on, including reading a `.tscn` as text. |
| 3 · GDScript | 12 | The language properly, with static typing from the first lesson rather than retrofitted. |
| 4 · 2D and movement | 10 | The node toolbox: bodies, shapes, areas, input, and movement that feels right. |
| 5 · Signals and structure | 8 | How two objects talk, and the one structural rule — call down, signal up. |
| 6 · Animation | 10 | `AnimationPlayer` through `AnimationTree` state machines to `Tween`. |
| 7 · Data and resources | 8 | Where the numbers live. Custom `Resource` classes, `.tres`, saving, `@tool`. |
| 8 · Worlds | 8 | `TileMapLayer`, terrains, per-tile data, and navigation. |
| 9 · Interface and camera | 8 | `Control`, containers, themes, and the pixel-art stretch settings. |
| 10 · Looking good, and shipping | 12 | Shaders, lights, particles, audio, profiling, and export. |

## Every lesson carries its substance

A lesson name is a label, not a lesson. "CharacterBody2D and move_and_slide"
says what to look up; it does not say that `motion_mode` must be **Floating**
for a top-down game, that `velocity` is in pixels per second, or that
`move_and_slide()` applies `delta` itself and takes no argument.

So every one of the 92 lessons has a `detail` written with it — the menu path,
the exact property name, the hotkey, the number, and the trap. Roughly 107,000
characters of it, in `godot-detail.json` rather than in the script, because
the prose is full of GDScript and a single unescaped backtick inside a
template literal would break the build.

## Standing decisions baked into the detail

These are stated once in the lessons and then assumed throughout:

- **Compatibility renderer.** Right for 2D, runs anywhere, exports to the web.
- **Static typing everywhere.** `var x = 5` with no annotation should feel wrong.
- **Nearest-neighbour filtering, project-wide**, and `snap_2d_transforms_to_pixel` on.
- **`viewport` stretch mode with `integer` scaling** for pixel art.
- **`_unhandled_input` for gameplay**, so the UI gets first refusal on every event.
- **Call down, signal up.** No `get_parent()`, no `$"../../Thing"`.
- **Numbers live in `@export` or a `Resource`**, never in the script body.
- **`queue_free()`, never `free()`.**

## Known thin spots

- **No 3D at all.** Deliberate: both games are 2D, and 3D would double the
  curriculum to teach nothing either project needs.
- **No multiplayer.** Same reason.
- **No C#.** GDScript throughout; the standard editor build, not .NET.
- **Normal maps for 2D lighting** are mentioned honestly as a large time
  investment rather than recommended.
- **`EditorPlugin`** gets a paragraph inside the `@tool` lesson rather than
  lessons of its own. It is worth knowing exists; it is rarely the answer.
