/**
 * Programmatic admin actions, shared by the JSON admin API (called by the
 * central Astroid dashboard) so list / publish / generate run the SAME logic
 * the /admin pages do — referential validation, FTS sync and CDN purge all
 * fire on publish exactly as in the human flow.
 */
import { ulid, nowIso } from "./ids";
import { slugify } from "./format";
import {
  attachProductsToContent,
  programIdsInBody,
  productIdsInBody,
  purgeContent,
  removeFts,
  syncFts,
  uniqueSlug,
  writeRevision,
} from "./admin";
import { assertReferences, ReferentialError } from "./validate";
import { runGenerationJob } from "./ai/generate";

export interface AdminContentSummary {
  id: string;
  type: string;
  status: string;
  slug: string;
  title: string;
  category: string | null;
  updatedAt: string;
  publishedAt: string | null;
  aiStatus: string | null;
}

interface ContentListRow {
  id: string;
  type: string;
  status: string;
  slug: string;
  title: string;
  category: string | null;
  updated_at: string;
  published_at: string | null;
  structured_json: string | null;
}

/** List content of any status (newest first), optionally filtered by status. */
export async function listAllContent(
  db: D1Database,
  opts: { status?: string; limit?: number } = {},
): Promise<AdminContentSummary[]> {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const where = opts.status ? "WHERE status = ?" : "";
  const binds: unknown[] = opts.status ? [opts.status] : [];
  binds.push(limit);
  const res = await db
    .prepare(
      `SELECT id, type, status, slug, title, category, updated_at, published_at, structured_json
       FROM content ${where} ORDER BY updated_at DESC LIMIT ?`,
    )
    .bind(...binds)
    .all<ContentListRow>();
  return (res.results ?? []).map((r) => {
    let aiStatus: string | null = null;
    try {
      aiStatus = JSON.parse(r.structured_json || "{}").aiStatus ?? null;
    } catch {
      /* ignore */
    }
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      slug: r.slug,
      title: r.title,
      category: r.category,
      updatedAt: r.updated_at,
      publishedAt: r.published_at,
      aiStatus,
    };
  });
}

interface ContentRow {
  id: string;
  slug: string;
  category: string | null;
  title: string;
  dek: string | null;
  body_md: string;
  structured_json: string;
  status: string;
  published_at: string | null;
}

/**
 * Publish the content item AS STORED (no body edits). Runs the same
 * referential validation + FTS sync + CDN purge as the editor's Publish.
 * Throws ReferentialError (message safe to surface) on a bad reference.
 */
export async function publishStored(
  env: Env,
  db: D1Database,
  id: string,
  by: string | null,
): Promise<{ slug: string }> {
  const c = await db
    .prepare("SELECT * FROM content WHERE id = ?")
    .bind(id)
    .first<ContentRow>();
  if (!c) throw new Error("Content not found");

  let structured: Record<string, unknown> = {};
  try {
    structured = JSON.parse(c.structured_json || "{}");
  } catch {
    /* tolerate */
  }

  // Gather every referenced product / affiliate-profile / program id, mirroring
  // the editor's publish gate.
  const pidSet = new Set<string>(productIdsInBody(c.body_md));
  if (typeof structured.productId === "string") pidSet.add(structured.productId);
  if (Array.isArray(structured.picks))
    for (const p of structured.picks as Array<{ productId?: string }>)
      if (p.productId) pidSet.add(p.productId);
  if (Array.isArray(structured.entrants))
    for (const e of structured.entrants as string[]) pidSet.add(e);

  const rel =
    (
      await db
        .prepare(
          "SELECT product_id, affiliate_profile_id FROM content_products WHERE content_id=?",
        )
        .bind(id)
        .all<{ product_id: string; affiliate_profile_id: string | null }>()
    ).results ?? [];
  const profSet = new Set<string>();
  for (const r of rel) {
    pidSet.add(r.product_id);
    if (r.affiliate_profile_id) profSet.add(r.affiliate_profile_id);
  }
  const caps =
    (
      await db
        .prepare(
          "SELECT affiliate_profile_id FROM content_affiliate_profiles WHERE content_id=?",
        )
        .bind(id)
        .all<{ affiliate_profile_id: string }>()
    ).results ?? [];
  for (const r of caps) profSet.add(r.affiliate_profile_id);
  const programSet = new Set<string>(programIdsInBody(c.body_md));

  await assertReferences(db, {
    productIds: [...pidSet],
    profileIds: [...profSet],
    programIds: [...programSet],
  });

  const now = nowIso();
  const publishedAt = c.published_at ?? now;
  await db
    .prepare(
      "UPDATE content SET status='published', published_at=?, updated_at=? WHERE id=?",
    )
    .bind(publishedAt, now, id)
    .run();

  const tagRows =
    (
      await db
        .prepare("SELECT tag_slug FROM content_tags WHERE content_id=?")
        .bind(id)
        .all<{ tag_slug: string }>()
    ).results ?? [];
  const tags = tagRows.map((t) => t.tag_slug);
  await syncFts(db, { id, title: c.title, dek: c.dek, bodyMd: c.body_md, tags });
  await purgeContent(env, c.slug, c.category, tags);
  await writeRevision(db, id, { action: "publish", by }, "published", "system", by);
  return { slug: c.slug };
}

/** Unpublish (revert to 'unpublished'): drop from FTS + purge caches. */
export async function unpublishStored(
  env: Env,
  db: D1Database,
  id: string,
  by: string | null,
): Promise<void> {
  const c = await db
    .prepare("SELECT id, slug, category FROM content WHERE id = ?")
    .bind(id)
    .first<{ id: string; slug: string; category: string | null }>();
  if (!c) throw new Error("Content not found");
  const now = nowIso();
  await db
    .prepare("UPDATE content SET status='unpublished', updated_at=? WHERE id=?")
    .bind(now, id)
    .run();
  await removeFts(db, id);
  await purgeContent(env, c.slug, c.category);
  await writeRevision(db, id, { action: "unpublish", by }, "unpublished", "system", by);
}

export interface CreateContentInput {
  type?: string;
  title: string;
  category?: string | null;
  primaryKeyword?: string;
  brief?: string;
  instructions?: string;
  productIds?: string[];
  programIds?: string[];
  generate?: boolean;
}

/**
 * Create a draft (optionally kicking off AI generation in the background),
 * mirroring /admin/content/new. Returns the new id + slug. When generate is
 * true the caller must pass ctx so the job runs after the response.
 */
export async function createDraft(
  env: Env,
  db: D1Database,
  input: CreateContentInput,
  ctx: ExecutionContext | null,
): Promise<{ id: string; slug: string }> {
  const title = (input.title ?? "").trim();
  if (!title) throw new Error("A title or topic is required.");
  const type = input.type || "review";
  const id = ulid();
  const slug = await uniqueSlug(db, slugify(title));
  const now = nowIso();
  const programIds = (input.programIds ?? []).filter(Boolean);
  const structured = JSON.stringify({
    primaryKeyword: input.primaryKeyword ?? "",
    brief: input.brief ?? "",
    instructions: input.instructions ?? "",
    ...(programIds.length ? { programIds } : {}),
    ...(input.generate ? { aiStatus: "generating" } : {}),
  });
  await db
    .prepare(
      `INSERT INTO content (id,type,status,slug,title,dek,category,author_id,body_md,structured_json,seo_title,seo_description,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(id, type, "draft", slug, title, null, input.category ?? null, "alex", "", structured, null, null, now, now)
    .run();
  await attachProductsToContent(db, id, (input.productIds ?? []).filter(Boolean));
  if (input.generate) {
    const job = runGenerationJob(env, db, id);
    if (ctx) ctx.waitUntil(job);
    else await job;
  }
  return { id, slug };
}

export { ReferentialError };
