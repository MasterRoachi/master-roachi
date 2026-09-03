// Quotes for the Work and Fun page headers.
//
// Attributions are the risky part of a file like this — a misquoted line under
// a real character's name is worse than no quote at all. These are ones widely
// enough repeated to be safe, kept short, and each one names who said it.
// Stephan should still read them and swap any that are not his; that is what
// this file is for.

export interface Quote {
  text: string;
  /** Character, then the work they are from. */
  source: string;
}

/** For the Work page: hard work, practice, and finishing things. */
export const workQuotes: Quote[] = [
  {
    text: 'Go beyond. Plus Ultra!',
    source: 'All Might, My Hero Academia',
  },
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
];

/**
 * For Thoughts.
 *
 * Games and shows rather than the commentators Stephan first suggested. Those
 * are living people, and a line invented for one of them and published under
 * his name is a different order of mistake from misremembering a cartoon.
 * These are all widely quoted and easy to check.
 */
export const ramblingQuotes: Quote[] = [
  {
    text: 'Stay awhile and listen.',
    source: 'Deckard Cain, Diablo',
  },
  {
    text: 'A man chooses. A slave obeys.',
    source: 'Andrew Ryan, BioShock',
  },
  { text: 'War. War never changes.', source: 'Fallout' },
  {
    text: 'It’s dangerous to go alone! Take this.',
    source: 'The Legend of Zelda',
  },
  { text: 'The truth is out there.', source: 'The X-Files' },
  { text: 'Praise the sun!', source: 'Solaire of Astora, Dark Souls' },
];

/**
 * For Foundations.
 *
 * Attribution matters more here than on the other two lists, and in a way that
 * is easy to get wrong: Seraphim Rose is not canonised, so he is Father, not
 * Saint. Titling him as one on an Orthodox page would be a real error, not a
 * typo — the kind a reader of this page would notice immediately.
 */
export const faithQuotes: Quote[] = [
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

/** For the Fun page: rest, play, and the point of any of it. */
export const lifeQuotes: Quote[] = [
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
  {
    text: 'I want to live!',
    source: 'Nico Robin, One Piece',
  },
  {
    text: 'It’s not the face that makes someone a monster; it’s the choices they make with their life.',
    source: 'Naruto Uzumaki, Naruto',
  },
];
