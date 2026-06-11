import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders } from "@/lib/security/headers";
import { apiRateLimiter } from "@/lib/security/rate-limiter";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Fast-path for health pings and port scanner HEAD checks
  if (path === "/health") {
    console.log("[Middleware] Health check pinged - returning 200 OK");
    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }

  if (path === "/") {
    if (request.method === "HEAD") {
      console.log("[Middleware] HEAD / port scan pinged - returning 200 OK");
      return new NextResponse("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    console.log("[Middleware] Root path GET - redirecting to /dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  console.log(`[Middleware] Incoming request: ${request.method} ${path}`);
  
  // 1. Enforce Rate Limiting on all API requests (IP derived from proxy headers for Render compatibility)
  if (path.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const rateLimit = apiRateLimiter.check(ip);

    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString()
          }
        }
      );
    }
  }

  // 2. Authentication Protection for App Workspace Routes
  const protectedPrefixes = [
    "/dashboard",
    "/tests",
    "/question-papers",
    "/question-bank",
    "/mistake-journal",
    "/weak-topics",
    "/revision-planner",
    "/analytics",
    "/settings",
    "/api/tests",
    "/api/uploads"
  ];
  
  const isProtected = protectedPrefixes.some(prefix => path.startsWith(prefix));

  if (isProtected) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      if (path.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(url);
    }
  }

  // 3. Inject Strict CSP & Security Headers
  const response = NextResponse.next();
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  // Apply security filters on all routes except static bundles and PWA manifest assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"
  ]
};
