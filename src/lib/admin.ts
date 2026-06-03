import { nowIso, ulid } from "./ids";

/** Strip directive-markdown to plain text for the FTS index. */
export function stripPlainText(md: string): string {
  return md
    .replace(/^:::\w[^\n]*$/gm, " ")
    .replace(/^:::$/gm, " ")
    .replace(/^::\w[^\n]*$/gm, " ")
    .replace(/:product\[([^\]]+)\]\{[^}]*\}/g, "$1")
    .replace(/^\|.*$/gm, " ")
    .replace(/[#>*_`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract a directive id from its `{...}` attribute string. Matches every form
 *  remark-directive resolves: shorthand `#id`, unquoted `id=x`, and `id="x"`/`id='x'`
 *  — so this stays in sync with what render-body actually renders. */
function directiveId(attrs: string): string | null {
  const shorthand = attrs.match(/(?:^|\s)#([A-Za-z0-9_-]+)/);
  if (shorthand) return shorthand[1];
  const m = attrs.match(/\bid=(?:"([^"]+)"|'([^']+)'|([^\s}]+))/);
  return m ? (m[1] ?? m[2] ?? m[3] ?? null) : null;
}

/** Program ids referenced by ::promo{...} CTA blocks (any directive id syntax). */
export function programIdsInBody(md: string): string[] {
  const ids: string[] = [];
  for (const m of md.matchAll(/::promo\{([^}]*)\}/g)) {
    const id = directiveId(m[1]);
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}

/**
 * Product ids referenced anywhere in a body (directive id="..."), EXCLUDING ::promo
 * blocks — those ids are programs, validated/resolved separately. ::promo blocks are
 * stripped by OCCURRENCE (not by id value) so a product id that happens to equal a
 * program id is still validated.
 */
export function productIdsInBody(md: string): string[] {
  const stripped = md.replace(/::promo\{[^}]*\}/g, " ");
  return [...new Set([...stripped.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))];
}

/** Rebuild the FTS row for a content item. */
export async function syncFts(
  db: D1Database,
  c: { id: string; title: string; dek: string | null; bodyMd: string; tags: string[] },
): Promise<void> {
  await db.prepare("DELETE FROM content_fts WHERE content_id = ?").bind(c.id).run();
  await db
    .prepare(
      "INSERT INTO content_fts (content_id, title, dek, body_text, tags) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(c.id, c.title, c.dek ?? "", stripPlainText(c.bodyMd), c.tags.join(" "))
    .run();
}

export async function removeFts(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM content_fts WHERE content_id = ?").bind(id).run();
}

/** Snapshot the current editable state into the revision log. */
export async function writeRevision(
  db: D1Database,
  contentId: string,
  snapshot: unknown,
  statusAtSave: string,
  source: "ai" | "human" | "system",
  by: string | null,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO content_revisions (id, content_id, snapshot_json, status_at_save, source, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(ulid(), contentId, JSON.stringify(snapshot), statusAtSave, source, by, nowIso())
    .run();
}

/**
 * Invalidate caches after a publish/edit. Bumps the global render-cache version
 * (used by the future two-tier read cache) and best-effort purges hot edge URLs.
 */
export async function purgeContent(
  env: Env,
  slug: string,
  category: string | null,
  tags: string[] = [],
): Promise<void> {
  try {
    const cur = parseInt((await env.RENDER_CACHE.get("meta:version")) ?? "1", 10) || 1;
    await env.RENDER_CACHE.put("meta:version", String(cur + 1));
  } catch {
    /* ignore */
  }
  const origin = (env.SITE_URL ?? "").replace(/\/$/, "");
  if (!origin) return;
  const paths = ["/", "/blog", "/deals", "/sitemap.xml", "/rss.xml", `/${slug}`];
  if (category) paths.push(`/category/${category}`);
  for (const t of tags) paths.push(`/tag/${t}`);
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    await Promise.all(paths.map((p) => cache.delete(new Request(origin + p))));
  } catch {
    /* edge cache purge is best-effort */
  }
}

/** Unique slug within `content`, excluding an optional id. */
export async function uniqueSlug(
  db: D1Database,
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = base || ulid().toLowerCase();
  for (let i = 0; i < 50; i++) {
    const row = await db
      .prepare("SELECT id FROM content WHERE slug = ?")
      .bind(slug)
      .first<{ id: string }>();
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${ulid().slice(-4).toLowerCase()}`;
}

/** Parse the ProductForm fields into DB-ready values. */
export function parseProductForm(form: FormData) {
  const lines = (s: string) =>
    s.split("\n").map((l) => l.trim()).filter(Boolean);
  const priceStr = String(form.get("price") ?? "").trim();
  const ratingStr = String(form.get("rating") ?? "").trim();
  const specs: Record<string, string> = {};
  for (const line of lines(String(form.get("specs") ?? ""))) {
    const i = line.indexOf(":");
    if (i > 0) specs[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    name: String(form.get("name") ?? "").trim(),
    brand: String(form.get("brand") ?? "").trim() || null,
    category: String(form.get("category") ?? "").trim() || null,
    image_url: String(form.get("image_url") ?? "").trim() || null,
    price_cents: priceStr ? Math.round(parseFloat(priceStr) * 100) : null,
    rating: ratingStr ? parseFloat(ratingStr) : null,
    description: String(form.get("description") ?? "").trim() || null,
    pros: lines(String(form.get("pros") ?? "")),
    cons: lines(String(form.get("cons") ?? "")),
    specs,
  };
}
