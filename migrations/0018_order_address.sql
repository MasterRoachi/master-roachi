-- An order's address in Printful's fields, as the buy form now asks for it.
--
-- `address` stays: it is the address as one block of text, composed from
-- these for an order placed through the new form, and the only record for an
-- order placed before it. The orders page shows `address`; the Send to
-- Printful form fills itself from these when they are there, and falls back
-- to guessing from the text when they are not.
--
-- Blanked with the rest of the personal details after 30 days.

ALTER TABLE orders ADD COLUMN address1 TEXT;
ALTER TABLE orders ADD COLUMN address2 TEXT;
ALTER TABLE orders ADD COLUMN city TEXT;
ALTER TABLE orders ADD COLUMN state_code TEXT;
ALTER TABLE orders ADD COLUMN zip TEXT;
ALTER TABLE orders ADD COLUMN country_code TEXT;
