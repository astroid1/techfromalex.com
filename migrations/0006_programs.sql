-- 0006_programs — single-link affiliate "programs" (e.g. make.com), promoted in
-- content via a CTA block. A program references an affiliate_profile (for the
-- network link rule + tracking tag) plus a destination base_url; the shown link is
-- built by buildAffiliateUrl(profile, {base_url}) so the referral tag is always
-- applied and an empty tag can never ship an un-tagged link.

CREATE TABLE programs (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  affiliate_profile_id TEXT NOT NULL REFERENCES affiliate_profiles(id) ON DELETE RESTRICT,
  base_url             TEXT NOT NULL,
  cta_label            TEXT NOT NULL DEFAULT 'Learn more',
  headline             TEXT,
  blurb                TEXT,
  logo_url             TEXT,
  is_active            INTEGER NOT NULL DEFAULT 1,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);
CREATE INDEX idx_programs_profile ON programs(affiliate_profile_id);

-- Seed make.com: single-link program. The 'make' network appends ?pc=<tag>, the
-- profile carries the partner code 'astroid', so the built link is
-- https://www.make.com/en/register?pc=astroid.
INSERT INTO networks (id, name, link_param, extra_params_json, param_help, is_active, created_at, updated_at) VALUES
  ('make', 'Make.com', 'pc', '{}', 'Your make.com partner/referral code (e.g. astroid).', 1, '2026-06-03T00:00:00.000Z', '2026-06-03T00:00:00.000Z');

INSERT INTO affiliate_profiles (id, name, network, tracking_tag, link_rules_json, is_active, created_at, updated_at) VALUES
  ('make-astroid', 'Make.com (astroid)', 'make', 'astroid', '{}', 1, '2026-06-03T00:00:00.000Z', '2026-06-03T00:00:00.000Z');

INSERT INTO programs (id, name, affiliate_profile_id, base_url, cta_label, headline, blurb, logo_url, is_active, created_at, updated_at) VALUES
  ('make', 'Make', 'make-astroid', 'https://www.make.com/en/register', 'Try Make free',
   'Make — automate anything', 'Connect 2,000+ apps and build powerful workflows without writing a line of code.', NULL, 1,
   '2026-06-03T00:00:00.000Z', '2026-06-03T00:00:00.000Z');
