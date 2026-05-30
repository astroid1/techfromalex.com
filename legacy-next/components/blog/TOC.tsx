"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocEntry {
  title: string;
  url: string;
  items?: TocEntry[];
}

interface TOCItem {
  title: string;
  url: string;
  depth: number;
}

function flattenToc(entries: TocEntry[], depth = 2): TOCItem[] {
  return entries.flatMap((entry) => [
    { title: entry.title, url: entry.url, depth },
    ...(entry.items ? flattenToc(entry.items, depth + 1) : []),
  ]);
}

interface TOCProps {
  items: TocEntry[];
}

export function TOC({ items: rawItems }: TOCProps) {
  const items = flattenToc(rawItems);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const headingIds = items.map((item) => item.url.replace("#", ""));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    for (const id of headingIds) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      aria-label="Table of contents"
    >
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        On This Page
      </h3>
      <ul className="space-y-1 text-sm">
        {items.map((item) => {
          const id = item.url.replace("#", "");
          const isActive = activeId === id;
          const indent = (item.depth - 2) * 12;

          return (
            <li key={item.url}>
              <a
                href={item.url}
                style={{ paddingLeft: `${indent}px` }}
                className={cn(
                  "block rounded-md px-2 py-1.5 transition-colors",
                  isActive
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-muted hover:text-foreground"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                    setActiveId(id);
                  }
                }}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
