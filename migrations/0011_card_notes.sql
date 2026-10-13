-- One card, one note, for as long as both exist.
--
-- A kanji card says "read it, then write it from memory", and his question was
-- the obvious one: where. So the cards page grew a panel beside the card, the
-- same size as it, that takes pen and text — "where i can write with my tablet
-- in notes that accept text and drawings".
--
-- `card_id` is the PRIMARY KEY, which is the whole design: a card cannot have
-- two notes and a note cannot be about two cards. His words — "one card and
-- one note always live together". A notes-with-a-card_id table would have
-- allowed a second one, and then something would have had to choose.
--
-- THE NOTE IS APPEND-ONLY IN PRACTICE rather than by constraint. Each review
-- writes below the last, so the note becomes the record of every attempt at
-- that character in order, and the one before is still there to compare
-- against — which is most of the value of writing kanji by hand at all.
-- Nothing enforces that; it falls out of always leaving one empty band at the
-- bottom and scrolling to it. See noteHeight() in lib/card-note.ts.
--
-- The scene is the sketchpad's own format (lib/sketch.ts): a JSON object of
-- strokes and text items. Stored as JSON and not as the SVG the sketchpad
-- saves, because a card note is dashboard data rather than a document — it is
-- never opened as a file, and the SVG wrapper would be most of the bytes.
-- toSvg() still turns one into a file if that is ever wanted.
CREATE TABLE IF NOT EXISTS card_notes (
  card_id    INTEGER PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  -- A Scene: { version, background, items[] }. Validated on the way in by
  -- parseNote() rather than trusted — it arrives from a browser.
  scene      TEXT    NOT NULL,
  -- The page height in scene units, which grows a band at a time as the note
  -- fills. Stored rather than derived on read so the page can be laid out
  -- before the scene is parsed.
  height     INTEGER NOT NULL,
  updated_at TEXT    NOT NULL
);

-- CASCADE here, unlike cards.lesson_id. A note is about one card and is
-- meaningless without it, so deleting the card deliberately — which is the
-- only way a card is ever deleted — takes the note too. Nothing a rebuild does
-- reaches either: a rebuild cannot delete a card at all.
