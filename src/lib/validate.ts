/**
 * Referential-integrity guards. Used by the admin publish gate (Phase 4) and
 * the AI draft writer (Phase 5) so a content row can never reference a product
 * or affiliate profile that doesn't exist — the structural fix for the legacy
 * `samsung-t7` mismatch that silently dropped monetization.
 */

async function missingIds(
  db: D1Database,
  table: "products" | "affiliate_profiles" | "programs",
  ids: string[],
): Promise<string[]> {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (uniq.length === 0) return [];
  const placeholders = uniq.map(() => "?").join(",");
  const res = await db
    .prepare(`SELECT id FROM ${table} WHERE id IN (${placeholders})`)
    .bind(...uniq)
    .all<{ id: string }>();
  const found = new Set((res.results ?? []).map((r) => r.id));
  return uniq.filter((id) => !found.has(id));
}

export const findMissingProductIds = (db: D1Database, ids: string[]) =>
  missingIds(db, "products", ids);

export const findMissingProfileIds = (db: D1Database, ids: string[]) =>
  missingIds(db, "affiliate_profiles", ids);

export const findMissingProgramIds = (db: D1Database, ids: string[]) =>
  missingIds(db, "programs", ids);

export class ReferentialError extends Error {
  constructor(
    message: string,
    public readonly missing: { products: string[]; profiles: string[]; programs: string[] },
  ) {
    super(message);
    this.name = "ReferentialError";
  }
}

/** Throw if any referenced product/profile/program id is absent. */
export async function assertReferences(
  db: D1Database,
  refs: { productIds?: string[]; profileIds?: string[]; programIds?: string[] },
): Promise<void> {
  const [products, profiles, programs] = await Promise.all([
    findMissingProductIds(db, refs.productIds ?? []),
    findMissingProfileIds(db, refs.profileIds ?? []),
    findMissingProgramIds(db, refs.programIds ?? []),
  ]);
  if (products.length || profiles.length || programs.length) {
    const parts: string[] = [];
    if (products.length) parts.push(`products: ${products.join(", ")}`);
    if (profiles.length) parts.push(`affiliate profiles: ${profiles.join(", ")}`);
    if (programs.length) parts.push(`programs: ${programs.join(", ")}`);
    throw new ReferentialError(`Unknown references — ${parts.join("; ")}`, {
      products,
      profiles,
      programs,
    });
  }
}
