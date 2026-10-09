---
title: The Odin Project — Full Stack JavaScript
written: 2026-10-09
---

# The Odin Project

Built by `scripts/curriculums/odin.mjs`. 34 modules, 151 lessons, 137 on the
route.

## Transcribed, not designed

The other curriculums in this folder are arguments. Godot decides what order
the engine should be met in; Drawing decides that a hundred gestures beat
reading about gesture. This one decides nothing. It is
[the Full Stack JavaScript path](https://www.theodinproject.com/paths/full-stack-javascript)
as it stands on 9 October 2026, in its own order, under its own lesson names,
read from the seven course pages.

That matters for what happens when Odin changes it. This file is a snapshot and
will drift; re-run the script against the live course pages rather than
patching lessons one at a time.

## Four levels into three

Odin nests **path → course → section → lesson**. The schema holds
**curriculum → module → lesson**. So a section is a module, and the course it
belongs to rides on the name:

```
NodeJS · Express
React · The React Ecosystem
JavaScript · A Bit of Computer Science
```

`0003_curriculums.sql` chose three levels with this exact case in mind — *"that
is how courses are actually organised — Odin's NodeJS path has sections with
lessons inside them"*. What it left open was which two levels to collapse, and
course-and-section into one label is the answer, because the alternative
(course as module, sections lost) throws away the only grouping a reader uses
to find their place in a 151-lesson list.

Modules are not numbered. Every other curriculum opens a module with a stage
number because its order is the argument being made; here the course name says
where you are and a 1-to-34 sequence across seven courses would say nothing.

## The shape

| Course | Modules | Lessons | |
|---|---|---|---|
| Intermediate HTML and CSS | 4 | 22 | done |
| JavaScript | 8 | 41 | done |
| Advanced HTML and CSS | 3 | 16 | done |
| React | 8 | 25 | done |
| Databases | 1 | 3 | done |
| NodeJS | 8 | 30 | **here** — first project done |
| Getting Hired | 2 | 14 | off the route |

Foundations is not in it. It is taken before a path is chosen and is not part
of this one, and it is long finished — Odin Recipes, the landing page, Rock
Paper Scissors, Etch-a-Sketch and the calculator are all in
`~/Work/Master Roachi/odin-projects`.

## What is off the route, and why

`0006_routes.sql` added `on_route` for this curriculum specifically: *"what is
being asked is '18 of the 41 I am actually doing'"*. A path with nothing
switched off makes the column do nothing, and the honest answer here is one
whole course.

**Getting Hired, 14 lessons.** Networking, job leads, a CV, interviewing, and
two projects whose deliverables are a resume and a personal website built to be
hired with. `SPEC.md` settles the same question for the site in its own words —
*"This is a personal brand site, not a portfolio for job applications … That
framing is dead"* — and the same answer holds for the course.

It stays in the curriculum rather than being deleted, so that the dashboard
shows a choice was made rather than that the course does not exist. One toggle
per lesson puts it back.

## No detail, and the rule that decides it

`0007_lesson_detail.sql` states it: detail is nullable *"because for a
transcribed curriculum the substance is in the resource"*. Every lesson here is
a maintained page on theodinproject.com. Restating it would duplicate what the
link already gives and would go stale the first time Odin edited a lesson.

The same rule is why **Greek and Japanese carry no detail either**, and why
Godot, Drawing, Aseprite and Piano all do: those four are designed, and a
designed curriculum has nowhere else to keep its substance.

The written record that Odin left behind is not lesson detail anyway — it is
the eight handoff notes in `odin-projects/handoff/`, which cover the JavaScript
CS section, hash maps, testing, Advanced HTML and CSS, React, databases and
NodeJS in order. Those are worth more than a restated lesson page and already
exist.

## Nothing is ticked, deliberately

Five courses and the first NodeJS project are finished in reality. None of it
is ticked here, because **the dates are not recoverable**.

`odin-projects` gives 2026-09-03 for twenty of its twenty-four project folders,
which is the day the repository was reorganised rather than the day anything
was learned. Only five carry what looks like a real date — the landing page and
admin dashboard on 28 July, the library on 3 August, tic-tac-toe on the 4th,
the restaurant page on the 8th.

`done_on` is a date and not a boolean on purpose: *"knowing a lesson is done is
worth less than knowing when"* (`0003`). Filling 114 rows with a day the work
did not happen would destroy the one thing the column was chosen for, and it
could not be undone, because the real dates are gone.

So the backfill is a statement with a date **he** supplies, written out at the
foot of `odin.mjs`. The dashboard also accepts a day per lesson — the API takes
one *"for catching up on something done yesterday"* — so anything he actually
remembers can be recorded truthfully instead.

## Where he is

NodeJS, after **Project: Basic Informational Site** (`basic-node-server` in the
projects repository — four pages on the raw `http` module, no Express, no
dependencies).

Next: Environment Variables, then the Express section — Introduction to
Frameworks, Express, Routes, Controllers, Views, and then
**Project: Mini Message Board**.
