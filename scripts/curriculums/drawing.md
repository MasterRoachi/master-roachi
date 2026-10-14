---
title: Drawing — Learning Path
route: the tablet, then the line, then form, then the figure, then the picture, then colour
written: 2026-10-09
rewritten: 2026-10-14
---

# Drawing

Built by `scripts/curriculums/drawing.mjs`. **17 stages, 157 lessons, 456 lesson
sources, no deck. Complete — every stage written, 14 October 2026.**

## Goal

**Drawing, zero to mastery, digitally, with Shepherds as the practical end.**

His rulings, 2026-10-14, four of them:

1. **Through colour, light and illustration.** Not drawing-stops-at-value. The
   curriculum runs fundamentals → anatomy → composition → value → colour and
   light → a finished illustration.
2. **Digital first, on the tablet.** Not paper-first, which was the
   recommendation. Every exercise in this curriculum is specified for a
   screenless graphics tablet and a painting program.
3. **The Famous Artists Course is one reference among many** — cited where it
   is the best source for a point, and nowhere else.
4. **No deck.** The second curriculum without one, after Godot. Drawing is
   motor skill and judgement; the anatomy vocabulary is carried by the lessons.

## What the rewrite changes

The first version (2026-10-09) was **8 stages and 64 milestones** at a median of
568 characters. It was not written as lessons at all — each entry was a count
("100 thirty-second gestures", "50 spheres, 50 boxes, 50 cylinders") with a
paragraph of detail beside it. That was a defensible design and it is superseded
by the standing ruling that **every lesson teaches its point in full and then
directs practice**.

**The counts survive.** The first version's best argument was that in this
subject the quantity *is* the method, and it is right: nobody has read their way
to a good line. So every lesson here ends in a directed count, the way every
lesson in Greek ends in a drill. What changes is that the teaching now precedes
the count instead of gesturing at a book.

## Two corrections to the first version

**The library is about seven times what the old plan described.** It listed
eight rows of books. There are **57 drawing-relevant volumes** on the shelf. The
old plan missed, among others:

| Missed | Why it matters |
| --- | --- |
| Williams, *The Animator's Survival Kit* | the standard animation text, and Shepherds animates at 12 fps |
| Mattesi, *Force* | the modern counterpart to gesture, and the best book on rhythm |
| Muybridge, *The Human Figure in Motion* | the photographic record every motion reference descends from |
| Eisner, *Comics & Sequential Art*; McCloud ×2 | the cinematic document's register 3 is graphic-novel tableaux |
| Hogarth, *Dynamic Wrinkles and Drapery* | §2.1 forbids inventing costume, so drapery has to be drawn correctly |
| Loomis, *Successful Drawing*; *The Eye of the Painter* | constructed perspective, and light — the two gaps the old plan called empty |
| Hultgren, *The Art of Animal Drawing*; Ellenberger, *Atlas of Animal Anatomy* | the Prologue needs a sheep, a dog, a deer and a fox |
| Faigin, *The Artist's Complete Guide to Facial Expression* | portraits are register 1, and expression is the whole job |
| Grafton, *Ancient and Medieval Arms and Armor*; Tierney, *Medieval Fashions* | York's costume and equipment, which may not be invented |

**And the 25 files filed under "Unknown" as `intro` and `1`–`24` are the
complete Famous Artists Course** — Famous Artists Schools, Westport,
Connecticut, © 1960, by Albert Dorne, Fred Ludekens, Norman Rockwell, Al Parker,
Ben Stahl, Stevan Dohanos, Jon Whitcomb, Robert Fawcett, Peter Helck, George
Giusti, Austin Briggs and Harold Von Schmidt. **948 pages, 3.1 GB, every lesson
present.** Its twenty-four lessons are:

| | | | |
| --- | --- | --- | --- |
| 1 The artist's materials | 7 Clothes, draperies, costumes | 13 The human family | 19 Advertising and editorial design |
| 2 Form — the basis of drawing | 8 Figure composition | 14 Advanced pictorial composition | 20 Specialized design |
| 3 Composition | 9 Variety in forms and textures | 15 Advanced line and tonal painting | 21 Studio procedures |
| 4 Drawing the human form | 10 Perspective for the artist | 16 Colour — theory and practice | 22 Studio production |
| 5 The human figure in motion | 11 Landscapes and interiors | 17 Lettering | 23 Fashion illustration |
| 6 Constructing the head and hands | 12 Animal drawing | 18 Experimental design | 24 Television art |

By his ruling it is a reference, not the spine. **Lessons 1–16 are cited
throughout. Lessons 17–24 are excluded** — lettering, advertising layout,
studio production, fashion and television art are 1960s commercial practice, and
nothing in his work needs them.

## What was found by reading the machine

The medium ruling made the rig itself a research subject, and two things turned
up that no tutorial would have told us.

**The tablet is bound to the wrong driver.** `256C:006D`, a Huion, enumerates as
`usb-HUION_Huion_Tablet-if01-event-mouse` and binds to **`hid-generic`**:

```
/sys/bus/hid/devices/0003:256C:006D.0004 -> hid-generic
/sys/bus/hid/devices/0003:256C:006D.0005 -> hid-generic
```

There is no pen node and no tablet node — only a mouse. **So there is no
pressure sensitivity and the pointer is relative rather than absolute**, which
is the opposite of how a graphics tablet works. The in-tree driver that should
claim it is `hid-uclogic`, it is present at
`/lib/modules/7.2.5-3-omarchy/kernel/drivers/hid/hid-uclogic.ko.zst`, and the
device **is** in its table:

```
alias: hid:b0003g*v0000256Cp0000006D
```

It is simply not loaded. This is an autoload problem, not an unsupported-hardware
problem, and stage 1 teaches both the diagnosis and the fix.

**And there is no painting program on the rig.** No Krita, no GIMP, no MyPaint,
no Inkscape — Aseprite and Blender are the only graphics software installed.
Krita 6.0.3-2 is in Arch `extra`, 70 MB. The medium ruling requires it.

## The shape

Ordered so no stage depends on a later one, and so the hand is trained before
it is asked to carry knowledge.

| # | Stage | Lessons | What it is for |
| --- | --- | --- | --- |
| 1 | The tablet | 13 | The instrument, before anything is drawn with it. **The driver fault on this rig** and its fix; absolute against relative mapping; the pressure curve; mapping the active area to one monitor; Krita, chosen and configured; the canvas; five brushes and no more; layers and not hiding behind them; **hand-eye separation**, which is a real motor skill no drawing course covers because none assumes this hardware; the flip, the zoom and the greyscale check; the no-undo rule; and where the work goes. |
| 2 | The line | 14 | The mark. What a line records; **the stabiliser argument**; the ghosted line in four steps; arcs and which joint draws which; ellipses and the minor-axis rule; line weight for depth and overlap; hatching; aiming as a skill separate from smoothness; sighting and measuring; negative space; blind and modified contour; line economy; warm-ups; and the nine-point diagnosis. |
| 3 | Form in space | 15 | The box, the cylinder, the sphere, drawn not traced. **The 250-box discipline**, adapted to the tablet with its correction method intact; checking convergence; cross-contour; foreshortening; form intersections; the organic sausage; texture as small form; drawing through; the ground plane and the horizon rule; building a thing from primitives by bounding box and subdivision. The longest stage, and the least rewarding. |
| 4 | Perspective | 14 | Constructed, after freehand. Station point and the 60° cone; one-, two- and three-point; **measuring heights anywhere off the horizon**; dividing and multiplying by diagonals; circles by the eight-point method; inclined planes for roofs and stairs; constructed shadows; reflections; the freehand/constructed hybrid that real work uses; and the four places the system is correct and looks wrong. |
| 5 | Gesture and force | 11 | The line of action before the anatomy. Thirty seconds and why longer is worse; **Mattesi's force and the straight-against-curve rule**; weight, balance and contrapposto; the three masses; exaggeration and how far; drawing an action rather than a pose; animal gesture; the six ways a gesture dies. Over 2,000 drawings, and that is the right order of magnitude. |
| 6 | The figure constructed | 13 | Gesture into construction. Proportion canons and the seven landmarks; the Loomis mannequin; rib cage and pelvis as two rigid solids; the spine's four curves; the shoulder girdle, which is why arms go wrong; the twelve bone landmarks you can feel; male, female, child and age; foreshortening a whole figure; **the eight standing directions on shared guides**; the figure from imagination; and the seven proportion checks. |
| 7 | Anatomy: the torso | 8 | After construction, never before. How to study anatomy and how not to; the torso's skeleton and its eight visible landmarks; the chest and the deltopectoral groove; the back's three masses and why it reorganises with every arm position; the abdomen and the oblique's fold; the neck, which emerges from inside the rib cage; and **what survives at figure size, thumbnail size and eighty pixels**. |
| 8 | Anatomy: the limbs | 8 | The arm's three bones and the elbow that belongs to the forearm; pronation, supination and the brachioradialis that always points at the thumb; the deltoid's insertion V; the leg's skeleton and the femur's slant; the thigh, flattened by the IT band; the knee, calf and ankle with their alternating asymmetries; **contracted bulges and stretched flattens**, which is one rule covering every limb in every pose. |
| 9 | Hands and feet | 6 | The part everyone hides. The hand as a box, a wedge and four chains; the three arches and the thumb's 90° plane; fingers that converge rather than parallel; the foot as a wedge and an arch with the ankle at its back third; and **what survives when a hand is three pixels across** — a direction, a state and a mass. |
| 10 | The head and the face | 13 | The hardest single thing, judged by a specialist. The ball and plane, with the centre and brow lines as **ellipses, not straight lines**; the skull; the eyes at the vertical middle; the planes; the eye, nose, mouth, ear and hair, each against its symbol; **likeness as proportion rather than features**; age by structure rather than wrinkles; Faigin's expression anatomy; and the six marks a face needs at two centimetres. |
| 11 | Drapery, costume, equipment | 6 | Hogarth's six folds, named; cloth over form in three zones; **fold count and radius as the material signal**; period dress and equipment from Grafton and Tierney, under §2.1's ban on invention; costume as character and the black-silhouette test. The stage that turns a constructed figure into a person who lives somewhere. |
| 12 | Animals and creatures | 9 | The quadruped skeleton as a re-proportioned human one; **the digitigrade leg, where the visible mid-joints are the wrist and the ankle**; body plans and proportion; animal heads and the stop; fur drawn by silhouette and flow; the four gaits from Muybridge; **the Prologue's sheep, dog, deer and fox**, each to §6's requirement; and creature design built from real skeletons under the square-cube rule. |
| 13 | Composition | 8 | From study to picture. The frame and the crop as content; **twenty thumbnails before choosing**; Dow's notan and the two-value test; the seven focal devices and the rule against spreading them; the six depth devices; composing with figures, where the face outranks everything. Mostly thinking rather than drawing. |
| 14 | Value and rendering | 6 | The six elements of a lit form; **light values and shadow values as two ranges nothing crosses between**; the value scale and why four beats twenty; hard, firm, soft and lost edges; the value signatures of six materials; the rendering order, the three levels of finish, and when to stop. |
| 15 | Colour and light | 6 | **Value first, chroma second, hue last.** Key and ambient as two differently coloured lights; why a shadow is not a darker version of the lit colour; **chroma peaking at the terminator**; temperature contrast at equal value; the limited palette, and why Shepherds' 132-entry Palette v0.1 is the same idea; local colour against the colour of light; the five schemes at 70/25/5. The one stage with a real gap: Gurney is not on the shelf. |
| 16 | Illustration | 4 | The eight-step pipeline from a sentence to a finished piece, and the stage at which most pieces die. Sequential art from Eisner and McCloud — the panel, the gutter, closure and the page as a unit — because register 3 is graphic-novel tableaux. **Character and creature design sheets to the standard a collaborator could work from**, which is the curriculum's actual deliverable. |
| 17 | Keeping it | 3 | The daily hour; **Drawabox's 50% rule**, which is half and is not optional; what to work on, found by finishing things and listing the failures; measuring progress, including **redrawing stage 1's three dated pre-instruction drawings**; and the two routes out — depth, or application to §11's open work. The one curriculum whose subject cannot be finished. |
| | **Total** | **157** | **456 lesson sources. No deck.** |

**Stage 1 is first and is not optional**, for the same reason Aseprite's was:
the instrument has a real and currently broken configuration, and drawing on a
tablet that reports as a mouse would teach the hand the wrong thing.

**Stages 7 and 8 come after 6 deliberately.** The first version had anatomy as
one stage of eight and put it fifth; splitting it in two and placing it after
construction is the single biggest structural change, and it follows the oldest
rule in the subject — Bridgman, Loomis, Vilppu and Hampton all say it.

## The medium, and what digital-first actually costs

His ruling, and it has consequences worth stating rather than smoothing over.

**What the tablet gives:** undo, layers, transform, flip, zoom, infinite paper,
a greyscale check one keystroke away, and work that goes straight into
Shepherds' pipeline without being photographed.

**What it takes, and what this curriculum does about it:**

| Taken | What the curriculum does |
| --- | --- |
| **The no-undo constraint.** Drawabox's exercises are ink on paper precisely because a mark you cannot take back forces you to plan it | **The no-undo rule is imposed deliberately in stages 2 and 3.** Ghosting, then one committed stroke, then live with it. Undo is for mistakes, not for retries |
| **The stabiliser.** It makes a beginner's lines look like an expert's, which is exactly the problem | Taught, named, and **turned off** until stage 14 |
| **Hand-eye unity.** A screenless tablet puts the hand in one place and the image in another | **Treated as a skill with its own exercises**, in stage 1 — because it is one, and three weeks of it is the normal cost |
| **Scale.** A drawing on a 27-inch monitor at 100% is not the size it will be seen | The flip, the zoom-out and the thumbnail check, taught as habits |
| **Texture.** Paper tooth does work that no brush preset replicates | Named honestly; the brush choices that come closest are given |

**And one practical consequence: the tablet has to be fixed first.** A device
bound to `hid-generic` has no pressure, and half the exercises in stages 2, 14
and 15 are pressure exercises.

## Resources

**Free, on the web** — verified 2026-10-14:

| | What it is | Where it carries |
| --- | --- | --- |
| **Drawabox** — `drawabox.com` | A complete, genuinely free exercise-based course. No paywall, no account. Lessons 0–7 plus the 250 Box, 250 Cylinder, 25 Texture, 25 Wheel and 100 Treasure Chest challenges | **stages 2–4**, adapted to the tablet |
| **Proko** — `proko.com` | **32 of the 57 lessons of Figure Drawing Fundamentals are free** (about 5 hours against the paid 15). The modern video companion to Loomis and Bridgman | **stages 5–10** |
| **Line of Action** — `line-of-action.com` | Free timed figure reference: figures, animals, hands and feet, faces and expressions; clothed or nude, any age, any build | **the gesture counts, stages 5–9** |
| **Quickposes**, **SketchDaily**, **Croquis Café** | Three more free timed-reference tools; Croquis Café is video, in traditional life-class format — 1–2 minute gestures, 5-minute poses, 10-minute studies | **the same** |
| **Krita's manual** — `docs.krita.org` | Free and complete. Brushes, layers, colour management, the tablet settings | **stage 1** |
| **Ctrl+Paint** — `ctrlpaint.com` | A free digital-painting video library, built for exactly this transition | **stages 1, 14, 16** |

**Owned, on the shelf** — 57 volumes, and the ones that carry a stage:

| Stage | Books |
| --- | --- |
| 1 Tablet | Krita's manual; Ctrl+Paint |
| 2 Line | Drawabox 1; Guptill, *Sketching and Rendering in Pencil*; Borgman, *Pen and Pencil Drawing Techniques*; Crane, *Line and Form* |
| 3 Form | Drawabox 2 and the box challenge; Famous Artists 2; Vilppu, *Drawing Manual* |
| 4 Perspective | D'Amelio, *Perspective Drawing Handbook*; Norling, *Perspective Made Easy*; Loomis, *Successful Drawing*; Famous Artists 10 |
| 5 Gesture | Nicolaides, *The Natural Way to Draw*; Vilppu, *Drawing Manual*; Mattesi, *Force*; Famous Artists 5; Muybridge |
| 6 Figure | Loomis, *Figure Drawing For All It's Worth*; Vilppu, *Figure Drawing*; Bridgman, *Guide to Drawing from Life*; Hogarth, *Dynamic Figure Drawing*; Tiner, *Figure Drawing without Models*; Famous Artists 4 |
| 7–8 Anatomy | Bridgman, *Constructive Anatomy* and *The Human Machine*; Goldfinger, *Human Anatomy for Artists*; Simblet, *Anatomy for the Artist*; Hogarth, *Dynamic Anatomy*; Leeuwe, *How to Learn Anatomy*; Fabry, *Anatomy for Fantasy Artists* |
| 9 Hands and feet | Hogarth, *Drawing Dynamic Hands*; Loomis, *Drawing the Head and Hands* |
| 10 Head | Loomis, *Drawing the Head and Hands*; Hogarth, *Drawing the Human Head*; Hamm, *Drawing the Head and Figure*; Civardi, *Drawing Portraits*; Parks, *Secrets to Drawing Realistic Faces*; **Faigin, *The Artist's Complete Guide to Facial Expression***; Famous Artists 6 |
| 11 Drapery | **Hogarth, *Dynamic Wrinkles and Drapery***; Famous Artists 7; Grafton, *Ancient and Medieval Arms and Armor*; Tierney, *Medieval Fashions* |
| 12 Animals | Ellenberger, *Atlas of Animal Anatomy for Artists*; Hultgren, *The Art of Animal Drawing*; Vilppu, *Drawing Animals*; Keane, *Animating Drawing 4-Legged Animals*; Famous Artists 12; Harding, *On Drawing Trees and Nature* |
| 13 Composition | Dow, *Composition*; Loomis, *Creative Illustration*; Hamm, *Drawing Scenery, Seascapes and Landscapes*; Famous Artists 3, 8 and 14 |
| 14 Value | Loomis, *The Eye of the Painter*; Guptill; Famous Artists 9 and 15 |
| 15 Colour | Edwards, *Color*; Famous Artists 16; Loomis, *The Eye of the Painter* |
| 16 Illustration | Loomis, *Creative Illustration*; Eisner, *Comics & Sequential Art*; McCloud, *Understanding Comics* and *Making Comics*; Williams, *The Animator's Survival Kit*; O'Connor, *Dracopedia: The Bestiary* |
| 17 Keeping it | Edwards, *The New Drawing on the Right Side of the Brain*; Dodson, *Keys to Drawing*; Nicolaides |

## What is deliberately excluded

| | Why |
| --- | --- |
| **Famous Artists lessons 17–24** | lettering, advertising layout, specialised and experimental design, studio procedures and production, fashion illustration, television art. 1960s commercial practice |
| **Origami — ten books** | a different subject that happens to be filed under Art |
| **Gurney, *Color and Light*; Scott Robertson, *How to Draw*; Bammes; Hampton** | not on the shelf. Named in stages 15 and 4 as the standard references they are, and not pretended to |
| **Paper-first instruction** | overruled. Where a paper technique has no digital equivalent it is named as such rather than translated badly |
| **Pixel art** | Aseprite's curriculum, which defers portraits, illustration and character design to this one |

## Standing decisions

1. **Every lesson teaches, then counts.** The teaching is complete in the
   lesson; the count is the practice. Neither alone is the lesson.
2. **The counts are real.** Fifty blocked-in figures is not forty. They are
   deliberately large and deliberately boring.
3. **Digital, on the tablet**, with paper named only where it genuinely does
   something a tablet cannot.
4. **No deck.**
5. **Anatomy after construction.** Never the reverse.
6. **Shepherds is the practical end, not the subject.** Timon has final say on
   design and draws by hand; this is about being able to contribute and to
   understand what he is doing.
7. **§2.1 holds here too.** Costume, insignia, equipment, anatomy and lore are
   not invented to fill a gap — the gap is surfaced. Stage 11 teaches that as a
   drawing discipline rather than a contract clause.
8. **Free web resources and the owned library, both.** The free-resources-only
   ruling that governed Aseprite reserved these books for this curriculum.

## Known thin spots

- **Colour and light has a real gap.** Edwards' *Color* is a mixing course,
  Famous Artists 16 is of 1960, and Loomis' *Eye of the Painter* is about
  seeing rather than about light's behaviour. Gurney is the modern standard and
  is absent. Stage 15 is honest about this and leans on free video.
- **Constructed perspective for invented objects.** D'Amelio and Norling are
  solid and old-fashioned; Robertson is the modern reference and is absent.
  Loomis' *Successful Drawing* carries more of stage 4 than it should have to.
- **No life drawing.** Every figure exercise runs against photographic
  reference, because that is what is available. The curriculum says plainly
  that a living model is better and why.
- **Texture and surface.** Famous Artists 9 covers it, and nothing modern on
  the shelf does.
- **Digital brush craft** is one stage, not three. Ctrl+Paint carries most of
  it, and the deeper painting craft would be its own curriculum.

## What the stages ended up containing

Written 14 October 2026, after all seventeen were built.

**The lesson count came in at 157 against the plan's ~280, and the stages are
not shorter for it.** The plan estimated lesson counts from the first version's
granularity, where a lesson was a single count. Written as teaching, the
material consolidated: one lesson on the quadruped skeleton does the work the
plan had spread over three, and the anatomy stages in particular came in at 8
lessons each rather than 16 because a muscle group is one idea, not four. The
total prose is **739 tables across 3,481 rows**, which is between Godot's and
Aseprite's density. The counts the lessons direct — the actual drawing — are
unchanged and total somewhere near **12,000 drawings** across the seventeen
stages.

**Three things turned up in the writing that the plan did not anticipate.**

**The reduction exercise became a recurring structure.** Stages 7, 9, 10 and 12
each ended up with a lesson on what survives at figure size, at thumbnail size
and at eighty pixels — because the question kept being the right one, and
because it is the specific bridge between this curriculum and the Aseprite one.
Drawing the same subject at four sizes and deciding what to drop at each is now
one of the curriculum's recurring exercises, and it is the one that most
directly serves the project.

**"Straight against curve" turned out to be anatomy rather than style.**
Mattesi teaches it in stage 5 as a mark-making principle. Stage 8 arrives at the
same rule from the other end: a contracted muscle bulges and a stretched one
flattens, so the two sides of every limb are genuinely different. The two
lessons were written three stages apart and meet exactly, which is the clearest
case in the curriculum of a craft heuristic having a physical cause.

**The palette lesson closed a loop.** Stage 15's limited-palette material ends
on Shepherds' Palette v0.1 — 132 entries in 33 four-step ramps running
`Deep → Shadow → Mid → Light` — and the explanation is that each ramp is one
material's local colour at four values, with the hue shifts between steps being
the light-and-shadow logic frozen into a palette. Which means the pixel-art
palette and the painter's limited palette are the same idea, and the Aseprite
curriculum's stage 5 and this one's stage 15 are describing one thing from two
directions.

**And one stage shrank deliberately.** Stage 16, Illustration, is four lessons.
The plan had seventeen. The reason is that illustration is not knowledge — it is
the application of every preceding stage, and the only things that genuinely
needed teaching were the pipeline, sequential art's vocabulary, and the design
sheet's standard. Padding it would have been padding.
