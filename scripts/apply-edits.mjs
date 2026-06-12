// Generic applier for tune-article proposals: exact before/after body edits plus
// field updates, against any article by slug. Replaces the hard-coded apply-tune.mjs.
//
// Usage:
//   node scripts/apply-edits.mjs <edits.json> --local|--remote
//
// edits.json:
//   {
//     "slug": "what-is-a-kvm-switch",
//     "edits": [{ "before": "exact current text", "after": "replacement text" }],
//     "set":   { "title"?, "dek"?, "seo_title"?, "seo_description"?,
//                "hero_image_url"?, "hero_alt"? }
//   }
//
// Reads the current row from the target D1 first, verifies every "before" string is
// present, applies all changes in one UPDATE, and resyncs the FTS row when the
// article is published. Refuses to write if any "before" no longer matches.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const q = (s) => (s == null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'");
const NOW = new Date().toISOString();

const [, , file, flag] = process.argv;
if (!file || !['--local', '--remote'].includes(flag)) {
  console.error('Usage: node scripts/apply-edits.mjs <edits.json> --local|--remote');
  process.exit(1);
}
const spec = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
if (!spec.slug) {
  console.error('edits.json needs a "slug"');
  process.exit(1);
}

const d1 = (sql) =>
  JSON.parse(
    execSync(`npx wrangler d1 execute techfromalex_db ${flag} --json --command ${JSON.stringify(sql)}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  )[0].results;

const rows = d1(`SELECT id, status, title, dek, body_md FROM content WHERE slug = '${spec.slug.replace(/'/g, "''")}'`);
if (!rows.length) {
  console.error(`No content row with slug "${spec.slug}" in ${flag.slice(2)} D1`);
  process.exit(1);
}
const row = rows[0];

let body = row.body_md;
const misses = [];
for (const e of spec.edits || []) {
  if (!body.includes(e.before)) {
    misses.push(e.before.slice(0, 80));
    continue;
  }
  body = body.split(e.before).join(e.after);
}
if (misses.length) {
  console.error(`REFUSING to write: ${misses.length} "before" string(s) not found in current body:`);
  for (const m of misses) console.error(`  - ${m}...`);
  console.error('The proposal is stale; regenerate it against the current article.');
  process.exit(1);
}

const SETTABLE = ['title', 'dek', 'seo_title', 'seo_description', 'hero_image_url', 'hero_alt'];
const sets = [];
if ((spec.edits || []).length) sets.push(`body_md = ${q(body)}`);
for (const [k, v] of Object.entries(spec.set || {})) {
  if (!SETTABLE.includes(k)) {
    console.error(`Unknown set field "${k}" (allowed: ${SETTABLE.join(', ')})`);
    process.exit(1);
  }
  sets.push(`${k} = ${q(v)}`);
}
if (!sets.length) {
  console.error('Nothing to apply (no edits, no set fields).');
  process.exit(1);
}
sets.push(`updated_at = ${q(NOW)}`);

const out = [`-- apply-edits: ${spec.slug}  ${NOW}`, `UPDATE content SET ${sets.join(', ')} WHERE id = ${q(row.id)};`];

// Keep search in sync for live articles (same strip as src/lib/admin.ts stripPlainText).
if (row.status === 'published') {
  const stripPlainText = (md) =>
    md
      .replace(/^:::\w[^\n]*$/gm, ' ')
      .replace(/^:::$/gm, ' ')
      .replace(/^::\w[^\n]*$/gm, ' ')
      .replace(/:product\[([^\]]+)\]\{[^}]*\}/g, '$1')
      .replace(/^\|.*$/gm, ' ')
      .replace(/[#>*_`~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const tags = d1(`SELECT tag_slug FROM content_tags WHERE content_id = ${q(row.id)}`).map((r) => r.tag_slug);
  const title = (spec.set && spec.set.title) || row.title;
  const dek = (spec.set && spec.set.dek) || row.dek || '';
  out.push(`DELETE FROM content_fts WHERE content_id = ${q(row.id)};`);
  out.push(
    `INSERT INTO content_fts (content_id, title, dek, body_text, tags) VALUES (${q(row.id)}, ${q(title)}, ${q(dek)}, ${q(stripPlainText(body))}, ${q(tags.join(' '))});`,
  );
}

const sqlFile = `.apply-${spec.slug}.sql`;
writeFileSync(sqlFile, out.join('\n') + '\n');
execSync(`npx wrangler d1 execute techfromalex_db ${flag} --file=${sqlFile}`, { stdio: 'inherit' });
console.error(
  `Applied ${(spec.edits || []).length} edit(s) + ${Object.keys(spec.set || {}).length} field(s) to "${spec.slug}" (${flag.slice(2)}).` +
    (row.status === 'published' ? ' FTS resynced. Remember the CDN may cache the page (admin republish purges it).' : ''),
);
