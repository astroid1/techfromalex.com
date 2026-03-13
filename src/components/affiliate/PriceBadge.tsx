import { cn } from "@/lib/utils";
import { getProduct } from "@/lib/affiliates";

interface PriceBadgeProps {
  productId: string;
  className?: string;
}

export function PriceBadge({ productId, className }: PriceBadgeProps) {
  const product = getProduct(productId);
  if (!product || product.price == null) return null;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300",
        className,
      )}
    >
      {formatted}
    </span>
  );
}
