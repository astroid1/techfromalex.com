import type { APIRoute } from "astro";
import { getDB, getEnv } from "@/lib/db";
import { unpublishStored } from "@/lib/admin-actions";

// Revert a published item to 'unpublished' (drops FTS + purges caches).
export const prerender = false;

export const POST: APIRoute = async ({ locals, params }) => {
  const db = getDB(locals);
  const env = getEnv(locals);
  try {
    await unpublishStored(env, db, params.id!, locals.user?.email ?? null);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
};
