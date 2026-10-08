-- Habits, and what was done on which day.
--
-- A tick belongs to a DAY, not to an instant. That distinction is the whole
-- reason `day` is text and not a timestamp: a habit done at 00:30 belongs to
-- that night, and storing the moment in UTC would file it under the previous
-- day — the one time a habit tracker is most likely to be wrong is exactly
-- when someone ticks something late. See localDay() in worker/db.ts.

CREATE TABLE IF NOT EXISTS habits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  -- 'daily' means every day. 'weekly' means `target` times in a week, which
  -- is a different question to ask of a streak, so the two are not merged.
  cadence     TEXT    NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly')),
  -- Only meaningful for 'weekly'. Null for daily rather than 7, so that a
  -- daily habit cannot be half-converted by writing a number here.
  target      INTEGER,
  position    INTEGER NOT NULL DEFAULT 0,
  -- Archived rather than deleted: the ticks are history, and deleting the
  -- habit would take years of them with it.
  archived    INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  created_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_ticks (
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  -- 'YYYY-MM-DD' in Africa/Johannesburg. Sorts and compares as text.
  day      TEXT    NOT NULL,
  -- One tick per habit per day, enforced rather than checked: toggling is
  -- then an insert or a delete, and a double-tap cannot create two.
  PRIMARY KEY (habit_id, day)
);

-- The tracker's only real query: every tick in a window, newest first.
CREATE INDEX IF NOT EXISTS habit_ticks_day ON habit_ticks (day);
