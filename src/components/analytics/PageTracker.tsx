"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    // Send page view after a small delay to avoid tracking redirects
    const timeout = setTimeout(() => {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || undefined,
        }),
      }).catch(() => {
        // Silently fail - analytics should never break the site
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
