// Builds the Piano curriculum.
//
// Source: scripts/curriculums/piano.md, which is the plan and the argument.
// The material is in piano-detail.json and the cards are in piano-cards.json,
// for the reasons japanese.mjs gives: prose full of tables does not belong
// inside a JS template literal, and cards are data rather than prose.
//
// A DESIGNED PATH, NOT A TRANSCRIPTION. There is no piano material on the
// machine — no books, nothing under Courses, ~/Media/Music empty — so every
// stage is an argument rather than a page map. Argue with it; the reasoning is
// in the .md.
//
// LESSONS ARE MILESTONES, NOT SESSIONS, which is the real difference from the
// Japanese curriculum and follows from the subject. A language resource is
// consumed, so a session is "these pages"; a piano skill is acquired, so a
// lesson is "can I do this yet". "C major, two octaves, hands together, evenly
// at 60" is either true or it is not.
//
// NOTHING HERE TELLS HIM TO RECORD HIMSELF. Asked directly, he said no, and
// the first version of this curriculum leaned on it. With no recording and an
// acoustic piano — so no MIDI, and none of the software that listens — the ear
// and the metronome are the entire feedback loop. Lessons therefore name ONE
// specific fault to listen for at a time, which is harder to write and is the
// only honest substitute.
//
// Prints SQL. Nothing is executed here — `npm run curriculum piano`.

import detail from './piano-detail.json' with { type: 'json' };
import cards from './piano-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/piano.md';
const NAME = 'Piano';

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) =>
  value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`;

const NOW = new Date().toISOString();
const CURRICULUM = `(select id from curriculums where name = ${q(NAME)})`;
/** The lesson just inserted. The other scripts use the same trick. */
const LESSON = '(select max(id) from lessons)';

/** Every key asked for, so a stray one in a data file can be found. */
const askedDetail = new Set();
const askedCards = new Set();

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

/**
 * A card's natural key, which is what the database matches on: curriculum,
 * kind and front. Two lessons claiming the same one is a silent bug — the
 * insert is `where not exists`, so the second claim does not fail, it just
 * quietly re-points the card at the later lesson. Caught here instead.
 */
const claimed = new Map();
const twiceClaimed = [];

function cardsFor(name) {
  askedCards.add(name);
  const list = cards[name] ?? [];
  for (const card of list) {
    const key = `${card.kind}\u0000${card.front}`;
    if (claimed.has(key)) twiceClaimed.push([card.front, claimed.get(key), name]);
    else claimed.set(key, name);
  }
  return list;
}

const missing = [];

/* The stages. A lesson is [name, sources?] — the material is looked up by
 * name, and so are the cards. */
const stages = [
  {
    name: 'Stage 1 · The instrument and the hands',
    lessons: [
    ['Sitting at it', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/', note: '400+ free video lessons.' }]],
    ['How the arm makes the sound', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The standard text on how to practise.' }]],
    ['Finding your way around the keys', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/', note: '400+ free video lessons.' }]],
    ['The fingers have numbers'],
    ['The five-finger position', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/', note: '400+ free video lessons.' }, { title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Your piano: an old acoustic'],
    ['Loud and soft, from the arm'],
    ['A first tune, by hand position'],
    ['Counting, and the metronome', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The standard text on how to practise.' }]],
    ['Rest, and when to stop', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The standard text on how to practise.' }]],
    ['The first bars of something you want to play', [{ title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }]],
    ['What stage 1 was for'],
    ],
  },
  {
    name: 'Stage 2 · Reading, and the first chords',
    lessons: [
    ['The staff, and why middle C is the hinge', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }, { title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Ledger lines, and reading outside the staff', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Note values, rests, and the beat', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Time signatures and bar lines', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Dotted notes and ties', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Reading rhythm before pitch'],
    ['Your first written line', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/', note: '400+ free video lessons.' }, { title: 'IMSLP', url: 'https://imslp.org', note: 'Every public-domain score and method book.' }]],
    ['Sight-reading: the daily ten minutes', [{ title: 'Piano Inspires — free sight-reading examples', url: 'https://pianoinspires.com/sight-reading-is-a-super-power/' }, { title: 'IMSLP', url: 'https://imslp.org', note: 'Every public-domain score and method book.' }]],
    ['Sharps, flats and naturals on the page', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['The road map of a score'],
    ['Articulation: legato, staccato, slurs'],
    ['Tempo marks and the Italian'],
    ['Intervals under the hand', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }, { title: 'Teoria', url: 'https://www.teoria.com/', note: 'Free ear training.' }]],
    ['The major triad', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['The minor triad, and the difference', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Chord symbols, and reading a lead sheet', [{ title: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/', note: 'Chord charts for nearly every popular song. They work at a piano.' }]],
    ['I, IV and V — the three chords', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Playing a song from chords', [{ title: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/', note: 'Chord charts for nearly every popular song. They work at a piano.' }]],
    ['Broken chords and the first accompaniment patterns'],
    ['Inversions, and why chords move smoothly', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['How to learn a new piece', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The standard text on how to practise.' }]],
    ['Structuring a session', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The standard text on how to practise.' }]],
    ['A piece from the page', [{ title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: '2,000+ classical tutorials.' }]],
    ['What stage 2 was for'],
    ],
  },
  {
    name: 'Stage 3 · Hands together',
    lessons: [
    ['Why hands together is hard', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Mental play and practice method.' }]],
    ['Parallel motion', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }]],
    ['Contrary motion'],
    ['One hand still, one moving'],
    ['Melody over block chords'],
    ['Melody over broken chords'],
    ['Two different rhythms', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Mental play and practice method.' }]],
    ['Balance: making the melody speak'],
    ['Voicing within one hand'],
    ['Phrasing, and where a line breathes'],
    ['Dynamics across both hands'],
    ['Hands separately: when, and when to stop', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Mental play and practice method.' }]],
    ['Slow practice, and what it is actually for', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Mental play and practice method.' }]],
    ['Interleaving, properly'],
    ['Practising a join', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Mental play and practice method.' }]],
    ['Reading two staves at once', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Anna Magdalena Notebook, Burgmüller, Satie — all free.' }]],
    ['How pieces get memorised', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Mental play and practice method.' }]],
    ['A piece, hands together', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Anna Magdalena Notebook, Burgmüller, Satie — all free.' }, { title: 'MuseScore', url: 'https://musescore.com' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Tutorials for most of the standard repertoire.' }]],
    ['What stage 3 was for'],
    ],
  },
  {
    name: 'Stage 4 · Keys and scales',
    lessons: [
    ['What a key is, and why music has one', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['The major scale, and the pattern underneath it', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }, { title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['C major, hands separately, and the thumb under', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }, { title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Fingering, and the two groups that explain nearly all of it', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The chapter on scales, and the Hanon objection.' }]],
    ['C major, two octaves, hands together', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The chapter on scales, and the Hanon objection.' }]],
    ['Key signatures on the page', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['The circle of fifths', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['G major and D major', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }]],
    ['F major, and the first flat'],
    ['A major and E major'],
    ['B♭ major and E♭ major'],
    ['The black-key keys, and why they fit the hand', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The chapter on scales, and the Hanon objection.' }]],
    ['Sight-reading with a key signature', [{ title: 'Piano Inspires — free sight-reading examples', url: 'https://pianoinspires.com/sight-reading-is-a-super-power/' }, { title: 'IMSLP', url: 'https://imslp.org', note: 'Burgmüller, Clementi, the Notebook, Satie — all free.' }]],
    ['Scale degrees, and their names', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['I, IV and V in any key', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }, { title: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/', note: 'Chord charts for nearly every popular song. They work at a piano.' }]],
    ['The minor scale: natural minor', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Harmonic minor', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Melodic minor, and which to practise', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Relative and parallel minor', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Three minor keys: A, E and D', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }]],
    ['Transposing a tune', [{ title: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/', note: 'Chord charts for nearly every popular song. They work at a piano.' }]],
    ['Arpeggios, one octave', [{ title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Arpeggios, two octaves, and the thumb', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The chapter on scales, and the Hanon objection.' }]],
    ['The chromatic scale', [{ title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['The pentatonic scale'],
    ['How to practise scales so they pay', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. The chapter on scales, and the Hanon objection.' }]],
    ['Finding the scale in the piece', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Burgmüller, Clementi, the Notebook, Satie — all free.' }]],
    ['A piece in a new key', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Burgmüller, Clementi, the Notebook, Satie — all free.' }, { title: 'MuseScore', url: 'https://musescore.com' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Tutorials for most of the standard repertoire.' }]],
    ['What stage 4 was for'],
    ],
  },
  {
    name: 'Stage 5 · First repertoire, first covers',
    lessons: [
    ['Pieces, finished — what this stage is'],
    ['Choosing a piece you can actually finish', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Where the free scores are, and which edition to take', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Every piece named in this stage, free.' }, { title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }, { title: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/', note: 'Chord charts for nearly every popular song. They work at a piano.' }]],
    ['The learning sequence, as a checklist', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Sectioning, and practising out of order', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Baroque: the first classical piece, and what the style wants', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Every piece named in this stage, free.' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Tutorials for most of the standard repertoire.' }]],
    ['Classical: the sonatina, and tempo discipline', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Every piece named in this stage, free.' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Tutorials for most of the standard repertoire.' }]],
    ['Romantic: the singing tone', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Every piece named in this stage, free.' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Tutorials for most of the standard repertoire.' }]],
    ['Modern and still: playing slowly on purpose', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Every piece named in this stage, free.' }, { title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }]],
    ['Learning from a video, without becoming dependent on it', [{ title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Tutorials for most of the standard repertoire.' }, { title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }]],
    ['Playing a cover from a lead sheet', [{ title: 'Ultimate Guitar', url: 'https://www.ultimate-guitar.com/', note: 'Chord charts for nearly every popular song. They work at a piano.' }, { title: 'Bill Hilton', url: 'https://www.youtube.com/@BillHiltonBids', note: 'Chords, covers and arranging — without the jazz.' }]],
    ['Arranging a song for two hands', [{ title: 'Bill Hilton', url: 'https://www.youtube.com/@BillHiltonBids', note: 'Chords, covers and arranging — without the jazz.' }, { title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }]],
    ['Finding an arrangement at the right difficulty', [{ title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }]],
    ['Anime openings, and what makes them hard', [{ title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }]],
    ['The textures covers are made of', [{ title: 'Bill Hilton', url: 'https://www.youtube.com/@BillHiltonBids', note: 'Chords, covers and arranging — without the jazz.' }]],
    ['Playing along with a recording'],
    ['Practising a hard bar: the tools', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Fixing a piece you learned wrong', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Keeping pieces alive', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Polishing: what makes a piece finished', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Memorising a piece on purpose', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }, { title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Playing it for someone', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Learning a piece, memorising, and performance.' }]],
    ['Sight-reading: raising the level', [{ title: 'Piano Inspires — free sight-reading examples', url: 'https://pianoinspires.com/sight-reading-is-a-super-power/' }, { title: 'IMSLP', url: 'https://imslp.org', note: 'Every piece named in this stage, free.' }]],
    ['The five pieces', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Every piece named in this stage, free.' }, { title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }]],
    ['What stage 5 was for'],
    ],
  },
  {
    name: 'Stage 6 · Technique and the pedal',
    lessons: [
    ['What technique is for, and the one rule about force', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['Tension, and the signals to stop', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['The pedals on your piano — and what the middle one is'],
    ['The sustain pedal: what it actually does', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }]],
    ['The foot: down, up, and silently', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }, { title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Syncopated pedalling', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Hands visible, played slowly — what video is actually good for.' }]],
    ['Reading pedal marks, and why they are suggestions', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Czerny, Chopin, Burgmüller, Grieg — all free.' }]],
    ['Pedalling by ear: listening for mud', [{ title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Hands visible, played slowly — what video is actually good for.' }]],
    ['Half pedal, and partial lifts'],
    ['What not to pedal', [{ title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Hands visible, played slowly — what video is actually good for.' }]],
    ['The soft pedal'],
    ['The stage 5 pieces, with pedal', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Czerny, Chopin, Burgmüller, Grieg — all free.' }, { title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }]],
    ['Finger independence without force', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['Czerny, and how to use him', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Czerny, Chopin, Burgmüller, Grieg — all free.' }, { title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['How speed actually develops', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['Practising for speed', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['Scales, four octaves, hands together', [{ title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Arpeggios, four octaves, and inversions', [{ title: 'Andrew Furmanczyk — free piano course', url: 'https://www.youtube.com/user/Lypur' }]],
    ['Dominant seventh and diminished arpeggios', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }]],
    ['Touch: legato, staccato, and where each comes from', [{ title: 'Hoffman Academy', url: 'https://www.hoffmanacademy.com/' }]],
    ['Repeated notes, and changing fingers'],
    ['Double notes: thirds and sixths', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['Octaves, and the wrist', [{ title: 'Fundamentals of Piano Practice', url: 'https://fundamentals-of-piano-practice.readthedocs.io/', note: 'Free. Speed, relaxation, injury — and the Hanon objection.' }]],
    ['Chords played as one sound', [{ title: 'Bill Hilton', url: 'https://www.youtube.com/@BillHiltonBids', note: 'Chords, covers and arranging — without the jazz.' }]],
    ['Leaps, and how to land'],
    ['Trills and ornaments', [{ title: 'musictheory.net', url: 'https://www.musictheory.net/', note: 'Free lessons and drills. No signup.' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Hands visible, played slowly — what video is actually good for.' }]],
    ['A piece that needs the technique', [{ title: 'IMSLP', url: 'https://imslp.org', note: 'Czerny, Chopin, Burgmüller, Grieg — all free.' }, { title: 'MuseScore', url: 'https://musescore.com', note: 'Community arrangements at several difficulties each.' }, { title: 'Paul Barton', url: 'https://www.youtube.com/@PaulBartonPiano', note: 'Hands visible, played slowly — what video is actually good for.' }]],
    ['What stage 6 was for'],
    ],
  },
];

const out = [
  '-- Generated by scripts/curriculums/piano.mjs. Read before running.',
  '-- Apply it with `npm run curriculum piano`, which carries ticks, detail',
  '-- typed at the dashboard and every card\'s review history across the rebuild',
  '-- below. Running this file through wrangler by hand discards them.',
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
  '',
  '-- CARDS ARE NEVER DELETED HERE. A card carries months of review history and',
  '-- no script can regenerate that, so the rebuild above sets lesson_id to null',
  '-- (migration 0010) and each card is matched again below by its natural key:',
  '-- curriculum, kind and front. Insert what is new, update what exists, and',
  '-- leave every scheduling column alone.',
];

stages.forEach((stage, m) => {
  out.push(
    '',
    `-- ${stage.name}`,
    `insert into modules (curriculum_id, name, position)\n` +
      `  values (${CURRICULUM}, ${q(stage.name)}, ${m + 1});`,
  );

  stage.lessons.forEach(([name, sources = []], l) => {
    out.push(
      `insert into lessons (module_id, name, position, on_route, detail)\n` +
        `  values ((select max(id) from modules), ${q(name)}, ${l + 1}, 1, ${q(detailFor(name))});`,
    );

    sources.forEach((source, s) => {
      out.push(
        `insert into sources (curriculum_id, lesson_id, title, url, note, position)\n` +
          `  values (${CURRICULUM}, ${LESSON}, ${q(source.title)}, ${q(source.url ?? null)},` +
          ` ${q(source.note ?? null)}, ${s + 1});`,
      );
    });

    for (const card of cardsFor(name)) {
      const identity =
        `curriculum_id = ${CURRICULUM} and kind = ${q(card.kind)} and front = ${q(card.front)}`;
      out.push(
        `insert into cards (curriculum_id, lesson_id, kind, front, back, reading, extra,\n` +
          `                   due, stability, difficulty, scheduled_days, learning_steps,\n` +
          `                   reps, lapses, state, last_review, unlocked_on, created_at)\n` +
          `  select ${CURRICULUM}, ${LESSON}, ${q(card.kind)}, ${q(card.front)}, ${q(card.back)},\n` +
          `         ${q(card.reading ?? null)}, ${q(card.extra ?? null)}, ${q(NOW)},\n` +
          `         0, 0, 0, 0, 0, 0, 0, null, null, ${q(NOW)}\n` +
          `  where not exists (select 1 from cards where ${identity});`,
        // Content and the lesson link are the script's; scheduling and
        // unlocked_on are the dashboard's and are not named here.
        `update cards set lesson_id = ${LESSON}, back = ${q(card.back)},\n` +
          `       reading = ${q(card.reading ?? null)}, extra = ${q(card.extra ?? null)}\n` +
          ` where ${identity};`,
      );
    }
  });
});

const strayDetail = Object.keys(detail).filter((key) => !askedDetail.has(key));
const strayCards = Object.keys(cards).filter((key) => !askedCards.has(key));

if (twiceClaimed.length) {
  console.error(`\n${twiceClaimed.length} card(s) are claimed by two lessons:`);
  for (const [front, first, second] of twiceClaimed) {
    console.error(`  · ${front}  —  ${first}  and  ${second}`);
  }
  console.error('\nA card belongs to one lesson. Nothing printed.');
  process.exit(1);
}

if (missing.length) {
  console.error(`\nNo material for ${missing.length} lesson(s):`);
  for (const name of missing) console.error(`  · ${name}`);
  console.error('\nEvery lesson teaches its point in full. Nothing printed.');
  process.exit(1);
}
for (const key of strayDetail) console.error(`! piano-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! piano-cards.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const cardCount = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, [name]) => k + (cards[name]?.length ?? 0), 0),
  0,
);
console.error(`modules: ${stages.length}  lessons: ${lessons}  cards: ${cardCount}`);
