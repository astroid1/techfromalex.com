import type { APIRoute } from "astro";
import { getEnv } from "@/lib/db";

export const prerender = false;

// Serves media objects from the R2 bucket. Public, long-cached + immutable
// (keys are content-addressed by ULID, so they never change).
export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key;
  if (!key) return new Response("Not found", { status: 404 });
  const obj = await getEnv(locals).MEDIA.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
};
