-- 0001_init — taxonomy bootstrap (Phase 0).
-- The full content/products/affiliate schema is added in Phase 1 migrations.

CREATE TABLE IF NOT EXISTS categories (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  position    INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO categories (slug, name, description, position) VALUES
  ('reviews',     'Reviews',     'In-depth product reviews',              1),
  ('guides',      'Guides',      'Buying guides and how-tos',             2),
  ('comparisons', 'Comparisons', 'Head-to-head product comparisons',      3),
  ('deals',       'Deals',       'The best tech deals right now',         4),
  ('news',        'News',        'Latest tech news and announcements',    5);
