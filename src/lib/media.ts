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
 * Download a remote image into the R2 MEDIA bucket and record a `media` row.
 * Returns the local `/img/...` path on success. On any failure it returns the
 * original URL as a graceful fallback (so the product still has an image),
 * or null if there was no URL. Mirrors src/pages/api/admin/media/upload.ts.
 */
export async function storeRemoteImage(
  env: Env,
  url: string | null | undefined,
  alt: string,
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; TechFromAlexBot/1.0)" },
    });
    if (!res.ok) return url;
    const mime = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!mime.startsWith("image/")) return url;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 10 * 1024 * 1024) return url; // skip empty / >10MB
    const id = ulid();
    const ext = EXT_BY_MIME[mime] ?? "jpg";
    const key = `uploads/${id}-amazon.${ext}`;
    await env.MEDIA.put(key, buf, { httpMetadata: { contentType: mime } });
    await env.DB.prepare(
      "INSERT INTO media (id, r2_key, url_path, mime, bytes, alt, created_at) VALUES (?,?,?,?,?,?,?)",
    )
      .bind(id, key, `/img/${key}`, mime, buf.byteLength, (alt || "Product image").slice(0, 300), nowIso())
      .run();
    return `/img/${key}`;
  } catch {
    return url; // graceful fallback — keep the remote URL
  }
}
