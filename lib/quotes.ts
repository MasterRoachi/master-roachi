// Quotes for the page headers: one shared pool, and one list kept apart.
//
// These used to be five lists, one per page, each matched to its subject. That
// turned out to be the wrong shape: the lists were short enough that a page
// cycled through the same five lines within a minute, and a quote that fits its
// page exactly is a smaller pleasure than an unexpected one that lands anyway.
//
// So most of them are one pool now, and a page takes from it at random. Any
// line in `quotes` can turn up under any header that uses it — worth
// remembering when adding one.
//
// Foundations is the exception, in both directions. It draws only from
// `saintQuotes`, and nothing from `saintQuotes` appears anywhere else. Sharing
// across that line went one absurd step too far: a cartoon under a candlelit
// Orthodox header, and a desert father over the merch.
//
// Attributions are the risky part of a file like this: a misquoted line under a
// real character's name is worse than no quote at all. These are widely enough
// repeated to be safe, kept short, and each one names who said it. Stephan
// should still read them and swap any that are not his; that is what this file
// is for.
//
// Everything in the shared pool is a character in a game, a show, or a film.
// The saints are real people, and their titles are load-bearing: Fr Seraphim
// Rose is not canonised, so he is Father, not Saint. Titling him as one would
// be a real error, not a typo.

export interface Quote {
  text: string;
  /** Character, then the work they are from. */
  source: string;
}

/** The shared pool. Every page but Foundations draws from this. */
export const quotes: Quote[] = [
  // Work, practice, and finishing things.
  { text: 'Go beyond. Plus Ultra!', source: 'All Might, My Hero Academia' },
  {
    text: 'A lesson without pain is meaningless.',
    source: 'Edward Elric, Fullmetal Alchemist',
  },
  {
    text: 'Do 100 push-ups, 100 sit-ups, 100 squats and a 10km run. Every single day.',
    source: 'Saitama, One-Punch Man',
  },
  {
    text: 'If you don’t take risks, you can’t create a future.',
    source: 'Monkey D. Luffy, One Piece',
  },
  {
    text: 'Hard work is worthless for those that don’t believe in themselves.',
    source: 'Naruto Uzumaki, Naruto',
  },

  // Clothes, appearances, and being recognised.
  { text: 'No capes!', source: 'Edna Mode, The Incredibles' },
  {
    text: 'It’s not who I am underneath, but what I do that defines me.',
    source: 'Batman Begins',
  },
  { text: 'I am the one who knocks.', source: 'Walter White, Breaking Bad' },
  { text: 'A man’s gotta have a code.', source: 'Omar Little, The Wire' },
  { text: 'Winter is coming.', source: 'Game of Thrones' },

  // The Saturday-morning end of things — the shows the drawings come from.
  {
    text: 'Foolish samurai warrior wielding a magic sword!',
    source: 'Aku, Samurai Jack',
  },
  { text: 'Buttered toast!', source: 'Ed, Ed, Edd n Eddy' },
  { text: 'The things I do for love.', source: 'Courage the Cowardly Dog' },
  { text: 'Dee Dee! Get out of my laboratory!', source: 'Dexter’s Laboratory' },
  { text: 'What’s the sitch?', source: 'Kim Possible' },
  { text: 'Azarath Metrion Zinthos.', source: 'Raven, Teen Titans' },
  { text: 'I’m gonna sing the Doom Song now!', source: 'GIR, Invader Zim' },
  {
    text: 'Sharing tea with a fascinating stranger is one of life’s true delights.',
    source: 'Uncle Iroh, Avatar: The Last Airbender',
  },
  { text: 'The city of Townsville!', source: 'The Powerpuff Girls' },

  // Games, mostly the ones that get replayed.
  { text: 'Stay awhile and listen.', source: 'Deckard Cain, Diablo' },
  { text: 'A man chooses. A slave obeys.', source: 'Andrew Ryan, BioShock' },
  { text: 'War. War never changes.', source: 'Fallout' },
  {
    text: 'It’s dangerous to go alone! Take this.',
    source: 'The Legend of Zelda',
  },
  { text: 'The truth is out there.', source: 'The X-Files' },
  { text: 'Praise the sun!', source: 'Solaire of Astora, Dark Souls' },

  // Rest, play, and the point of any of it.
  {
    text: 'Life happens wherever you are, whether you make it or not.',
    source: 'Uncle Iroh, Avatar: The Last Airbender',
  },
  {
    text: 'Yesterday is history, tomorrow is a mystery, but today is a gift.',
    source: 'Master Oogway, Kung Fu Panda',
  },
  {
    text: 'It is important to draw wisdom from many different places.',
    source: 'Uncle Iroh, Avatar: The Last Airbender',
  },
  { text: 'I want to live!', source: 'Nico Robin, One Piece' },
  {
    text: 'It’s not the face that makes someone a monster; it’s the choices they make with their life.',
    source: 'Naruto Uzumaki, Naruto',
  },
];

/**
 * Foundations only, and Foundations draws from nothing else.
 *
 * See the note at the top about the titles here — they are the one place in
 * this file where getting an attribution wrong would be a real error rather
 * than a misremembered cartoon.
 */
export const saintQuotes: Quote[] = [
  {
    text: 'Acquire the Spirit of Peace, and a thousand souls around you will be saved.',
    source: 'St Seraphim of Sarov',
  },
  {
    text: 'Keep your mind in hell, and despair not.',
    source: 'St Silouan the Athonite',
  },
  {
    text: 'He became man that we might become god.',
    source: 'St Athanasius, On the Incarnation',
  },
  {
    text: 'It is later than you think. Hasten, therefore, to do the work of God.',
    source: 'Fr Seraphim Rose',
  },
  {
    text: 'This life has been given to you for repentance. Do not waste it on other things.',
    source: 'St Isaac the Syrian',
  },
];
