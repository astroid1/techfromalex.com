// Generic seeder: turn a create-article workflow proposal (JSON) into a DRAFT in D1.
// Replaces the one-off seed-*.mjs scripts. Never publishes; review and publish in /admin.
//
// Usage:
//   node scripts/seed-article.mjs <proposal.json>            # write .seed-<slug>.sql only
//   node scripts/seed-article.mjs <proposal.json> --local    # also apply to local D1
//   node scripts/seed-article.mjs <proposal.json> --remote   # also apply to PROD D1
//
// Proposal shape = the create-article workflow return value:
//   { type, category, article: {title, slug, dek, seoTitle, seoDescription, tags, bodyMd, structured},
//     products: [{id, name, brand, category, asin, priceUsd, rating, imageUrl, pros, cons,
//                 specs: [{name,value}], rationale, ...}],
//     hero: {imageUrl, alt, ...} | null }
//
// Behavior:
//   - Products and their Amazon links use INSERT OR IGNORE: a product id that already
//     exists in D1 is kept as-is (the article just references it).
//   - The content row is a plain INSERT: seeding the same slug twice fails loudly.
//   - Products without a verified ASIN are DROPPED (affiliate-link integrity) and their
//     directives are removed from the body; a warning is printed.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const NOW = new Date().toISOString();
const q = (s) => (s == null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'");
const json = (o) => q(JSON.stringify(o));
const n = (x) => (x == null ? 'NULL' : String(x));
const slugify = (s) => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const [, , file, flag] = process.argv;
if (!file) {
  console.error('Usage: node scripts/seed-article.mjs <proposal.json> [--local|--remote]');
  process.exit(1);
}
const d = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const A = d.article;
if (!A || !A.slug || !A.title || !A.bodyMd) {
  console.error('Proposal is missing article.slug / article.title / article.bodyMd');
  process.exit(1);
}
const hero = d.hero && d.hero.imageUrl ? d.hero : null;
const allProducts = Array.isArray(d.products) ? d.products : [];

// Drop anything without a real ASIN; never seed an unmonetizable buy link.
const ASIN_RE = /^[A-Z0-9]{10}$/;
const products = allProducts.filter((p) => ASIN_RE.test(String(p.asin || '')));
const dropped = allProducts.filter((p) => !ASIN_RE.test(String(p.asin || '')));
for (const p of dropped) console.error(`WARN dropped product without valid ASIN: ${p.name} (asin=${p.asin})`);

// Clean, brand-deduped product ids; remap occurrences in body + structured.
const seen = new Set();
const idMap = {};
for (const p of products) {
  const nm = String(p.name || ''), br = String(p.brand || '');
  let id = slugify(br && !nm.toLowerCase().startsWith(br.toLowerCase()) ? br + ' ' + nm : nm);
  while (seen.has(id) || !id) id = (id || 'product') + '-x';
  seen.add(id);
  idMap[p.id] = id;
}
let bodyMd = A.bodyMd;
let structuredStr = JSON.stringify(A.structured || {});
for (const [oldId, newId] of Object.entries(idMap)) {
  bodyMd = bodyMd.split(oldId).join(newId);
  structuredStr = structuredStr.split(oldId).join(newId);
}
// Remove directives that reference dropped products so the draft renders cleanly.
for (const p of dropped) {
  const esc = String(p.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  bodyMd = bodyMd
    .replace(new RegExp(`^\\s*::(?:product-card|buy-button)\\{id="${esc}"\\}\\s*$`, 'gm'), '')
    .replace(new RegExp(`:product\\[([^\\]]+)\\]\\{id="${esc}"\\}`, 'g'), '$1');
}
const structured = JSON.parse(structuredStr);

const contentId = slugify(A.slug);
const out = [`-- seed-article (DRAFT): ${A.title}  ${NOW}`];

for (const p of products) {
  const id = idMap[p.id];
  const specsObj = Object.fromEntries((p.specs || []).map((s) => [s.name, s.value]));
  const priceCents = p.priceUsd == null ? null : Math.round(p.priceUsd * 100);
  out.push(
    `INSERT OR IGNORE INTO products (id, name, brand, category, image_url, price_cents, currency, price_source, price_observed_at, rating, description, pros_json, cons_json, specs_json, created_at, updated_at) VALUES (${q(id)}, ${q(p.name)}, ${q(p.brand)}, ${q(p.category)}, ${q(p.imageUrl)}, ${n(priceCents)}, 'USD', 'manual', ${priceCents == null ? 'NULL' : q(NOW)}, ${n(p.rating)}, ${q(p.rationale)}, ${json(p.pros || [])}, ${json(p.cons || [])}, ${json(specsObj)}, ${q(NOW)}, ${q(NOW)});`,
  );
  out.push(
    `INSERT OR IGNORE INTO product_links (id, product_id, affiliate_profile_id, base_url, is_primary, created_at, updated_at) VALUES (${q('pl-' + id + '-amazon')}, ${q(id)}, 'amazon-main', ${q('https://www.amazon.com/dp/' + p.asin)}, 1, ${q(NOW)}, ${q(NOW)});`,
  );
}

out.push(
  `INSERT INTO content (id, type, status, slug, title, dek, category, author_id, verdict_score, hero_image_url, hero_alt, body_md, structured_json, seo_title, seo_description, published_at, created_at, updated_at) VALUES (${q(contentId)}, ${q(d.type)}, 'draft', ${q(A.slug)}, ${q(A.title)}, ${q(A.dek)}, ${q(d.category || 'guides')}, 'alex', ${n(structured && structured.verdictScore)}, ${q(hero && hero.imageUrl)}, ${q(hero && hero.alt)}, ${q(bodyMd)}, ${json(structured)}, ${q(A.seoTitle)}, ${q(A.seoDescription)}, NULL, ${q(NOW)}, ${q(NOW)});`,
);
if (products.length) {
  out.push(`INSERT OR IGNORE INTO content_affiliate_profiles (content_id, affiliate_profile_id) VALUES (${q(contentId)}, 'amazon-main');`);
}
products.forEach((p, i) => {
  out.push(
    `INSERT OR IGNORE INTO content_products (content_id, product_id, role, position, affiliate_profile_id) VALUES (${q(contentId)}, ${q(idMap[p.id])}, ${i === 0 ? "'primary'" : "'featured'"}, ${i}, 'amazon-main');`,
  );
});
for (const t of A.tags || []) {
  out.push(`INSERT OR IGNORE INTO tags (slug, name) VALUES (${q(t.slug)}, ${q(t.name)});`);
  out.push(`INSERT OR IGNORE INTO content_tags (content_id, tag_slug) VALUES (${q(contentId)}, ${q(t.slug)});`);
}

const sqlFile = `.seed-${contentId}.sql`;
writeFileSync(sqlFile, out.join('\n') + '\n');
console.error(`content: ${contentId} | products: ${products.length}${dropped.length ? ` (dropped ${dropped.length})` : ''} | sql: ${sqlFile}`);

if (flag === '--local' || flag === '--remote') {
  execSync(`npx wrangler d1 execute techfromalex_db ${flag} --file=${sqlFile}`, { stdio: 'inherit' });
  console.error(`Seeded as DRAFT. Review at /admin/content/${contentId}/preview, then publish from /admin/content/${contentId}.`);
} else {
  console.error(`Dry run. Apply with: npx wrangler d1 execute techfromalex_db --local|--remote --file=${sqlFile}`);
}
