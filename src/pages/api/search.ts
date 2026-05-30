import type { APIRoute } from "astro";
import { getDB } from "@/lib/db";
import { searchContent } from "@/lib/content";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const q = url.searchParams.get("q") ?? "";
  const db = getDB(locals);
  const results = await searchContent(db, q, 10);
  return new Response(JSON.stringify({ results }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=30",
    },
  });
};
