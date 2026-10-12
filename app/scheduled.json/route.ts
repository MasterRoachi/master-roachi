import { nextScheduled } from '@/lib/content';

// When the site next needs rebuilding to publish something.
//
// Scheduling on a statically exported site has one real problem: there is no
// "now" at read time. A post dated tomorrow is withheld by today's build and
// included by any build that runs tomorrow — so something has to make a build
// happen tomorrow, and nothing did. The nightly play-data Action only pushes
// when play data actually changed, which is not a publisher.
//
// So the build writes down what it withheld, and the Worker's scheduled
// handler reads this file once a day and rebuilds only when a date has
// arrived. One rebuild on the day a post is due, rather than a commit a day
// forever.
//
// Public, and deliberately so: it is a list of dates with no titles, which
// gives away nothing, and keeping it behind Access would mean the Worker
// authenticating to itself to read its own asset.
export const dynamic = 'force-static';

export function GET() {
  const next = nextScheduled();
  return Response.json(
    { next, checkedAt: new Date().toISOString() },
    {
      headers: {
        // Short, because the whole point is that a build changes it and the
        // Worker must see the change the next day rather than a cached copy.
        'cache-control': 'public, max-age=300',
      },
    },
  );
}
