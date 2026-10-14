---
title: Godot — Learning Path
route: the editor first, then the one idea, then the language, then everything it draws
written: 2026-10-09
rewritten: 2026-10-14
---

# Godot

Built by `scripts/curriculums/godot.mjs`. **13 stages, 292 lessons, 462 lesson sources. Complete — every stage written, 14 October 2026.**

## Why this one starts at zero

The three Godot projects in `the-world-of-terrath/products/` hold **672 script
files and 163,533 lines of GDScript**, across 88 scenes and 12 shaders, all on
**Godot 4.7 with the GL Compatibility renderer**:

| Project | Scripts | Lines | Scenes | Shaders |
| --- | --- | --- | --- | --- |
| `shepherds-we-shall-be` | 535 | 114,394 | 82 | 10 |
| `cultus-botanicus` | 68 | 29,000 | 3 | 0 |
| `the-lost-sheep` | 69 | 20,139 | 3 | 2 |

**Master Roachi wrote none of it. I did.** So none of it is evidence of what he
knows, and the obvious shape for this curriculum — "skip the basics, go straight
to the gaps" — was wrong. It was drafted that way first and it was built on a
false premise.

What the codebase *is* is the finish line. It is three real, working Godot
projects he owns and cannot yet read. That makes this an ordinary beginner
curriculum with an unusually distant end point: **by the end there should be
nothing those 163,533 lines do that has not been met deliberately.**

## What this rewrite changes

The first version (2026-10-09) had 92 lessons averaging **1,162 characters** —
accurate, dense notes carrying the menu path, the property name, the hotkey and
the trap. Good notes, and not lessons. Measured against the three curriculums
finished since:

| | Lessons | Mean chars | Practice | Tables |
| --- | --- | --- | --- | --- |
| Japanese | 382 | 1,469 | 382/382 | 369 |
| Piano | 284 | 2,299 | 284/284 | 227 |
| Greek | 417 | 2,973 | 416/417 | 1,395 |
| **Godot, before** | **92** | **1,162** | **0/92** | **0** |

**Nothing directed practice on any of the 92**, which is half of his standing
ruling — *teach the point in full and then direct practice*. There were also no
per-lesson sources, no curriculum source list and no cards.

**His four rulings for the rewrite** (2026-10-14):

**1. Expand the structure, not just the depth.** The ten stages are a sound
argument and are kept; lessons are added inside them, and every lesson is
rewritten to full depth with tables, worked GDScript and a Practice line.

**2. Everything — 3D, multiplayer and C# too.** The first version left all three
out on the grounds that every project is 2D GDScript. Overruled: *zero to
mastery* is taken literally, so three stages are added for the parts of the
engine none of his projects use.

**3. No card deck.** Alone among the curriculums. The editor's own help is one
keystroke away (**F1**) and the practice is building things, so a deck would be
busywork beside the projects.

**4. Teach from his own code.** Where a lesson needs a real example, it reads the
actual code in one of the three projects, by named file and named function.

## The shape

Ordered so no lesson depends on a later one.

| # | Stage | Was | Written | What it is for |
| --- | --- | --- | --- | --- |
| 1 | The editor | 8 | 18 | The tool itself, before any code. The docks, the remote Scene tree, the debugger, the F-keys, and the **Asset Store** that replaced the Asset Library in 4.7. |
| 2 | Scenes and nodes | 8 | 20 | The one idea the whole engine is built on. Instancing, inheritance, groups, autoloads, and reading a `.tscn` as text. |
| 3 | GDScript | 12 | 32 | The language properly, with static typing from the first lesson rather than retrofitted. |
| 4 | 2D and movement | 10 | 28 | The node toolbox: bodies, shapes, areas, collision layers, input, state machines, and movement that feels right. |
| 5 | Signals and structure | 8 | 20 | How two objects talk, and the structural rule — call down, signal up — against his five production layers. |
| 6 | Animation | 10 | 24 | `AnimationPlayer` through `AnimationTree` state machines to `Tween`, and the Aseprite import pipeline. |
| 7 | Data and resources | 8 | 22 | Where the numbers live. Custom `Resource` classes, `.tres`, saving, `@tool`. |
| 8 | Worlds | 8 | 20 | `TileMapLayer`, terrains, per-tile data, navigation and pathfinding. |
| 9 | Interface and camera | 8 | 22 | `Control`, containers, themes, and the stretch-and-scale problem in full. |
| 10 | Looking good, shipping, and testing | 12 | 26 | Shaders, lights, particles, audio, profiling, export — and testing, which the first version left out entirely. |
| 11 | 3D, from zero | — | 26 | Added by ruling 2. `Node3D`, cameras, lights, meshes, materials, 3D physics, and what differs from 2D. |
| 12 | Multiplayer | — | 18 | Added by ruling 2. `MultiplayerAPI`, `MultiplayerSynchronizer`, RPCs, authority, and why none of his games need it. |
| 13 | C# and .NET | — | 16 | Added by ruling 2. The .NET build, the C# API, interop with GDScript, and when it is worth it. |
| | **Total** | **92** | **292** | |

**Stages 11 to 13 serve completeness rather than his projects**, and say so in
their own opening lessons. They are last for that reason.

**Testing joins stage 10** rather than taking a stage of its own, because
shipping is where it belongs and because he approved ten stages plus three.

### What the later stages ended up containing

- **Stage 9** closes with three lessons reading real interfaces: `ViewportSizer`
  in full, the `top_bar.gd` from *The Lost Sheep* end to end, and the polling
  exception it documents. The stretch-and-scale problem gets five lessons,
  because the project settings cannot express the arrangement his own game uses
  and the reasoning is the valuable part.
- **Stage 10** adds *Reading a real shader* for `sway.gdshader`, and four
  testing lessons: the `extends SceneTree` harness, reading the 188-test and
  26-check suites, the parallel runner, testing an interface through
  `what_it_says()`, and determinism through `simulate.py` and `replay.py`.
- **Stage 11** teaches 3D as understanding rather than a change of plan, says so
  in its first lesson, and ends by reading `orb_view_3d.gd` — a complete 3D
  scene built in code inside a 2D game's HUD.
- **Stage 12** spends its first lesson on whether to build multiplayer at all,
  and its last on the split-screen that is actually worth building. The decision
  for all three of his projects is recorded as no.
- **Stage 13** ends the same way: the five questions, the decision table, and the
  fourth option his own `simulate.py` already takes — move the heavy work out of
  the engine entirely.

## Teaching from his own code

The convention, by ruling 4: a lesson that needs a real example names the
**project, the path and the symbol** — never a line number.

> … which is why `shepherds-we-shall-be/game/scripts/presentation/pixel_perfect_viewport.gd`
> computes `viewport_for()` as a **static** function. Open it and find out why it
> has to be callable without a window.

**The staleness risk is real and mitigated three ways.** Paths move and functions
get renamed, so: nothing cites a line number; every citation says what it is
looking for, so a moved symbol is still findable; and the citation is always an
illustration of a point the lesson has already taught in full, never the only
place the point is made. A stale citation costs a reader thirty seconds, not the
lesson.

**What makes it worth the risk** is that the codebase is documented to a degree
that is genuinely unusual — the comments carry the reasoning, the rejected
alternatives and the dates, and in several places his own words. The viewport
file above records four failed attempts and quotes him: *"the window doesnt show
more, everything just zooms"*. No invented example teaches as well as that.

**His five production layers**, from `design/production-architecture.md`, are the
spine of stage 5:

| Layer | What belongs there |
| --- | --- |
| **Definitions** | schemas, IDs, `Resource` classes, loaders |
| **Gameplay** | actor-local simulation |
| **Orchestration** | multi-actor and persistent state |
| **Presentation** | display and sound |
| **Content** | act-specific assembly |

## Standing decisions baked into the detail

Stated once in the lessons and then assumed throughout. **Every one verified
against `shepherds-we-shall-be/project.godot` on 2026-10-14.**

- **GL Compatibility renderer.** `renderer/rendering_method="gl_compatibility"`.
  Right for 2D, runs anywhere, exports to the web.
- **Static typing everywhere.** `var x = 5` with no annotation should feel wrong.
- **`viewport` stretch mode with `integer` scaling**, at **960×540** with a
  1920×1080 window override.
- **`_unhandled_input` for gameplay**, so the UI gets first refusal on every event.
- **Call down, signal up.** No `get_parent()`, no `$"../../Thing"`.
- **Numbers live in `@export` or a `Resource`**, never in the script body.
- **`queue_free()`, never `free()`.**

**One standing decision was wrong and is removed.** The first version claimed
*"nearest-neighbour filtering, project-wide, and `snap_2d_transforms_to_pixel`
on"*. Neither is set in the real project — its `[rendering]` section is empty.
Shepherds solves pixel-perfection a different way, and the right way: a 960×540
viewport with integer scaling, plus a `ViewportSizer` autoload that sets
`content_scale_size` at runtime. **At an integer scale off a low-res viewport,
every game pixel already lands on a whole screen pixel**, so snapping and a
project-wide filter override are solving a problem that no longer exists. Stage 9
teaches both approaches and says which one his projects use.

**And one unusual decision of his codebase that stage 10 teaches as it is**:
there is **no test framework** — no GUT, no GdUnit4. Every test is
`extends SceneTree`, which *is* the main loop, so two cannot share a process;
`tools/run_tests.sh` therefore boots about 120 Godot processes, eight at a time,
after his *"this suite takes forever man"*. It is a real answer to a real
constraint and worth a lesson.

## The resources

Free, all of them.

| Role | Resource |
| --- | --- |
| **The authority** | **The official manual and class reference** (docs.godotengine.org) — and **F1** inside the editor opens the same reference offline |
| **The language, interactively** | **GDQuest — Learn GDScript From Zero**: free, open source, 27 lessons with exercises and quizzes, runs inside Godot |
| **Recipes** | **KidsCanCode — Godot Recipes**: short, self-contained solutions for movement, physics, UI, shaders and common patterns |
| **Video, beginner** | **Brackeys'** Godot series, and **GodotGameLab** |
| **Video, deeper** | **HeartBeast**, and **GDQuest's** free material |
| **Shaders** | **godotshaders.com** — a free library, readable as worked examples |
| **Placeholder art** | **Kenney.nl** — free, CC0, so a lesson never stalls for want of a sprite |
| **The finish line** | **His own three projects**, per ruling 4 |

## No deck

His ruling, and the only curriculum without one. The engine's own class
reference is a keystroke away, the practice is building things, and nine of the
other curriculums' decks exist because recall genuinely is the bottleneck in a
language or an instrument. Here it is not.

## Known thin spots

- **No 3D, multiplayer or C# — overturned.** All three are now stages 11 to 13.
- **Normal maps for 2D lighting** are named honestly as a large time investment
  rather than recommended.
- **`EditorPlugin`** gets a section inside the `@tool` lesson rather than lessons
  of its own. It is worth knowing exists; it is rarely the answer.
- **No engine source, no GDExtension, no C++ modules.** Named in stage 13 as the
  door past C#, and not opened.
