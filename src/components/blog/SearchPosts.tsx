"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface SearchPostsProps {
  categories: string[];
}

export function SearchPosts({ categories }: SearchPostsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentQuery = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row">
      <input
        type="search"
        placeholder="Search posts..."
        value={currentQuery}
        onChange={(e) => updateParams("q", e.target.value)}
        className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        aria-label="Search posts"
      />
      <select
        value={currentCategory}
        onChange={(e) => updateParams("category", e.target.value)}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
