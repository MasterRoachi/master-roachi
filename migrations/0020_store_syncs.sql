-- When the store was last checked against Printful, whether or not it changed.
--
-- Sync commits data/store.json only when the catalogue actually changed —
-- every commit is a deploy — so the catalogue's own `fetchedAt` is the last
-- CHANGE, not the last CHECK. The stale-catalogue warning on /work/shop went by
-- fetchedAt, and so it never cleared after a sync that found nothing new. Each
-- successful sync writes a row here instead, which costs no commit, and the
-- warning goes by the later of the two.

CREATE TABLE IF NOT EXISTS store_syncs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  synced_at  TEXT    NOT NULL,
  -- Whether that sync committed a new catalogue.
  changed    INTEGER NOT NULL,
  products   INTEGER NOT NULL
);
