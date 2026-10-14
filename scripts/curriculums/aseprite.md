---
title: Aseprite and Pixel Art — Learning Path
route: the tool, then the atom, then form, then light, then colour, then whole assets, then the pipeline
written: 2026-10-09
rewritten: 2026-10-14
---

# Aseprite and Pixel Art

Built by `scripts/curriculums/aseprite.mjs`. **13 stages, 211 lessons, 587 cards,
653 lesson sources. Complete — every stage written, 14 October 2026.**

## Goal

**Pixel art, zero to mastery, with Shepherds' art contract as the gate.**

His ruling, 2026-10-14. The first version's goal was deliberately narrow —
*produce a Shepherds asset that passes its own art contract, unassisted* — and
that goal is kept as the **gate** rather than as the **scope**. The curriculum
teaches the craft whole: projection, value, light, colour, materials, the
figure, animation, tiles, props, interface and effects. Every stage is taught
on Shepherds, and §10.1 decides whether the result is accepted.

So there are two tests, and they are different:

| Test | What it asks |
| --- | --- |
| **The craft** | can he draw the thing at all — does the form read, does the value separate, does the motion carry |
| **The contract** | does the asset satisfy `design/art-and-animation.md` §10 — geometry, pivot, tags, palette, direction coverage, in-engine behaviour |

An asset that passes the second and fails the first is a correctly specified
bad drawing. The first version could only catch the second.

## His four rulings, 2026-10-14

1. **The whole craft, with the contract as the gate.** Not narrowed to the
   contract. Zero to mastery, taught throughout on Shepherds.
2. **All four asset classes.** Characters and creatures; terrain and
   architecture; props and set-pieces; UI art and VFX. The first version's
   eight stages covered the first class and touched the rest only inside
   "Production".
3. **A card deck.** Like SA politics and unlike Godot — the subject has a
   great deal of assertable material, and a judgement call is not a card.
4. **Free web resources only.** The art library on the machine is reserved
   for the Drawing curriculum that follows this one. See the correction below.

## What this rewrite changes

The first version (2026-10-09) was 8 stages and 64 lessons with a median of
**426 characters** of material each — an index of exercises rather than a
course. It also used the pre-Greek machinery: a flat list of lesson strings, no
per-lesson sources and no deck.

| | First version | This one |
| --- | --- | --- |
| Stages | 8 | **13** |
| Lessons | 64 | **~222** |
| Material per lesson | ~426 characters | **teaches its point in full, then directs practice** |
| Per-lesson sources | none | **every lesson** |
| Deck | none | **yes** |
| Asset classes | characters, mostly | **all four** |
| Lesson names | instructions (*"Draw at 1× only"*) | **titles** |

**The lesson names change kind.** The first version's names were the exercises
— *"50 clean one-pixel lines at every angle, no stray pixels"*. That belongs in
the practice at the foot of a lesson, not in its title. The title says what the
lesson is about; the material teaches it; the practice directs the work.

## Two corrections to the first version

**One — the library.** The first version says *"no pixel art book is on the
machine"*, which is true, and *"There is no pixel art curriculum on the machine
and no pixel art book in the library, so the structure is mine"*, which reads
as though the library offers nothing. It holds **about twenty-five art books**
covering the craft pixel art is a constrained form of: Preston Blair's *Cartoon
Animation* on timing and holds; Ellenberger's *Atlas of Animal Anatomy for
Artists* and Vilppu's *Drawing Animals* for the sheep, the dog, the deer and
the fox; Arthur Wesley Dow's *Composition* on value massing, which is §2's own
phrase "value organization"; Betty Edwards' *Color*; Mattesi's *Force* on the
pose readability §10.1 demands; and Loomis, Bridgman, Hogarth, Civardi,
Goldfinger, Dodson and Leeuwe on the figure.

**By his ruling they are not cited here.** They are the Drawing curriculum's
library, and citing them in both would make the two read as the same reading
list twice. The finding is recorded so that (a) nobody repeats the claim that
the library is empty, and (b) Drawing knows what it has.

**Two — the tool is bigger than the first version thought.** "Aseprite is a
small program and the whole of it can be learned deliberately in a few
sittings" understates it by two whole subsystems, and both are load-bearing
here:

- **Tilemap mode**, the headline feature of Aseprite 1.3, which is what §9.1's
  "hand-drawn 16 × 16 tiles assembled as Godot terrain sets" actually wants;
- **Slices**, which is what a 9-slice UI border wants.

Neither appears anywhere in the first version. Nor does the **Lua API**, which
matters because `colour-palette.md` asks for "a palette validator" that does
not exist, and the API is free and documented.

## What was found by reading the machine

The most useful material in this curriculum is not in any tutorial. It came
from reading the installed addon and the game's own scripts, which is the
method Godot's rewrite used.

| Finding | Where it came from |
| --- | --- |
| **84 ms, not 83.** Aseprite Wizard derives FPS as `ceil(1000 / shortest frame duration in ms)`, with rounding **on by default**. A frame at 83 ms — the natural choice for 12 fps — **imports at 13 fps**. 84 ms imports at 12. | `addons/AsepriteWizard/creators/sprite_frames/sprite_frames_creator.gd` |
| **Holds survive as relative durations.** Each frame's SpriteFrames duration is `frame.duration / min_duration`, so a frame twice as long is a multiplier of 2 rather than a duplicated frame. This is how Timon's two-frame holds carry across. | the same file |
| **The underscore rule is the addon's default**, not a convention Shepherds invented: `_DEFAULT_LOOP_EX_PREFIX = '_'`. | `addons/AsepriteWizard/config/config.gd` |
| **Four importers, not one.** Sprite frames, static texture, **tileset texture** and **split-layer** — the last two being exactly what §9.1's terrain sets and §3.1's body/equipment/shadow/effects separation need. | `addons/AsepriteWizard/importers/` |
| **The runtime already enforces the eight-direction rule.** A direction with its own drawing is used **as drawn, unmirrored**; only a direction with no drawing of its own borrows a mirror. | `game/scripts/gameplay/actors/authored_sprite_body.gd` |
| **The master palette is not loaded in Aseprite.** `~/.config/aseprite/palettes/` holds only `default.ase`. The `.gpl` is in the repo and has never been installed as a preset. | the machine |

## Versions this is written against

Pinned, because every one of the findings above is version-specific.

| | |
| --- | --- |
| **Aseprite** | **1.3.18.6-x64**, Steam install at `~/Games/steam/steamapps/common/Aseprite/aseprite` |
| **Aseprite Wizard** | **9.8.0** |
| **Godot** | **4.7**, GL Compatibility |
| **The art contract** | `design/art-and-animation.md`, current as reset 2026-09-22 |
| **The palette** | Palette v0.1, 132 entries in 33 ramps |
| **Aseprite extensions** | **none installed.** `~/.config/aseprite/extensions/` does not exist |

## How to read this subject

**Pixel art is not drawing at a small size.** It is a distinct discipline with
its own grammar, and the difference is that **every pixel is a decision you
made**. A brush stroke at high resolution averages out; a stray pixel at 80 px
tall is 1.25% of a character's height and is visible at 3× scale.

Four consequences run through the whole curriculum:

| | |
| --- | --- |
| **1 — The constraint is the medium** | three or four values per material is not a limitation to work around; it is the thing that makes a sprite read at native scale in a crowd |
| **2 — Judgement happens at 1×** | §10.1's first rule. Everything looks good at 800%. Nothing is decided there |
| **3 — Value does the work; colour does identity** | which is why value comes before colour here, and why the black and grey tests exist |
| **4 — The contract is a readability specification** | every clause in §10.1 — the outline, the key light, the negative gaps, the colour counts — exists so that a hazard reads during movement, combat, crowds, darkness and effects |

## What "practice" means here

Six kinds, and every lesson ends with one. **Nothing requires opening a source
to learn the lesson** — the material teaches it in full, and the practice is
the work.

| Kind | Example |
| --- | --- |
| **Reps** | the same form fifty times until the hand stops making stray pixels |
| **A single asset** | one bucket, to contract, start to finish |
| **A comparison** | draw the same object three ways and decide which reads |
| **A test** | run the black test and the grey test and record which change fixed it |
| **A measurement** | open a reference, count its colours, measure its heights by direction |
| **A round trip** | draw it, name it, import it, see it in Godot at native scale, under light |

**Nothing in this curriculum tells him to post work for critique, join a
community, or practise daily.** He draws; that is the point of owning the
tool.

## The 80-pixel problem

A separate note because it governs the whole of stages 7 to 10, and because it
is the single hardest thing about this subject.

A Shepherds adult is **about 80 px sole-to-crown**. At that height a head is
roughly 10 to 14 px, an eye is **one pixel or none**, a hand is two or three
px, and a sword's blade is two px wide. Everything that figure drawing teaches
about proportion and gesture still applies, and almost nothing it teaches about
rendering does. **Identity has to be carried by silhouette, value and costume
shape, because there is no room for a face.**

§10.1 states this as a requirement — *"identity cannot depend on hue, glow,
jewellery or microscopic detail"* — and the black test is how it is checked.

## The one conflict between the best free resource and the contract

**Slynyrd's top-down character method mirrors.** Pixelblog 55 draws five
orientations — front, back, side and two diagonals — and flips the side and
diagonals to cover eight directions. It is the best free writing on exactly
this subject.

**§5.4 forbids it.** Timon's reference ties limb colours to a side, so a
flipped west swaps them; and handedness, costume and action geometry have to
survive a flip, which for a character with a crook on one shoulder and a
satchel on one hip they do not.

The curriculum **teaches both**: the five-plus-mirror method, because it is the
industry-normal economy and because the runtime still implements it as a
fallback; and the eight-authored rule, because that is the contract. Stage 9
has a lesson on what mirroring costs and when it is legitimately available —
§5.4 permits it *"for an explicitly approved asset whose handedness, costume
and action geometry survive the flip"*.

## The shape

Ordered so no lesson depends on a later one, and so the difficulty gradient
runs through a bucket before it runs through a person.

| # | Stage | Lessons | Cards | What it is for |
| --- | --- | --- | --- | --- |
| 1 | The tool | 22 | 61 | All of Aseprite 1.3, once, deliberately — including Tilemap, Slices, the CLI and the Lua API, which the first version never mentions. Learned on purpose rather than absorbed over a year of bad habits. |
| 2 | The pixel | 16 | 46 | The atom. Clusters, jaggies, lines at every slope, curves, circles, banding, noise against texture, dithering and when §10.1 bans it, why anti-aliasing is off, and the discipline of judging at 1×. |
| 3 | Projection and form | 14 | 36 | **The most under-taught thing in the subject.** §9.1's rectilinear three-quarter top-down: what it is, why it is not isometric, vertical edges staying vertical, floors that do not converge, and the 16 px tile, 8 px subgrid and 45.7 px/m calibration. |
| 4 | Value and light | 15 | 44 | Four values per material; the upper-left key and restrained lower-right form shade; why static shading stays restrained so `Light2D` reads; the black test and the grey test; negative gaps; contact shadow against environmental shadow. |
| 5 | Colour and the palette | 17 | 41 | Hue shifting rather than darkening; the `Deep → Shadow → Mid → Light` order; all 132 entries and 33 ramps; loading the `.gpl`; indexed mode; the four colour-count bands; the coloured one-pixel outline and the three outline prohibitions; the violet rule's two registers and its three exemptions. |
| 6 | Materials | 14 | 33 | Wool, cloth, metal, wood, stone, slate, earth, leather, moss, water, ice, the four skin ranges, dead flesh, blood, ember and fire — each in four values, each mapped to its ramp, none by texture imitation. |
| 7 | The prop, and the round trip | 15 | 35 | **The first complete asset, end to end.** A bucket: brief, eight colours, the York size bands, footprint and visible size as separate facts, bottom-centre anchor, Y-sort, contact shadow, no baked floor — then named, imported through Wizard, placed in the real scene and checked at native scale under light. Plus the six importers, §10's definition of done, and a prop with a second state. |
| 8 | Terrain and architecture | 16 | 40 | 16 × 16 tiles in Aseprite's Tilemap mode; Godot `TileSet` terrain sets and the three match modes by name; the transition grammar; the repetition and seam tests; modular walls, roofs, doors, windows, gates, fences and posts with straight-run and corner tests; interiors; cliffs; and the 32–40 colour screen budget. |
| 9 | The figure | 16 | 40 | The 80-pixel problem. Proportion, head, hands and feet at that height; silhouette first; the eight authored directions and why mirroring is banned; what five directions would cost; the 81–87 px directional height variance; anatomical scale kept across poses; signature equipment breaking the torso; and the four-legged body — sheep, dog, deer, fox. |
| 10 | Animation | 21 | 59 | The principles that survive 12 fps at 80 px. Keys, breakdowns, holds and the two-frame hold; **the 84 ms arithmetic**; the 24-frame idle with its 3–5 poses, held portion and deliberate loop drop; the 12-frame run; the waist split; anticipation, active, impact and recovery against real gameplay timing; one-shots and the `_` tag; telegraphs through pose; four-legged cycles and gaits; and the whole Prologue creature list. |
| 11 | UI art and VFX | 15 | 52 | **UI art is not pixel art.** `hud.md` §2's rendering split — the world integer-scaled with nearest filtering, the interface rasterised at native resolution over the same 960-unit layout — so UI art is painted at 4× and downsampled, and inherits no canvas, pivot or animation rule. The main frame read as a specification, nine-slice borders, painted openings and hit targets, legibility at four resolutions, the placeholder, map markers at twelve pixels, the eight open HUD items. Then the five visual registers, the sacred and dissonant violet, Shepherd Light, Beacon and fire, and effects at twelve frames. |
| 12 | The pipeline | 16 | 55 | Aseprite Wizard read as source. The nine steps from master to playing animation; the machine-local command path; the exact Aseprite command line; layer exclusion matched against full hierarchy paths; the JSON the pipeline reads; `ceil(1000 / shortest frame ms)` and why 84 ms gives 12 fps and 83 gives 13; relative durations; the loop default the `_` prefix inverts; tag direction and repeat; the six importers; bake files; what a re-import regenerates; and a Lua palette validator. |
| 13 | Production | 14 | 45 | The brief before anything is drawn; §6's actual Prologue requirement and §7's later-game families; what the numbers come to and why directional coverage is the cost lever; one asset, action and direction at a time; working with Timon, who has final say on design; preparing an asset for review; surfacing a gap rather than inventing; everything that is open; an order of work; the repository kept clean; and the whole contract on one page. |
| | **Total** | **211** | **587** | **653 lesson sources** |

**Stage 1 is first and is not optional.** It is the one stage whose absence
produces a year of bad habits that then have to be unlearned — and the two
subsystems it adds, Tilemap and Slices, are prerequisites for stages 8 and 11.

**Stages 3 and 9 are the rewrite's real additions.** Projection is what makes a
top-down asset sit in the world rather than float above it, and the first
version had no lesson on it at all. The figure at 80 px is the subject's
hardest problem and the first version gave it seven lessons inside a stage that
also had to cover eight directions and readability.

## The deck

Cards, by his ruling. Two kinds, following Piano's precedent for a non-language
deck:

| Kind | For | Example front |
| --- | --- | --- |
| **`word`** | a tool, a term, a palette ID, a named technique, a file-layout fact, a size band | *Tilemap mode* |
| **`grammar`** | a rule, a procedure, a relationship, a numeric contract | *How Wizard derives FPS from frame duration* |

**What gets a card:** the canvas, pivot and scale numbers; the **84 ms** fact
and its arithmetic; the tag naming grammar and the `_` prefix; the ramp order
and the four colour-count bands; the York size bands; the eight directions and
the mirroring exception; the two readability tests; the key light direction; the
three outline prohibitions; the shortcuts worth having in the hand; the four
importers; §10's eight conditions; and the asset brief's required fields.

**What does not:** any judgement. *"Does this silhouette read?"* is not a card,
and neither is *"choose the right value for wool"*. The deck holds the
specification and the arithmetic; the craft is in the practice.

## The resources

**Free only, by his ruling.** Everything below was checked on 2026-10-14 and is
free to read without an account.

| Source | What it is | Why it is here |
| --- | --- | --- |
| **Aseprite docs** — `aseprite.org/docs` | The official manual: Workspace, Image & Sprite, Color, Drawing, Selecting, Transformations, Layers, Animation, **Tilemap**, **Slices**, Save, Exporting, Sprite Sheet, CLI, Preferences, Shortcuts, Workspace Layout, Extensions, Scripting | stage 1 end to end |
| **Aseprite Lua API** — `aseprite.org/api` | The scripting reference, free and complete | stage 12's validators |
| **Slynyrd's Pixelblog** — `slynyrd.com/pixelblog-catalogue` | **64 free articles** by a working pixel artist, still running — #64 appeared this month. The single best free body of writing on this subject | the backbone of stages 2–11 |
| **Saint11** — `saint11.art/blog/pixel-art-tutorials` | **~90 free technique cards** by Pedro Medeiros, Celeste's artist. Short, precise, one technique each | technique throughout, and the only good free material on four-legged cycles |
| **Lospec** — `lospec.com` | 586 free tutorials, the palette list, and the palette quantizer, identifier and analyzer | palette work in stage 5, and a second opinion throughout |
| **Aseprite Wizard** — the installed addon, `addons/AsepriteWizard/` | Version 9.8.0, read as source | stage 12 |
| **The Shepherds documents** | `design/art-and-animation.md`, `design/colour-palette.md`, `design/hud.md`, `design/menu-runtime-contract.md`, `design/cinematic-and-dialogue-visual-system.md`, `media/README.md`, `media/reference/Animation/README.md` | the contract, cited by section throughout |
| **The game's own scripts** | `authored_sprite_body.gd`, `body_base_run.gd`, `production_hud.gd` | read where the code is the lesson |

### The Slynyrd entries that matter, by stage

Recorded here because the catalogue is in reverse chronological order and the
useful mapping is not obvious from it.

| Stage | Pixelblog |
| --- | --- |
| 2 · The pixel | **5** Back to the Basics, **2** Texture |
| 3 · Projection | **3** and **4** Graphical Projection Parts 1 and 2 |
| 4 · Value and light | **6** Light and Shadow |
| 5 · Colour | **1** Color Palettes, **7** Developing Style |
| 6 · Materials | **13** Rocks, **15** Plant Life, **10** Water in Motion |
| 7 · Props | **21** Top Down Objects, **24** Items |
| 8 · Terrain | **20** and **43** Top Down Tiles, **44** Top Down Trees, **45** Bricks, Walls, Doors, and More, **35** Top Down Interiors, **34** **On The Farm** — York's own subject matter |
| 9 · The figure | **22** Top Down Character Sprites, **17** and **49** Human Anatomy |
| 10 · Animation | **8** Intro to Animation, **25** Motion Cycles, **50** Human Walk Cycle, **52** Idle Fighting Stance, **9** Melee Attacks, **53** Punches and Kicks, **55**, **56** and **58** Top Down Character Animation Parts 1–3 |
| 11 · UI and VFX | **26** UX/UI Design Basics, **33** Wind Effects |

### What is deliberately excluded

- **Pixel Logic** (Michafrar) — the closest thing to a textbook for this
  subject, and **paid**, on Gumroad. Named so nobody wires it in later.
- **The art library on the machine** — ~25 books, reserved for Drawing. See
  the correction above.
- **PixelSchool.org** — promoted by Lospec; could not be verified as free on
  2026-10-14, so nothing here depends on it.
- **Aseprite MCP Pro** — present in `tools/` and registered in `.mcp.json`,
  with the Aseprite extension **not installed**. It is an inspection tool for
  an assistant, not a way for him to learn to draw, and `CLAUDE.md` is explicit
  that he owns all Aseprite authoring. The curriculum never routes work
  through it.
- **LibreSprite** — the free fork. He owns Aseprite 1.3.18; the fork is
  behind on tilemaps and would teach a different tool.

## Standing decisions baked into the material

1. **The contract is quoted, never paraphrased.** Every numeric or
   prohibitive claim names its section — §4, §5.1, §10.1 — so the claim can be
   checked against the document rather than trusted.
2. **He draws. Nothing else draws.** `CLAUDE.md`: *"Master Roachi owns all
   Aseprite authoring."* No lesson produces art by any other route, and the
   retired generated-art and sprite-acus workflow is named as retired.
3. **Timon has final say on design.** Approval of a drawing is Master
   Roachi's; the design behind it is Timon's, and the body-part reference is
   the decided standard. Where the curriculum teaches a method that would
   change a design, it says so.
4. **Every geometry number comes from the contract**, not from general pixel
   art practice: 960 × 540, 112 × 112, pivot (56, 96), ~80 px adult, 16 px
   tile, 8 px subgrid, 45.7 px per metre, 24 frames, 12 fps, 12 frames.
5. **Mirroring is taught and then banned**, with the exception stated.
6. **The palette is a bank, not a quota.** `colour-palette.md`: *"A master
   palette is a bank of approved choices, not a requirement to use every
   colour in an asset."*
7. **Nothing is approved until he approves the actual asset** — not a concept,
   not a filename. §10.2.
8. **No speculative sprite catalogue.** §10.2 again. Every production lesson
   derives its subject from accepted on-screen use, and stage 13 teaches that
   as the rule it is.

## Known thin spots

- **Portraits and illustrated scenes.** §2 permits higher-resolution art for
  dialogue portraits and major illustrated scenes and **none is approved**.
  There is no stage for high-resolution illustration; that is the Drawing
  curriculum's territory and the two meet there.
- **Normal maps.** §2 allows optional normal maps for atmosphere. One lesson
  in stage 11 names them; generating and authoring them is not taught, because
  nothing in the project uses them yet.
- **Tiling at scale.** Stage 8 teaches tiles, terrain sets, seams and
  modularity, but a full York tileset is a production job of months and the
  curriculum stops at the grammar and the tests.
- **VFX is one half of one stage.** §9 leaves VFX rules open work, so there is
  no contract to teach to; the stage teaches the palette registers and
  restraint and says the rest is undecided.
- **Audio-visual synchronisation** for telegraphs — §5.3 requires telegraphs to
  read through *"pose, silhouette, motion and sound"*. Sound is `audio.md`'s and
  is not here.
- **The deck holds the specification, not the craft.** Deliberate, and a
  limitation: a reader who learned only the cards would know every number in
  the contract and be unable to draw.

## What the later stages ended up containing

Written 14 October 2026, after all thirteen stages were built. Three stages
diverged from this plan in ways worth recording.

**Stage 11 was restructured completely.** The plan had it as "UI art is PNG and
is not sprite work". Reading `hud.md` §2 showed the real reason: the world
renders into a 960 × 540 `SubViewport` enlarged by an integer factor with
nearest filtering, while **interface layers are lifted into the window and
rasterised at native display resolution**, retaining the same 960 × 540 layout
coordinates. So UI art is **painted at 4× or more and downsampled** — the exact
inverse of §3's rule against resized source art — and `PresentationShell` owns
the split. The stage's thesis became "UI art is not pixel art", with the format
difference a consequence rather than the point. Two lines from that document
carry the stage: *"Running a world scene without the shell is not a valid
presentation-quality HUD review"* and *"Hit testing uses the painted circle, not
its rectangular bounds"*. The stage also gained `menu-runtime-contract.md` §9's
authorship fact — *"Final UI art comes from Timon"* — which makes the stage
about reading and validating a UI contract rather than painting one.

**Stage 12 came out of the addon's source rather than its documentation.** Every
number in it was read from `addons/AsepriteWizard/`:

- `_calculate_fps` is `ceil(1000.0 / min_duration)` with rounding on by default,
  where `min_duration` is the shortest frame in the tag — so **84 ms imports at
  12 fps and 83 ms at 13**, and the shortest frame rules the whole tag.
- each frame's Godot duration is `frame.duration / min_duration`, a multiplier,
  which is why multiples of 84 ms keep every derived number whole.
- the loop flag is `aseprite/animation/loop/enabled` (default `true`) **inverted**
  by the `_` prefix, which is stripped — matching §3.1 and §5.3 exactly.
- the exact command line, including `--all-layers` by default and
  `--merge-duplicates` by default, so hidden layers export and holds are free.
- the exclusion pattern is a Godot `RegEx` **searched against full hierarchy
  paths** like `Group/Layer`, and **an invalid pattern is silently ignored**.
- ping-pong expansion always drops the last frame and drops the first only when
  the animation loops.
- bake files are `.<filename>.ase_bake.res`, hidden, with the source's MD5 in a
  `source_hash` meta, and **a stale bake warns and is used anyway**.
- there are **six** importers, not four — the plan undercounted.

Two things the plan listed are not in the stage: `_exports/` and `.gdignore`.
Neither exists in the Shepherds repository, because the importer deletes its
intermediate sheet and JSON (`aseprite/import/cleanup/remove_json_file`, default
on) and the `SpriteFrames` resource embeds a `PortableCompressedTexture2D`. There
is nothing to ignore.

**Stage 13 gained the arithmetic.** The plan did not include a lesson on what the
Prologue's requirement actually costs. Counting it changed the stage: §5.1 and
§5.2 fix one character's two cycles at exactly **288 drawings** (24 × 8 plus
12 × 8, no mirroring), Eli's fifteen one-shots are **720–1,200 at eight
directions and 90–150 at one**, and the ten named residents at hero coverage
would be **1,920 drawings for people who stand in a village**. Which makes
directional coverage, not frame count, the project's cost lever — and §7's
*"Ambient characters do not automatically receive hero-level directional or
combat coverage"* the sentence that resolves it. The stage also gained a lesson
on working with Timon, because every approved asset in the repository is his and
the two motion references are the model for how a drawing becomes a contract.

**Two things the plan promised and the stages dropped.** Eastward and Sea of
Stars as references: they are commercial games, not free resources, and the
contract's own approved references turned out to be better teachers. And "what
to do when drawing contradicts the contract": it became §2.1's rule — surface
the gap — spread across stage 13's lessons on the brief, the review and the gap,
rather than one lesson of its own.
