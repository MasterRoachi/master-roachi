// Presentation helpers with no filesystem dependency, so client components can
// import them without pulling node:fs into the browser bundle.

// Writing is one collection with several views. `track` decides where a post
// surfaces: /writing shows everything, /gaming shows gaming, /orthodoxy shows
// theology, and a project page shows posts pointing at it via `project`.
export type Track = 'code' | 'gaming' | 'theology' | 'devlog';

export const TRACK_LABEL: Record<Track, string> = {
  code: 'Code',
  gaming: 'Gaming',
  theology: 'Orthodoxy',
  devlog: 'Devlog',
};

/**
 * Each track in its own section's colour, so a post carries the same identity
 * on the writing index that its subject has everywhere else on the site.
 *
 * Devlog has no section of its own and takes the blue Thoughts answers in the
 * nav — it belongs to the writing rather than to a pursuit.
 */
export const TRACK_COLOUR: Record<Track, string> = {
  code: 'oklch(97% 0 0)',
  gaming: 'oklch(86% 0.20 135)',
  theology: 'oklch(84% 0.16 92)',
  devlog: 'oklch(74% 0.15 250)',
};

// Where a project actually stands. The old live/coming-soon binary could not
// describe a store that is open, a world being written, or a game in early
// development — which is most of what there is.
export type Status =
  | 'released'
  | 'building'
  | 'ongoing'
  | 'concept'
  | 'parked';

export const STATUS_LABEL: Record<Status, string> = {
  released: 'Released',
  building: 'Building',
  ongoing: 'Ongoing',
  concept: 'Concept',
  parked: 'Parked',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** The shape a card needs — no MDX body, so it is cheap to hand to a client
 *  component and safe to serialise across the server/client boundary. */
export interface EntrySummary {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readingMinutes: number;
  track?: Track;
  project?: string;
  draft?: boolean;
}
