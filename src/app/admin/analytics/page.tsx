"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { MiniChart } from "@/components/admin/MiniChart";

interface Analytics {
  totalPageViews: number;
  totalAffiliateClicks: number;
  totalSubscribers: number;
  pageViewsByDay: { date: string; count: number }[];
  clicksByDay: { date: string; count: number }[];
  topPages: { path: string; count: number }[];
  topProducts: { productId: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const avgDailyViews = data.pageViewsByDay.length > 0
    ? Math.round(data.totalPageViews / data.pageViewsByDay.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted">Detailed traffic and engagement metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Page Views"
          value={data.totalPageViews}
          icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
        <StatCard
          title="Avg. Daily Views"
          value={avgDailyViews}
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
        <StatCard
          title="Total Clicks"
          value={data.totalAffiliateClicks}
          icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
        <StatCard
          title="CTR"
          value={data.totalPageViews > 0
            ? `${((data.totalAffiliateClicks / data.totalPageViews) * 100).toFixed(2)}%`
            : "0%"}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MiniChart data={data.pageViewsByDay} label="Page Views (Last 30 Days)" height={280} />
        <MiniChart data={data.clicksByDay} label="Affiliate Clicks (Last 30 Days)" color="var(--success)" height={280} />
      </div>

      {/* Top Pages & Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted">Top Pages</h3>
          {data.topPages.length > 0 ? (
            <div className="space-y-3">
              {data.topPages.map((page, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-right text-xs text-muted">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-foreground">{page.path}</span>
                      <span className="ml-2 text-muted">{page.count} views</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-border">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{
                          width: `${(page.count / (data.topPages[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">No page view data yet</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted">Top Products (by clicks)</h3>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-right text-xs text-muted">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-foreground">{product.productId}</span>
                      <span className="ml-2 text-muted">{product.count} clicks</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-border">
                      <div
                        className="h-1.5 rounded-full bg-success"
                        style={{
                          width: `${(product.count / (data.topProducts[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">No click data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
