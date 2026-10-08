// Icons for the habit rows.
//
// Hand-drawn rather than a dependency: an icon set is a megabyte to get
// twenty glyphs, and these have to match a site whose whole visual language is
// one weight of stroke on a dark ground. All of them are built on the same
// 24-unit grid with the same stroke width and round caps, so a column of them
// reads as one family.
//
// Habits store the NAME. The drawing lives here, so redrawing one improves
// every row rather than leaving old rows holding an old path.
//
// Order matters: related icons sit next to each other, because thirty-six
// glyphs are found by scanning a neighbourhood rather than by reading titles
// one at a time.

export interface HabitIcon {
  name: string;
  /** What it is for, shown in the picker — the label does the disambiguating. */
  label: string;
  /** Path data on a 0 0 24 24 grid, stroked rather than filled. */
  d: string;
}

export const HABIT_ICONS: HabitIcon[] = [
  { name: 'book', label: 'Reading', d: 'M5 4h9a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM16 6h3v14h-3' },
  { name: 'cross', label: 'Prayer', d: 'M12 3v18M7 8h10M9 13h6' },
  { name: 'weights', label: 'Training', d: 'M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10' },
  { name: 'code', label: 'Code', d: 'M9 7l-5 5 5 5M15 7l5 5-5 5' },
  { name: 'pen', label: 'Writing', d: 'M4 20l4.5-1.2L19 8.3l-3.3-3.3L5.2 15.5zM14.5 5.8l3.7 3.7' },
  { name: 'brush', label: 'Drawing', d: 'M14 4l6 6-7 7-6-6zM7 17l-2 3 3-2M5 20H3' },
  { name: 'water', label: 'Water', d: 'M12 3c3.2 5.2 5 7.4 5 10a5 5 0 0 1-10 0c0-2.6 1.8-4.8 5-10z' },
  { name: 'sun', label: 'Morning', d: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19' },
  { name: 'moon', label: 'Sleep', d: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z' },
  { name: 'walk', label: 'Walking', d: 'M13 4a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 13 4M12 9l-1 5 3 3 1 4M11 14l-3 2-1 4M12.5 10.5l3.5 1.5' },
  { name: 'leaf', label: 'Plants', d: 'M5 19C5 11 10.5 5 19 5c0 8-5.5 14-14 14M5 19l9-9' },
  { name: 'flame', label: 'Streak', d: 'M12 3c3.5 4.5 5 6.5 5 9.5a5 5 0 0 1-10 0c0-2 .8-3.2 2-5 .8 2 1.8 2.2 3 1-1.2-2-1.2-3.8 0-5.5z' },
  { name: 'clock', label: 'Time', d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18M12 7.5V12l3.5 2' },
  { name: 'note', label: 'Music', d: 'M9 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M20 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M9 18.5V6l11-2.5v13' },
  { name: 'mug', label: 'Coffee', d: 'M5 8h12v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM17 10h2a2 2 0 0 1 0 4h-2M4 22h14' },
  { name: 'home', label: 'House', d: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM10 21v-6h4v6' },
  { name: 'target', label: 'Focus', d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8M12 12h.01' },
  { name: 'phone-off', label: 'Off the phone', d: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1M4 2l16 20' },

  // The vices, which are the point of half a habit tracker — a thing counted
  // to be reduced needs a square as much as one counted to be kept.
  { name: 'cigarette', label: 'Cigarette', d: 'M3 14h18v4H3zM16 14v4M18 10.5c1.4-1.1.5-2.4 1.4-3.5' },
  { name: 'weed', label: 'Weed', d: 'M12 21v-9M12 12L8 6M12 12l4-6M12 14l-6.5-2M12 14l6.5-2M12 17l-4.5 1M12 17l4.5 1M12 12V3.5' },
  { name: 'glass', label: 'A drink', d: 'M7 4h10l-1.2 6.2a4 4 0 0 1-7.6 0zM12 14.5V20M8.5 20h7' },
  { name: 'bottle', label: 'Bottle', d: 'M10 3h4v3.2l2 3V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9.2l2-3zM8 13h8' },

  // Body and upkeep.
  { name: 'pill', label: 'Medicine', d: 'M6 10a4 4 0 0 1 4-4h4a4 4 0 0 1 0 8h-4a4 4 0 0 1-4-4M12 6v8' },
  { name: 'heart', label: 'Heart', d: 'M12 20.3S4.5 15.6 4.5 10.6A4 4 0 0 1 12 8.2a4 4 0 0 1 7.5 2.4c0 5-7.5 9.7-7.5 9.7z' },
  { name: 'scale', label: 'Weigh-in', d: 'M4 8h16M12 8V5M7 8l-3 7h6zM17 8l3 7h-6zM9 19h6' },
  { name: 'shower', label: 'Shower', d: 'M12 3v4M6 11h12a6 6 0 0 0-12 0M9 15v1.5M12 15v2.5M15 15v1.5' },
  { name: 'bed', label: 'Bed', d: 'M3 18v-6h18v6M3 12V7M7 12V9h6v3' },
  { name: 'cutlery', label: 'Meals', d: 'M7 3v18M5 3v5a2 2 0 0 0 4 0V3M16 3c-1.9 0-3 1.6-3 3.5S14.1 10 16 10s3-1.6 3-3.5S17.9 3 16 3M16 10v11' },
  { name: 'stairs', label: 'Steps', d: 'M4 20h4v-4h4v-4h4V8h4' },

  // House, people, and the rest of a day.
  { name: 'broom', label: 'Chores', d: 'M14 3l7 7M12.5 8.5l-9 9L2 21l3.5-1.5 9-9zM8.5 12.5l3 3' },
  { name: 'paw', label: 'The dog', d: 'M6.5 10a1.8 1.8 0 1 0 0-.1M11 7.5a1.8 1.8 0 1 0 0-.1M15.5 7.5a1.8 1.8 0 1 0 0-.1M19.5 11a1.8 1.8 0 1 0 0-.1M13 20c-3.2 0-5.5-1.9-5.5-3.9S9.8 12.5 13 12.5s5.5 1.6 5.5 3.6S16.2 20 13 20z' },
  { name: 'coin', label: 'Money', d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4' },
  { name: 'candle', label: 'Candle', d: 'M9.5 10h5v10h-5zM12 10V7.5M12 7.5c1.6-1.5.3-3.2-.8-4.2 2 .7 2.6 2.7 1 4.2M7 20h10' },
  { name: 'controller', label: 'Games', d: 'M7.5 9.5h9a4.5 4.5 0 0 1 4.5 4.5v.8a2.7 2.7 0 0 1-4.9 1.6l-.8-1.1H8.7l-.8 1.1A2.7 2.7 0 0 1 3 14.8V14a4.5 4.5 0 0 1 4.5-4.5M8 12v2.5M6.8 13.2h2.5M16 12.5h.01M17.8 14.2h.01' },
  { name: 'film', label: 'Watching', d: 'M3 5h18v14H3zM7.5 5v14M16.5 5v14M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21' },
  { name: 'speech', label: 'Language', d: 'M4 5h16v10h-9l-5 4.5V15H4z' },
];

const BY_NAME = new Map(HABIT_ICONS.map((icon) => [icon.name, icon]));

export function iconFor(name: string | null | undefined): HabitIcon | null {
  return name ? BY_NAME.get(name) ?? null : null;
}

/** A known icon name, or null. Keeps an unknown name out of the database. */
export function validIconName(value: unknown): string | null {
  return typeof value === 'string' && BY_NAME.has(value) ? value : null;
}
