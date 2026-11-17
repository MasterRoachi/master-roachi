-- The Sync button's work in progress, a few products per request.
--
-- A sync of the whole store is about 260 Printful requests since Timon's art
-- (13 Nov 2026), with rate-limit waits, which is too much to ask of one Worker
-- request. So the button lists the store (part -1, the listing), then fetches
-- the products ten at a time (part = the offset of the first), then asks for
-- the parts to be put together and committed. Each part is kept here between
-- requests, because D1 is read back exactly as written where KV may not be.
--
-- A run's rows are deleted when it finishes; runs left unfinished are deleted
-- a day later, at the next start.
CREATE TABLE store_sync_parts (
  run TEXT NOT NULL,
  part INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (run, part)
);
