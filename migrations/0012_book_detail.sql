-- What a book is, beyond its title: the fields that were being carried in his
-- head, plus the two things he wanted to keep against a book — quotes, and
-- sketchpad notes.
--
-- All nullable. A book typed in by hand knows none of this, and a book that
-- is simply a title on the Next shelf should not have to.

-- Which row of the Calibre library this is, when it came from there.
-- Null for anything typed in by hand, which is the normal state for a book he
-- does not own a file of. It is what resolves the cover at build time — see
-- scripts/book-covers.mjs — so it is the id and not the folder path: Calibre
-- renames a folder when a title is corrected, and the id survives that.
ALTER TABLE books ADD COLUMN calibre_id INTEGER;

ALTER TABLE books ADD COLUMN series TEXT;
-- Real, not integer: Calibre numbers novellas 2.5, and rounding one to 2 puts
-- it on top of the book it sits between.
ALTER TABLE books ADD COLUMN series_index REAL;
ALTER TABLE books ADD COLUMN genre TEXT;
ALTER TABLE books ADD COLUMN language TEXT;
-- A fact about the READ, not about the work: which Odyssey this was is the
-- difference between two quite different books.
ALTER TABLE books ADD COLUMN translator TEXT;

CREATE INDEX IF NOT EXISTS books_calibre ON books (calibre_id);

-- Quotes, kept while reading.
--
-- Their own table rather than more lines in `notes`: a quote has a page and a
-- date and wants to be listed, counted and pulled out on its own, and none of
-- that is possible once it is prose in a textarea.
CREATE TABLE IF NOT EXISTS book_quotes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  text       TEXT    NOT NULL,
  -- Where it was found. Null is normal: plenty of what is worth keeping is
  -- noticed without the page being noted.
  page       INTEGER,
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS book_quotes_book ON book_quotes (book_id, id);

-- Sketchpad pages kept against a book.
--
-- The sketch itself is a file in the `notes` collection, written through
-- /work/api/content like every other one — this table only says which book it
-- belongs to. Storing the drawing here instead would put an SVG in D1 and
-- take it out of the repo, where the sketchpad can still open it.
--
-- A book can have several; a sketch belongs to at most one book, so the path
-- is the key.
CREATE TABLE IF NOT EXISTS book_notes (
  path       TEXT    PRIMARY KEY,
  book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS book_notes_book ON book_notes (book_id, path);
