-- A source can belong to one lesson, not only to the whole curriculum.
--
-- 0008 made sources a list per curriculum, which was right for the question it
-- answered: what is this studied FROM. Japanese runs fourteen books at once and
-- one free-text line could not say so.
--
-- It is the wrong grain for the question a lesson asks. "Thompson, A History of
-- South Africa" is true of all thirty-two lessons and tells none of them where
-- to look; the lesson wants chapter 4, and the next one wants chapter 5. A
-- curriculum-wide list shown under every lesson is a bibliography, and a
-- bibliography is what you consult when you have already decided what to read.
--
-- So: `lesson_id`, nullable, and the nullability is the whole design. A row
-- with it null is what it has always been — the curriculum's own list, shown
-- under every lesson. A row with it set belongs to that one lesson and is shown
-- only there. Nothing already in the table changes meaning, which is why this
-- is a column and not a second table.
--
-- `curriculum_id` stays NOT NULL on both kinds. A lesson's source is still the
-- curriculum's source; carrying both lets the whole set come back in one read
-- and keeps the 0008 index doing its job.
--
-- WHO OWNS WHICH. Scripts own the lesson rows: a build script writes a
-- lesson's sources beside its detail, deletes its own on a rebuild, and that is
-- the only way lesson sources are written. Nothing owns the curriculum rows but
-- the hand that typed them — the sixteen already here for Japanese, Greek and
-- Odin exist in no script, so a rebuild must leave `lesson_id is null`
-- untouched. scripts/curriculums/apply.mjs says the same thing in its header,
-- and a rebuild that forgets it loses a reading list nothing can regenerate.
--
-- ON DELETE CASCADE is declared and not relied upon. D1 enforces foreign keys;
-- node:sqlite, which apply.mjs rehearses against, does not do so by default,
-- and a rebuild there would orphan every lesson source instead of removing it.
-- So the build scripts delete their own rows explicitly, exactly as they
-- already delete lessons before modules rather than trusting the cascade.

ALTER TABLE sources ADD COLUMN lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE;

-- Read one lesson's sources in order, which is the only way a lesson asks.
-- Partial, because the curriculum-wide rows are already served by
-- sources_curriculum and there are thousands of lesson rows coming.
CREATE INDEX IF NOT EXISTS sources_lesson ON sources (lesson_id, position, id)
  WHERE lesson_id IS NOT NULL;
