// Seed the create-article DEMO (USB-C docking stations roundup) as a DRAFT for review.
// Reads .demo-article.json (the workflow proposal), remaps product ids to clean
// (brand-deduped) slugs, and emits seed SQL. Status=draft (not public); review via
// /admin/content/<slug>/preview. Run: node scripts/seed-demo-dock.mjs > demo.sql
import { readFileSync } from 'node:fs';

const NOW = new Date().toISOString();
const q = (s) => (s == null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'");
const json = (o) => q(JSON.stringify(o));
const n = (x) => (x == null ? 'NULL' : String(x));
const slugify = (s) => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const d = JSON.parse(readFileSync('.demo-article.json', 'utf8'));
const A = d.article;
const hero = d.hero;

// clean ids + remap
const seen = new Set();
const idMap = {};
for (const p of d.products) {
  const nm = String(p.name || ''), br = String(p.brand || '');
  let id = slugify(br && !nm.toLowerCase().startsWith(br.toLowerCase()) ? br + ' ' + nm : nm);
  while (seen.has(id) || !id) id = (id || 'product') + '-x';
  seen.add(id);
  idMap[p.id] = id;
}
let bodyMd = A.bodyMd;
let structuredStr = JSON.stringify(A.structured);
for (const [oldId, newId] of Object.entries(idMap)) {
  bodyMd = bodyMd.split(oldId).join(newId);
  structuredStr = structuredStr.split(oldId).join(newId);
}
const structured = JSON.parse(structuredStr);

const contentId = slugify(A.slug || d.topic);
const out = ['-- create-article demo seed (DRAFT): ' + A.title + '  ' + NOW];

// products + links
d.products.forEach((p) => {
  const id = idMap[p.id];
  const specsObj = Object.fromEntries((p.specs || []).map((s) => [s.name, s.value]));
  out.push(
    `INSERT INTO products (id, name, brand, category, image_url, price_cents, currency, price_source, rating, description, pros_json, cons_json, specs_json, created_at, updated_at) VALUES (${q(id)}, ${q(p.name)}, ${q(p.brand)}, ${q(p.category)}, ${q(p.imageUrl)}, ${n(Math.round((p.priceUsd || 0) * 100))}, 'USD', 'manual', ${n(p.rating)}, ${q(p.rationale)}, ${json(p.pros || [])}, ${json(p.cons || [])}, ${json(specsObj)}, ${q(NOW)}, ${q(NOW)});`,
  );
  out.push(
    `INSERT INTO product_links (id, product_id, affiliate_profile_id, base_url, is_primary, created_at, updated_at) VALUES (${q('pl-' + id + '-amazon')}, ${q(id)}, 'amazon-main', ${q('https://www.amazon.com/dp/' + p.asin)}, 1, ${q(NOW)}, ${q(NOW)});`,
  );
});

// content (DRAFT) + relations + tags
out.push(
  `INSERT INTO content (id, type, status, slug, title, dek, category, author_id, verdict_score, hero_image_url, hero_alt, body_md, structured_json, seo_title, seo_description, published_at, created_at, updated_at) VALUES (${q(contentId)}, ${q(d.type)}, 'draft', ${q(A.slug)}, ${q(A.title)}, ${q(A.dek)}, ${q(d.category)}, 'alex', NULL, ${q(hero && hero.imageUrl)}, ${q(hero && hero.alt)}, ${q(bodyMd)}, ${json(structured)}, ${q(A.seoTitle)}, ${q(A.seoDescription)}, NULL, ${q(NOW)}, ${q(NOW)});`,
);
out.push(`INSERT INTO content_affiliate_profiles (content_id, affiliate_profile_id) VALUES (${q(contentId)}, 'amazon-main');`);
d.products.forEach((p, i) => {
  out.push(
    `INSERT INTO content_products (content_id, product_id, role, position, affiliate_profile_id) VALUES (${q(contentId)}, ${q(idMap[p.id])}, ${i === 0 ? "'primary'" : "'featured'"}, ${i}, 'amazon-main');`,
  );
});
for (const t of A.tags || []) {
  out.push(`INSERT OR IGNORE INTO tags (slug, name) VALUES (${q(t.slug)}, ${q(t.name)});`);
  out.push(`INSERT INTO content_tags (content_id, tag_slug) VALUES (${q(contentId)}, ${q(t.slug)});`);
}

console.error('content id/slug: ' + contentId + '  | products: ' + d.products.length + '  | ids: ' + Object.values(idMap).join(', '));
console.log(out.join('\n'));
