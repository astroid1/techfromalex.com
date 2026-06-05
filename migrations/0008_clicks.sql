-- Outbound affiliate-click tracking for the /go redirect.
CREATE TABLE click_events (
  id           TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL,
  target_type  TEXT NOT NULL,          -- 'product' | 'program'
  target_id    TEXT NOT NULL,
  network      TEXT,
  content_id   TEXT,
  source_path  TEXT,                   -- referring article path, best-effort
  placement    TEXT,                   -- e.g. 'product-card', 'cross-sell', 'sticky-bar'
  position     INTEGER
);
CREATE INDEX idx_click_created ON click_events(created_at);
CREATE INDEX idx_click_target ON click_events(target_type, target_id);
CREATE INDEX idx_click_source ON click_events(source_path);
