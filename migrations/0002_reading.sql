-- What is being read, what was, and what was given up on.
--
-- 'abandoned' is a status and not a deletion. A book put down at page 80 is
-- a fact about the reading, and the usual design — delete it and pretend it
-- never happened — loses the most interesting row in the table.
--
-- Dates are local days in Africa/Johannesburg, written as 'YYYY-MM-DD' by the
-- same localDay() the habit ticks use. A book is started on a day, not at an
-- instant, and the reasoning is identical: see worker/db.ts.

CREATE TABLE IF NOT EXISTS books (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  author       TEXT,
  status       TEXT    NOT NULL DEFAULT 'want'
               CHECK (status IN ('want', 'reading', 'read', 'abandoned')),
  -- Total pages, when known, and where he is now. Both nullable: plenty of
  -- what he reads has no page count worth tracking, and progress on a book
  -- whose length is unknown is still worth recording.
  pages        INTEGER,
  page         INTEGER,
  started_on   TEXT,
  finished_on  TEXT,
  -- 1 to 5, and null for anything not finished. A 'read' book with no rating
  -- is a normal state, not a missing one.
  rating       INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  notes        TEXT,
  created_at   TEXT    NOT NULL
);

-- The page groups by status, so that is what it reads by.
CREATE INDEX IF NOT EXISTS books_status ON books (status, id);
