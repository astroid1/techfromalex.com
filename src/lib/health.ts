import { buildAffiliateUrl } from "./affiliate-link";

export interface LinkIssue {
  productId: string;
  productName: string;
  profileName: string;
  network: string;
  baseUrl: string;
  reason: string;
}
export interface CoverageIssue {
  productId: string;
  productName: string;
  reason: string;
}
export interface ImageIssue {
  kind: "product" | "content";
  id: string;
  name: string;
  url: string;
  editHref: string;
}
export interface HealthReport {
  totals: { products: number; links: number; monetizedProducts: number };
  untaggedLinks: LinkIssue[];
  unmonetized: CoverageIssue[];
  externalImages: ImageIssue[];
}

/** Internalized images are stored as "/img/..." paths; an http(s) URL means the
 *  image was never internalized (or internalization failed and fell back). */
function isExternalImage(url: string | null | undefined): boolean {
  return /^https?:\/\//i.test((url ?? "").trim());
}

/**
 * On-demand link + image health: which buy links can't build a tagged URL,
 * which products therefore can't be monetized, and which hero images were
 * never internalized into R2. All deterministic (no outbound requests).
 */
export async function getLinkHealth(db: D1Database): Promise<HealthReport> {
  const linkRows =
    (await db
      .prepare(
        `SELECT pl.product_id, pl.base_url, pl.tag_override, pr.name AS product_name,
                ap.name AS profile_name, ap.network, ap.tracking_tag, ap.link_rules_json,
                nw.link_param, nw.extra_params_json
         FROM product_links pl
         JOIN products pr ON pr.id = pl.product_id
         JOIN affiliate_profiles ap ON ap.id = pl.affiliate_profile_id
         LEFT JOIN networks nw ON nw.id = ap.network
         WHERE ap.is_active = 1`,
      )
      .all<any>()).results ?? [];

  const untaggedLinks: LinkIssue[] = [];
  const monetized = new Set<string>();
  for (const l of linkRows) {
    try {
      buildAffiliateUrl(
        {
          network: l.network,
          tracking_tag: l.tracking_tag,
          link_rules_json: l.link_rules_json,
          link_param: l.link_param,
          extra_params_json: l.extra_params_json,
        },
        { base_url: l.base_url, tag_override: l.tag_override },
      );
      monetized.add(l.product_id);
    } catch {
      untaggedLinks.push({
        productId: l.product_id,
        productName: l.product_name,
        profileName: l.profile_name,
        network: l.network,
        baseUrl: l.base_url,
        reason: String(l.tag_override ?? l.tracking_tag ?? "").trim()
          ? "can't build a tagged link"
          : "missing tracking tag",
      });
    }
  }

  const products = (await db.prepare(`SELECT id, name, image_url FROM products`).all<any>()).results ?? [];
  const linkedProducts = new Set(linkRows.map((l: any) => l.product_id));
  const unmonetized: CoverageIssue[] = [];
  const externalImages: ImageIssue[] = [];
  for (const p of products) {
    if (!monetized.has(p.id)) {
      unmonetized.push({
        productId: p.id,
        productName: p.name,
        reason: linkedProducts.has(p.id) ? "has links but none build a tagged URL" : "no buy link at all",
      });
    }
    if (isExternalImage(p.image_url)) {
      externalImages.push({ kind: "product", id: p.id, name: p.name, url: p.image_url, editHref: `/admin/products/${p.id}` });
    }
  }

  const contentRows =
    (await db.prepare(`SELECT id, title, hero_image_url FROM content WHERE hero_image_url IS NOT NULL`).all<any>())
      .results ?? [];
  for (const c of contentRows) {
    if (isExternalImage(c.hero_image_url)) {
      externalImages.push({ kind: "content", id: c.id, name: c.title, url: c.hero_image_url, editHref: `/admin/content/${c.id}` });
    }
  }

  return {
    totals: { products: products.length, links: linkRows.length, monetizedProducts: monetized.size },
    untaggedLinks,
    unmonetized,
    externalImages,
  };
}
