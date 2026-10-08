// Builds the Godot curriculum.
//
// Source: scripts/curriculums/godot.md.
//
// FROM ZERO, DELIBERATELY. Shepherds and Cultus hold about 143,000 lines of
// GDScript between them, and Master Roachi wrote none of it — I did. So the
// codebase is not evidence of what he knows; it is the thing he wants to be
// able to read, judge and change. That makes this a real beginner curriculum
// whose finish line happens to be unusually far along: by stage 10 the engine
// has no corners left that those 143,000 lines use and he has not met.
//
// Ordered so that nothing depends on a later stage. The editor before the
// tree, the tree before the language, the language before the nodes, and
// signals before anything that needs two objects to talk. Stages 8-10 are
// the parts a 2D game needs and a tutorial never reaches.
//
// EVERY LESSON CARRIES ITS SUBSTANCE, which is the whole point of the detail
// column. "CharacterBody2D and move_and_slide" names a node; it does not say
// that motion_mode must be Floating for a top-down game, or that velocity is
// in pixels per second, or that move_and_slide applies delta itself. The
// detail is the lesson; the name is its label.
//
// Prints SQL. Nothing is executed here.

const SOURCE = 'scripts/curriculums/godot.md';
const NAME = 'Godot';

// The substance of each lesson, keyed by its name.
//
// In JSON rather than in this file because the prose is Markdown full of
// GDScript, and every backtick, quote and ${ would need escaping inside a JS
// template literal — one missed escape turns a 92-lesson curriculum into a
// syntax error. JSON needs no escaping and the prose stays editable.
import detail from './godot-detail.json' with { type: 'json' };

/** The detail for a lesson, or null where none is written. */
function detailFor(name) {
  const text = detail[name];
  if (text === undefined) {
    // Loud rather than silent: a lesson renamed here and not in the JSON
    // would otherwise quietly lose its substance.
    console.error(`  no detail for: ${name}`);
    return null;
  }
  return text;
}

const stages = [
  {
    name: '1 · The editor',
    lessons: [
      'Install Godot 4.7 and the export templates',
      'Make a project: renderer choice, folder layout, project.godot',
      'The interface: Scene, FileSystem, Inspector, Node docks',
      'The 2D viewport: pan, zoom, select, snap',
      'Run the project, run the current scene, and the two shortcuts',
      'The Output, Debugger, and remote Scene tree while running',
      'Editor settings worth changing on day one',
      'The built-in docs: F1, and Ctrl-click on any class name',
    ],
  },
  {
    name: '2 · Scenes and nodes',
    lessons: [
      'A node is an object in a tree; a scene is a saved tree',
      'Your first scene: Node2D root, Sprite2D child',
      'Saving a scene as .tscn, and what the file actually contains',
      'Instancing a scene inside another scene',
      "Editable children, and overriding an instance's properties",
      'Scene inheritance',
      'The node lifecycle: _init, _enter_tree, _ready, in order',
      'owner, get_parent, $ paths and % unique names',
    ],
  },
  {
    name: '3 · GDScript',
    lessons: [
      'Attach a script: extends, class_name, and the file header',
      'Variables, static typing, and why you always annotate',
      'Constants, enums, and static variables',
      'Control flow: if, elif, else, and match',
      'Loops: for, while, range, break and continue',
      'Functions, default arguments, and return types',
      'Arrays and typed arrays',
      'Dictionaries',
      'Classes: inner classes, inheritance, and super',
      '@export and the Inspector',
      '_process and _physics_process, and what delta means',
      'Callable, lambdas, and bind',
    ],
  },
  {
    name: '4 · 2D and movement',
    lessons: [
      'Node2D: position, rotation, scale, local against global',
      'Sprite2D, texture import, and turning filtering off',
      'Input: the InputMap, is_action_pressed against just_pressed',
      '_input, _unhandled_input, and the event order',
      'CharacterBody2D and move_and_slide',
      'Velocity, acceleration, and making movement feel right',
      'CollisionShape2D, and choosing the shape',
      'Area2D, body_entered, and overlap queries',
      'RigidBody2D and StaticBody2D — when each is right',
      'RayCast2D, shape queries, and asking the world a question',
    ],
  },
  {
    name: '5 · Signals and structure',
    lessons: [
      'Built-in signals, and connecting them in the editor',
      'Declaring signals, and emitting them',
      'connect() in code, and disconnecting',
      'Who connects to whom: call down, signal up',
      'Groups: add_to_group, and when that is the right answer',
      'Autoloads: what earns one, and what does not',
      'queue_free, free, and is_instance_valid',
      'await, and awaiting a signal',
    ],
  },
  {
    name: '6 · Animation',
    lessons: [
      'AnimatedSprite2D and SpriteFrames',
      'Importing a sprite sheet into SpriteFrames',
      'AnimationPlayer: keyframe any property, not just sprites',
      'Tracks: property, call-method, audio, and animation',
      'animation_finished, animation_changed, and driving state from them',
      'AnimationTree and the StateMachine node',
      'travel(), and the playback parameter',
      'BlendSpace2D for 8-direction movement',
      'Tween: create_tween, tween_property, and easing',
      'Timer, create_timer, and counting frames',
    ],
  },
  {
    name: '7 · Data and resources',
    lessons: [
      'Resource: a custom data class with class_name and @export',
      'Saving a .tres, and editing it in the Inspector',
      'The shared-resource trap: duplicate() and resource_local_to_scene',
      '@export hints, groups, and a readable Inspector',
      'preload, load, and ResourceLoader threaded loading',
      'FileAccess, user://, and saving a game',
      'JSON, and when to use it instead',
      '@tool scripts: running code in the editor',
    ],
  },
  {
    name: '8 · Worlds',
    lessons: [
      'TileSet and TileMapLayer',
      'Atlas sources, and painting a map',
      'Terrain sets and autotiling',
      'Physics, navigation and occlusion layers on a tile',
      'Custom data layers, and reading them from script',
      'NavigationRegion2D and baking a polygon',
      'NavigationAgent2D: target_position and get_next_path_position',
      'Avoidance, and collision layers and masks',
    ],
  },
  {
    name: '9 · Interface and camera',
    lessons: [
      'Control nodes, anchors and offsets',
      'Containers: VBox, HBox, Grid, Margin',
      'Labels, buttons, and the nodes you will actually use',
      'Theme resources, and styling once instead of everywhere',
      'CanvasLayer, and UI that ignores the camera',
      'Camera2D: limits, smoothing, and zoom',
      'Viewport scaling, and the stretch mode for pixel art',
      'SubViewport, and rendering a scene into a texture',
    ],
  },
  {
    name: '10 · Looking good, and shipping',
    lessons: [
      'The renderers: Forward+, Mobile, Compatibility',
      'The canvas_item shader: vertex, fragment, light',
      'uniform, ShaderMaterial, and set_shader_parameter',
      '2D lights: PointLight2D, occluders, and CanvasModulate',
      'Particles: GPUParticles2D and the process material',
      'Audio: AudioStreamPlayer, buses, and the Audio tab',
      'The profiler, and Performance.get_monitor',
      'Draw calls, batching, and what actually costs frames in 2D',
      'print_orphan_nodes, and finding leaks',
      'Export templates, presets, and export_presets.cfg',
      'Headless runs, --script, and a test gate',
      'Export to each target, and run it',
    ],
  },
];

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/godot.mjs. Read before running.',
  // Rebuildable without losing its place. The row is created only if it is
  // not already there, and its modules are cleared instead — deleting the
  // curriculum and reinserting it would take a new position at the end, and
  // curriculum order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select ${q(NAME)}, ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())}\n` +
    `  where not exists (select 1 from curriculums where name = ${q(NAME)});`,
  `update curriculums set source = ${q(SOURCE)} where name = ${q(NAME)};`,
  // Cascade takes the lessons with them.
  `delete from modules where curriculum_id =\n` +
    `  (select id from curriculums where name = ${q(NAME)});`,
];

stages.forEach((stage, m) => {
  out.push(
    `insert into modules (curriculum_id, name, position)\n` +
      `  values ((select id from curriculums where name = ${q(NAME)}), ${q(stage.name)}, ${m + 1});`,
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
  `modules: ${stages.length}  lessons: ${stages.reduce((n, s) => n + s.lessons.length, 0)}`,
);
