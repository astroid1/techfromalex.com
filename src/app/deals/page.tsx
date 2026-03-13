import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { products } from "@/data/products";
import { ProductCard } from "@/components/affiliate/ProductCard";

export const metadata: Metadata = generatePageMetadata({
  title: "Today's Best Tech Deals",
  description:
    "Curated tech deals on laptops, headphones, accessories, and more. Updated regularly to help you save on the gear that matters.",
  url: "/deals",
});

export default function DealsPage() {
  const productIds = Object.keys(products);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Today&apos;s Best Tech Deals
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted">
          Hand-picked deals on top-rated tech products. Updated regularly so you
          never miss a good price.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {productIds.map((id) => (
          <ProductCard key={id} productId={id} />
        ))}
      </div>
    </div>
  );
}
