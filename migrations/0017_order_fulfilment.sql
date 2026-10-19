-- An order can be sent to Printful, and Printful's status comes back onto it.
--
-- Shop step 3, his rulings of 2026-10-19: a Paid order gets a "Send to
-- Printful" button; it is created in Printful as a DRAFT, which he confirms in
-- Printful's own dashboard, so nothing is charged by a mistaken click; and the
-- status and tracking are read back whenever /work/shop loads, not by webhook.

-- Printful's order id. Null until sent; set once, and the Send button is gone
-- after that, so one order cannot become two in Printful.
ALTER TABLE orders ADD COLUMN printful_id INTEGER;
-- Printful's own word for where it is: draft, pending, inprocess, onhold,
-- partial, fulfilled, canceled, failed. Shown as given, not translated.
ALTER TABLE orders ADD COLUMN printful_status TEXT;
ALTER TABLE orders ADD COLUMN sent_at TEXT;
-- The first shipment's tracking, once Printful has one.
ALTER TABLE orders ADD COLUMN carrier TEXT;
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN tracking_url TEXT;
