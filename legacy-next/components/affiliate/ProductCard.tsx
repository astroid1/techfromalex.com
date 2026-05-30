import { cn } from "@/lib/utils";
import { getProduct, getAffiliateUrl } from "@/lib/affiliates";
import { programs } from "@/data/programs";

interface ProductCardProps {
  productId: string;
  className?: string;
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span
      className="inline-flex items-center gap-0.5 text-yellow-500"
      aria-label={`${rating} out of 5 stars`}
    >
      {"★".repeat(fullStars)}
      {hasHalf && "★"}
      {"☆".repeat(emptyStars)}
      <span className="ml-1 text-xs text-muted-foreground">({rating})</span>
    </span>
  );
}

export function ProductCard({ productId, className }: ProductCardProps) {
  const product = getProduct(productId);
  if (!product) return null;

  const firstLink = product.links[0];
  const url = getAffiliateUrl(productId, firstLink?.program);
  const programConfig = firstLink ? programs[firstLink.program] : undefined;
  const programName = programConfig?.name || "Retailer";

  const formattedPrice =
    product.price != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(product.price)
      : null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="text-lg font-semibold leading-tight text-card-foreground">
            {product.name}
          </h3>
        </div>
        {formattedPrice && (
          <span className="inline-flex shrink-0 items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
            {formattedPrice}
          </span>
        )}
      </div>

      {product.rating != null && (
        <div className="mb-3">
          <RatingStars rating={product.rating} />
        </div>
      )}

      {product.description && (
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="nofollow sponsored"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Buy on {programName}
        </a>
      )}
    </div>
  );
}
