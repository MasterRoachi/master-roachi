// The Library of Wyggzantium: a long hall shelved floor to ceiling on all four
// walls. Videos stand round a roll-down projector screen on one long wall and
// books fill the other; music (CDs, and LPs in the low rows) and podcasts take
// the two ends. Every wall is labelled, sections and groups have plaques and
// shelf labels, and the Index walks you to any of them. Anything can be taken
// down, opened and handled: a CD's booklet slides out and its pages turn, its
// disc goes in the CD player; an LP goes on the record player; a DVD's disc
// goes in the player under the screen and the projector shows it.
//
// It is meant for wigga.masterroachi.com (Master Roachi, 18 Nov 2026). The page
// is /wyggzantium/ on the main site, full screen with none of the site around
// it, so the subdomain can serve it as its front page.
//
// The collection is data/library.json, built from Fjord and Bjorn's media
// catalogue (18 Nov 2026): albums of tracks on the music wall (LPs for
// Dyerwave), The Lord of Spirits a CD per episode on the podcast wall, and
// Jay Dyer's lecture series and each debater's debates as DVD box sets. Each sleeve and box carries
// its video's own YouTube thumbnail as cover art, in public/wyggzantium/covers/.
// `fill` would put a generated placeholder in every unused compartment; it
// is off now that the shelves hold the real collection.
//
// THE MEDIA RULE. The collection is embedded from YouTube, not downloaded
// (Master Roachi, 18 Nov 2026): a track or a lecture gives the video's id as
// `youtube`, and plays in YouTube's own player, which is always shown
// (components/library/media.ts says how). A track cut from a full-album
// stream also gives `start` and `end`. Every one names the channel it is
// posted on (`credit`), with links to the channel and the video.

import data from '@/data/library.json';

export const LIBRARY_NAME = 'The Library of Wyggzantium';

export interface Credit {
  /** Who made the recording, as they asked to be named. */
  name: string;
  /** Where they can be found: their channel. */
  url?: string;
  /** The video itself, on YouTube. */
  video?: string;
  /** The same recording posted on other channels, credited too. */
  also?: { name: string; url: string }[];
  /** Anything else owed: the permission's date, a licence line. */
  note?: string;
}

export interface Track {
  title: string;
  /** The YouTube video's id, played in an embed. The real collection uses this. */
  youtube?: string;
  /** Or a file on the site, a path under public/. */
  src?: string;
  /**
   * Where in the video the track starts and ends, in seconds: a track cut
   * from a full-album stream, by its posted timestamps.
   */
  start?: number;
  end?: number;
  credit: Credit;
}

/**
 * Where an item stands. A `section` takes whole bays of its wall, under a
 * brass plaque (Jay Dyer, Alex Sorin); a `group` within it starts on a fresh
 * shelf with its own label (Tragedy and Hope). Both appear in the Index.
 * Items keep the order they are listed in.
 */
export interface Shelved {
  section?: string;
  group?: string;
}

export interface Cd extends Shelved {
  id: string;
  /** A compact disc in a jewel case, or a 7-inch single in a sleeve. */
  format?: 'cd' | 'vinyl';
  title: string;
  artist: string;
  year?: number;
  /** The sleeve's colour, behind and around its cover art. */
  colour: string;
  /** The cover art, an image under public/: the video's own thumbnail, squared. */
  cover?: string;
  tracks: Track[];
  /** Text for the booklet's inner pages, one string per page. Optional. */
  booklet?: string[];
}

export interface Video {
  /** The YouTube video's id, played in an embed over the projector screen. */
  youtube?: string;
  /** Or a file on the site, a path under public/. */
  src?: string;
  credit: Credit;
}

/** One disc of a box set: a lecture on DVD, or an episode on CD. */
export interface Disc {
  title: string;
  /** This disc's own cover: its video's thumbnail. */
  cover?: string;
  /** A DVD's lecture. */
  video?: Video;
  /** A CD's tracks: a podcast episode is one. */
  tracks?: Track[];
}

/**
 * A box set: a slipcase holding a case per disc. A lecture series is a box of
 * DVDs, and so is a debater's debates on one topic.
 */
export interface BoxSet extends Shelved {
  id: string;
  /** What the cases inside are: DVD keep cases or CD jewel cases. */
  format?: 'dvd' | 'cd';
  title: string;
  /** Under the title on the box: its episodes or its count of lectures. */
  subtitle?: string;
  /** Who made it, for the box and its CDs' booklets. */
  by?: string;
  year?: number;
  colour: string;
  cover?: string;
  discs: Disc[];
}

/** The video wall holds box sets of DVDs. */
export type Dvd = BoxSet;

export interface Book extends Shelved {
  id: string;
  title: string;
  author: string;
  colour: string;
  /** Sets the book's thickness. */
  pages?: number;
  /** In metres, spine top to bottom. A paperback is about 0.2. */
  height?: number;
  /**
   * Its text, to read in the room: a gzipped file under public/, one paragraph
   * to a line (scripts/wyggzantium-texts.py). Without it the pages are blank lines.
   */
  text?: string;
}

/** A framed picture in the gallery behind the projector screen. */
export interface Picture {
  title: string;
  /** The line on its plaque. */
  caption?: string;
  /**
   * An image under public/, e.g. /wyggzantium/pictures/jay-dyer.jpg. Only an
   * image we are free to show: our own, freely licensed, or given with
   * permission. Without one, the frame holds a placeholder.
   */
  src?: string;
}

/** The four walls: videos round the screen, books opposite, music and podcasts at the ends. */
export interface Collection {
  /** Fill every unused compartment with a generated placeholder. */
  fill?: boolean;
  /** CDs, and LPs (format: 'vinyl'), which go in the low rows. */
  music: Cd[];
  /** Podcasts: a CD per episode, no box sets (Master Roachi, 18 Nov 2026), played on the podcast stand. */
  podcasts: Cd[];
  videos: Dvd[];
  books: Book[];
  /** The gallery behind the screen: the first is the portrait in the middle. */
  gallery?: Picture[];
}

export const collection = data as Collection;
