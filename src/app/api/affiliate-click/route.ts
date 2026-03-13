import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, program, url } = body;

    if (!productId || !program || !url) {
      return NextResponse.json(
        { error: "Missing required fields: productId, program, url." },
        { status: 400 }
      );
    }

    // TODO: Integrate with analytics service (Plausible, PostHog, etc.)
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
