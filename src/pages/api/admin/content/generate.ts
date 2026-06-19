import type { APIRoute } from "astro";
import { getDB, getEnv } from "@/lib/db";
import { createDraft } from "@/lib/admin-actions";

// Create a draft and (by default) kick off AI generation in the background,
// mirroring /admin/content/new. Returns the new id + slug so the dashboard can
// deep-link into the editor. Auth enforced by middleware.
export const prerender = false;

interface Body {
  type?: string;
  title?: string;
  category?: string | null;
  primaryKeyword?: string;
  brief?: string;
  instructions?: string;
  productIds?: string[];
  programIds?: string[];
  generate?: boolean;
}

export const POST: APIRoute = async ({ locals, request }) => {
  const db = getDB(locals);
  const env = getEnv(locals);
  const ctx = locals.runtime?.ctx ?? null;
  const body = (await request.json().catch(() => ({}))) as Body;
  try {
    const r = await createDraft(
      env,
      db,
      {
        type: body.type,
        title: body.title ?? "",
        category: body.category ?? null,
        primaryKeyword: body.primaryKeyword,
        brief: body.brief,
        instructions: body.instructions,
        productIds: body.productIds,
        programIds: body.programIds,
        generate: body.generate !== false,
      },
      ctx,
    );
    return Response.json({ ok: true, id: r.id, slug: r.slug });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
};
