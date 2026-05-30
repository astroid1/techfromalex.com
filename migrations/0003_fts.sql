-- 0003_fts — full-text search index over published content.
-- Standalone FTS5 (stores its own copy) so DELETE/INSERT work simply; the
-- admin publish path keeps it in sync, search joins back via content_id.

CREATE VIRTUAL TABLE content_fts USING fts5(
  content_id UNINDEXED,
  title,
  dek,
  body_text,
  tags,
  tokenize = 'porter unicode61'
);
