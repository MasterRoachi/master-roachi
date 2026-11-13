-- Who drew what an order is for, and what Printful charged to make it.
--
-- Timon's art is sold on a 50/50 split of the profit, Master Roachi's ruling
-- of 12 Nov 2026: the item's price less Printful's cost, delivery left out.
-- lib/artist-share.ts does the arithmetic.
--
-- The artist and share are copied on when the order is placed, so changing a
-- share in /work/shop later never rewrites what an old sale owed. Null on his
-- own work and on every order from before this.
ALTER TABLE orders ADD COLUMN artist TEXT;
ALTER TABLE orders ADD COLUMN artist_share REAL;
-- What Printful charges to make the item, in rand: its order total less
-- delivery, converted at lib/pricing.json's rate. Set when the order is sent
-- to Printful, or on the next read once Printful has costed it.
ALTER TABLE orders ADD COLUMN item_cost REAL;
