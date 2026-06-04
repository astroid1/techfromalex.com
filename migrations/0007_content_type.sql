-- 0007_content_type — drop the hardcoded type-enum CHECK on content.type. It only allowed
-- ('review','comparison','roundup','news_deal'), so adding the 'howto' content type (and the
-- "Write from YouTube" flow, which defaults to howto) failed with a CHECK constraint error.
-- ContentType in the app layer (src/lib/types.ts) is the source of truth, so the DB enum is a
-- footgun that requires a full rebuild on every new type. SQLite can't drop a CHECK in place,
-- and content has four ON DELETE CASCADE children, so we stash + rebuild children-first
-- (mirrors migration 0005). The status CHECK is kept; only the type CHECK is removed.

PRAGMA defer_foreign_keys = true;

-- 1) Stash content + its CASCADE children in constraint-free temp tables.
CREATE TABLE _content_tmp AS SELECT * FROM content;
CREATE TABLE _cp_tmp      AS SELECT * FROM content_products;
CREATE TABLE _cap_tmp     AS SELECT * FROM content_affiliate_profiles;
CREATE TABLE _crev_tmp    AS SELECT * FROM content_revisions;
CREATE TABLE _ctags_tmp   AS SELECT * FROM content_tags;

-- 2) Drop the children first (so the parent has no referrers), then content.
DROP TABLE content_products;
DROP TABLE content_affiliate_profiles;
DROP TABLE content_revisions;
DROP TABLE content_tags;
DROP TABLE content;

-- 3) Recreate content with the SAME columns/indexes but NO type-enum CHECK.
CREATE TABLE content (
  id               TEXT PRIMARY KEY,
  type             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK(status IN ('draft','in_review','scheduled','published','unpublished')),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  dek              TEXT,
  category         TEXT REFERENCES categories(slug),
  author_id        TEXT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
  hero_media_id    TEXT REFERENCES media(id) ON DELETE SET NULL,
  hero_image_url   TEXT,
  hero_alt         TEXT,
  verdict_score    REAL,
  body_md          TEXT NOT NULL DEFAULT '',
  structured_json  TEXT NOT NULL DEFAULT '{}',
  seo_title        TEXT,
  seo_description  TEXT,
  canonical_url    TEXT,
  og_media_id      TEXT REFERENCES media(id) ON DELETE SET NULL,
  noindex          INTEGER NOT NULL DEFAULT 0,
  deal_price_cents INTEGER,
  deal_expires_at  TEXT,
  scheduled_for    TEXT,
  published_at     TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX idx_content_status_pub ON content(status, published_at DESC);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_category ON content(category, status, published_at DESC);

-- 4) Recreate the children with their original schemas + indexes.
CREATE TABLE content_products (
  content_id           TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  product_id           TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  role                 TEXT NOT NULL DEFAULT 'featured'
                         CHECK(role IN ('featured','primary','alternative','compared','runner_up')),
  position             INTEGER NOT NULL DEFAULT 0,
  affiliate_profile_id TEXT REFERENCES affiliate_profiles(id) ON DELETE RESTRICT,
  blurb_md             TEXT,
  PRIMARY KEY (content_id, product_id, role)
);
CREATE INDEX idx_cp_product ON content_products(product_id);

CREATE TABLE content_affiliate_profiles (
  content_id           TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  affiliate_profile_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE RESTRICT,
  PRIMARY KEY (content_id, affiliate_profile_id)
);

CREATE TABLE content_revisions (
  id             TEXT PRIMARY KEY,
  content_id     TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  snapshot_json  TEXT NOT NULL,
  status_at_save TEXT NOT NULL,
  note           TEXT,
  source         TEXT NOT NULL DEFAULT 'human' CHECK(source IN ('ai','human','system')),
  created_by     TEXT REFERENCES authors(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL
);
CREATE INDEX idx_rev_content ON content_revisions(content_id, created_at DESC);

CREATE TABLE content_tags (
  content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag_slug   TEXT NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_slug)
);

-- 5) Restore data parent-first (column-identical schemas, so SELECT * is exact).
INSERT INTO content SELECT * FROM _content_tmp;
INSERT INTO content_products SELECT * FROM _cp_tmp;
INSERT INTO content_affiliate_profiles SELECT * FROM _cap_tmp;
INSERT INTO content_revisions SELECT * FROM _crev_tmp;
INSERT INTO content_tags SELECT * FROM _ctags_tmp;

-- 6) Drop temps.
DROP TABLE _content_tmp;
DROP TABLE _cp_tmp;
DROP TABLE _cap_tmp;
DROP TABLE _crev_tmp;
DROP TABLE _ctags_tmp;
