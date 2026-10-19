-- Orders move out of KV and into D1.
--
-- WHY. An order lived in KV with a 180-day TTL, so a sale — and the
-- customer's name, email and address — vanished six months later, and the only
-- way to read one was `curl /api/orders?key=<secret>`. Here it is a permanent
-- record, read by /work/shop/ behind Access with the rest of the backend.
--
-- KV is still written when D1 cannot be, for the same reason the buy flow
-- treats storage as non-fatal: losing the convenience is better than blocking
-- a sale. /work/api/orders sweeps whatever is in KV into this table on every
-- read, so a fallback write is not lost and the orders that were already in KV
-- on the day this landed are carried across without a separate step.

CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  -- The customer-facing reference, and what the KV sweep de-duplicates on:
  -- an order carried across twice is the same order.
  ref         TEXT    NOT NULL UNIQUE,
  -- When the form was submitted, as an ISO timestamp. Not the payment: see
  -- status.
  created_at  TEXT    NOT NULL,
  product     TEXT    NOT NULL DEFAULT '',
  product_id  TEXT    NOT NULL DEFAULT '',
  size        TEXT    NOT NULL,
  -- What the page showed. Informational only — the payment link is a fixed
  -- sum and this cannot change it.
  price       TEXT    NOT NULL DEFAULT '',
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  phone       TEXT    NOT NULL DEFAULT '',
  address     TEXT    NOT NULL,
  note        TEXT    NOT NULL DEFAULT '',
  -- His ruling, 2026-10-19. The order is written BEFORE the customer reaches
  -- PayFast, so a stored order is a filled-in form and not a sale:
  --   received   the form was submitted; nothing is known about payment
  --   paid       he has seen the money in PayFast
  --   fulfilled  it has gone to Printful, or out of the door
  --   dismissed  never paid, and he has stopped expecting it to be
  -- Marked by hand. PayFast's shareable links do not tell this Worker anything.
  status      TEXT    NOT NULL DEFAULT 'received'
              CHECK (status IN ('received', 'paid', 'fulfilled', 'dismissed')),
  -- When each mark was made, so a fulfilled order still says when it was paid.
  paid_at      TEXT,
  fulfilled_at TEXT,
  dismissed_at TEXT
);

CREATE INDEX IF NOT EXISTS orders_created ON orders (created_at);
