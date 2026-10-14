// Builds the Godot curriculum.
//
// Source: scripts/curriculums/godot.md, which is the plan and the argument.
// The material is in godot-detail.json, for the reason japanese.mjs gives:
// prose full of GDScript does not belong inside a JS template literal, where a
// single unescaped backtick breaks the build.
//
// WHY IT STARTS AT ZERO. the-world-of-terrath/products/ holds 672 script files
// and 163,533 lines of GDScript across three projects — shepherds-we-shall-be,
// cultus-botanicus and the-lost-sheep — all on Godot 4.7, GL Compatibility.
// MASTER ROACHI WROTE NONE OF IT. I did. So none of it is evidence of what he
// knows, and "skip the basics" was built on a false premise. The codebase is
// the FINISH LINE: three real projects he owns and cannot yet read.
//
// A REWRITE, 2026-10-14. The first version (2026-10-09) had 92 lessons
// averaging 1,162 characters — good notes, and not lessons. NOTHING DIRECTED
// PRACTICE on any of the 92, which is half of his standing ruling: teach the
// point in full and then direct practice. His four rulings for the rewrite:
//
//   1. EXPAND THE STRUCTURE, not just the depth. The ten stages are kept and
//      lessons are added inside them.
//   2. EVERYTHING — 3D, multiplayer and C# too, as stages 11 to 13. The first
//      version left all three out because every project is 2D GDScript;
//      overruled, because "zero to mastery" is taken literally.
//   3. NO CARD DECK. The only curriculum without one: F1 opens the class
//      reference and the practice is building things.
//   4. TEACH FROM HIS OWN CODE — named project, named path, named symbol, and
//      never a line number, so a moved function is still findable.
//
// ONE STANDING DECISION WAS WRONG AND IS GONE. The first version claimed
// "nearest-neighbour filtering project-wide, and snap_2d_transforms_to_pixel
// on". Neither is set in the real project — its [rendering] section is empty.
// Shepherds uses a 960x540 viewport with integer scaling plus a ViewportSizer
// autoload, and at an integer scale off a low-res viewport every game pixel
// already lands on a whole screen pixel. Stage 9 teaches both and says which.
//
// Prints SQL. Nothing is executed here — `npm run curriculum godot`.

import detail from './godot-detail.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/godot.md';
const NAME = 'Godot';

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) =>
  value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`;

const NOW = new Date().toISOString();
const CURRICULUM = `(select id from curriculums where name = ${q(NAME)})`;
/** The lesson just inserted. The other scripts use the same trick. */
const LESSON = '(select max(id) from lessons)';

/** Every key asked for, so a stray one in the data file can be found. */
const askedDetail = new Set();
const missing = [];

function detailFor(name) {
  askedDetail.add(name);
  const text = detail[name];
  if (text === undefined) {
    // Loud rather than silent: a lesson renamed here and not in the data file
    // would otherwise quietly lose its material.
    missing.push(name);
    return null;
  }
  return text;
}

/** Keys in the data file that no lesson asked for — a rename left behind. */
const strays = () => Object.keys(detail).filter((key) => !askedDetail.has(key));

/**
 * A lesson is either a bare name or [name, sources]. Sources are per-lesson
 * rows in `sources`; the curriculum's OWN list (lesson_id is null) is
 * dashboard-owned and no script regenerates it.
 */
const nameOf = (lesson) => (Array.isArray(lesson) ? lesson[0] : lesson);
const sourcesOf = (lesson) => (Array.isArray(lesson) ? (lesson[1] ?? []) : []);

const stages = [
  {
    name: '1 · The editor',
    lessons: [
      ['What this curriculum is for', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Install Godot 4.7: the standard build, not .NET', [{ title: 'Godot downloads', url: 'https://godotengine.org/download/', note: 'The standard build and the export templates. Take 4.7.x stable, not a 4.8 dev.' }]],
      ['The export templates, and getting them now', [{ title: 'Godot downloads', url: 'https://godotengine.org/download/', note: 'The standard build and the export templates. Take 4.7.x stable, not a 4.8 dev.' }]],
      ['Make a project: the renderer choice', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The project folder, and what project.godot is', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The interface: the docks, and what each is for', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The Scene dock: the tree and its icons', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The FileSystem dock, res:// and user://', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The Inspector, and where a property is actually stored', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The Node dock: signals and groups', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['The 2D viewport: pan, zoom, select, and snapping', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Running: F5, F6, F7, F8', [{ title: 'Default editor shortcuts', url: 'https://docs.godotengine.org/en/stable/tutorials/editor/default_key_mapping.html', note: 'F1 Search Help, F5 Play, F6 Play Scene, F7 Pause, F8 Stop.' }]],
      ['The Output panel: print, push_warning, push_error', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The Debugger: breakpoints, the stack, and the inspector', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The remote Scene tree, while the game runs', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The Asset Store, new in 4.7', [{ title: 'Godot Asset Store', url: 'https://store.godotengine.org/', note: 'Replaces the Asset Library in 4.7. The in-editor tab can 500 in 4.7.2; the web version works.' }, { title: 'Kenney — free assets', url: 'https://kenney.nl/assets', note: 'CC0 sprites, tiles, UI and audio, no attribution required. So a lesson never stalls for want of art.' }]],
      ['Editor settings worth changing on day one', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The built-in docs: F1, Ctrl-click, and the class reference', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'GDQuest — Learn GDScript From Zero', url: 'https://gdquest.github.io/learn-gdscript/', note: 'Free and open source, 27 interactive lessons with exercises. Runs inside Godot.' }]],
    ],
  },
  {
    name: '2 · Scenes and nodes',
    lessons: [
      ['A node is an object in a tree', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['A scene is a saved tree', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Choosing a root node, and what it decides', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Your first scene: Node2D and Sprite2D', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Kenney — free assets', url: 'https://kenney.nl/assets', note: 'CC0 sprites, tiles, UI and audio — so a lesson never stalls for want of art.' }]],
      ['Saving as .tscn, and reading the file', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Instancing a scene inside another scene', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['What an instance stores: the override list', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Editable children', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Scene inheritance', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The node lifecycle: _init, _enter_tree, _ready', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['_ready order, and why children go first', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['$ paths and get_node', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['% unique names', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['owner, and what it means in a saved scene', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Adding and removing nodes in code', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['queue_free, free, and why never free', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Autoloads: always-there scripts and scenes', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['When an autoload is right', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Groups: finding nodes without paths', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Reading a real scene: main.tscn', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
    ],
  },
  {
    name: '3 · GDScript',
    lessons: [
      ['Attach a script: extends, class_name, and the file header', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Variables, static typing, and why you always annotate', [{ title: 'GDQuest — Learn GDScript From Zero', url: 'https://gdquest.github.io/learn-gdscript/', note: 'Free and open source, 27 interactive lessons with exercises. Runs inside Godot.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The built-in types, and which to reach for', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Numbers: int, float, and the traps', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['String, StringName, and NodePath', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Vector2, Vector2i, and the vector maths you need', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Constants, enums, and static variables', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Control flow: if, elif, else, and truthiness', [{ title: 'GDQuest — Learn GDScript From Zero', url: 'https://gdquest.github.io/learn-gdscript/', note: 'Free and open source, 27 interactive lessons with exercises. Runs inside Godot.' }]],
      ['match, which is not a switch', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Loops: for, while, range, break, continue', [{ title: 'GDQuest — Learn GDScript From Zero', url: 'https://gdquest.github.io/learn-gdscript/', note: 'Free and open source, 27 interactive lessons with exercises. Runs inside Godot.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Functions, default arguments, and return types', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Arrays, and typed arrays', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Array methods worth knowing', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Dictionaries', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Packed arrays, and when they matter', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['@export, and the Inspector', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['@export variants: ranges, enums, files, groups', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Classes: class_name, inheritance, super', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Inner classes, and when not to', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Static functions, and pure functions', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['_process and _physics_process, and delta', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['The other callbacks: _input, _unhandled_input, _draw', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Signals, declared and emitted', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['await, and asynchronous GDScript', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Callable, lambdas, and bind', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Null, and the safe ways to handle it', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Errors: assert, push_error, and the warnings', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Doc comments, and your class in F1', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Style: the official conventions', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Reading GDScript you did not write', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['The traps list: ten things that bite', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Reading a real script: island_view.gd', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
  {
    name: '4 · 2D and movement',
    lessons: [
      ['The 2D coordinate system, and the pixel', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Node2D transforms: position, rotation, scale, skew', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Global against local coordinates', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['z_index, and what draws on top', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['The physics bodies: which to use', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['CharacterBody2D and move_and_slide', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['velocity, and motion_mode', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Collision shapes, and the shapes to choose', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Collision layers and masks', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['is_on_floor, is_on_wall, and the collision results', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['move_and_collide, and when to use it instead', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Area2D, and detecting without colliding', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['RigidBody2D, and when physics should decide', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['StaticBody2D and AnimatableBody2D', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Input actions, and the Input map', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Input.get_vector, and reading movement', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Just pressed, just released, and the event forms', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Top-down movement, in full', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Platformer movement, in full', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Pixel-perfect movement, and whole-pixel quantising', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['State machines with enum and match', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Raycasts: RayCast2D and the direct space state', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Shape queries and overlap tests', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Knockback, hitstop, and impact', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Projectiles, and the lifetime problem', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Many moving things: nodes against drawing', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Debugging physics: the visible shapes', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Reading real movement code: production_actor.gd', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
    ],
  },
  {
    name: '5 · Signals and structure',
    lessons: [
      ['The problem: two objects that need to talk', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Signals, revisited: the full API', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Call down, signal up', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Why not get_parent()', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The five ways to connect two nodes', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Editor connections against code connections', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Custom signals, and naming them', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Signal payloads, and what to put in them', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['The five production layers', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Dependency direction, and what it buys', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['A view that is told, not asked', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Services, and when something is not a node\'s job', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['The event bus, and why to be careful', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Resources as a communication channel', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Groups and call_group, revisited', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Interfaces in a language without them', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Testing a node in isolation', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Refactoring towards the rule', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Reading the layer boundaries', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['The five layers in practice', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
  {
    name: '6 · Animation',
    lessons: [
      ['The four ways to animate', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['AnimationPlayer: the panel and the timeline', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Keyframes, and what can be animated', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Track types, and the ones that matter', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Interpolation, easing and the curve editor', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Playing animations from code', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Animation libraries, and sharing animations', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Looping, the RESET animation, and autoplay', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['AnimatedSprite2D and SpriteFrames', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Sprite sheets, hframes and the frame property', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Kenney — free assets', url: 'https://kenney.nl/assets', note: 'CC0 sprites, tiles, UI and audio — so a lesson never stalls for want of art.' }]],
      ['The Aseprite pipeline: Aseprite Wizard', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Eight directions, and the naming convention', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['AnimationTree: the three node types', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['The state machine in AnimationTree', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['BlendSpace1D and BlendSpace2D', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Driving an AnimationTree from code', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Tween: the code-first animator', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Tween chaining, parallel and callbacks', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Squash, stretch and the impact toolkit', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Animating the interface', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Animating a shader parameter', [{ title: 'Godot Shaders', url: 'https://godotshaders.com/', note: 'A free library of 2D and 3D shaders, readable as worked examples.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Frame-driven animation by hand', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Performance, and when animation costs', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Reading a real animation setup: body_base_run.gd', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
    ],
  },
  {
    name: '7 · Data and resources',
    lessons: [
      ['What a Resource is', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Writing a custom Resource class', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['@export in a Resource, and the Inspector', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Saving a .tres, and reading one', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Loading resources, and the cache', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Sharing, duplicating, and Make Unique', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Nested resources, and sub-resources', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Separating definition from runtime state', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Signals on a resource', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['@tool, and running in the editor', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['The @tool contagion rule', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Configuration warnings, and editor feedback', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['A definitions folder: the pattern', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['JSON as the authority', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Validating data, and failing loudly', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Saving a game: the file, and the format', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['What not to save, and migration', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['user:// and where saves live', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Generating data with a tool script', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Testing a data layer', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['ResourceSaver, and resources as saves', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Reading a real data layer: IslandData', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
  {
    name: '8 · Worlds',
    lessons: [
      ['TileMapLayer, and what replaced TileMap', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Building a TileSet', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Painting, and the tilemap tools', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Tile collision', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Terrains, and autotiling', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Per-tile custom data', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Several layers, and what each is for', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Y-sorting a tilemap against actors', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Tilemap coordinates: map, local, global', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Reading and writing cells from code', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Scenes as tiles', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Navigation: the mesh and the agent', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Pathfinding with AStarGrid2D', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['A sparse grid without a tilemap', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Drawing a world instead of tiling it', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Chunking, and large worlds', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['The world\'s edge, and camera limits', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Procedural generation, briefly', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Tools for painting a world', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Reading a real world: the ground and the island', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
  {
    name: '9 · Interface and camera',
    lessons: [
      ['Control, and why it is not Node2D', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Anchors and offsets', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The container nodes', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Size flags, and how space is divided', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The common Control nodes', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Themes: the resource', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Theme overrides, and when to use them', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Fonts, and pixel-art text', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Kenney — free assets', url: 'https://kenney.nl/assets', note: 'CC0 sprites, tiles, UI and audio — so a lesson never stalls for want of art.' }]],
      ['The focus system, and keyboard navigation', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['CanvasLayer, and drawing above the world', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The stretch problem', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Integer scaling, and the whole-pixel rule', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['ViewportSizer: reading the real solution', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['SubViewport, and rendering the world separately', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Camera2D: following, smoothing, limits', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Screen shake, properly', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Parallax, and backgrounds that move', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['World-space UI: health bars and damage numbers', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['The HUD, and what it must not know', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Polling against being told, in interface', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Responsive interface, and the design frame', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Reading a real interface', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
  {
    name: '10 · Looking good, shipping, and testing',
    lessons: [
      ['The renderers: Forward+, Mobile, Compatibility', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['The canvas_item shader: vertex, fragment, light', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot Shaders', url: 'https://godotshaders.com/', note: 'A free library of 2D and 3D shaders, readable as worked examples.' }]],
      ['Shader uniforms, ShaderMaterial, and set_shader_parameter', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Useful 2D shaders: flash, outline, dissolve', [{ title: 'Godot Shaders', url: 'https://godotshaders.com/', note: 'A free library of 2D and 3D shaders, readable as worked examples.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Screen-reading shaders and post-processing', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot Shaders', url: 'https://godotshaders.com/', note: 'A free library of 2D and 3D shaders, readable as worked examples.' }]],
      ['Reading a real shader: wind', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['2D lights: PointLight2D and occluders', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['CanvasModulate, and night', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Normal maps, and lighting pixel art', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot Shaders', url: 'https://godotshaders.com/', note: 'A free library of 2D and 3D shaders, readable as worked examples.' }]],
      ['GPUParticles2D and the process material', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Particles by hand, and when to prefer them', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Audio: AudioStreamPlayer and positional sound', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Audio buses, effects, and mixing', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Music, cues, and crossfading', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['The options screen, and settings that persist', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The profiler', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Performance monitors, and a debug overlay', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Draw calls, and what costs frames in 2D', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Orphans, leaks, and lifetime bugs', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Testing: extends SceneTree', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Reading a real test suite', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Running the suite in parallel', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Testing an interface', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Determinism, seeds, and simulating the game', [{ title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Export templates, presets, and export_presets.cfg', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Export, headless gates, and shipping', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
  {
    name: '11 · 3D, from zero',
    lessons: [
      ['The 3D editor, and moving around it', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Node3D, and transforms in three dimensions', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Quaternions, basis, and rotating properly', [{ title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }, { title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['MeshInstance3D and the primitive meshes', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Importing models: glTF and the import dock', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Kenney — free assets', url: 'https://kenney.nl/assets', note: 'CC0 sprites, tiles, UI and audio — so a lesson never stalls for want of art.' }]],
      ['StandardMaterial3D', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['PBR: what the maps mean', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Kenney — free assets', url: 'https://kenney.nl/assets', note: 'CC0 sprites, tiles, UI and audio — so a lesson never stalls for want of art.' }]],
      ['Camera3D, projection, and the planes', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Lights in 3D: Directional, Omni, Spot', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Shadows in 3D', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Environment, sky, and tonemapping', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Global illumination: SDFGI, LightmapGI, VoxelGI', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Reflections: probes, SSR, and roughness', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['CharacterBody3D and a first-person controller', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['A third-person camera, and SpringArm3D', [{ title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['3D physics: bodies, shapes, layers', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Raycasting in 3D, and picking', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['CSG, and blocking out a level', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['GridMap', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Kenney — free assets', url: 'https://kenney.nl/assets', note: 'CC0 sprites, tiles, UI and audio — so a lesson never stalls for want of art.' }]],
      ['Animation in 3D: AnimationTree and retargeting', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Skeleton3D, bones, and attachments', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['NavigationRegion3D and agents', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Decals, 3D particles, and effects', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['The spatial shader', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot Shaders', url: 'https://godotshaders.com/', note: 'A free library of 2D and 3D shaders, readable as worked examples.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Reading a real 3D scene: OrbView3D', [{ title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['What differs from 2D, and what carries over', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
    ],
  },
  {
    name: '12 · Multiplayer',
    lessons: [
      ['What multiplayer means, and whether you need it', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['The high-level API: peers and SceneMultiplayer', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['ENetMultiplayerPeer: host and join', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Authority, and set_multiplayer_authority', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['RPCs: the @rpc annotation', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['MultiplayerSpawner', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['MultiplayerSynchronizer', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['What to synchronise, and what not to', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Client-server, peer-to-peer, and the listen server', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Latency: prediction and reconciliation', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Cheating, and server validation', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Interpolation, and making other players look smooth', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['WebSocket and WebRTC', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Organising a scene for multiplayer', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'KidsCanCode — Godot Recipes', url: 'https://kidscancode.org/godot_recipes/4.x/', note: 'Short, self-contained solutions for the problems that recur.' }]],
      ['Testing multiplayer', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Matchmaking, NAT, and what Godot leaves out', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Split-screen and shared-screen multiplayer', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['What to take from this stage', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
  {
    name: '13 · C# and .NET',
    lessons: [
      ['What the .NET build is, and whether to use it', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Setting it up: SDK, editor, and IDE', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }]],
      ['Project structure: the .csproj and the build', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['C# for a GDScript programmer', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Node scripts in C#: lifecycle and attributes', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Signals in C#', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Custom resources in C#', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['Collections and marshalling', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['async/await, and how it differs', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Calling GDScript from C#, and back', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Nullability, Variant, and the type boundary', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Memory, GC, and disposal', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Performance: when C# is faster', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
      ['Tooling: debugging, tests, and NuGet', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'shepherds-we-shall-be', note: 'His own: 535 scripts, 114,394 lines, 82 scenes, 10 shaders. The finish line.' }]],
      ['GDExtension and C++, briefly', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'Godot class reference', url: 'https://docs.godotengine.org/en/stable/classes/', note: 'The same reference F1 opens inside the editor, offline and version-matched.' }]],
      ['Whether to use it, honestly', [{ title: 'Godot manual', url: 'https://docs.godotengine.org/en/stable/', note: 'The hand-written tutorials. Check the version selector — /en/stable/ is 4.7.' }, { title: 'the-lost-sheep', note: 'His own: 69 scripts, 20,139 lines, 3 scenes. The smallest of the three, so the one to read first.' }]],
    ],
  },
];

const out = [
  '-- Generated by scripts/curriculums/godot.mjs. Read before running.',
  '-- Apply it with `npm run curriculum godot`, which carries ticks and detail',
  '-- typed at the dashboard across the rebuild below. Running this file through',
  '-- wrangler by hand discards every one of them.',
  // Rebuildable without losing its place: the row is created only if it is not
  // already there, and its modules are cleared instead. Deleting the curriculum
  // and reinserting it would take a new position at the end, and curriculum
  // order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select ${q(NAME)}, ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(NOW)}\n` +
    `  where not exists (select 1 from curriculums where name = ${q(NAME)});`,
  `update curriculums set source = ${q(SOURCE)} where name = ${q(NAME)};`,

  // Lesson-scoped sources are the script's own and go before the lessons do.
  // ON DELETE CASCADE would cover it wherever foreign keys are enforced — D1
  // enforces them, node:sqlite does not — so it is written out rather than
  // relied upon. The curriculum's own list, where lesson_id is null, is NOT
  // touched: nothing could regenerate it. See migration 0009.
  `delete from sources where lesson_id is not null and curriculum_id = ${CURRICULUM};`,

  // Lessons, then modules. Same reasoning.
  `delete from lessons where module_id in\n` +
    `  (select id from modules where curriculum_id = ${CURRICULUM});`,
  `delete from modules where curriculum_id = ${CURRICULUM};`,
];

stages.forEach((stage, m) => {
  out.push(
    '',
    `-- ${stage.name}`,
    `insert into modules (curriculum_id, name, position)\n` +
      `  values (${CURRICULUM}, ${q(stage.name)}, ${m + 1});`,
  );

  stage.lessons.forEach((lesson, l) => {
    const name = nameOf(lesson);
    out.push(
      `insert into lessons (module_id, name, position, on_route, detail)\n` +
        `  values ((select max(id) from modules), ${q(name)}, ${l + 1}, 1, ${q(detailFor(name))});`,
    );

    sourcesOf(lesson).forEach((source, s) => {
      out.push(
        `insert into sources (curriculum_id, lesson_id, title, url, note, position)\n` +
          `  values (${CURRICULUM}, ${LESSON}, ${q(source.title)}, ${q(source.url ?? null)},` +
          ` ${q(source.note ?? null)}, ${s + 1});`,
      );
    });
  });
});

if (missing.length) {
  console.error(`\nNo material for ${missing.length} lesson(s):`);
  for (const name of missing) console.error(`  · ${name}`);
  console.error('\nEvery lesson teaches its point in full. Nothing printed.');
  process.exit(1);
}
for (const key of strays()) console.error(`! godot-detail.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const sources = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, lesson) => k + sourcesOf(lesson).length, 0),
  0,
);
console.error(`modules: ${stages.length}  lessons: ${lessons}  lesson sources: ${sources}`);
