-- What a PayFast checkout charged, and PayFast's word that it was paid.
--
-- His ruling, 2026-10-19: delivery is quoted live from Printful and paid at
-- PayFast's checkout, instead of being built into a fixed payment link. The
-- Worker works out every amount itself (lib/price.ts) and records it here
-- before the customer leaves for PayFast, so a payment notification can be
-- checked against what was actually asked for.
--
-- All null for an order from a payment link, which records only the `price`
-- label the page showed.

ALTER TABLE orders ADD COLUMN item_amount REAL;
ALTER TABLE orders ADD COLUMN shipping_amount REAL;
ALTER TABLE orders ADD COLUMN total REAL;
ALTER TABLE orders ADD COLUMN currency TEXT;
-- Printful's id for the method quoted (e.g. STANDARD), so the order sent to
-- Printful uses the delivery the customer paid for.
ALTER TABLE orders ADD COLUMN shipping_method TEXT;
ALTER TABLE orders ADD COLUMN shipping_name TEXT;
-- PayFast's own reference for the payment, from its notification.
ALTER TABLE orders ADD COLUMN pf_payment_id TEXT;
