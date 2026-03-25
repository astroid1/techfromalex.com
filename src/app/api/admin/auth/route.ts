import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIdentityFromRequest, isCFAccessConfigured, getCFLogoutUrl } from "@/lib/admin/auth";

// GET: Return current identity info
export async function GET(request: NextRequest) {
  const cfConfigured = isCFAccessConfigured();

  if (cfConfigured) {
    const identity = await getIdentityFromRequest(request);
    if (identity) {
      return NextResponse.json({
        authenticated: true,
        provider: "cloudflare-access",
        email: identity.email,
        logoutUrl: getCFLogoutUrl(),
      });
    }
    return NextResponse.json({ authenticated: false, provider: "cloudflare-access" }, { status: 401 });
  }

  // Dev mode fallback
  return NextResponse.json({
    authenticated: true,
    provider: "dev",
    email: "admin@localhost",
    logoutUrl: "/admin/login",
  });
}

// POST: Dev-mode login (only works when CF Access is not configured)
export async function POST(request: NextRequest) {
  if (isCFAccessConfigured()) {
    return NextResponse.json(
      { error: "Login is handled by Cloudflare Access" },
      { status: 400 }
    );
  }

  try {
    const { password } = await request.json();
    const devPassword = process.env.ADMIN_PASSWORD;

    if (!devPassword || password !== devPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Create dev session cookie
    let hash = 0;
    const str = devPassword + "techfromalex-salt";
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", Math.abs(hash).toString(36), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE: Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");

  return NextResponse.json({
    success: true,
    logoutUrl: isCFAccessConfigured() ? getCFLogoutUrl() : "/admin/login",
  });
}
