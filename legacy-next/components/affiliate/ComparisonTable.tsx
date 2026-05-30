import { cn } from "@/lib/utils";
import { getProductsByIds, getAffiliateUrl } from "@/lib/affiliates";
import { programs } from "@/data/programs";

interface ComparisonTableProps {
  productIds: string[];
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
    </span>
  );
}

export function ComparisonTable({
  productIds,
  className,
}: ComparisonTableProps) {
  const products = getProductsByIds(productIds);

  if (products.length === 0) return null;

  // Collect all unique spec keys across all products
  const allSpecKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specs || {}))),
  );

  const formatPrice = (price?: number) =>
    price != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price)
      : "--";

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-border bg-card p-3 text-left font-semibold text-card-foreground">
              Feature
            </th>
            {products.map((product) => (
              <th
                key={product.id}
                className="border-b border-border bg-card p-3 text-center font-semibold text-card-foreground"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {product.brand}
                  </span>
                  <span>{product.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Price row */}
          <tr className="border-b border-border">
            <td className="sticky left-0 z-10 bg-card p-3 font-medium text-card-foreground">
              Price
            </td>
            {products.map((product) => (
              <td
                key={product.id}
                className="p-3 text-center font-semibold text-green-700 dark:text-green-400"
              >
                {formatPrice(product.price)}
              </td>
            ))}
          </tr>

          {/* Rating row */}
          <tr className="border-b border-border">
            <td className="sticky left-0 z-10 bg-card p-3 font-medium text-card-foreground">
              Rating
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-3 text-center">
                {product.rating != null ? (
                  <RatingStars rating={product.rating} />
                ) : (
                  "--"
                )}
              </td>
            ))}
          </tr>

          {/* Spec rows */}
          {allSpecKeys.map((specKey) => (
            <tr key={specKey} className="border-b border-border">
              <td className="sticky left-0 z-10 bg-card p-3 font-medium text-card-foreground">
                {specKey}
              </td>
              {products.map((product) => (
                <td
                  key={product.id}
                  className="p-3 text-center text-muted-foreground"
                >
                  {product.specs?.[specKey] || "--"}
                </td>
              ))}
            </tr>
          ))}

          {/* Buy row */}
          <tr>
            <td className="sticky left-0 z-10 bg-card p-3 font-medium text-card-foreground">
              Buy
            </td>
            {products.map((product) => {
              const firstLink = product.links[0];
              const url = getAffiliateUrl(product.id, firstLink?.program);
              const programConfig = firstLink
                ? programs[firstLink.program]
                : undefined;
              const programName = programConfig?.name || "Retailer";

              return (
                <td key={product.id} className="p-3 text-center">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="nofollow sponsored"
                      className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Buy on {programName}
                    </a>
                  ) : (
                    "--"
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
