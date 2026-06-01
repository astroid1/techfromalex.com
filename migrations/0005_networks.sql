-- 0005_networks — promote affiliate "network" from a hardcoded enum to managed data.
-- Adds a `networks` table (carrying the link-building rule per network) and rebuilds
-- `affiliate_profiles` to drop CHECK(network IN (...)) and instead reference networks(id).
--
-- SQLite can't drop a CHECK in place, and affiliate_profiles is the parent of three
-- ON DELETE RESTRICT children (product_links, content_products, content_affiliate_profiles),
-- so a plain DROP trips RESTRICT (which defer_foreign_keys does NOT defer). We therefore
-- stash all affected rows in constraint-free temp tables, drop the FK-bearing tables
-- children-first, recreate them (parent with the new schema), restore the data, and let
-- deferred FKs re-validate at commit against the preserved ids.

PRAGMA defer_foreign_keys = true;

CREATE TABLE networks (
  id                TEXT PRIMARY KEY,             -- slug, e.g. 'amazon'
  name              TEXT NOT NULL,                -- display name
  link_param        TEXT NOT NULL DEFAULT 'tag',  -- query param carrying the tag ('' = none)
  extra_params_json TEXT NOT NULL DEFAULT '{}',   -- static extra query params for every link
  param_help        TEXT,                         -- guidance shown under the tag field
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

INSERT INTO networks (id, name, link_param, extra_params_json, param_help, is_active, created_at, updated_at) VALUES
  ('amazon',  'Amazon Associates', 'tag',      '{}', 'Your Amazon Associates tracking ID (e.g. techfromalex-20).',          1, '2025-04-01T00:00:00.000Z', '2025-04-01T00:00:00.000Z'),
  ('bestbuy', 'Best Buy',          'irclickid','{}', 'Your Best Buy / Impact click reference or affiliate ID.',             1, '2025-04-01T00:00:00.000Z', '2025-04-01T00:00:00.000Z'),
  ('bhphoto', 'B&H Photo',         'BI',       '{}', 'Your B&H affiliate (BI) ID. Add a KBID via link rules if required.',  1, '2025-04-01T00:00:00.000Z', '2025-04-01T00:00:00.000Z'),
  ('impact',  'Impact',            'subId1',   '{}', 'Your Impact publisher SubId / tracking value.',                       1, '2025-04-01T00:00:00.000Z', '2025-04-01T00:00:00.000Z'),
  ('cj',      'CJ Affiliate',      'subId1',   '{}', 'Your CJ (Commission Junction) SID / tracking value.',                 1, '2025-04-01T00:00:00.000Z', '2025-04-01T00:00:00.000Z'),
  ('manual',  'Manual link',       '',         '{}', 'No tag is appended — paste the full pre-built tracking URL as the product link.', 1, '2025-04-01T00:00:00.000Z', '2025-04-01T00:00:00.000Z');

-- 1) Stash data in constraint-free temp tables.
CREATE TABLE _ap_tmp  AS SELECT * FROM affiliate_profiles;
CREATE TABLE _pl_tmp  AS SELECT * FROM product_links;
CREATE TABLE _cp_tmp  AS SELECT * FROM content_products;
CREATE TABLE _cap_tmp AS SELECT * FROM content_affiliate_profiles;

-- 2) Drop FK-bearing tables children-first (so the parent has no referrers left).
DROP TABLE product_links;
DROP TABLE content_products;
DROP TABLE content_affiliate_profiles;
DROP TABLE affiliate_profiles;

-- 3) Recreate the parent with the new schema (no CHECK enum; FK to networks).
CREATE TABLE affiliate_profiles (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  network             TEXT NOT NULL REFERENCES networks(id) ON DELETE RESTRICT,
  tracking_tag        TEXT NOT NULL,
  link_rules_json     TEXT NOT NULL DEFAULT '{}',
  secret_binding_name TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  CHECK (length(trim(tracking_tag)) > 0)
);

-- 4) Recreate the children with their original schemas.
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

CREATE TABLE content_affiliate_profiles (
  content_id           TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  affiliate_profile_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE RESTRICT,
  PRIMARY KEY (content_id, affiliate_profile_id)
);

-- 5) Restore data parent-first.
INSERT INTO affiliate_profiles (id, name, network, tracking_tag, link_rules_json, secret_binding_name, is_active, created_at, updated_at)
  SELECT id, name, network, tracking_tag, link_rules_json, secret_binding_name, is_active, created_at, updated_at FROM _ap_tmp;
INSERT INTO product_links (id, product_id, affiliate_profile_id, base_url, tag_override, is_primary, created_at, updated_at)
  SELECT id, product_id, affiliate_profile_id, base_url, tag_override, is_primary, created_at, updated_at FROM _pl_tmp;
INSERT INTO content_products (content_id, product_id, role, position, affiliate_profile_id, blurb_md)
  SELECT content_id, product_id, role, position, affiliate_profile_id, blurb_md FROM _cp_tmp;
INSERT INTO content_affiliate_profiles (content_id, affiliate_profile_id)
  SELECT content_id, affiliate_profile_id FROM _cap_tmp;

-- 6) Recreate indexes.
CREATE INDEX idx_aff_network ON affiliate_profiles(network);
CREATE INDEX idx_plinks_product ON product_links(product_id);
CREATE INDEX idx_plinks_profile ON product_links(affiliate_profile_id);
CREATE INDEX idx_cp_product ON content_products(product_id);

-- 7) Drop temps.
DROP TABLE _ap_tmp;
DROP TABLE _pl_tmp;
DROP TABLE _cp_tmp;
DROP TABLE _cap_tmp;
