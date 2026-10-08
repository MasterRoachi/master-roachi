// Builds the Piano curriculum from scripts/curriculums/piano.md.
//
// Unlike Japanese, this is a designed path rather than a transcription —
// there was no piano material on the machine to transcribe. The prose
// reasoning lives in piano.md beside this file; the milestones are here.
//
// LESSONS ARE MILESTONES, NOT SESSIONS. That is the real difference from the
// Japanese curriculum and it follows from the subject: a language resource is
// consumed, so a session is "these pages", while a piano skill is acquired, so
// a lesson is "can I do this yet". "C major, two octaves, hands together,
// evenly at 60" is either true or it is not, and dating the day it became true
// is worth more than dating the day a page was turned.
//
// Sight-reading recurs from stage 2 onward rather than sitting in a stage of
// its own. It decays faster than anything else without constant use, and the
// route is walked in order — a sight-reading module at the end would never
// come up as the next thing until everything else was finished, which is
// exactly backwards for the skill that needs the most repetition.
//
// Prints SQL. Nothing is executed here.

const SOURCE = 'scripts/curriculums/piano.md';

const stages = [
  {
    name: '1 · At the keyboard',
    lessons: [
      'Bench height and posture — wrists level, shoulders down, feet flat',
      'Finger numbers 1-5, both hands, named without looking',
      'Find any C on the keyboard; name every white key',
      'The black-key pattern of 2 and 3; sharps and flats',
      'Five-finger pattern C-G, right hand, evenly',
      'Five-finger pattern C-G, left hand, evenly',
      'Legato — two notes joined with no gap and no overlap',
      'Staccato — short, from the wrist, not the arm',
    ],
  },
  {
    name: '2 · Reading',
    lessons: [
      'Treble staff: C-G on lines and spaces, named at sight',
      'Bass staff: C-G below middle C, named at sight',
      'The grand staff — middle C in both clefs, and why it appears twice',
      'Note values: whole, half, quarter',
      '4/4 and bar lines; counting aloud while playing',
      '3/4 and the feel of three against four',
      'Rests, counted as carefully as notes',
      'Eighth notes and subdividing the beat',
      'Play a written four-bar melody, right hand, counting aloud',
      'Play a written four-bar melody, left hand, counting aloud',
      'Sight-read: four new bars a day, one hand, no stopping',
    ],
  },
  {
    name: '3 · Hands together',
    lessons: [
      'Both hands in parallel motion, five-finger pattern',
      'Both hands in contrary motion',
      'Left-hand single notes under a right-hand melody',
      'A first piece, hands together, read from notation',
      'Dynamics: p, mf, f — produced by touch, not by the pedal',
      'Phrasing: shape a four-bar phrase rather than play eight equal notes',
      'Play to a metronome at 60 without drifting',
      'Sight-read: four new bars a day, hands together',
    ],
  },
  {
    name: '4 · Scales and keys',
    lessons: [
      'C major, one octave, right hand, thumb passing under cleanly',
      'C major, one octave, left hand',
      'C major, two octaves, hands together, evenly at 60',
      'G major and F major, one octave each hand',
      'The circle of fifths; key signatures to four sharps and four flats',
      'A natural minor, then harmonic, then melodic — and the difference',
      'Tonic triads and their inversions in C, G and F',
      'Broken chords and arpeggios: C, G, F',
      'All twelve major scales, two octaves, hands together',
      'All twelve harmonic minor scales, two octaves, hands together',
      'Sight-read: a piece in a key with three or more accidentals',
    ],
  },
  {
    name: '5 · Early repertoire',
    lessons: [
      'Bach — Minuet in G, BWV Anh. 114 (Anna Magdalena Notebook)',
      'Bach — Minuet in G minor, BWV Anh. 115',
      'Schumann — Melody, Op. 68 no. 1 (Album for the Young)',
      'Schumann — Soldier’s March, Op. 68 no. 2',
      'Burgmüller — Arabesque, Op. 100 no. 2',
      'Clementi — Sonatina Op. 36 no. 1, first movement',
      'Beethoven — Für Elise, main section',
      'Satie — Gymnopédie no. 1',
      'Sight-read: a complete short piece, first time, at half tempo',
    ],
  },
  {
    name: '6 · Technique',
    lessons: [
      'Hanon 1-5, hands together, 60bpm, evenly',
      'Hanon 1-10 at 80bpm',
      'Czerny Op. 599, studies 1-10',
      'Sustain pedal — syncopated pedalling, changed on the beat after',
      'Scales at 100bpm, four octaves, hands together',
      'Chromatic scale, two octaves, both hands',
      'Octave reaches and the stretch between 1 and 5',
      'Trills, mordents and the ornaments Bach assumes you know',
      'Sight-read: a piece with pedal markings, observed',
    ],
  },
  {
    name: '7 · Intermediate repertoire',
    lessons: [
      'Bach — Prelude in C, WTC Book I',
      'Bach — Invention no. 1 in C, BWV 772',
      'Chopin — Prelude Op. 28 no. 4 in E minor',
      'Chopin — Nocturne Op. 9 no. 2',
      'Beethoven — Sonata Op. 49 no. 2, first movement',
      'Debussy — Clair de Lune',
      'Bach — a fugue from WTC Book I, voices audible separately',
      'Sight-read: a movement you have never heard, hands together',
    ],
  },
  {
    name: '8 · Keeping it',
    lessons: [
      'Sight-read one new piece a week, below current level, without stopping',
      'Identify every interval within an octave by ear',
      'Tell major from minor from diminished by ear, in any inversion',
      'Transpose a simple piece into three other keys',
      'Play a song from a lead sheet, left hand improvised',
      'Memorise one piece completely, hands separately as well as together',
      'Record yourself monthly and listen back to the whole thing',
    ],
  },
];

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/piano.mjs. Read before running.',
  `delete from curriculums where name = 'Piano';`,
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  values ('Piano', ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())});`,
];

stages.forEach((stage, m) => {
  out.push(
    `insert into modules (curriculum_id, name, position)\n` +
      `  values ((select max(id) from curriculums), ${q(stage.name)}, ${m + 1});`,
  );
  stage.lessons.forEach((lesson, l) => {
    out.push(
      `insert into lessons (module_id, name, position, on_route)\n` +
        `  values ((select max(id) from modules), ${q(lesson)}, ${l + 1}, 1);`,
    );
  });
});

console.log(out.join('\n'));
console.error(
  `modules: ${stages.length}  milestones: ${stages.reduce((n, s) => n + s.lessons.length, 0)}`,
);
