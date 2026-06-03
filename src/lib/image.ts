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
  if (src.startsWith("/cdn-cgi/")) return src;
  const target = /^https?:\/\//.test(src) ? src : `/${src.replace(/^\//, "")}`;
  // Cloudflare Image Transformations are opt-in per zone (IMAGE_TRANSFORMS var). When
  // enabled, serve a resized + auto-format (webp/avif) variant; otherwise serve the
  // original directly so images never break when transformations are off.
  if (!opts.transform) return target;
  const { width = 1200, quality = 75 } = opts;
  return `/cdn-cgi/image/width=${width},quality=${quality},format=auto/${target}`;
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
