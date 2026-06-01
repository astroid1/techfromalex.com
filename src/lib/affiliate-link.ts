/**
 * Build a monetized affiliate URL from a profile + product link.
 *
 * The per-network rule (which query param carries the tag, plus any static
 * extra params) now lives in the `networks` table and is passed in via
 * `link_param` / `extra_params_json`. A per-profile `link_rules_json` can still
 * override the param or add extras. An empty tag is a hard error, surfaced at
 * the publish gate and at render, so a misconfiguration can never ship silently.
 */
export interface AffiliateProfileLite {
  network: string;
  tracking_tag: string;
  link_rules_json?: string | null;
  /** networks.link_param — query param carrying the tag ("" = append none). */
  link_param?: string | null;
  /** networks.extra_params_json — static extra query params for every link. */
  extra_params_json?: string | null;
}

export interface ProductLinkLite {
  base_url: string;
  tag_override?: string | null;
}

interface LinkRules {
  param?: string;
  extraParams?: Record<string, string>;
  kbid?: string;
}

export class AffiliateTagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AffiliateTagError";
  }
}

export function buildAffiliateUrl(
  profile: AffiliateProfileLite,
  link: ProductLinkLite,
): string {
  const tag = (link.tag_override ?? profile.tracking_tag ?? "").trim();
  if (!tag) {
    throw new AffiliateTagError(
      `Empty affiliate tracking tag for network "${profile.network}".`,
    );
  }

  let rules: LinkRules = {};
  try {
    rules = JSON.parse(profile.link_rules_json || "{}") as LinkRules;
  } catch {
    /* malformed per-profile rules — fall back to the network defaults */
  }

  let networkExtra: Record<string, string> = {};
  try {
    networkExtra = JSON.parse(profile.extra_params_json || "{}") as Record<string, string>;
  } catch {
    /* malformed network extras — ignore */
  }

  // Per-profile rule.param overrides the network's default link_param.
  // A param of "" (e.g. the "manual" network) means: append no tag param —
  // the base_url is already a complete tracking link.
  const param = rules.param ?? profile.link_param ?? "tag";

  const url = new URL(link.base_url);
  if (param) url.searchParams.set(param, tag);

  // Network-level static params first, then per-profile extras, then legacy KBID.
  for (const [k, v] of Object.entries(networkExtra)) url.searchParams.set(k, String(v));
  for (const [k, v] of Object.entries(rules.extraParams ?? {})) url.searchParams.set(k, String(v));
  if (rules.kbid) url.searchParams.set("KBID", rules.kbid);

  return url.toString();
}
