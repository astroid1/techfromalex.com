import Link from "next/link";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <Link
      href={`/blog?tag=${slugify(tag)}`}
      className={cn(
        "inline-flex items-center rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-card-hover",
        className
      )}
    >
      {tag}
    </Link>
  );
}
