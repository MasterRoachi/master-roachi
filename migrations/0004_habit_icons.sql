-- An icon per habit, so a row is identifiable at a glance rather than by
-- reading a column of names.
--
-- Stores the icon's NAME, not its path data. The drawing lives in
-- lib/habit-icons.tsx, so improving an icon improves it everywhere instead of
-- leaving old rows holding an old drawing — and a name survives a redraw.
--
-- Nullable: a habit without one is a normal state, and gets a neutral mark.

ALTER TABLE habits ADD COLUMN icon TEXT;
