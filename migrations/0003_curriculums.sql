-- Curriculums, in three levels: curriculum → module → lesson.
--
-- Three rather than two because that is how courses are actually organised —
-- Odin's NodeJS path has sections with lessons inside them — and collapsing a
-- level later is easy where adding one is not.
--
-- A lesson's completion is a DATE and not a boolean. Same reasoning as the
-- habit ticks and the reading dates: knowing a lesson is done is worth less
-- than knowing when, and a boolean cannot be widened into a date later
-- without losing every tick already recorded. Null means not done.

CREATE TABLE IF NOT EXISTS curriculums (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  -- Where it comes from: a course URL, a book, a syllabus. Free text, because
  -- half of what he studies does not have a URL.
  source      TEXT,
  status      TEXT    NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'paused', 'done')),
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id  INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  -- 'YYYY-MM-DD' in Africa/Johannesburg, or null. See localDay() in
  -- worker/db.ts for why the zone is fixed and not read from the browser.
  done_on    TEXT
);

-- The dashboard reads a whole curriculum at a time, in order.
CREATE INDEX IF NOT EXISTS modules_curriculum ON modules (curriculum_id, position, id);
CREATE INDEX IF NOT EXISTS lessons_module ON lessons (module_id, position, id);
