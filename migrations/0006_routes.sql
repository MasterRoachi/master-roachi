-- Which lessons are on the route.
--
-- A course is not a list you finish; it is a list you take a line through.
-- Odin forks into Full Stack JavaScript or Ruby and plenty of lessons are
-- optional, so "18 of 96" is a number about the course rather than about the
-- work — what is being asked is "18 of the 41 I am actually doing".
--
-- DEFAULT 1, on the route. An imported outline is on the route until something
-- is taken off it, which is the right way round: the alternative shows a
-- freshly imported course as 0 of 0 and needs every lesson switched on by hand.
--
-- Only lessons carry the flag. A module is off the route when all of its
-- lessons are, which is derived rather than stored — two sources of truth for
-- the same fact is how they come to disagree.

ALTER TABLE lessons ADD COLUMN on_route INTEGER NOT NULL DEFAULT 1
  CHECK (on_route IN (0, 1));
