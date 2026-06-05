import { getProducts, linkHost } from "./content";
import { getPrograms } from "./programs";
import { ulid, nowIso } from "./ids";

export interface GoParams {
  type: "product" | "program";
  id: string;
  network?: string | null;
  /** Destination host, used to disambiguate same-network "Also at" retailers. */
  host?: string | null;
  /** Where the link was clicked, for analytics (e.g. "product-card"). */
  placement?: string | null;
  /** 1-based position in a list (roundup rank, cross-sell slot), if relevant. */
  position?: number | null;
}

/** First-party /go tracking URL. A target URL is NEVER placed in the query;
 *  /go rebuilds the tagged affiliate URL server-side from these ids. */
export function goUrl(p: GoParams): string {
  const q = new URLSearchParams();
  q.set("t", p.type === "program" ? "g" : "p");
  q.set("id", p.id);
  if (p.network) q.set("net", p.network);
  if (p.host) q.set("h", p.host);
  if (p.placement) q.set("pl", p.placement);
  if (p.position != null) q.set("pos", String(p.position));
  return `/go?${q.toString()}`;
}

export interface ResolvedTarget {
  /** Built (tagged) affiliate URL. */
  url: string;
  /** The retailer network actually resolved (for honest click attribution). */
  network: string | null;
}

/** Resolve a click to its built (tagged) affiliate URL + the network actually hit,
 *  or null. Reuses getProducts/getPrograms so ONLY buildAffiliateUrl output is ever
 *  returned — the /go redirect can never point at an untagged or attacker URL. */
export async function resolveBuyTarget(
  db: D1Database,
  t: { type: "product" | "program"; id: string; network?: string | null; host?: string | null },
): Promise<ResolvedTarget | null> {
  if (t.type === "program") {
    const url = (await getPrograms(db, [t.id])).get(t.id)?.url ?? null;
    return url ? { url, network: null } : null;
  }
  const p = (await getProducts(db, [t.id])).get(t.id);
  if (!p) return null;
  const primary = (): ResolvedTarget | null =>
    p.buyUrl ? { url: p.buyUrl, network: p.buyNetwork } : null;
  // Primary buy link: no specific retailer requested, or it matches the primary.
  if (!t.host && (!t.network || t.network === p.buyNetwork)) return primary();
  // "Also at" secondary: match by host first (distinguishes same-network retailers),
  // then by network; fall back to the primary tagged link if the requested one is gone.
  const byHost = t.host ? p.otherBuyLinks.find((l) => linkHost(l.url) === t.host) : undefined;
  const byNet = t.network ? p.otherBuyLinks.find((l) => l.network === t.network) : undefined;
  const link = byHost ?? byNet;
  return link ? { url: link.url, network: link.network } : primary();
}

export interface ClickEvent {
  targetType: string;
  targetId: string;
  network?: string | null;
  contentId?: string | null;
  sourcePath?: string | null;
  placement?: string | null;
  position?: number | null;
}

export async function logClick(db: D1Database, e: ClickEvent): Promise<void> {
  await db
    .prepare(
      `INSERT INTO click_events
         (id, created_at, target_type, target_id, network, content_id, source_path, placement, position)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      ulid(),
      nowIso(),
      e.targetType,
      e.targetId,
      e.network ?? null,
      e.contentId ?? null,
      e.sourcePath ?? null,
      e.placement ?? null,
      e.position ?? null,
    )
    .run();
}

export interface ClickStats {
  days: number;
  total: number;
  byDay: { d: string; n: number }[];
  topProducts: { id: string; name: string | null; n: number }[];
  topPrograms: { id: string; name: string | null; n: number }[];
  byPlacement: { placement: string | null; n: number }[];
  bySource: { path: string | null; n: number }[];
}

/** Aggregate outbound-click counts over the last `days` for the admin dashboard. */
export async function getClickStats(db: D1Database, days = 30): Promise<ClickStats> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const [total, byDay, topProducts, topPrograms, byPlacement, bySource] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS n FROM click_events WHERE created_at >= ?`).bind(since).first<{ n: number }>(),
    db
      .prepare(
        `SELECT substr(created_at,1,10) AS d, COUNT(*) AS n FROM click_events
         WHERE created_at >= ? GROUP BY d ORDER BY d`,
      )
      .bind(since)
      .all<{ d: string; n: number }>(),
    db
      .prepare(
        `SELECT ce.target_id AS id, p.name AS name, COUNT(*) AS n
         FROM click_events ce LEFT JOIN products p ON p.id = ce.target_id
         WHERE ce.target_type='product' AND ce.created_at >= ?
         GROUP BY ce.target_id ORDER BY n DESC LIMIT 15`,
      )
      .bind(since)
      .all<{ id: string; name: string | null; n: number }>(),
    db
      .prepare(
        `SELECT ce.target_id AS id, pr.name AS name, COUNT(*) AS n
         FROM click_events ce LEFT JOIN programs pr ON pr.id = ce.target_id
         WHERE ce.target_type='program' AND ce.created_at >= ?
         GROUP BY ce.target_id ORDER BY n DESC LIMIT 15`,
      )
      .bind(since)
      .all<{ id: string; name: string | null; n: number }>(),
    db
      .prepare(
        `SELECT placement, COUNT(*) AS n FROM click_events
         WHERE created_at >= ? GROUP BY placement ORDER BY n DESC`,
      )
      .bind(since)
      .all<{ placement: string | null; n: number }>(),
    db
      .prepare(
        `SELECT source_path AS path, COUNT(*) AS n FROM click_events
         WHERE created_at >= ? GROUP BY source_path ORDER BY n DESC LIMIT 15`,
      )
      .bind(since)
      .all<{ path: string | null; n: number }>(),
  ]);
  return {
    days,
    total: total?.n ?? 0,
    byDay: byDay.results ?? [],
    topProducts: topProducts.results ?? [],
    topPrograms: topPrograms.results ?? [],
    byPlacement: byPlacement.results ?? [],
    bySource: bySource.results ?? [],
  };
}
