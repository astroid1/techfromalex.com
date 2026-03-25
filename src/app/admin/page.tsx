"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { MiniChart } from "@/components/admin/MiniChart";
import { ActivityFeed } from "@/components/admin/ActivityFeed";

interface Analytics {
  totalPageViews: number;
  totalAffiliateClicks: number;
  totalSubscribers: number;
  pageViewsByDay: { date: string; count: number }[];
  clicksByDay: { date: string; count: number }[];
  topPages: { path: string; count: number }[];
  topProducts: { productId: string; count: number }[];
  recentActivity: { type: string; description: string; timestamp: string }[];
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  const data = analytics || {
    totalPageViews: 0,
    totalAffiliateClicks: 0,
    totalSubscribers: 0,
    pageViewsByDay: [],
    clicksByDay: [],
    topPages: [],
    topProducts: [],
    recentActivity: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">Overview of your site performance</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Page Views"
          value={data.totalPageViews}
          icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
        <StatCard
          title="Affiliate Clicks"
          value={data.totalAffiliateClicks}
          icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
        <StatCard
          title="Subscribers"
          value={data.totalSubscribers}
          icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
        <StatCard
          title="Conversion Rate"
          value={data.totalPageViews > 0
            ? `${((data.totalAffiliateClicks / data.totalPageViews) * 100).toFixed(1)}%`
            : "0%"}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MiniChart data={data.pageViewsByDay} label="Page Views (Last 30 Days)" />
        <MiniChart data={data.clicksByDay} label="Affiliate Clicks (Last 30 Days)" color="var(--success)" />
      </div>

      {/* Tables + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted">Top Pages</h3>
          {data.topPages.length > 0 ? (
            <div className="space-y-2">
              {data.topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-foreground">{page.path}</span>
                  <span className="ml-2 shrink-0 text-muted">{page.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">No page view data yet</p>
          )}
        </div>

        {/* Activity Feed */}
        <ActivityFeed items={data.recentActivity} />
      </div>
    </div>
  );
}
