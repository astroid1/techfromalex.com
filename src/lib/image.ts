/**
 * Cloudflare Image Resizing URL builder. Active on the zone (techfromalex.com);
 * on *.workers.dev /cdn-cgi/image is unavailable, so callers must tolerate a
 * missing/placeholder image (components render a branded placeholder on null).
 */
export function cdnImage(
  src: string | null | undefined,
  opts: { width?: number; quality?: number; transform?: boolean } = {},
): string | null {
  if (!src) return null;
  // Already-built transform URLs and inline data: URIs pass through untouched.
  if (src.startsWith("/cdn-cgi/") || src.startsWith("data:")) return src;
  // Treat protocol-relative ("//host/x") as absolute so its host is checked too.
  const isProtoRel = src.startsWith("//");
  const isAbsolute = isProtoRel || /^https?:\/\//i.test(src);
  const target = isAbsolute ? src : `/${src.replace(/^\//, "")}`;
  // Cloudflare Image Transformations can only fetch SAME-ZONE sources — an external
  // origin URL returns 403 through /cdn-cgi/image. So only transform our own paths
  // (relative, or absolute on techfromalex.com); pass external URLs straight through
  // so a not-yet-internalized image still loads instead of dying with a 403.
  let sameZone = !isAbsolute;
  if (isAbsolute) {
    try {
      // Dot-boundary match: apex + real subdomains only (not "faketechfromalex.com").
      const h = new URL(isProtoRel ? `https:${src}` : src).hostname.toLowerCase();
      sameZone = h === "techfromalex.com" || h.endsWith(".techfromalex.com");
    } catch {
      sameZone = false;
    }
  }
  // Image Transformations are opt-in per zone (IMAGE_TRANSFORMS var). When enabled,
  // serve a resized + auto-format (webp/avif) variant; otherwise serve the original.
  if (!opts.transform || !sameZone) return target;
  const { width = 1200, quality = 75 } = opts;
  // Strip target's leading slash so relative paths don't produce a double slash
  // (".../format=auto//img/..."); absolute same-zone URLs are unaffected.
  return `/cdn-cgi/image/width=${width},quality=${quality},format=auto/${target.replace(/^\//, "")}`;
}

export function retailerName(network: string | null | undefined): string {
  switch (network) {
    case "amazon":
      return "Amazon";
    case "bestbuy":
      return "Best Buy";
    case "bhphoto":
      return "B&H";
    case "impact":
    case "cj":
    case "manual":
      return "retailer";
    default:
      return "retailer";
  }
}

/** Display label for a buy link: a known brand name, else derived from the URL host
 *  (e.g. an aggregator/manual link to walmart.com -> "Walmart"). */
export function retailerLabel(network: string | null | undefined, url: string): string {
  const name = retailerName(network);
  if (name !== "retailer") return name;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const core = host.split(".").slice(-2, -1)[0] || host;
    return core.charAt(0).toUpperCase() + core.slice(1);
  } catch {
    return "another store";
  }
}
