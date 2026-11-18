import type { Book, Cd, Credit, Dvd } from '@/lib/library';
import { hash } from './textures';

// The fillers: a generated placeholder for every compartment the collection
// does not use, so the walls read as full while the collection is small. Each
// is made from its compartment's number, so the same compartment always holds
// the same thing, and nothing is made until it is taken down.
//
// Switched off by `fill: false` in data/library.json.

const ADJ = ['Quiet', 'Golden', 'Northern', 'Hollow', 'Paper', 'Silver', 'Late', 'Distant', 'Iron', 'Small', 'Winter', 'Open', 'Lost', 'Second', 'Blue', 'Salt', 'Low', 'Bright'];
const NOUN = ['Harbour', 'Hours', 'Rooms', 'Rivers', 'Lanterns', 'Fields', 'Engines', 'Letters', 'Orchards', 'Stations', 'Tides', 'Bells', 'Gardens', 'Signals', 'Roads', 'Windows', 'Mirrors', 'Hills'];

export const PALETTE = [
  '#c8553d', '#2d6a8f', '#e0b13a', '#3f7d58', '#7b4a8f', '#1f1f24', '#d97a9b', '#5a8fb8', '#a3683c',
  '#22313f', '#8f2d2d', '#3c5a3a', '#6b5b95', '#c49a2c', '#2f4858', '#d8cbb0', '#2f6f6f', '#9b2f5f',
  '#e7e2d6', '#b5651d', '#5d4b8a', '#8a8a3d', '#384b70', '#c2b280',
];

const pick = <T,>(list: T[], n: number) => list[n % list.length];
const title = (h: number) => `${pick(ADJ, h)} ${pick(NOUN, h >>> 5)}`;

const CREDIT: Credit = {
  name: 'Placeholder tone',
  note: 'Generated for testing. Real recordings are used only with the creator’s permission, and credited here.',
};
const PICTURE: Credit = {
  name: 'Placeholder picture',
  note: 'Generated for testing. Real films are used only with the creator’s permission, and credited here.',
};

export function fillerCd(slot: number): Cd {
  const h = hash(`cd${slot}`);
  return {
    id: `cd-filler-${slot}`,
    title: title(h),
    artist: 'Placeholder Artist',
    colour: pick(PALETTE, h >>> 9),
    tracks: [0, 1, 2].slice(0, 2 + (h & 1)).map((k) => ({
      title: `Track ${k + 1}`,
      src: `/wyggzantium/audio/placeholder-${((h >>> 3) + k) % 6 + 1}.mp3`,
      credit: CREDIT,
    })),
  };
}

export function fillerDvd(slot: number): Dvd {
  const h = hash(`dvd${slot}`);
  return {
    id: `dvd-filler-${slot}`,
    title: title(h),
    year: 1960 + (h % 60),
    colour: pick(PALETTE, h >>> 9),
    discs: [{ title: title(h), video: { src: `/wyggzantium/video/placeholder-${(h & 1) + 1}.mp4`, credit: PICTURE } }],
  };
}

export function fillerBook(slot: number, thickness: number, height: number): Book {
  const h = hash(`book${slot}`);
  return {
    id: `book-filler-${slot}`,
    title: title(h),
    author: 'Placeholder Author',
    colour: pick(PALETTE, h >>> 9),
    pages: Math.round((thickness - 0.012) / 0.00009),
    height,
  };
}

/** A filler book's size in its compartment: thickness and height, in metres. */
export function fillerBookSize(slot: number) {
  const h = hash(`size${slot}`);
  return { thickness: 0.018 + (h % 33) * 0.001, height: 0.19 + ((h >>> 6) % 8) * 0.01 };
}
