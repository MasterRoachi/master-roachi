// Presentation helpers with no filesystem dependency, so client components can
// import them without pulling node:fs into the browser bundle.

export type Track = 'tech' | 'theology';

export const TRACK_LABEL: Record<Track, string> = {
  tech: 'Tech',
  theology: 'Theology',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** The shape a card needs — no MDX body, so it is cheap to send to a client
 *  component and safe to serialise across the server/client boundary. */
export interface EntrySummary {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readingMinutes: number;
  track?: Track;
  draft?: boolean;
}
