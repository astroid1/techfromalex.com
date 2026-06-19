import type { APIRoute } from "astro";
import { getDB } from "@/lib/db";
import { listAllContent } from "@/lib/admin-actions";

// JSON content list for the central Astroid dashboard. Auth is enforced by
// middleware (Cloudflare Access OR the machine bearer token).
export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const db = getDB(locals);
  const status = url.searchParams.get("status") || undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50") || 50;
  const items = await listAllContent(db, { status, limit });
  return Response.json({ items });
};
