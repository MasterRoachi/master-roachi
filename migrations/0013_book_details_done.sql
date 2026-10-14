-- Whether a book's four facts have been settled.
--
-- Series, genre, language and translator are a setup step, not a standing
-- form: they are filled once from the library or by hand, confirmed, and then
-- the inputs have no further business on the page. What survives on screen
-- afterwards is only what is worth reading — the series under the author and
-- the genre as a mark in the corner. Language and translator are kept and not
-- shown; they are facts about the book, not things to look at every time.
--
-- Default 0, so every book already on a shelf still offers the fields.
ALTER TABLE books ADD COLUMN details_done INTEGER NOT NULL DEFAULT 0
  CHECK (details_done IN (0, 1));
