import fs from 'node:fs';
import path from 'node:path';
import Achievements, { type Achievement } from './Achievements';

// The MDX-facing half of the achievement grid.
//
//   <AchievementGrid game="bioshock-remastered" />
//
// A server component, so the JSON is read at build time and the post body stays
// a piece of writing rather than a data file. The interactive half is
// Achievements, which is the client component underneath.
//
// A missing file renders nothing at all. A grid is an illustration; a post
// should not fail to build because one did not come back from Steam.

export default function AchievementGrid({
  game,
}: {
  /** Matches a slug in scripts/achievements.mjs. */
  game: string;
}) {
  const file = path.join(process.cwd(), 'data', 'achievements', `${game}.json`);
  if (!fs.existsSync(file)) return null;

  let achievements: Achievement[] = [];
  try {
    achievements = JSON.parse(fs.readFileSync(file, 'utf8')).achievements ?? [];
  } catch {
    return null;
  }
  if (achievements.length === 0) return null;

  return <Achievements achievements={achievements} />;
}
