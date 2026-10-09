// Builds the Drawing curriculum from scripts/curriculums/drawing.md.
//
// Designed, not transcribed — there is no drawing curriculum on the machine —
// but built around the library that IS there, so every milestone names the
// book on hand that backs it. Nothing here needs buying.
//
// THE COUNTS ARE THE METHOD. Drawing is the one subject in this set where
// quantity is not a proxy for learning, it is the learning: "understand
// gesture" is not a milestone, a hundred thirty-second gestures is. So most
// entries carry a number, the numbers are deliberately large, and finishing
// one means finishing it.
//
// Ordering has two rules that are not arbitrary. Gesture comes before anatomy,
// because a figure built on correct muscles and no gesture is a diagram. And
// anatomy comes after construction, because anatomy learned without
// construction is a vocabulary with no grammar.
//
// EVERY MILESTONE CARRIES ITS SUBSTANCE. A count on its own is an instruction
// and not a lesson: "50 ears" says how many and never says that an ear is a C
// with a Y inside it, or that placement between brow line and nose base is what
// actually decides whether one reads. The number is the method; the detail is
// what you are meant to be looking at while you do it that many times.
//
// Prints SQL. Nothing is executed here.

const SOURCE = 'scripts/curriculums/drawing.md';

// The substance of each milestone, keyed by its name.
//
// In JSON rather than in this file for the same reason as the others: the prose
// is Markdown full of apostrophes and quotation marks, and every one would need
// escaping inside a JS template literal. JSON needs none and the prose stays
// editable.
import detail from './drawing-detail.json' with { type: 'json' };

/** The detail for a milestone, or null where none is written. */
function detailFor(name) {
  const text = detail[name];
  if (text === undefined) {
    // Loud rather than silent: a milestone renamed here and not in the JSON
    // would otherwise quietly lose its substance.
    console.error(`  no detail for: ${name}`);
    return null;
  }
  return text;
}

const stages = [
  {
    name: '1 · Seeing',
    lessons: [
      'Pre-instruction drawings: self-portrait, your own hand, a chair — dated and kept (Edwards)',
      'Upside-down drawing: copy a line drawing inverted (Edwards)',
      '20 blind contour drawings of your own hand (Edwards)',
      '20 modified contour drawings of everyday objects',
      '10 negative-space drawings — draw the gaps, not the thing (Edwards)',
      'Sighting: angles and proportions measured against vertical and horizontal (Edwards)',
      'Draw one object five times across a week, without looking at the earlier attempts',
      'Keys to Drawing: work the exercises in the first third (Dodson)',
    ],
  },
  {
    name: '2 · Gesture',
    lessons: [
      '100 thirty-second gestures (Vilppu, Drawing Manual)',
      '100 more, from life if there is any life available',
      'Line of action identified and drawn first on 50 figures',
      'Contour and gesture combined — the first exercises (Nicolaides)',
      "Nicolaides' first month of the schedule, as written in the book",
      '50 one-minute gestures with weight — where the mass is sitting',
      '20 one-minute animal gestures (Vilppu, Drawing Animals)',
    ],
  },
  {
    name: '3 · Form and construction',
    lessons: [
      '50 spheres, 50 boxes, 50 cylinders — from imagination, not traced',
      'Cross-contour lines on a sphere, a cylinder and a folded cloth',
      'The same forms with one light source and cast shadows',
      '50 mannequin figures from imagination (Loomis, Figure Drawing)',
      'Block in a figure from reference, 20 times, gesture first',
      'Vilppu: sphere, box and cylinder applied to a live figure',
      'The figure in eight directions, standing — the Shepherds problem, by hand',
      'Foreshortening: 20 limbs pointing at the viewer',
    ],
  },
  {
    name: '4 · Perspective',
    lessons: [
      'One-point: a room from imagination, furniture included (Norling)',
      'Two-point: a building, once with the horizon high and once low',
      'Three-point: looking up at something tall',
      '100 ellipses in perspective, minor axis correct',
      'Place a figure correctly in a one-point scene, scaled to the horizon',
      'Cast shadows from a single source in a constructed scene (D’Amelio)',
      'A street in two-point, from imagination',
      'One Shepherds location drawn in perspective from the map',
    ],
  },
  {
    name: '5 · Anatomy',
    lessons: [
      'Draw the skeleton from memory, front and back (Goldfinger, Simblet)',
      'Ribcage and pelvis as simple forms, 30 times, in rotation',
      'The torso: constructive anatomy, front, back and side (Bridgman)',
      'Arms: the two-bone structure and what rotation does to it',
      'Legs: the same, with weight on one side',
      '50 hands from life — your own is always available (Loomis, Head and Hands)',
      '20 feet, which are harder than they look',
      'Muscles of the back, named and drawn (Hogarth, Dynamic Anatomy)',
      'A figure from imagination with anatomy that survives a second look',
    ],
  },
  {
    name: '6 · Head and portrait',
    lessons: [
      'The Loomis ball-and-plane head, 30 angles from imagination',
      '50 eyes, from life and reference',
      '50 noses',
      '50 mouths',
      '50 ears — the one everybody skips',
      'Head proportions measured from life, not remembered',
      'A portrait from life across three sittings',
      'A portrait from a photograph, and the difference noted',
      '20 expressions from imagination (Hogarth, Drawing the Human Head)',
      'One Shepherds character drawn as a portrait, off the sprite',
    ],
  },
  {
    name: '7 · Composition and rendering',
    lessons: [
      '20 notan studies — two values only, no detail (Dow)',
      '20 thumbnail compositions for a single subject, then pick one',
      'A nine-step value scale, drawn by hand and even',
      'One drawing in five values, no more (Guptill)',
      'Rendering: one subject taken to a finish in pencil',
      'Picture-making: the composition chapters (Loomis, Creative Illustration)',
      'Colour: the first exercises in Edwards’ course',
      'One finished illustration of a Shepherds scene, composed and rendered',
    ],
  },
  {
    name: '8 · Keeping it',
    lessons: [
      'A sketchbook page a day, every day',
      '10 figures a day from life or reference',
      'One finished piece a month, taken past the point it stops being fun',
      'Redraw the stage 1 pre-instruction drawings and compare them honestly',
      'Draw something for Shepherds every week',
      'Draw something purely because you wanted to, every week',
    ],
  },
];

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/drawing.mjs. Read before running.',
  // Rebuildable without losing its place. The row is created only if it is
  // not already there, and its modules are cleared instead — deleting the
  // curriculum and reinserting it would take a new position at the end, and
  // curriculum order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select 'Drawing', ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())}\n` +
    `  where not exists (select 1 from curriculums where name = 'Drawing');`,
  `update curriculums set source = ${q(SOURCE)} where name = 'Drawing';`,
  // Lessons first, then modules. ON DELETE CASCADE covers this wherever foreign
  // keys are enforced — D1 enforces them — and silently does nothing where they
  // are not, orphaning every lesson instead of removing it so that a rebuild
  // quietly adds a second full set nobody can see, because every read joins
  // through modules. Written out rather than relied upon.
  `delete from lessons where module_id in\n` +
    `  (select id from modules where curriculum_id =\n` +
    `     (select id from curriculums where name = 'Drawing'));`,
  `delete from modules where curriculum_id =\n` +
    `  (select id from curriculums where name = 'Drawing');`,
];

stages.forEach((stage, m) => {
  out.push(
    `insert into modules (curriculum_id, name, position)\n` +
      `  values ((select id from curriculums where name = 'Drawing'), ${q(stage.name)}, ${m + 1});`,
  );
  stage.lessons.forEach((lesson, l) => {
    const text = detailFor(lesson);
    out.push(
      `insert into lessons (module_id, name, position, on_route, detail)\n` +
        `  values ((select max(id) from modules), ${q(lesson)}, ${l + 1}, 1, ` +
        `${text === null ? 'null' : q(text)});`,
    );
  });
});

console.log(out.join('\n'));
console.error(
  `modules: ${stages.length}  milestones: ${stages.reduce((n, s) => n + s.lessons.length, 0)}`,
);
