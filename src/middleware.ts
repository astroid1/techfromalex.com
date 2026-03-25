import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest, isCFAccessConfigured } from "@/lib/admin/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API through
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const authenticated = await isAuthenticatedFromRequest(request);

    if (!authenticated) {
      // For CF Access: Cloudflare intercepts the request before it reaches
      // the app, so unauthenticated requests here mean either:
      // 1. CF Access isn't configured (dev mode) → redirect to local login
      // 2. Token is invalid/expired → return 401
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!isCFAccessConfigured()) {
        // Dev fallback: redirect to local login
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // CF Access configured but token invalid - return 403
      return new NextResponse("Access denied. Please authenticate via Cloudflare Access.", {
        status: 403,
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
