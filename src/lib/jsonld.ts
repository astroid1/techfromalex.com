import type { Author, ContentFull, Product } from "./types";

type Ld = Record<string, unknown>;

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
  if (p.priceCents != null && p.buyUrl) {
    ld.offers = {
      "@type": "Offer",
      price: (p.priceCents / 100).toFixed(2),
      priceCurrency: p.currency,
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
