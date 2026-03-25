import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/admin/analytics";

export async function GET() {
  try {
    const summary = getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
