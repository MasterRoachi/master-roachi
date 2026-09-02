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
