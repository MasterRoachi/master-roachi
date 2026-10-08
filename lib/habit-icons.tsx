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
];

const BY_NAME = new Map(HABIT_ICONS.map((icon) => [icon.name, icon]));

export function iconFor(name: string | null | undefined): HabitIcon | null {
  return name ? BY_NAME.get(name) ?? null : null;
}

/** A known icon name, or null. Keeps an unknown name out of the database. */
export function validIconName(value: unknown): string | null {
  return typeof value === 'string' && BY_NAME.has(value) ? value : null;
}
