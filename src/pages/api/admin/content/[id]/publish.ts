import type { APIRoute } from "astro";
import { getDB, getEnv } from "@/lib/db";
import { publishStored, ReferentialError } from "@/lib/admin-actions";

// Publish a content item as stored — same validation + FTS sync + CDN purge as
// the editor's Publish button. Auth enforced by middleware.
export const prerender = false;

export const POST: APIRoute = async ({ locals, params }) => {
  const db = getDB(locals);
  const env = getEnv(locals);
  const id = params.id!;
  try {
    const r = await publishStored(env, db, id, locals.user?.email ?? null);
    return Response.json({ ok: true, slug: r.slug });
  } catch (e) {
    const msg = (e as Error).message;
    // Referential errors are the author's to fix → 422 (not a server fault).
    const status = e instanceof ReferentialError ? 422 : 500;
    return Response.json({ error: msg }, { status });
  }
};
