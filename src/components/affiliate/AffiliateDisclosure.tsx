import { cn } from "@/lib/utils";

export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-200",
        className,
      )}
      role="note"
      aria-label="Affiliate disclosure"
    >
      <p>
        This post contains affiliate links. If you purchase through these links,
        I may earn a commission at no extra cost to you.
      </p>
    </div>
  );
}
