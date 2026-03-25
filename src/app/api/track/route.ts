import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/admin/analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer } = body;

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    trackPageView({
      path,
      timestamp: new Date().toISOString(),
      referrer: referrer || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
