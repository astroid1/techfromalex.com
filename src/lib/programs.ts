import { buildAffiliateUrl } from "./affiliate-link";
import type { ProgramCta } from "./types";

/**
 * Single-link affiliate "programs" (e.g. make.com). A program pairs an affiliate
 * profile (network link rule + tracking tag) with a destination base_url and CTA
 * display fields. The shown link is built via buildAffiliateUrl so the referral
 * tag is always applied; if the tag is empty/broken the URL resolves to null and
 * the CTA renders nothing — an un-tagged link can never ship.
 */
interface ProgramRow {
  id: string;
  name: string;
  base_url: string;
  cta_label: string;
  headline: string | null;
  blurb: string | null;
  logo_url: string | null;
  network: string;
  tracking_tag: string;
  link_rules_json: string;
  link_param: string | null;
  extra_params_json: string | null;
  profile_active: number;
}

const SELECT = `
  SELECT pg.id, pg.name, pg.base_url, pg.cta_label, pg.headline, pg.blurb, pg.logo_url,
         ap.network, ap.tracking_tag, ap.link_rules_json, ap.is_active AS profile_active,
         nw.link_param, nw.extra_params_json
  FROM programs pg
  JOIN affiliate_profiles ap ON ap.id = pg.affiliate_profile_id
  LEFT JOIN networks nw ON nw.id = ap.network`;

function resolve(r: ProgramRow): ProgramCta {
  let url: string | null = null;
  // Effective tag param (mirrors buildAffiliateUrl's resolution). A program MUST
  // append a referral tag — unlike a product "manual" link, the program form forbids
  // pasting a pre-built tracking URL. An empty param (e.g. the "manual" network) would
  // yield a raw, UN-TAGGED link, so treat it as a hard failure: url stays null and the
  // CTA renders nothing on the live site.
  let ruleParam: string | undefined;
  try {
    ruleParam = (JSON.parse(r.link_rules_json || "{}") as { param?: string }).param;
  } catch {
    /* malformed per-profile rules — fall back to network default */
  }
  const effectiveParam = ruleParam ?? r.link_param ?? "tag";
  if (r.profile_active && effectiveParam) {
    try {
      url = buildAffiliateUrl(
        {
          network: r.network,
          tracking_tag: r.tracking_tag,
          link_rules_json: r.link_rules_json,
          link_param: r.link_param,
          extra_params_json: r.extra_params_json,
        },
        { base_url: r.base_url },
      );
    } catch {
      url = null; // empty/broken tag — never ship an un-tagged link
    }
  }
  return {
    id: r.id,
    name: r.name,
    headline: r.headline?.trim() || r.name,
    blurb: r.blurb,
    ctaLabel: r.cta_label,
    logoUrl: r.logo_url,
    url,
  };
}

/** Resolve active programs by id, each with a built tagged affiliate URL. */
export async function getPrograms(
  db: D1Database,
  ids: string[],
): Promise<Map<string, ProgramCta>> {
  const uniq = [...new Set(ids.filter(Boolean))];
  const out = new Map<string, ProgramCta>();
  if (uniq.length === 0) return out;
  const ph = uniq.map(() => "?").join(",");
  const res = await db
    .prepare(`${SELECT} WHERE pg.id IN (${ph}) AND pg.is_active = 1`)
    .bind(...uniq)
    .all<ProgramRow>();
  for (const r of res.results ?? []) out.set(r.id, resolve(r));
  return out;
}

/** Active programs (id + name) for the content editor's insert picker. */
export async function listActivePrograms(
  db: D1Database,
): Promise<{ id: string; name: string }[]> {
  const res = await db
    .prepare("SELECT id, name FROM programs WHERE is_active = 1 ORDER BY name")
    .all<{ id: string; name: string }>();
  return res.results ?? [];
}
