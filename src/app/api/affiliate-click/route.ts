import { NextResponse } from "next/server";
import { trackAffiliateClick } from "@/lib/admin/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, program, url, postSlug } = body;

    if (!productId || !program || !url) {
      return NextResponse.json(
        { error: "Missing required fields: productId, program, url." },
        { status: 400 }
      );
    }

    // Track click in analytics
    trackAffiliateClick({
      productId,
      program,
      timestamp: new Date().toISOString(),
      postSlug,
    });

    console.log(
      `[Affiliate Click] Product: ${productId}, Program: ${program}, URL: ${url}`
    );

    return NextResponse.json(
      { message: "Click tracked successfully." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
