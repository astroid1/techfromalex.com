import type { Product } from "@/types";
import { products } from "@/data/products";
import { programs } from "@/data/programs";

/**
 * Look up a single product by its ID.
 */
export function getProduct(id: string): Product | undefined {
  return products[id];
}

/**
 * Resolve the affiliate URL for a product and optional program.
 *
 * If no program is specified, falls back to the first available link.
 * Returns the raw product URL if the program is not found in config.
 */
export function getAffiliateUrl(
  productId: string,
  program?: string,
): string | undefined {
  const product = getProduct(productId);
  if (!product || product.links.length === 0) return undefined;

  // Find the requested program link, or fall back to the first link
  const link = program
    ? product.links.find((l) => l.program === program)
    : product.links[0];

  if (!link) {
    // Requested program not available; fall back to first link
    const fallback = product.links[0];
    const fallbackProgram = programs[fallback.program];
    if (fallbackProgram) {
      return fallbackProgram.buildUrl(fallback.url);
    }
    return fallback.url;
  }

  const programConfig = programs[link.program];
  if (programConfig) {
    return programConfig.buildUrl(link.url);
  }

  return link.url;
}

/**
 * Batch lookup: retrieve multiple products by their IDs.
 * Returns products in the same order as the input array.
 * Missing products are filtered out.
 */
export function getProductsByIds(ids: string[]): Product[] {
  return ids
    .map((id) => getProduct(id))
    .filter((p): p is Product => p !== undefined);
}
