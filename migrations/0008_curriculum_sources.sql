-- What a curriculum is actually studied FROM.
--
-- `curriculums.source` was one free-text line — "a course URL, a book, a
-- syllabus. Free text, because half of what he studies does not have a URL".
-- That was right for one field and wrong as soon as the dashboard grew a
-- Sources card per lesson, because a real curriculum is studied from several
-- things at once: Greek runs Pimsleur and the Basic Course in tandem, Japanese
-- runs fourteen books, and Piano's source is currently the filename of the
-- document that designed it.
--
-- So: a row per source, ordered, with a title and optionally somewhere to go.
--
-- `url` is nullable on purpose and for the original reason — a book has no
-- URL, and a source that is just "Japanese From Zero! vol. 1, pp. 68-88" is a
-- complete answer to where the work comes from. `note` carries what a title
-- cannot: an edition, a shelf, which volume.
--
-- curriculums.source is NOT dropped. It is carried into this table below and
-- then left alone: it is referenced by the build scripts, where it records
-- which .md file designed the curriculum, and that is a different fact from
-- what he studies from. Dropping a column in SQLite also rewrites the table,
-- which is not worth doing to tidy away one string.

CREATE TABLE IF NOT EXISTS sources (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  title         TEXT    NOT NULL,
  url           TEXT,
  note          TEXT,
  position      INTEGER NOT NULL DEFAULT 0
);

-- Read a whole curriculum's sources at once, in order, which is the only way
-- the card ever asks for them.
CREATE INDEX IF NOT EXISTS sources_curriculum ON sources (curriculum_id, position, id);

-- Carry over what is already recorded, so no curriculum opens its Sources card
-- empty on the first day. A source that looks like a repository path is where
-- the curriculum was DESIGNED rather than something he studies from, so it is
-- labelled as such instead of pretending to be a reading list.
INSERT INTO sources (curriculum_id, title, url, note, position)
  SELECT
    id,
    source,
    CASE WHEN source LIKE 'http%' THEN source ELSE NULL END,
    CASE WHEN source LIKE 'scripts/%' THEN 'The document this curriculum was designed in.' ELSE NULL END,
    1
  FROM curriculums
  WHERE source IS NOT NULL AND trim(source) <> ''
    AND NOT EXISTS (SELECT 1 FROM sources WHERE sources.curriculum_id = curriculums.id);
