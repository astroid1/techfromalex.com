export type ContentType = "review" | "comparison" | "roundup" | "news_deal" | "howto";
export type CategorySlug =
  | "reviews"
  | "guides"
  | "comparisons"
  | "deals"
  | "news";

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string;
  rating: number | null;
  description: string | null;
  pros: string[];
  cons: string[];
  specs: Record<string, string>;
  /** Built affiliate URL for the primary active link, if any. */
  buyUrl: string | null;
  buyNetwork: string | null;
  /** When the cached price was last observed (import/refresh); for the "approx." stamp. */
  priceObservedAt: string | null;
}

/** A single-link affiliate program (e.g. make.com) resolved for a content CTA block. */
export interface ProgramCta {
  id: string;
  name: string;
  headline: string;
  blurb: string | null;
  ctaLabel: string;
  logoUrl: string | null;
  /** Built tagged affiliate link, or null if it can't be built (never show untagged). */
  url: string | null;
}

export interface ContentSummary {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  dek: string | null;
  category: CategorySlug | null;
  heroImageUrl: string | null;
  heroAlt: string | null;
  verdictScore: number | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ContentFull extends ContentSummary {
  authorId: string;
  bodyMd: string;
  structured: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  dealPriceCents: number | null;
  dealExpiresAt: string | null;
  tags: string[];
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  title: string | null;
  sameAs: string[];
}

export interface RoundupPick {
  rank: number;
  productId: string;
  award: string;
  bestFor: string;
  rationale: string;
}

export interface HowtoStep {
  name: string;
  detail: string;
}

export const CATEGORY_NAMES: Record<CategorySlug, string> = {
  reviews: "Reviews",
  guides: "Guides",
  comparisons: "Comparisons",
  deals: "Deals",
  news: "News",
};
