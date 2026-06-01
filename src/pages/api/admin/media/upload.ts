import type { APIRoute } from "astro";
import { getEnv } from "@/lib/db";
import { ulid, nowIso } from "@/lib/ids";

export const prerender = false;

const safeName = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60) || "file";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = getEnv(locals);
  const form = await request.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return redirect("/admin/media?error=" + encodeURIComponent("Choose a file to upload."), 303);
  }
  if (!alt) {
    return redirect("/admin/media?error=" + encodeURIComponent("Alt text is required."), 303);
  }
  if (file.size > 10 * 1024 * 1024) {
    return redirect("/admin/media?error=" + encodeURIComponent("File too large (max 10MB)."), 303);
  }

  const id = ulid();
  const key = `uploads/${id}-${safeName(file.name)}`;
  const mime = file.type || "application/octet-stream";
  try {
    await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: mime } });
    await env.DB.prepare(
      "INSERT INTO media (id, r2_key, url_path, mime, bytes, alt, created_at) VALUES (?,?,?,?,?,?,?)",
    )
      .bind(id, key, `/img/${key}`, mime, file.size, alt, nowIso())
      .run();
  } catch (e) {
    return redirect("/admin/media?error=" + encodeURIComponent((e as Error).message), 303);
  }
  return redirect("/admin/media", 303);
};
