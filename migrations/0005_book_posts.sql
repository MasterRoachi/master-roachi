-- Which post a book became, if it became one.
--
-- Recorded so that making a post from a book is idempotent: without it,
-- pressing the button twice writes a second file under a second slug and the
-- site grows a duplicate nobody asked for. With it, the second press opens
-- what is already there.
--
-- Null is the normal state. Most books never become a post.

ALTER TABLE books ADD COLUMN post_path TEXT;
