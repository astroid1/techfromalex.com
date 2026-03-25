import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data/analytics");

export interface PageView {
  path: string;
  timestamp: string;
  referrer?: string;
  userAgent?: string;
}

export interface AffiliateClick {
  productId: string;
  program: string;
  timestamp: string;
  postSlug?: string;
}

export interface NewsletterSub {
  email: string;
  timestamp: string;
  source?: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  totalAffiliateClicks: number;
  totalSubscribers: number;
  pageViewsByDay: { date: string; count: number }[];
  clicksByDay: { date: string; count: number }[];
  topPages: { path: string; count: number }[];
  topProducts: { productId: string; count: number }[];
  recentActivity: { type: string; description: string; timestamp: string }[];
}

function ensureFile(filename: string): string {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    writeFileSync(filepath, "[]", "utf-8");
  }
  return filepath;
}

function readJsonFile<T>(filename: string): T[] {
  const filepath = ensureFile(filename);
  try {
    return JSON.parse(readFileSync(filepath, "utf-8"));
  } catch {
    return [];
  }
}

function appendJsonFile<T>(filename: string, item: T): void {
  const items = readJsonFile<T>(filename);
  items.push(item);
  const filepath = join(DATA_DIR, filename);
  writeFileSync(filepath, JSON.stringify(items, null, 2), "utf-8");
}

export function trackPageView(view: PageView): void {
  appendJsonFile("pageviews.json", view);
}

export function trackAffiliateClick(click: AffiliateClick): void {
  appendJsonFile("clicks.json", click);
}

export function trackNewsletterSub(sub: NewsletterSub): void {
  appendJsonFile("subscribers.json", sub);
}

export function getPageViews(): PageView[] {
  return readJsonFile<PageView>("pageviews.json");
}

export function getAffiliateClicks(): AffiliateClick[] {
  return readJsonFile<AffiliateClick>("clicks.json");
}

export function getSubscribers(): NewsletterSub[] {
  return readJsonFile<NewsletterSub>("subscribers.json");
}

function groupByDay(items: { timestamp: string }[]): { date: string; count: number }[] {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const date = item.timestamp.split("T")[0];
    counts[date] = (counts[date] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByField(items: any[], field: string): { key: string; count: number }[] {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const key = String(item[field] || "unknown");
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const pageViews = getPageViews();
  const clicks = getAffiliateClicks();
  const subscribers = getSubscribers();

  const topPages = groupByField(pageViews, "path")
    .slice(0, 10)
    .map((item) => ({ path: item.key, count: item.count }));

  const topProducts = groupByField(clicks, "productId")
    .slice(0, 10)
    .map((item) => ({ productId: item.key, count: item.count }));

  // Build recent activity feed
  const recentActivity: { type: string; description: string; timestamp: string }[] = [];

  pageViews.slice(-5).forEach((pv) => {
    recentActivity.push({
      type: "pageview",
      description: `Page view: ${pv.path}`,
      timestamp: pv.timestamp,
    });
  });

  clicks.slice(-5).forEach((c) => {
    recentActivity.push({
      type: "click",
      description: `Affiliate click: ${c.productId} on ${c.program}`,
      timestamp: c.timestamp,
    });
  });

  subscribers.slice(-5).forEach((s) => {
    recentActivity.push({
      type: "subscriber",
      description: `New subscriber: ${s.email}`,
      timestamp: s.timestamp,
    });
  });

  recentActivity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    totalPageViews: pageViews.length,
    totalAffiliateClicks: clicks.length,
    totalSubscribers: subscribers.length,
    pageViewsByDay: groupByDay(pageViews),
    clicksByDay: groupByDay(clicks),
    topPages,
    topProducts,
    recentActivity: recentActivity.slice(0, 15),
  };
}
