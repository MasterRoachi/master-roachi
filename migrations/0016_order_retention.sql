-- An order's personal details are kept for 30 days.
--
-- His ruling, 2026-10-19 (open decision 3): thirty days from when the order
-- was SUBMITTED, whatever its status, and then the name, email, phone,
-- address and note are blanked. The sale itself — product, size, price, the
-- status and its dates — stays, so the history of what sold survives.
--
-- Known cost, stated when he ruled: an order still in the post on day 30
-- loses its address while it is still travelling.
--
-- Done by the daily cron and on every read of /work/api/orders. This column
-- records when, so the page can say the details were removed rather than
-- showing an order with an empty name as though it were broken.

ALTER TABLE orders ADD COLUMN redacted_at TEXT;
