-- Who a curriculum is for, in Ohana, the household app.
--
-- 'his', 'hers' or 'both'; null means not shared, and Ohana does not see it.
-- "Both" is ONE shared progress, his ruling (2026-11-04): a lesson ticked or a
-- card answered by either of them is done for both. There is no per-person
-- state, and adding one later would be a schema change, not a filter.
--
-- Set from the dashboard's curriculum card. Seeded here with his first ruling:
-- Piano is for both of them, every other curriculum is his.

ALTER TABLE curriculums ADD COLUMN audience TEXT
  CHECK (audience IN ('his', 'hers', 'both'));

UPDATE curriculums SET audience = 'his';
UPDATE curriculums SET audience = 'both' WHERE name = 'Piano';
