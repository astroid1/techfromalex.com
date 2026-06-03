import { ulid, nowIso } from "@/lib/ids";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Amazon image URLs encode size in a token (e.g. `._AC_SL1500_`). Rewrite it to
 * request a ~1000px variant so we don't store huge originals. Non-Amazon URLs
 * pass through unchanged.
 */
export function optimizeAmazonImageUrl(url: string): string {
  if (!/(?:m\.media-amazon|images-[a-z]+\.ssl-images-amazon|images-amazon)\.com/i.test(url)) return url;
  return url.replace(/\._[A-Za-z0-9,_-]+_\.(jpg|jpeg|png|webp)(\?.*)?$/i, "._SL1000_.$1");
}

/**
 * Download a remote image into the R2 MEDIA bucket and record a `media` row.
 * Returns the local `/img/...` path on success. On any failure it returns the
 * original URL as a graceful fallback (so the image still shows), or null if
 * there was no URL. Mirrors src/pages/api/admin/media/upload.ts.
 */
export async function storeRemoteImage(
  env: Env,
  url: string | null | undefined,
  alt: string,
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(optimizeAmazonImageUrl(url), {
      headers: { "user-agent": "Mozilla/5.0 (compatible; TechFromAlexBot/1.0)" },
    });
    if (!res.ok) return url;
    const mime = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!mime.startsWith("image/")) return url;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 10 * 1024 * 1024) return url; // skip empty / >10MB
    const id = ulid();
    const ext = EXT_BY_MIME[mime] ?? "jpg";
    const key = `uploads/${id}-img.${ext}`;
    await env.MEDIA.put(key, buf, { httpMetadata: { contentType: mime } });
    await env.DB.prepare(
      "INSERT INTO media (id, r2_key, url_path, mime, bytes, alt, created_at) VALUES (?,?,?,?,?,?,?)",
    )
      .bind(id, key, `/img/${key}`, mime, buf.byteLength, (alt || "Image").slice(0, 300), nowIso())
      .run();
    return `/img/${key}`;
  } catch {
    return url; // graceful fallback — keep the remote URL
  }
}

/**
 * "Make an external image ours": if the value is an http(s) URL, download it into
 * R2 and return the local `/img/...` path. Local/relative paths (already ours) and
 * non-URLs pass through unchanged. Returns the original URL if the download fails.
 */
export async function internalizeImage(
  env: Env,
  url: string | null | undefined,
  alt: string,
): Promise<string | null> {
  const u = (url ?? "").trim();
  if (!u || u.startsWith("/")) return u || null;
  if (!/^https?:\/\//i.test(u)) return u;
  return await storeRemoteImage(env, u, alt);
}
