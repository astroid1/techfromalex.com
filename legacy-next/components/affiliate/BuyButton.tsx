import { cn } from "@/lib/utils";
import { getProduct, getAffiliateUrl } from "@/lib/affiliates";
import { programs } from "@/data/programs";

interface BuyButtonProps {
  productId: string;
  program?: string;
  className?: string;
}

export function BuyButton({ productId, program, className }: BuyButtonProps) {
  const product = getProduct(productId);
  if (!product) return null;

  const url = getAffiliateUrl(productId, program);
  if (!url) return null;

  // Determine the display name for the program
  const resolvedProgram = program || product.links[0]?.program;
  const programConfig = resolvedProgram ? programs[resolvedProgram] : undefined;
  const programName = programConfig?.name || "Retailer";

  return (
    <a
      href={url}
      target="_blank"
      rel="nofollow sponsored"
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      Buy on {programName}
    </a>
  );
}
