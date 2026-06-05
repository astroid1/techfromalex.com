import type { Author, ContentFull, Product } from "./types";

type Ld = Record<string, unknown>;

function addDaysIso(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}
/** A cached price is trustworthy enough for structured data only if recently observed. */
function isFreshPrice(observedAt: string | null): boolean {
  if (!observedAt) return false;
  const t = Date.parse(observedAt);
  return !isNaN(t) && Date.now() - t < 90 * 86_400_000;
}

export function breadcrumbLd(crumbs: { name: string; url: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export function productLd(p: Product, origin: string, opts: { withContext?: boolean } = {}): Ld {
  const ld: Ld = {
    ...(opts.withContext ? { "@context": "https://schema.org" } : {}),
    "@type": "Product",
    name: p.name,
  };
  if (p.brand) ld.brand = { "@type": "Brand", name: p.brand };
  if (p.description) ld.description = p.description;
  // schema.org image must be absolute; internalized images are stored as /img/... paths.
  if (p.imageUrl) ld.image = new URL(p.imageUrl, origin).toString();
  // Only advertise a price in structured data when it's recent enough to trust:
  // there's no auto price refresh, so a stale price risks a Google price-mismatch.
  if (p.priceCents != null && p.buyUrl && isFreshPrice(p.priceObservedAt)) {
    ld.offers = {
      "@type": "Offer",
      price: (p.priceCents / 100).toFixed(2),
      priceCurrency: p.currency,
      priceValidUntil: addDaysIso(30),
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      url: p.buyUrl,
    };
  }
  return ld;
}

function authorLd(author: Author | null, origin: string): Ld {
  if (!author) return { "@type": "Person", name: "Alex Hirt" };
  return {
    "@type": "Person",
    name: author.name,
    url: `${origin}/about`,
    ...(author.title ? { jobTitle: author.title } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    worksFor: { "@type": "Organization", name: "Tech From Alex", url: origin },
    ...(author.sameAs.length ? { sameAs: author.sameAs } : {}),
  };
}

const publisherLd = (origin: string): Ld => ({
  "@type": "Organization",
  name: "Tech From Alex",
  logo: { "@type": "ImageObject", url: `${origin}/favicon.svg` },
});

/** Primary article schema. Reviews → Review (with reviewRating + itemReviewed). */
export function articleLd(
  c: ContentFull,
  author: Author | null,
  featured: Product | null,
  origin: string,
  ogImage?: string,
): Ld {
  const url = `${origin}/${c.slug}`;
  const base: Ld = {
    "@context": "https://schema.org",
    headline: c.title,
    description: c.dek ?? c.seoDescription ?? "",
    datePublished: c.publishedAt ?? undefined,
    dateModified: c.updatedAt,
    author: authorLd(author, origin),
    publisher: publisherLd(origin),
    ...(ogImage ? { image: ogImage } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
  if (c.type === "review" && c.verdictScore != null) {
    return {
      ...base,
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: c.verdictScore,
        bestRating: 10,
        worstRating: 1,
      },
      ...(featured ? { itemReviewed: productLd(featured, origin) } : {}),
    };
  }
  return {
    ...base,
    "@type": c.type === "news_deal" ? "NewsArticle" : "Article",
  };
}

export function itemListLd(
  products: { product: Product; position: number }[],
  origin: string,
): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map(({ product, position }) => ({
      "@type": "ListItem",
      position,
      item: productLd(product, origin),
    })),
  };
}

export function howToLd(
  name: string,
  steps: { name: string; detail: string }[],
  opts: { description?: string | null; tools?: string[] } = {},
): Ld | null {
  if (!steps.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.tools?.length
      ? { tool: opts.tools.map((t) => ({ "@type": "HowToTool", name: t })) }
      : {}),
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.detail,
    })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]): Ld | null {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
