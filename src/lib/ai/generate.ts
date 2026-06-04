import { getProducts, getContentProductIds } from "@/lib/content";
import { getProgramFacts } from "@/lib/programs";
import { writeRevision, productIdsInBody, programIdsInBody } from "@/lib/admin";
import { findMissingProductIds, findMissingProgramIds } from "@/lib/validate";
import { nowIso } from "@/lib/ids";
import { generateStructured } from "./anthropic";
import { buildSystem, buildUserText, getTemplate, naturalize, naturalizeDeep, cleanGenerated, cleanGeneratedDeep, type ProductFact } from "./templates";
import type { ContentType } from "@/lib/types";

interface DraftOutput {
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  heroAlt: string;
  bodyMarkdown: string;
  faq: { q: string; a: string }[];
  structured: Record<string, unknown>;
}

function collectIds(out: DraftOutput): string[] {
  const ids = new Set<string>(productIdsInBody(out.bodyMarkdown));
  const s = out.structured as Record<string, any>;
  if (s.productId) ids.add(s.productId);
  if (s.dealProductId) ids.add(s.dealProductId);
  if (Array.isArray(s.entrants)) for (const e of s.entrants) ids.add(e);
  if (s.overallWinnerId) ids.add(s.overallWinnerId);
  if (Array.isArray(s.picks)) for (const p of s.picks) if (p.productId) ids.add(p.productId);
  return [...ids];
}

/**
 * Generate (or regenerate) the body + structured fields of a draft with Claude.
 * Uses only the products attached to the content; validates that every product
 * the model references exists, with one corrective re-roll. Leaves status as-is
 * (drafts stay drafts — author reviews, then publishes).
 */
export async function generateDraft(env: Env, db: D1Database, contentId: string): Promise<void> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Run: wrangler secret put ANTHROPIC_API_KEY");
  }

  const c = await db
    .prepare("SELECT id, type, title, structured_json FROM content WHERE id = ?")
    .bind(contentId)
    .first<{ id: string; type: ContentType; title: string; structured_json: string }>();
  if (!c) throw new Error("Draft not found.");

  const inStruct = JSON.parse(c.structured_json || "{}") as Record<string, any>;
  const brief = String(inStruct.brief ?? "");
  const keyword = String(inStruct.primaryKeyword ?? "");
  const instructions = String(inStruct.instructions ?? "");
  const source = String(inStruct.sourceTranscript ?? "");

  const productIds = await getContentProductIds(db, contentId);
  const productMap = await getProducts(db, productIds);
  const facts: ProductFact[] = [...productMap.values()].map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.priceCents != null ? p.priceCents / 100 : null,
    rating: p.rating,
    description: p.description,
    pros: p.pros,
    cons: p.cons,
    specs: p.specs,
  }));

  const programIds: string[] = Array.isArray(inStruct.programIds) ? inStruct.programIds.map(String) : [];
  const programFacts = await getProgramFacts(db, programIds);

  const tmpl = getTemplate(c.type);
  const system = buildSystem(c.type, facts, programFacts);
  let userText = buildUserText(c.title, keyword, brief, productIds, instructions, source);

  let { data } = await generateStructured<DraftOutput>({ apiKey, system, userText, schema: tmpl.schema });

  // Referential guard + one corrective re-roll (products AND ::promo program ids).
  let missing = await findMissingProductIds(db, collectIds(data));
  let missingPrograms = await findMissingProgramIds(db, programIdsInBody(data.bodyMarkdown));
  if (missing.length || missingPrograms.length) {
    userText +=
      `\n\nCORRECTION: Use ONLY these product ids: ${productIds.join(", ") || "(none)"} and these program ids: ${programIds.join(", ") || "(none)"}. ` +
      `You referenced unknown ids: ${[...missing, ...missingPrograms].join(", ")}. Do not reference any product or program not in those lists.`;
    ({ data } = await generateStructured<DraftOutput>({ apiKey, system, userText, schema: tmpl.schema }));
    missing = await findMissingProductIds(db, collectIds(data));
    missingPrograms = await findMissingProgramIds(db, programIdsInBody(data.bodyMarkdown));
  }

  const warnings = [
    ...(missing.length ? [`Removed references to unknown products: ${missing.join(", ")}`] : []),
    ...(missingPrograms.length ? [`Removed references to unknown programs: ${missingPrograms.join(", ")}`] : []),
  ];

  // Em-dash naturalize always; the heavier creator-monetization scrub (codes / "link in the
  // description" / bare URLs) runs ONLY when this draft was written FROM a source transcript —
  // where echoed sponsor codes/links can appear. That keeps normal articles from being
  // over-scrubbed (e.g. a coding how-to that says "use the code editor", or a deal post that
  // legitimately discusses a "discount code"). cleanGenerated skips ::/::: directive lines.
  const preCleanIds = source ? new Set(collectIds(data)) : new Set<string>();
  const clean = source ? cleanGenerated : naturalize;
  const cleanDeep = source ? cleanGeneratedDeep : naturalizeDeep;
  data.title = naturalize(data.title);
  data.metaDescription = clean(data.metaDescription);
  data.seoTitle = clean(data.seoTitle);
  data.heroAlt = naturalize(data.heroAlt);
  data.bodyMarkdown = clean(data.bodyMarkdown);
  data.faq = (data.faq ?? []).map((f) => ({ q: naturalize(f.q), a: clean(f.a) }));
  data.structured = cleanDeep(data.structured);
  // Safety net: cleaning must never drop a referenced product id (it skips directives). If it
  // somehow did, surface it rather than ship a silently un-monetized article.
  if (source) {
    const after = new Set(collectIds(data));
    const lost = [...preCleanIds].filter((id) => !after.has(id));
    if (lost.length) warnings.push(`Cleaning removed product references: ${lost.join(", ")}`);
  }

  const now = nowIso();
  const newStruct = {
    ...inStruct,
    ...data.structured,
    faq: data.faq ?? [],
    aiWarnings: warnings,
  };
  const verdict =
    typeof (data.structured as any)?.verdictScore === "number"
      ? Math.max(0, Math.min(10, (data.structured as any).verdictScore))
      : null;

  await db
    .prepare(
      `UPDATE content SET title=?, dek=?, body_md=?, structured_json=?, seo_title=?, seo_description=?,
         hero_alt=COALESCE(NULLIF(?,''), hero_alt), verdict_score=COALESCE(?, verdict_score), updated_at=? WHERE id=?`,
    )
    .bind(
      data.title || c.title,
      data.metaDescription || null,
      data.bodyMarkdown || "",
      JSON.stringify(newStruct),
      data.seoTitle || null,
      data.metaDescription || null,
      data.heroAlt || "",
      verdict,
      now,
      contentId,
    )
    .run();

  await writeRevision(
    db,
    contentId,
    { title: data.title, body_md: data.bodyMarkdown, structured_json: JSON.stringify(newStruct), note: "AI draft" },
    "draft",
    "ai",
    null,
  );
}

/**
 * Run draft generation as a background job (via ctx.waitUntil). Marks the
 * content's `aiStatus` in structured_json as "done" on success or "error" (with
 * the message) on failure, so the editor/list can show progress without blocking
 * the request that kicked it off.
 */
export async function runGenerationJob(env: Env, db: D1Database, contentId: string): Promise<void> {
  try {
    await generateDraft(env, db, contentId);
    await db
      .prepare(`UPDATE content SET structured_json = json_set(structured_json, '$.aiStatus', 'done'), updated_at=? WHERE id=?`)
      .bind(nowIso(), contentId)
      .run();
  } catch (e) {
    await db
      .prepare(
        `UPDATE content SET structured_json = json_set(structured_json, '$.aiStatus', 'error', '$.aiError', ?), updated_at=? WHERE id=?`,
      )
      .bind(String((e as Error).message).slice(0, 300), nowIso(), contentId)
      .run();
  }
}
