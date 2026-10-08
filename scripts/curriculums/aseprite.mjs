// Builds the Aseprite and Pixel Art curriculum.
//
// Source: scripts/curriculums/aseprite.md, and through it Shepherds' own
// design/art-and-animation.md. The structure is designed — there is no pixel
// art curriculum on the machine and no pixel art book in the library — but
// every standard it teaches is quoted from the art contract, and the section
// is named in the milestone so the claim can be checked.
//
// THE GOAL IS THE CONTRACT, which is why this is narrow. "Learn pixel art" has
// no finish line; §10.1 does, and an asset either satisfies it or it does not.
//
// Two threads. The tool is a small program and stage 1 exists to learn all of
// it deliberately rather than absorbing it accidentally over a year of bad
// habits. Everything after stage 1 is craft, which no menu teaches.
//
// Prints SQL. Nothing is executed here.

const SOURCE = 'scripts/curriculums/aseprite.md';

// The substance of each lesson, keyed by its name.
//
// In JSON rather than in this file because the prose is Markdown and contains
// backticks, quotes and ${ — all of which have to be escaped inside a JS
// template literal, and one missed escape turns a 60-lesson curriculum into a
// syntax error. JSON needs no escaping and the prose stays editable.
import detail from './aseprite-detail.json' with { type: 'json' };

/** The detail for a lesson, or null where none is written. */
function detailFor(name) {
  const text = detail[name];
  if (text === undefined) {
    // Loud rather than silent: a lesson whose name was edited here and not in
    // the JSON would otherwise quietly lose its substance.
    console.error(`  no detail for: ${name}`);
    return null;
  }
  return text;
}

const stages = [
  {
    name: '1 · The tool',
    lessons: [
      'A 112 × 112 canvas with a guide at pivot (56, 96) — §4',
      'Load the Terrath palette as an Aseprite palette file — colour-palette.md',
      'Pencil, eraser and bucket at 1 px with anti-aliasing off everywhere',
      'Selection, colour replace and shading mode',
      'Layers and groups — body, equipment, shadow, effects and nothing finer (§3.1)',
      'Frames, tags, onion skin, and playback at 12 fps',
      'A tag named lower-case snake-case, and one beginning with _ (§5.3)',
      'Export a sheet, and find where Aseprite Wizard expects it (§3.1)',
      'Learn the shortcuts for pencil, eyedropper, zoom, frame step and play',
      'Aseprite’s own docs, start to finish, once',
    ],
  },
  {
    name: '2 · The pixel',
    lessons: [
      'Draw at 1× only — every judgement made at native scale, never zoomed (§10.1)',
      '50 clean one-pixel lines at every angle, no stray pixels',
      'The jaggy rule: 20 curves with no single-pixel stair breaks',
      '20 circles of different diameters, pixel-perfect, drawn by hand',
      'Recognise banding in someone else’s sprite, then in your own',
      'Deliberate clusters versus noise — redraw a noisy patch as clusters (§10.1)',
      'Draw the same 32 × 32 object three times: noisy, clean, and clean with fewer pixels',
    ],
  },
  {
    name: '3 · Value and light',
    lessons: [
      'A sphere, a cube and a cylinder with key light from the upper-left (§10.1)',
      'Shadows and undersides favouring the lower-right, restrained (§10.1)',
      'Four values of stone; four of cloth; four of metal; four of wood',
      '20 materials at three or four purposeful values each — no gradients (§10.1)',
      'THE BLACK TEST: a sprite still identifiable as solid black (§10.1)',
      'THE GREY TEST: the same sprite identifiable with all hue removed (§10.1)',
      'Fix a sprite that fails both, and write down which change fixed it',
      'Preserve negative gaps between body, limbs and equipment (§10.1)',
    ],
  },
  {
    name: '4 · Colour and the palette',
    lessons: [
      'Read colour-palette.md and find the ramps rather than the swatches',
      'Shadows by hue shift, not by darkening alone',
      'A one-pixel dark COLOURED outline — never universal pure black (§10.1)',
      'No double outlines, and equipment never merged into the torso (§10.1)',
      'Choose a 12–18 colour subset for a hero from the palette (§10.1)',
      'Choose 4–10 for a small prop (§10.1)',
      'Choose 8–26 for an ordinary enemy (§10.1)',
      'Redraw one asset with six fewer colours and decide whether it lost anything',
    ],
  },
  {
    name: '5 · The sprite, standing still',
    lessons: [
      'A prop in 4–10 colours, correct outline, at 1× (§10.1)',
      'A character facing S: 112 × 112, pivot (56, 96), ~80 px sole-to-crown (§4)',
      'Stable ground contact, and a pose that keeps anatomical scale (§4)',
      'Signature equipment that breaks the torso silhouette (§10.1)',
      'The same character in all eight authored directions, no mirroring (§5.4)',
      'Readability in a busy party scene and in darkness (§10.1)',
      'An asset brief written BEFORE the next asset is drawn (§10.2)',
    ],
  },
  {
    name: '6 · The sprite, moving',
    lessons: [
      'The approved idle, one direction: 24 frames at 12 fps, a 2-second loop (§5.1)',
      'Three to five meaningful poses, with the held portion and loop drop (§5.1)',
      'The idle in all eight directions, authored separately (§5.1)',
      'The approved run, one direction: 12 frames at 12 fps (§5.2)',
      'The run in eight directions, legs movement-facing (§5.2)',
      'Upper body aim-facing, at most two direction steps from the legs (§5.2, §5.4)',
      'A one-shot action: anticipation, active frames, impact, recovery (§5.3)',
      'Tag it with a leading _ so it imports without looping (§5.3)',
      'Check every animation at native scale, in motion, on real ground, lit (§5.3)',
      'A telegraph that reads through pose and silhouette, not colour (§5.3)',
    ],
  },
  {
    name: '7 · Into the game',
    lessons: [
      'Masters under media/sprites/<category>/<family>/<asset-key>/ (§3.1)',
      'Named <asset-key>_<action>_<direction>.aseprite, one tag each (§3.1)',
      'Names that state action and direction — idle_s, move_ne (§5.4)',
      'Import through Aseprite Wizard to SpriteFrames, one animation per file',
      'Exports land in media/sprites/_exports/ and are never hand-edited (§3.1)',
      'See it in Godot at native scale under Light2D, in the real scene',
      'One unambiguous editable master, and the derived files understood as derived (§3)',
    ],
  },
  {
    name: '8 · Production',
    lessons: [
      'Study one Eastward screenshot for value organisation — reference, not template (§2)',
      'Study one Sea of Stars screenshot the same way (§2)',
      'Draw the sheep walk masters — the Highfold’s flock is still grey boxes',
      'Draw the real menu window art and retire the placeholder (§11)',
      'Replace one greybox terrain placeholder with an approved master (§11)',
      'Draw one prop to contract, start to finish, in a single sitting',
      'One asset a week, to contract, reviewed against §10.1 before it is accepted',
    ],
  },
];

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/aseprite.mjs. Read before running.',
  // Rebuildable without losing its place. The row is created only if it is
  // not already there, and its modules are cleared instead — deleting the
  // curriculum and reinserting it would take a new position at the end, and
  // curriculum order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select 'Aseprite and pixel art', ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())}\n` +
    `  where not exists (select 1 from curriculums where name = 'Aseprite and pixel art');`,
  `update curriculums set source = ${q(SOURCE)} where name = 'Aseprite and pixel art';`,
  // Cascade takes the lessons with them.
  `delete from modules where curriculum_id =\n` +
    `  (select id from curriculums where name = 'Aseprite and pixel art');`,
];

stages.forEach((stage, m) => {
  out.push(
    `insert into modules (curriculum_id, name, position)\n` +
      `  values ((select id from curriculums where name = 'Aseprite and pixel art'), ${q(stage.name)}, ${m + 1});`,
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
