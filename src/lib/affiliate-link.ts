/**
 * Build a monetized affiliate URL from a profile + product link.
 *
 * This replaces the legacy `programs.ts` builders, which silently returned the
 * raw (un-tagged) URL when the tracking tag was empty — shipping zero-revenue
 * links with no warning. Here an empty tag is a hard error, surfaced at the
 * publish gate and at render, so a misconfiguration can never ship silently.
 */
export interface AffiliateProfileLite {
  network: string;
  tracking_tag: string;
  link_rules_json?: string | null;
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
    /* malformed rules — fall back to network defaults */
  }

  const url = new URL(link.base_url);
  switch (profile.network) {
    case "amazon":
      url.searchParams.set("tag", tag);
      break;
    case "bestbuy":
      url.searchParams.set(rules.param ?? "irclickid", tag);
      break;
    case "bhphoto":
      url.searchParams.set("BI", tag);
      if (rules.kbid) url.searchParams.set("KBID", rules.kbid);
      break;
    case "impact":
    case "cj":
      url.searchParams.set(rules.param ?? "subId1", tag);
      break;
    case "manual":
      // base_url is already a full tracking link; non-empty tag still required above.
      break;
    default:
      url.searchParams.set(rules.param ?? "tag", tag);
  }

  for (const [k, v] of Object.entries(rules.extraParams ?? {})) {
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}
