import { getProducts, getContentProductIds } from "@/lib/content";
import { productIdsInBody } from "@/lib/admin";
import { findMissingProductIds } from "@/lib/validate";
import { generateStructured } from "./anthropic";
import { buildSystem, getTemplate, naturalize, naturalizeDeep, type ProductFact } from "./templates";
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

export interface AiEditResult {
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  seoTitle: string;
  heroAlt: string;
  structured: Record<string, unknown>;
  verdictScore: number | null;
  warnings: string[];
}

/**
 * Apply a targeted, natural-language edit to an existing draft with Claude.
 * Unlike generateDraft (which writes from scratch), this hands the model the
 * CURRENT title/body/structured and an instruction, asking it to change only
 * what's requested and return the full revised draft. Same product-id guard +
 * one corrective re-roll. The caller persists the result.
 */
export async function aiEdit(
  env: Env,
  db: D1Database,
  contentId: string,
  instruction: string,
  current: { title: string; bodyMd: string; structuredJson: string },
): Promise<AiEditResult> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Run: wrangler secret put ANTHROPIC_API_KEY");
  }
  if (!instruction.trim()) throw new Error("Tell the AI what to change.");

  const c = await db
    .prepare("SELECT id, type FROM content WHERE id = ?")
    .bind(contentId)
    .first<{ id: string; type: ContentType }>();
  if (!c) throw new Error("Draft not found.");

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

  const tmpl = getTemplate(c.type);
  const system = buildSystem(c.type, facts);

  const curStructRaw = current.structuredJson || "{}";
  let userText = [
    "You are EDITING an existing published-quality draft — NOT writing from scratch.",
    "Apply ONLY the change requested below. Preserve everything else: keep sections, wording, directives,",
    "and product ids you were not asked to touch. Return the COMPLETE revised draft, filling the JSON schema exactly.",
    "",
    "=== CURRENT DRAFT ===",
    `TITLE: ${current.title}`,
    "",
    "BODY (markdown):",
    current.bodyMd || "(empty)",
    "",
    "STRUCTURED (JSON):",
    curStructRaw,
    "",
    "=== EDIT INSTRUCTION ===",
    instruction.trim(),
    "",
    productIds.length
      ? `Allowed product ids (use only these): ${productIds.join(", ")}`
      : "No products are attached to this piece.",
    "Return the full revised draft now.",
  ].join("\n");

  let { data } = await generateStructured<DraftOutput>({ apiKey, system, userText, schema: tmpl.schema });

  let missing = await findMissingProductIds(db, collectIds(data));
  if (missing.length) {
    userText +=
      `\n\nCORRECTION: Use ONLY these product ids: ${productIds.join(", ") || "(none)"}. ` +
      `You referenced unknown ids: ${missing.join(", ")}. Do not reference any product not in that list.`;
    ({ data } = await generateStructured<DraftOutput>({ apiKey, system, userText, schema: tmpl.schema }));
    missing = await findMissingProductIds(db, collectIds(data));
  }
  const warnings = missing.length
    ? [`Removed references to unknown products: ${missing.join(", ")}`]
    : [];

  // Strip em dashes / AI-tell punctuation so the copy reads like a person wrote it.
  data.title = naturalize(data.title);
  data.metaDescription = naturalize(data.metaDescription);
  data.seoTitle = naturalize(data.seoTitle);
  data.heroAlt = naturalize(data.heroAlt);
  data.bodyMarkdown = naturalize(data.bodyMarkdown);
  if (Array.isArray(data.faq)) data.faq = data.faq.map((f) => ({ q: naturalize(f.q), a: naturalize(f.a) }));
  data.structured = naturalizeDeep(data.structured);

  let curStruct: Record<string, any> = {};
  try {
    curStruct = JSON.parse(curStructRaw);
  } catch {
    /* ignore malformed current structured */
  }
  const newStruct = {
    ...curStruct,
    ...data.structured,
    faq: data.faq ?? curStruct.faq ?? [],
    aiWarnings: warnings,
  };
  const verdict =
    typeof (data.structured as any)?.verdictScore === "number"
      ? Math.max(0, Math.min(10, (data.structured as any).verdictScore))
      : null;

  return {
    title: data.title || current.title,
    metaDescription: data.metaDescription || "",
    bodyMarkdown: data.bodyMarkdown ?? current.bodyMd,
    seoTitle: data.seoTitle || "",
    heroAlt: data.heroAlt || "",
    structured: newStruct,
    verdictScore: verdict,
    warnings,
  };
}
