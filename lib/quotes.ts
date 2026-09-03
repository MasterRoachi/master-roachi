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
