/**
 * Cloudflare Image Resizing URL builder. Active on the zone (techfromalex.com);
 * on *.workers.dev /cdn-cgi/image is unavailable, so callers must tolerate a
 * missing/placeholder image (components render a branded placeholder on null).
 */
export function cdnImage(
  src: string | null | undefined,
  opts: { width?: number; quality?: number } = {},
): string | null {
  if (!src) return null;
  if (src.startsWith("/cdn-cgi/")) return src;
  // Cloudflare Image Resizing (/cdn-cgi/image) is NOT enabled on this zone — it 404s —
  // so serve the original image directly (R2 path or external URL). If Image Resizing
  // is later enabled in the dashboard, restore the transform using `opts` here.
  void opts;
  return /^https?:\/\//.test(src) ? src : `/${src.replace(/^\//, "")}`;
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
