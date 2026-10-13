-- Flashcards, because Anki was not going to be used.
--
-- Every modern approach to Japanese assumes a spaced-repetition system running
-- daily, and 2,136 kanji cannot be held any other way. His objections to Anki
-- were four, and each one is a design constraint here rather than a matter of
-- taste:
--
--   "it's in a separate window"      — so this is a page in the backend.
--   "finding the right decks is
--    almost impossible"              — so a deck is a curriculum. There is
--                                      nothing to find, download or evaluate:
--                                      the lessons make the cards.
--   "i have no idea how it works"    — so there is nothing to understand. No
--                                      deck options, no intervals to set, no
--                                      ease factors on screen. One number is
--                                      configurable and it is how many new
--                                      cards a day.
--   "learning it takes as long as
--    learning godot"                 — so there are two buttons.
--
-- A DECK IS A CURRICULUM, which is why there is no decks table. Eight
-- curriculums are eight decks, they are already named, already ordered, and
-- already have a colour derived from the name. A decks table would be a second
-- list of the same things, kept in step by hand.

-- FSRS state, one row per card. Fields match the Card type in ts-fsrs 5.x so
-- that no translation layer is needed in either direction: the scheduler is a
-- pure function, it is handed this row and it hands back the next one.
CREATE TABLE IF NOT EXISTS cards (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  -- The lesson that teaches this card, where one does. Null for a card added
  -- by hand. NOT a cascade: see "what a rebuild must not do" below.
  lesson_id     INTEGER REFERENCES lessons(id) ON DELETE SET NULL,

  -- What kind of thing this is, which decides how it is drawn and what is
  -- asked. Typed rather than free front/back text, his call, because a blank
  -- rectangle has to be filled in by hand every time and a kanji card already
  -- knows it wants readings, words and a stroke count.
  kind          TEXT    NOT NULL
                CHECK (kind IN ('kanji', 'word', 'grammar', 'sentence')),

  -- The prompt, and the answer. `front` is the natural key together with
  -- curriculum_id and kind — see the unique index — so it is the one field a
  -- rebuild matches on and the one field that must not be edited casually.
  front         TEXT    NOT NULL,
  back          TEXT    NOT NULL,
  -- Reading, in kana. Separate from `back` so it can be shown as ruby over
  -- the front rather than only beside it.
  reading       TEXT,
  -- Anything else worth seeing on the answer side: a pitch pattern, a stroke
  -- count, the words a kanji appears in. Markdown, same subset as a lesson.
  extra         TEXT,

  -- FSRS, exactly as the library names them.
  due           TEXT    NOT NULL,  -- ISO instant. An instant, not a day: the
                                   -- scheduler works in hours early on.
  stability     REAL    NOT NULL DEFAULT 0,
  difficulty    REAL    NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  learning_steps INTEGER NOT NULL DEFAULT 0,
  reps          INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  -- 0 new, 1 learning, 2 review, 3 relearning. The library's State enum.
  state         INTEGER NOT NULL DEFAULT 0 CHECK (state IN (0, 1, 2, 3)),
  last_review   TEXT,

  -- The day this card became reviewable, which is the day its lesson was
  -- ticked. Null means not yet: a card exists from the moment the curriculum
  -- is built, and waits. This is what "auto" means — his choice — without the
  -- pile growing to two thousand on day one.
  unlocked_on   TEXT,
  created_at    TEXT    NOT NULL
);

-- The natural key. A curriculum cannot hold two cards of the same kind asking
-- the same thing, which is what makes a rebuild able to find a card again
-- after its ids have changed.
CREATE UNIQUE INDEX IF NOT EXISTS cards_identity ON cards (curriculum_id, kind, front);

-- The only query the review loop makes: what is due in this deck, soonest
-- first, excluding what is still locked.
CREATE INDEX IF NOT EXISTS cards_due ON cards (curriculum_id, due, id);
-- And the one the lesson tick makes: unlock everything this lesson taught.
CREATE INDEX IF NOT EXISTS cards_lesson ON cards (lesson_id);

-- Every review, forever.
--
-- FSRS needs only the card's current state to schedule the next review, so
-- this table is not required for the thing to work. It exists because without
-- it the scheduler can never be re-optimised against his own answers, and that
-- is the one thing that would make this better than Anki rather than merely
-- less annoying. ts-fsrs ships an optimiser that takes a review history; a
-- history not kept cannot be handed to it later.
CREATE TABLE IF NOT EXISTS card_reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id     INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  -- 1 Again, 3 Good. The library's Rating enum, which also has Hard (2) and
  -- Easy (4) — not shown, his call, two buttons. Stored as the library's
  -- numbers anyway so that a third button later needs no migration.
  rating      INTEGER NOT NULL CHECK (rating IN (1, 2, 3, 4)),
  -- The state the card was in BEFORE this review, which is what an optimiser
  -- needs and what cannot be reconstructed afterwards.
  state       INTEGER NOT NULL CHECK (state IN (0, 1, 2, 3)),
  reviewed_at TEXT    NOT NULL,
  -- 'YYYY-MM-DD' in Africa/Johannesburg. Denormalised from reviewed_at on
  -- purpose: the new-card allowance is per day, and asking "how many today"
  -- of an instant means a range scan and a timezone argument every time.
  day         TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS card_reviews_card ON card_reviews (card_id, reviewed_at);
CREATE INDEX IF NOT EXISTS card_reviews_day ON card_reviews (day);

-- How many new cards a day, per deck.
--
-- On the curriculum rather than in a settings table, and per deck rather than
-- global: Japanese is 2,136 kanji and Greek is a vocabulary list, and one
-- number for both means the wrong number for both. Null means the default in
-- lib/cards.ts, so a curriculum that has never been thought about behaves
-- sensibly and nothing has to be seeded.
ALTER TABLE curriculums ADD COLUMN new_per_day INTEGER;

-- WHAT A REBUILD MUST NOT DO.
--
-- `npm run curriculum <name>` deletes every lesson and re-inserts it. If cards
-- cascaded from lessons, a rebuild would delete months of review history and no
-- script could put it back — the same trap as done_on and detail, but worse,
-- because a tick is one date and a card is a hundred.
--
-- So: ON DELETE SET NULL, not CASCADE. A rebuild empties lesson_id and the card
-- survives with its whole history. The build script then re-points it by the
-- natural key above, inserting what is new and leaving the scheduling alone.
-- Build scripts never delete a card; a card whose lesson is gone is reported,
-- the same way an orphan lesson is.
