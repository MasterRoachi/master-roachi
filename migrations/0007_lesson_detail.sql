-- What a lesson actually teaches.
--
-- Until now a lesson had a name and nothing else, which makes a curriculum an
-- index rather than a curriculum. "Bench height and posture — wrists level,
-- shoulders down, feet flat" names a topic; it does not say what wrist level
-- means, how high the bench goes, or how to tell when it is wrong. The
-- knowledge was in the design and never written down.
--
-- So: the substance, in Markdown, nullable. Nullable because for a transcribed
-- curriculum the substance is in the resource — a Japanese session pointing at
-- JFZ1 pp. 68-88 does not need the grammar restated beside it — while a
-- designed one has nowhere else to keep it.

ALTER TABLE lessons ADD COLUMN detail TEXT;
