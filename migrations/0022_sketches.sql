-- The sketches, in D1 rather than in the repository (his call, 2026-11-11).
--
-- They were files in notes/, committed by /work/api/content like a post. The
-- repository is public, so every sketch was published the moment it was
-- saved, behind Access or not. Here they are private, as everything else in
-- the Sketchpad and Reading already is.
--
-- The API is unchanged: /work/api/content?collection=notes still lists, reads
-- and saves them by path (notes/<slug>.svg), and book_notes still links a
-- book to a path. `sha` plays the part the blob sha played: a hash of the
-- text, sent back on save, so a save over a newer version is refused.

CREATE TABLE IF NOT EXISTS sketches (
  path        TEXT PRIMARY KEY,
  svg         TEXT NOT NULL,
  sha         TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
