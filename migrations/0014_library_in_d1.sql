-- The Calibre index moves out of the repository and into D1.
--
-- WHY. The index was written to public/work/library.json so that Cloudflare
-- Access, which matches the /work prefix, would gate it. That reasoning was
-- right about SERVING and wrong about STORING: the GitHub repository is
-- public, so committing the file publishes a listing of all 3,623 books he
-- owns to anyone who opens the repo, whatever Access does at the edge. The
-- file was therefore never committed, and the reading page's book browser has
-- been inert in production ever since — it fetches a file that is not there.
--
-- Here it is a table, read by the Worker and served from /work/api/library
-- under the same one Access policy as every other backend route. Nothing
-- about the library lands in the repository.
--
-- This is an INDEX, not a reading list. `books` is what he reads; this is what
-- he owns, and it exists only so that adding a book can be a search instead of
-- retyping what Calibre already knows. The two are joined by calibre_id, and
-- a book on a shelf need not be in here at all — most of what he wants to read
-- next is not on the rig.

CREATE TABLE IF NOT EXISTS library_books (
  -- Calibre's own book id, and the primary key. Not an autoincrement of our
  -- own: this table is a projection of metadata.db and is rebuilt wholesale,
  -- so a surrogate key would change under rows that did not.
  --
  -- It is also the id Calibre keeps when a title is corrected and the folder
  -- is renamed, which is why books.calibre_id points at it.
  calibre_id   INTEGER PRIMARY KEY,
  title        TEXT    NOT NULL,
  -- Calibre's own ' & ' join, kept as written rather than split into rows:
  -- this is for searching and for filling in the add card, never for asking
  -- questions about authorship.
  authors      TEXT,
  series       TEXT,
  -- Real, for the same reason books.series_index is: Calibre numbers novellas
  -- 2.5. Only meaningful beside a series, and null without one.
  series_index REAL,
  -- Calibre's tags, comma-joined. Named genre to match books.genre, which is
  -- what it fills in.
  genre        TEXT,
  language     TEXT,
  -- Whether Calibre holds a cover.jpg for it. Not whether we hold a webp —
  -- that is library_covers, and only shelved books get one.
  has_cover    INTEGER NOT NULL DEFAULT 0,
  -- When this row was last written from metadata.db. One value for the whole
  -- rebuild, so it doubles as the index's generated-at.
  indexed_at   TEXT    NOT NULL
);

-- The add card searches title and author as you type. SQLite will not use an
-- index for a leading-wildcard LIKE, so these earn their keep on the ordering
-- and on exact and prefix matches rather than on the contains case.
CREATE INDEX IF NOT EXISTS library_books_author ON library_books (authors, series_index, title);
CREATE INDEX IF NOT EXISTS library_books_title  ON library_books (title);

-- Cover art, for the books actually on a shelf.
--
-- Separate table rather than a column on library_books, because the index is
-- rebuilt wholesale from metadata.db and the covers are not: a rebuild must
-- not drop image bytes, and a cover must survive its book leaving the library.
-- It is also the reason this is keyed on calibre_id rather than on books.id —
-- the art belongs to the library row, and a shelf entry can be deleted and
-- re-added without fetching it again.
--
-- Only shelved books get one. 3,623 covers would be a few hundred megabytes
-- of books he is not reading; the shelved set is a handful.
CREATE TABLE IF NOT EXISTS library_covers (
  calibre_id INTEGER PRIMARY KEY,
  -- A 320px-wide WebP at quality 80, resized from Calibre's cover.jpg. The
  -- grid draws them at about 150 CSS px, so this covers a 2x screen and
  -- nothing more.
  webp       BLOB    NOT NULL,
  bytes      INTEGER NOT NULL,
  made_at    TEXT    NOT NULL
);
