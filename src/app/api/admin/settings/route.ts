import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const SETTINGS_FILE = join(process.cwd(), "data/analytics/settings.json");

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  author: string;
  twitterHandle: string;
  githubUrl: string;
  amazonTag: string;
  bestBuyAffId: string;
  newsletterProvider: string;
  analyticsEnabled: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Tech From Alex",
  siteDescription: "Tech reviews, deals, and guides to help you make smarter buying decisions.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://techfromalex.com",
  author: "Alex",
  twitterHandle: "techfromalex",
  githubUrl: "https://github.com/techfromalex",
  amazonTag: process.env.NEXT_PUBLIC_AMAZON_TAG || "",
  bestBuyAffId: process.env.NEXT_PUBLIC_BESTBUY_AFF_ID || "",
  newsletterProvider: "none",
  analyticsEnabled: true,
};

function getSettings(): SiteSettings {
  if (!existsSync(SETTINGS_FILE)) {
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(SETTINGS_FILE, "utf-8")) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: SiteSettings): void {
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const current = getSettings();
    const updated = { ...current, ...body };
    saveSettings(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 400 });
  }
}
