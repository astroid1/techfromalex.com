-- 0002_schema — canonical content-platform schema.
-- SQLite/D1: INTEGER 0/1 for bools, TEXT for JSON & ISO-8601 timestamps, ULID text PKs.
-- Every outward relation from `content` is ON DELETE RESTRICT so a referenced
-- product/profile can never be orphaned (structurally prevents the samsung-t7 bug).

CREATE TABLE authors (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  email           TEXT,
  bio             TEXT,
  title           TEXT,
  avatar_media_id TEXT,
  same_as_json    TEXT NOT NULL DEFAULT '[]',
  is_owner        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE media (
  id          TEXT PRIMARY KEY,
  r2_key      TEXT NOT NULL UNIQUE,
  url_path    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  bytes       INTEGER NOT NULL DEFAULT 0,
  width       INTEGER,
  height      INTEGER,
  lqip        TEXT,
  alt         TEXT NOT NULL,
  title       TEXT,
  uploaded_by TEXT REFERENCES authors(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_media_created ON media(created_at DESC);

CREATE TABLE affiliate_profiles (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  network             TEXT NOT NULL CHECK(network IN ('amazon','impact','cj','bestbuy','bhphoto','manual')),
  tracking_tag        TEXT NOT NULL,
  link_rules_json     TEXT NOT NULL DEFAULT '{}',
  secret_binding_name TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  CHECK (length(trim(tracking_tag)) > 0)
);
CREATE INDEX idx_aff_network ON affiliate_profiles(network);

CREATE TABLE products (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  brand             TEXT,
  category          TEXT,
  hero_media_id     TEXT REFERENCES media(id) ON DELETE SET NULL,
  image_url         TEXT,
  price_cents       INTEGER,
  currency          TEXT NOT NULL DEFAULT 'USD',
  price_source      TEXT,
  price_observed_at TEXT,
  rating            REAL,
  description       TEXT,
  pros_json         TEXT NOT NULL DEFAULT '[]',
  cons_json         TEXT NOT NULL DEFAULT '[]',
  specs_json        TEXT NOT NULL DEFAULT '{}',
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_products_category ON products(category);

CREATE TABLE product_links (
  id                   TEXT PRIMARY KEY,
  product_id           TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  affiliate_profile_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE RESTRICT,
  base_url             TEXT NOT NULL,
  tag_override         TEXT,
  is_primary           INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  UNIQUE(product_id, affiliate_profile_id)
);
CREATE INDEX idx_plinks_product ON product_links(product_id);
CREATE INDEX idx_plinks_profile ON product_links(affiliate_profile_id);

CREATE TABLE content (
  id               TEXT PRIMARY KEY,
  type             TEXT NOT NULL CHECK(type IN ('review','comparison','roundup','news_deal')),
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

CREATE TABLE tags (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE content_tags (
  content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag_slug   TEXT NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_slug)
);
