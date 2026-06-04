import { parseJson } from "./db";
import { buildAffiliateUrl } from "./affiliate-link";
import type {
  Author,
  ContentFull,
  ContentSummary,
  ContentType,
  Product,
} from "./types";

/* ----------------------------------------------------------------- products */

interface ProductRow {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  rating: number | null;
  description: string | null;
  pros_json: string;
  cons_json: string;
  specs_json: string;
  price_observed_at: string | null;
}

interface LinkRow {
  product_id: string;
  base_url: string;
  tag_override: string | null;
  is_primary: number;
  network: string;
  tracking_tag: string;
  link_rules_json: string;
  link_param: string | null;
  extra_params_json: string | null;
}

/** Hostname of a built buy URL (no www.), used to dedup retailers. */
function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Resolve products by id, each with a built primary affiliate URL. */
export async function getProducts(
  db: D1Database,
  ids: string[],
): Promise<Map<string, Product>> {
  const uniq = [...new Set(ids.filter(Boolean))];
  const out = new Map<string, Product>();
  if (uniq.length === 0) return out;
  const ph = uniq.map(() => "?").join(",");

  const [prodRes, linkRes] = await Promise.all([
    db.prepare(`SELECT * FROM products WHERE id IN (${ph})`).bind(...uniq).all<ProductRow>(),
    db
      .prepare(
        `SELECT pl.product_id, pl.base_url, pl.tag_override, pl.is_primary,
                ap.network, ap.tracking_tag, ap.link_rules_json,
                nw.link_param, nw.extra_params_json
         FROM product_links pl
         JOIN affiliate_profiles ap ON ap.id = pl.affiliate_profile_id
         LEFT JOIN networks nw ON nw.id = ap.network
         WHERE pl.product_id IN (${ph}) AND ap.is_active = 1
         ORDER BY pl.is_primary DESC`,
      )
      .bind(...uniq)
      .all<LinkRow>(),
  ]);

  const linksByProduct = new Map<string, LinkRow[]>();
  for (const l of linkRes.results ?? []) {
    const arr = linksByProduct.get(l.product_id) ?? [];
    arr.push(l);
    linksByProduct.set(l.product_id, arr);
  }

  for (const r of prodRes.results ?? []) {
    // Build every active link into a tagged URL; drop any that can't be tagged
    // (empty/broken tag) so we never ship an un-tagged link.
    const built: { network: string; url: string }[] = [];
    for (const l of linksByProduct.get(r.id) ?? []) {
      try {
        const url = buildAffiliateUrl(
          {
            network: l.network,
            tracking_tag: l.tracking_tag,
            link_rules_json: l.link_rules_json,
            link_param: l.link_param,
            extra_params_json: l.extra_params_json,
          },
          { base_url: l.base_url, tag_override: l.tag_override },
        );
        built.push({ network: l.network, url });
      } catch {
        // empty/broken tag — skip it
      }
    }
    const primary = built[0] ?? null;
    // Secondary retailers (one per destination host, excluding the primary) for "Also at ...".
    // Dedup on host, NOT network: aggregator networks (manual/impact/cj) carry many distinct
    // retailers, so keying on network would silently drop a legitimately tagged link.
    const seenHosts = new Set<string>(primary ? [linkHost(primary.url)] : []);
    const otherBuyLinks = built.filter((b) => {
      const h = linkHost(b.url);
      if (seenHosts.has(h)) return false;
      seenHosts.add(h);
      return true;
    });
    out.set(r.id, {
      id: r.id,
      name: r.name,
      brand: r.brand,
      category: r.category,
      imageUrl: r.image_url,
      priceCents: r.price_cents,
      currency: r.currency,
      rating: r.rating,
      description: r.description,
      pros: parseJson<string[]>(r.pros_json, []),
      cons: parseJson<string[]>(r.cons_json, []),
      specs: parseJson<Record<string, string>>(r.specs_json, {}),
      buyUrl: primary?.url ?? null,
      buyNetwork: primary?.network ?? null,
      priceObservedAt: r.price_observed_at ?? null,
      otherBuyLinks,
    });
  }
  return out;
}

/** Cross-sell: other tagged products sharing a category with the on-page ones. */
export async function getCrossSellProducts(
  db: D1Database,
  opts: { categories: string[]; excludeIds: string[]; limit?: number },
): Promise<Product[]> {
  const cats = [...new Set(opts.categories.filter(Boolean))];
  if (cats.length === 0) return [];
  const exclude = [...new Set(opts.excludeIds.filter(Boolean))];
  const limit = opts.limit ?? 4;
  const catPh = cats.map(() => "?").join(",");
  const exClause = exclude.length ? ` AND id NOT IN (${exclude.map(() => "?").join(",")})` : "";
  // Rank only products that HAVE an active affiliate link, and over-fetch (LIMIT is
  // applied before the post-build tag check, and an active link can still carry an
  // empty tag). We then keep tagged products and slice — so a tagged product is never
  // silently dropped just because a higher-rated untagged one took its slot.
  const idRes = await db
    .prepare(
      `SELECT id FROM products
       WHERE category IN (${catPh})${exClause}
         AND EXISTS (
           SELECT 1 FROM product_links pl
           JOIN affiliate_profiles ap ON ap.id = pl.affiliate_profile_id
           WHERE pl.product_id = products.id AND ap.is_active = 1
         )
       ORDER BY rating DESC
       LIMIT ?`,
    )
    .bind(...cats, ...exclude, limit * 4)
    .all<{ id: string }>();
  const ids = (idRes.results ?? []).map((r) => r.id);
  const map = await getProducts(db, ids);
  // Preserve rating order; keep only products with a built (tagged) link, then trim.
  return ids
    .map((id) => map.get(id))
    .filter((p): p is Product => Boolean(p && p.buyUrl))
    .slice(0, limit);
}

/* ----------------------------------------------------------------- content */

interface ContentRow {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  dek: string | null;
  category: ContentSummary["category"];
  hero_image_url: string | null;
  hero_alt: string | null;
  verdict_score: number | null;
  published_at: string | null;
  updated_at: string;
  author_id?: string;
  body_md?: string;
  structured_json?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  noindex?: number;
  deal_price_cents?: number | null;
  deal_expires_at?: string | null;
}

const SUMMARY_COLS =
  "id, type, slug, title, dek, category, hero_image_url, hero_alt, verdict_score, published_at, updated_at";

function toSummary(r: ContentRow): ContentSummary {
  return {
    id: r.id,
    type: r.type,
    slug: r.slug,
    title: r.title,
    dek: r.dek,
    category: r.category,
    heroImageUrl: r.hero_image_url,
    heroAlt: r.hero_alt,
    verdictScore: r.verdict_score,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
  };
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  type?: ContentType;
  excludeSlug?: string;
}

export async function listPublished(
  db: D1Database,
  opts: ListOptions = {},
): Promise<ContentSummary[]> {
  const { limit = 12, offset = 0, category, tag, type, excludeSlug } = opts;
  const where: string[] = ["c.status = 'published'"];
  const binds: unknown[] = [];
  let from = "content c";
  if (tag) {
    from += " JOIN content_tags ct ON ct.content_id = c.id";
    where.push("ct.tag_slug = ?");
    binds.push(tag);
  }
  if (category) {
    where.push("c.category = ?");
    binds.push(category);
  }
  if (type) {
    where.push("c.type = ?");
    binds.push(type);
  }
  if (excludeSlug) {
    where.push("c.slug != ?");
    binds.push(excludeSlug);
  }
  const sql = `SELECT ${SUMMARY_COLS.replace(/(^|, )/g, "$1c.")} FROM ${from}
    WHERE ${where.join(" AND ")}
    ORDER BY c.published_at DESC LIMIT ? OFFSET ?`;
  binds.push(limit, offset);
  const res = await db.prepare(sql).bind(...binds).all<ContentRow>();
  return (res.results ?? []).map(toSummary);
}

export async function countPublished(
  db: D1Database,
  opts: Pick<ListOptions, "category" | "tag" | "type"> = {},
): Promise<number> {
  const where: string[] = ["c.status = 'published'"];
  const binds: unknown[] = [];
  let from = "content c";
  if (opts.tag) {
    from += " JOIN content_tags ct ON ct.content_id = c.id";
    where.push("ct.tag_slug = ?");
    binds.push(opts.tag);
  }
  if (opts.category) {
    where.push("c.category = ?");
    binds.push(opts.category);
  }
  if (opts.type) {
    where.push("c.type = ?");
    binds.push(opts.type);
  }
  const res = await db
    .prepare(`SELECT COUNT(*) AS n FROM ${from} WHERE ${where.join(" AND ")}`)
    .bind(...binds)
    .first<{ n: number }>();
  return res?.n ?? 0;
}

export async function getContentBySlug(
  db: D1Database,
  slug: string,
): Promise<ContentFull | null> {
  const r = await db
    .prepare(`SELECT * FROM content WHERE slug = ? AND status = 'published'`)
    .bind(slug)
    .first<ContentRow>();
  if (!r) return null;
  const tagsRes = await db
    .prepare(`SELECT tag_slug FROM content_tags WHERE content_id = ?`)
    .bind(r.id)
    .all<{ tag_slug: string }>();
  return {
    ...toSummary(r),
    authorId: r.author_id ?? "alex",
    bodyMd: r.body_md ?? "",
    structured: parseJson<Record<string, unknown>>(r.structured_json, {}),
    seoTitle: r.seo_title ?? null,
    seoDescription: r.seo_description ?? null,
    canonicalUrl: r.canonical_url ?? null,
    noindex: r.noindex === 1,
    dealPriceCents: r.deal_price_cents ?? null,
    dealExpiresAt: r.deal_expires_at ?? null,
    tags: (tagsRes.results ?? []).map((t) => t.tag_slug),
  };
}

/** Product ids referenced by a content item (relations + structured_json + body directives). */
export async function getContentProductIds(
  db: D1Database,
  contentId: string,
): Promise<string[]> {
  const res = await db
    .prepare(
      `SELECT product_id FROM content_products WHERE content_id = ? ORDER BY position`,
    )
    .bind(contentId)
    .all<{ product_id: string }>();
  return (res.results ?? []).map((r) => r.product_id);
}

export async function getRelated(
  db: D1Database,
  item: ContentSummary,
  limit = 3,
): Promise<ContentSummary[]> {
  const sameCat = item.category
    ? await listPublished(db, {
        category: item.category,
        excludeSlug: item.slug,
        limit,
      })
    : [];
  if (sameCat.length >= limit) return sameCat;
  const filler = await listPublished(db, {
    excludeSlug: item.slug,
    limit: limit + sameCat.length,
  });
  const seen = new Set(sameCat.map((s) => s.slug));
  return [...sameCat, ...filler.filter((f) => !seen.has(f.slug))].slice(0, limit);
}

export async function getAuthor(
  db: D1Database,
  id: string,
): Promise<Author | null> {
  const r = await db
    .prepare(`SELECT id, slug, name, bio, title, same_as_json FROM authors WHERE id = ?`)
    .bind(id)
    .first<{
      id: string;
      slug: string;
      name: string;
      bio: string | null;
      title: string | null;
      same_as_json: string;
    }>();
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    bio: r.bio,
    title: r.title,
    sameAs: parseJson<string[]>(r.same_as_json, []),
  };
}

export async function getAllPublishedSlugs(
  db: D1Database,
): Promise<{ slug: string; updatedAt: string; publishedAt: string | null }[]> {
  const res = await db
    .prepare(
      `SELECT slug, updated_at, published_at FROM content WHERE status = 'published' ORDER BY published_at DESC`,
    )
    .all<{ slug: string; updated_at: string; published_at: string | null }>();
  return (res.results ?? []).map((r) => ({
    slug: r.slug,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
  }));
}

export async function getAllTags(
  db: D1Database,
): Promise<{ slug: string; name: string }[]> {
  const res = await db
    .prepare(
      `SELECT t.slug, t.name FROM tags t
       JOIN content_tags ct ON ct.tag_slug = t.slug
       JOIN content c ON c.id = ct.content_id AND c.status = 'published'
       GROUP BY t.slug ORDER BY t.name`,
    )
    .all<{ slug: string; name: string }>();
  return res.results ?? [];
}

/* ----------------------------------------------------------------- search */

export interface SearchHit {
  slug: string;
  title: string;
  dek: string | null;
  category: string | null;
  snippet: string;
}

/** Full-text search over published content via FTS5 (BM25-ranked). */
export async function searchContent(
  db: D1Database,
  query: string,
  limit = 10,
): Promise<SearchHit[]> {
  const clean = query.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  if (clean.length < 2) return [];
  const match = clean
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `${t}*`)
    .join(" ");
  try {
    const res = await db
      .prepare(
        `SELECT c.slug, c.title, c.dek, c.category,
                snippet(content_fts, 3, '<mark>', '</mark>', '…', 8) AS snippet
         FROM content_fts f
         JOIN content c ON c.id = f.content_id AND c.status = 'published'
         WHERE content_fts MATCH ?
         ORDER BY bm25(content_fts, 0.0, 8.0, 4.0, 1.0, 2.0)
         LIMIT ?`,
      )
      .bind(match, limit)
      .all<SearchHit>();
    return res.results ?? [];
  } catch {
    return []; // malformed FTS query → no results rather than 500
  }
}
